import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getStudentDashboard } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { SectionHeading } from '@/components/shared/page-shell';
import { PHOTO_LIMITS } from '@/types';
import { PhotoSection } from './photo-section';

export default async function StudentPhotosPage() {
  const user = await requireRole('student');
  if (!user.studentId) redirect('/login');

  const { student, photos } = await getStudentDashboard(user.studentId);
  if (!student) redirect('/login');

  const supabase = await createClient();

  // Get signed URLs for existing photos
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(photo.storage_thumb_path, 3600);
      return { ...photo, thumbUrl: data?.signedUrl || '' };
    })
  );

  const categories = [
    {
      key: 'portrait' as const,
      title: 'Portrait Photo',
      description: 'Your main yearbook photo. Make it your best!',
      hint: 'This will be your profile picture across the yearbook.',
    },
    {
      key: 'general' as const,
      title: 'General Photos',
      description: 'Memorable moments from your university life.',
      hint: 'These appear on your profile and in the gallery.',
    },
    {
      key: 'course' as const,
      title: 'Course Photos',
      description: 'Photos with your course mates and department.',
      hint: 'These appear on your course page.',
    },
    {
      key: 'childhood' as const,
      title: 'Childhood Photo',
      description: 'A photo from when you were young for the Then & Now section.',
      hint: 'This creates a fun comparison with your current portrait.',
    },
  ];

  return (
    <div>
      <SectionHeading
        title="My Photos"
        subtitle="Upload your photos for the yearbook"
      />

      <div className="space-y-8">
        {categories.map((cat) => {
          const categoryPhotos = photosWithUrls.filter((p) => p.category === cat.key);
          return (
            <PhotoSection
              key={cat.key}
              category={cat.key}
              title={cat.title}
              description={cat.description}
              hint={cat.hint}
              maxCount={PHOTO_LIMITS[cat.key]}
              photos={categoryPhotos.map((p) => ({
                id: p.id,
                thumbUrl: p.thumbUrl,
                status: p.moderation_status,
                processingStatus: p.processing_status,
              }))}
            />
          );
        })}
      </div>
    </div>
  );
}
