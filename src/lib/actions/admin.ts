'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getUserWithRole } from '@/lib/auth';
import { isAdmin, isSuperAdmin } from '@/lib/permissions';
import { generateInviteToken } from './auth';
import { slugify, normalizeFullName, slugifyWithId } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Access Request Management
// ============================================================================

export async function approveAccessRequest(requestId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data: request } = await supabase
    .from('access_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) return { error: 'Request not found.' };

  // Update request status
  await supabase
    .from('access_requests')
    .update({
      request_status: 'approved',
      reviewed_by: user.userId,
    })
    .eq('id', requestId);

  // Check if student already exists
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('wiut_email', request.wiut_email)
    .eq('graduation_year_id', request.graduation_year_id)
    .single();

  if (!existingStudent) {
    // Find or create the course
    let courseId: string | null = null;
    if (request.course_name_raw) {
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('graduation_year_id', request.graduation_year_id)
        .ilike('name', `%${request.course_name_raw}%`)
        .limit(1)
        .single();
      courseId = course?.id || null;
    }

    // Create student record
    await supabase.from('students').insert({
      graduation_year_id: request.graduation_year_id,
      course_id: courseId,
      full_name: request.full_name,
      full_name_normalized: normalizeFullName(request.full_name),
      slug: slugifyWithId(request.full_name),
      wiut_email: request.wiut_email,
      student_id_code: request.student_id_code,
      approval_status: 'approved',
    });
  }

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'access_request_approved',
    entity_type: 'access_request',
    entity_id: requestId,
  });

  revalidatePath('/admin/access-requests');
  return { success: true };
}

export async function rejectAccessRequest(requestId: string, reason?: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('access_requests')
    .update({
      request_status: 'rejected',
      reviewed_by: user.userId,
      review_note: reason || null,
    })
    .eq('id', requestId);

  revalidatePath('/admin/access-requests');
  return { success: true };
}

// ============================================================================
// Invitation Management
// ============================================================================

