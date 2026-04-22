'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUserWithRole } from '@/lib/auth';
import { getStudentPhotoPath, BUCKET_NAME, isAllowedMimeType, isWithinSizeLimit, detectOrientation, IMAGE_CONFIG } from '@/lib/storage';
import { PHOTO_LIMITS } from '@/types';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

export async function uploadStudentPhoto(formData: FormData) {
  // `getUserWithRole` reads the session server-side and derives `studentId`
  // from the DB, so the student can't spoof which record they're writing to
  // by tampering with the form. Path + DB row are all built from that
  // trusted id. MIME type, size, and category are whitelisted below.
  const user = await getUserWithRole();
  if (!user || user.role !== 'student' || !user.studentId || !user.yearId) {
    return { error: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  const category = formData.get('category') as string;
  const caption = formData.get('caption') as string | null;

  if (!file || !category) {
    return { error: 'Missing file or category.' };
  }

  if (!isAllowedMimeType(file.type)) {
    return { error: 'Invalid file type. Use JPG, PNG, or WebP.' };
  }

  if (!isWithinSizeLimit(file.size)) {
    return { error: 'File too large. Maximum 10MB.' };
  }

  const validCategories = ['portrait', 'general', 'course', 'childhood'] as const;
  if (!validCategories.includes(category as typeof validCategories[number])) {
    return { error: 'Invalid category.' };
  }

  const photoCategory = category as keyof typeof PHOTO_LIMITS;

  // Admin client so the storage upload doesn't collide with `storage.objects`
  // RLS on the private bucket. The user-session client has no INSERT policy
  // on that bucket (none were ever written), and managing per-user storage
  // policies is much fussier than trusting the role check above. Every
  // field we write is derived from the session, not the form payload.
  const supabase = await createAdminClient();

  // Check count limits
  const { count } = await supabase
    .from('student_photos')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.studentId)
    .eq('category', category)
    .eq('is_deleted', false);

  if ((count || 0) >= PHOTO_LIMITS[photoCategory]) {
    return { error: `Maximum ${PHOTO_LIMITS[photoCategory]} ${category} photo(s) allowed.` };
  }

  // Get year label for path
  const { data: year } = await supabase
    .from('graduation_years')
    .select('year_label')
    .eq('id', user.yearId)
    .single();

  if (!year) return { error: 'Year not found.' };

  const photoId = crypto.randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer);

  // --- Process image with Sharp ---
  // We intentionally DO NOT store the original uploaded file.
  // Only `display` (~1600px WebP, ~300 KB) and `thumb` (~400px WebP, ~30 KB)
  // are written to storage. This cuts per-photo storage by ~90%.
  let displayBuffer: Buffer;
  let thumbBuffer: Buffer;
  let width: number;
  let height: number;
  let orientation: 'portrait' | 'landscape';

  try {
    // Respect EXIF rotation so photos from phones display correctly
    const pipeline = sharp(sourceBuffer, { failOn: 'none' }).rotate();
    const metadata = await pipeline.metadata();
    width = metadata.width ?? 0;
    height = metadata.height ?? 0;
    if (!width || !height) throw new Error('Could not read image dimensions');
    orientation = detectOrientation(width, height);

    // Display variant — constrain long edge, keep aspect ratio
    const displayResize =
      orientation === 'portrait'
        ? { height: IMAGE_CONFIG.variants.display.portrait.height }
        : { width: IMAGE_CONFIG.variants.display.landscape.width };

    displayBuffer = await sharp(sourceBuffer, { failOn: 'none' })
      .rotate()
      .resize({ ...displayResize, withoutEnlargement: true })
      .webp({ quality: IMAGE_CONFIG.quality.display })
      .toBuffer();

    // Thumb variant — square-ish, short edge
    thumbBuffer = await sharp(sourceBuffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: IMAGE_CONFIG.variants.thumb.maxDimension,
        height: IMAGE_CONFIG.variants.thumb.maxDimension,
        fit: 'cover',
        position: 'attention',
      })
      .webp({ quality: IMAGE_CONFIG.quality.thumb })
      .toBuffer();
  } catch {
    return { error: 'Could not process image. Try a different file.' };
  }

  const displayPath = getStudentPhotoPath(
    year.year_label,
    user.studentId,
    photoCategory,
    photoId,
    'display'
  );
  const thumbPath = getStudentPhotoPath(
    year.year_label,
    user.studentId,
    photoCategory,
    photoId,
    'thumb'
  );

  // Upload display + thumb in parallel
  const [displayUpload, thumbUpload] = await Promise.all([
    supabase.storage.from(BUCKET_NAME).upload(displayPath, displayBuffer, {
      contentType: 'image/webp',
      upsert: false,
    }),
    supabase.storage.from(BUCKET_NAME).upload(thumbPath, thumbBuffer, {
      contentType: 'image/webp',
      upsert: false,
    }),
  ]);

  if (displayUpload.error || thumbUpload.error) {
    // Log the underlying error so the next failure isn't a mystery.
    console.error('[uploadStudentPhoto] storage upload failed', {
      display: displayUpload.error?.message,
      thumb: thumbUpload.error?.message,
      bucket: BUCKET_NAME,
      displayPath,
      thumbPath,
    });
    // Best-effort cleanup of whichever variant uploaded
    await supabase.storage.from(BUCKET_NAME).remove([displayPath, thumbPath]);
    return { error: 'Failed to upload file.' };
  }

  const { error: dbError } = await supabase.from('student_photos').insert({
    id: photoId,
    student_id: user.studentId,
    graduation_year_id: user.yearId,
    category,
    storage_original_path: null, // originals are not stored
    storage_display_path: displayPath,
    storage_thumb_path: thumbPath,
    mime_type: 'image/webp',
    file_size: displayBuffer.length + thumbBuffer.length,
    width,
    height,
    orientation,
    processing_status: 'ready',
    moderation_status: 'draft',
    caption: caption || null,
  });

  if (dbError) {
    console.error('[uploadStudentPhoto] db insert failed:', dbError.message);
    await supabase.storage.from(BUCKET_NAME).remove([displayPath, thumbPath]);
    return { error: 'Failed to save photo record.' };
  }

  revalidatePath('/student/photos');
  return { success: true, photoId };
}

export async function deleteStudentPhoto(photoId: string) {
  const user = await getUserWithRole();
  if (!user || user.role !== 'student' || !user.studentId) {
    return { error: 'Unauthorized' };
  }

  // Same reasoning as the upload action: scope the update to the student's
  // own record (`.eq('student_id', user.studentId)`) so admin client doesn't
  // let them nuke someone else's row.
  const supabase = await createAdminClient();

  // Soft delete
  const { error } = await supabase
    .from('student_photos')
    .update({ is_deleted: true })
    .eq('id', photoId)
    .eq('student_id', user.studentId);

  if (error) {
    console.error('[deleteStudentPhoto] update failed:', error.message);
    return { error: 'Failed to delete photo.' };
  }

  revalidatePath('/student/photos');
  return { success: true };
}

export async function replaceStudentPhoto(photoId: string, formData: FormData) {
  // Delete old, upload new
  const deleteResult = await deleteStudentPhoto(photoId);
  if (deleteResult.error) return deleteResult;

  return uploadStudentPhoto(formData);
}