export async function sendInvitation(studentId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  // Check student exists and is approved
  const { data: student } = await supabase
    .from('students')
    .select('id, wiut_email, full_name, approval_status')
    .eq('id', studentId)
    .single();

  if (!student) return { error: 'Student not found.' };
  if (!['approved', 'not_requested'].includes(student.approval_status)) {
    return { error: 'Student is not in an invitable state.' };
  }

  const { token, hash } = await generateInviteToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  await supabase.from('invitations').insert({
    student_id: studentId,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
    sent_by: user.userId,
  });

  await supabase
    .from('students')
    .update({
      approval_status: 'invited',
      invited_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'invitation_sent',
    entity_type: 'student',
    entity_id: studentId,
  });

  // The activation URL would be sent via email in production
  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`;

  revalidatePath('/admin/invitations');
  return { success: true, activationUrl };
}

export async function bulkSendInvitations(studentIds: string[]) {
  const results = [];
  for (const id of studentIds) {
    const result = await sendInvitation(id);
    results.push({ studentId: id, ...result });
  }
  return results;
}

// ============================================================================
// CSV Upload — Pre-seeded Activation (from Deep Review)
// ============================================================================

export async function uploadStudentCSV(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const file = formData.get('file') as File;
  const yearId = formData.get('graduationYearId') as string;

  if (!file || !yearId) return { error: 'Missing file or year.' };

  const text = await file.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const nameIdx = headers.findIndex((h) => h.includes('name'));
  const emailIdx = headers.findIndex((h) => h.includes('email'));
  const idIdx = headers.findIndex((h) => h.includes('student') && h.includes('id'));
  const courseIdx = headers.findIndex((h) => h.includes('course'));

  if (nameIdx === -1 || emailIdx === -1) {
    return { error: 'CSV must have at least "name" and "email" columns.' };
  }

  const supabase = await createClient();

  // Get courses for matching
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .eq('graduation_year_id', yearId);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const fullName = cols[nameIdx];
    const email = cols[emailIdx];
    const studentIdCode = idIdx >= 0 ? cols[idIdx] : null;
    const courseName = courseIdx >= 0 ? cols[courseIdx] : null;

    if (!fullName || !email) {
      errors.push(`Row ${i + 1}: Missing name or email.`);
      skipped++;
      continue;
    }

    // Match course
    let courseId: string | null = null;
    if (courseName && courses) {
      const match = courses.find(
        (c) => c.name.toLowerCase().includes(courseName.toLowerCase()) ||
               courseName.toLowerCase().includes(c.name.toLowerCase())
      );
      courseId = match?.id || null;
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('wiut_email', email)
      .eq('graduation_year_id', yearId)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    await supabase.from('students').insert({
      graduation_year_id: yearId,
      course_id: courseId,
      full_name: fullName,
      full_name_normalized: normalizeFullName(fullName),
      slug: slugifyWithId(fullName),
      wiut_email: email,
      student_id_code: studentIdCode,
      approval_status: 'approved',
    });

    imported++;
  }

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'csv_upload',
    entity_type: 'students',
    details_json: { imported, skipped, year_id: yearId },
  });

  revalidatePath('/admin/students');
  return { success: true, imported, skipped, errors };
}

// ============================================================================
// Moderation
// ============================================================================

export async function moderatePhoto(
  photoId: string,
  action: 'approve' | 'reject' | 'hide',
  reason?: string
) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data: photo } = await supabase
    .from('student_photos')
    .select('moderation_status')
    .eq('id', photoId)
    .single();

  if (!photo) return { error: 'Photo not found.' };

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    hide: 'hidden',
  } as const;

  const newStatus = statusMap[action];

  await supabase
    .from('student_photos')
    .update({
      moderation_status: newStatus,
      rejection_reason: action === 'reject' ? reason : null,
      approved_by: action === 'approve' ? user.userId : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('id', photoId);

  await supabase.from('moderation_logs').insert({
    actor_user_id: user.userId,
    target_type: 'student_photo',
    target_id: photoId,
    action,
    old_status: photo.moderation_status,
    new_status: newStatus,
    reason,
  });

  revalidatePath('/admin/moderation');
  return { success: true };
}

export async function bulkModeratePhotos(
  photoIds: string[],
  action: 'approve' | 'reject'
) {
  const results = [];
  for (const id of photoIds) {
    const result = await moderatePhoto(id, action);
    results.push({ photoId: id, ...result });
  }
  return results;
}

export async function moderateProfile(
  studentId: string,
  action: 'approve' | 'reject' | 'hide',
  reason?: string
) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    hide: 'hidden',
  } as const;

  const newStatus = statusMap[action];

  await supabase
    .from('student_profiles')
    .update({
      profile_status: newStatus,
      approved_by: action === 'approve' ? user.userId : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('student_id', studentId);

  await supabase.from('moderation_logs').insert({
    actor_user_id: user.userId,
    target_type: 'student_profile',
    target_id: studentId,
    action,
    new_status: newStatus,
    reason,
  });

  revalidatePath('/admin/moderation');
  return { success: true };
}

// ============================================================================
// Staff Management
// ============================================================================

export async function createStaffProfile(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const yearId = formData.get('graduationYearId') as string;
  const fullName = formData.get('fullName') as string;
  const roleTitle = formData.get('roleTitle') as string;
  const department = formData.get('department') as string | null;
  const shortMessage = formData.get('shortMessage') as string | null;

  if (!yearId || !fullName || !roleTitle) {
    return { error: 'Name and role are required.' };
  }

  const supabase = await createClient();

  await supabase.from('staff_profiles').insert({
    graduation_year_id: yearId,
    full_name: fullName,
    role_title: roleTitle,
    department,
    short_message: shortMessage,
  });

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function updateStaffProfile(staffId: string, formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('staff_profiles')
    .update({
      full_name: formData.get('fullName') as string,
      role_title: formData.get('roleTitle') as string,
      department: (formData.get('department') as string) || null,
      short_message: (formData.get('shortMessage') as string) || null,
    })
    .eq('id', staffId);

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function deleteStaffProfile(staffId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();
  await supabase.from('staff_profiles').delete().eq('id', staffId);

  revalidatePath('/admin/staff');
  return { success: true };
}

// ============================================================================
// Course Management
// ============================================================================

export async function createCourse(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const yearId = formData.get('graduationYearId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;

  if (!yearId || !name) return { error: 'Course name is required.' };

  const supabase = await createClient();

  await supabase.from('courses').insert({
    graduation_year_id: yearId,
    name,
    slug: slugify(name),
    description,
  });

  revalidatePath('/admin/courses');
  return { success: true };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('courses')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', courseId);

  revalidatePath('/admin/courses');
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();
  await supabase.from('courses').delete().eq('id', courseId);

  revalidatePath('/admin/courses');
  return { success: true };
}

// ============================================================================
// Year Settings
// ============================================================================

export async function lockYearEditing(yearId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('graduation_years')
    .update({ editing_lock_at: new Date().toISOString() })
    .eq('id', yearId);

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'year_locked',
    entity_type: 'graduation_year',
    entity_id: yearId,
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function unlockYearEditing(yearId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('graduation_years')
    .update({ editing_lock_at: null })
    .eq('id', yearId);

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'year_unlocked',
    entity_type: 'graduation_year',
    entity_id: yearId,
  });

  revalidatePath('/admin/settings');
  return { success: true };
}
