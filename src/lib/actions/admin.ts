'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getUserWithRole } from '@/lib/auth';
import { isAdmin, canModerate } from '@/lib/permissions';
import { generateInviteToken } from './auth';
import { slugify, normalizeFullName, slugifyWithId } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Access Request Management
// ============================================================================

export async function approveAccessRequest(requestId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  // `access_requests` and `students` both have super-admin-only write policies,
  // so regular admins can't flip request_status or create the student record
  // through the user-session client — the approval would appear to succeed but
  // nothing downstream would see it. Admin client after the isAdmin gate is
  // the same trust-the-role pattern we use everywhere else.
  const supabase = await createAdminClient();

  const { data: request, error: loadErr } = await supabase
    .from('access_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (loadErr || !request) return { error: 'Request not found.' };

  // Update request status
  const { error: updateErr } = await supabase
    .from('access_requests')
    .update({
      request_status: 'approved',
      reviewed_by: user.userId,
    })
    .eq('id', requestId);

  if (updateErr) return { error: 'Failed to update the request.' };

  // Check if student already exists
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('wiut_email', request.wiut_email)
    .eq('graduation_year_id', request.graduation_year_id)
    .maybeSingle();

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
        .maybeSingle();
      courseId = course?.id ?? null;
    }

    // Create student record
    const { error: insertErr } = await supabase.from('students').insert({
      graduation_year_id: request.graduation_year_id,
      course_id: courseId,
      full_name: request.full_name,
      full_name_normalized: normalizeFullName(request.full_name),
      slug: slugifyWithId(request.full_name),
      wiut_email: request.wiut_email,
      student_id_code: request.student_id_code,
      approval_status: 'approved',
    });

    if (insertErr) return { error: 'Failed to create the student record.' };
  }

  // Audit log — best-effort; don't fail the approval if this write fails
  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'access_request_approved',
    entity_type: 'access_request',
    entity_id: requestId,
  });

  // Both admin and super-admin views read this table; keep them in sync.
  revalidatePath('/admin/access-requests');
  revalidatePath('/super-admin/access-requests');
  return { success: true };
}

export async function rejectAccessRequest(requestId: string, reason?: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  // Sanity-check the reason length so a malicious client can't stuff MBs in
  const trimmedReason = reason?.trim().slice(0, 500) ?? null;

  // Same admin-only-write pattern as `approveAccessRequest` — user-session
  // writes would fail for regular admins.
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('access_requests')
    .update({
      request_status: 'rejected',
      reviewed_by: user.userId,
      review_note: trimmedReason || null,
    })
    .eq('id', requestId);

  if (error) return { error: 'Failed to reject the request.' };

  revalidatePath('/admin/access-requests');
  revalidatePath('/super-admin/access-requests');
  return { success: true };
}

// ============================================================================
// Invitation Management
// ============================================================================

export async function sendInvitation(studentId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  // `invitations` has RLS on with no policies, so the user-session client
  // can't insert the token row — the button would appear to succeed but no
  // activation link would actually be persisted. Authorization is enforced
  // by `isAdmin(user)` above, so admin client is the right fit.
  const supabase = await createAdminClient();

  // Check student exists and is approved
  const { data: student, error: loadErr } = await supabase
    .from('students')
    .select('id, wiut_email, full_name, approval_status')
    .eq('id', studentId)
    .single();

  if (loadErr || !student) return { error: 'Student not found.' };
  if (!['approved', 'not_requested'].includes(student.approval_status)) {
    return { error: 'Student is not in an invitable state.' };
  }

  const { token, hash } = await generateInviteToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  const { error: invErr } = await supabase.from('invitations').insert({
    student_id: studentId,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
    sent_by: user.userId,
  });

  if (invErr) {
    console.error('[sendInvitation] insert failed:', invErr.message);
    return { error: 'Failed to create invitation.' };
  }

  const { error: studentErr } = await supabase
    .from('students')
    .update({
      approval_status: 'invited',
      invited_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  if (studentErr) return { error: 'Failed to update student status.' };

  // Audit log — best-effort
  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'invitation_sent',
    entity_type: 'student',
    entity_id: studentId,
  });

  // The activation URL would be sent via email in production
  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`;

  revalidatePath('/admin/invitations');
  revalidatePath('/super-admin/invitations');
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

/**
 * Mint a fresh activation link for a student who was already invited.
 *
 * We only persist the hash of the invitation token, so the original link is
 * unrecoverable once the admin closes the copy modal. This action generates
 * a brand-new token and inserts an additional invitation row — the stale
 * row stays until its `expires_at` passes, which is harmless because its
 * hash doesn't match any future activation attempt.
 *
 * Valid approval_status values: `invited` (common case) and `approved` /
 * `not_requested` (in case the previous send somehow didn't flip the status
 * due to the RLS bug we fixed earlier — don't block the admin on cleanup).
 */
export async function resendInvitation(studentId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createAdminClient();

  const { data: student, error: loadErr } = await supabase
    .from('students')
    .select('id, wiut_email, full_name, approval_status')
    .eq('id', studentId)
    .single();

  if (loadErr || !student) return { error: 'Student not found.' };
  if (student.approval_status === 'active') {
    return { error: 'Student has already activated their account.' };
  }

  const { token, hash } = await generateInviteToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: invErr } = await supabase.from('invitations').insert({
    student_id: studentId,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
    sent_by: user.userId,
  });

  if (invErr) {
    console.error('[resendInvitation] insert failed:', invErr.message);
    return { error: 'Failed to regenerate invitation.' };
  }

  // If the student was in `approved`/`not_requested` somehow, bring them
  // up to `invited` so the UI shows the right state.
  if (student.approval_status !== 'invited') {
    await supabase
      .from('students')
      .update({
        approval_status: 'invited',
        invited_at: new Date().toISOString(),
      })
      .eq('id', studentId);
  }

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'invitation_resent',
    entity_type: 'student',
    entity_id: studentId,
  });

  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`;

  revalidatePath('/admin/invitations');
  revalidatePath('/super-admin/invitations');
  return { success: true, activationUrl };
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
        (c) =>
          c.name.toLowerCase().includes(courseName.toLowerCase()) ||
          courseName.toLowerCase().includes(c.name.toLowerCase()),
      );
      courseId = match?.id || null;
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('wiut_email', email)
      .eq('graduation_year_id', yearId)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error: insertErr } = await supabase.from('students').insert({
      graduation_year_id: yearId,
      course_id: courseId,
      full_name: fullName,
      full_name_normalized: normalizeFullName(fullName),
      slug: slugifyWithId(fullName),
      wiut_email: email,
      student_id_code: studentIdCode,
      approval_status: 'approved',
    });

    if (insertErr) {
      errors.push(`Row ${i + 1} (${email}): ${insertErr.message}`);
      skipped++;
      continue;
    }

    imported++;
  }

  // Audit log — best-effort
  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'csv_upload',
    entity_type: 'students',
    details_json: { imported, skipped, year_id: yearId, error_count: errors.length },
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
  reason?: string,
) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  // `student_photos` has RLS on with no admin-role policies, so a user-session
  // update silently returns 0 rows affected — the button appears to work but
  // the photo stays in `pending`. Approve-any-photo is trusted to the
  // role+year gate below (isAdmin + canModerate); admin client only fills
  // the RLS gap, it does not widen authority.
  const supabase = await createAdminClient();

  const { data: photo, error: loadErr } = await supabase
    .from('student_photos')
    .select('moderation_status, graduation_year_id')
    .eq('id', photoId)
    .single();

  if (loadErr || !photo) return { error: 'Photo not found.' };

  // Year-scope check: a year-assigned admin can only moderate photos in their
  // own year. Super-admin passes unconditionally.
  if (!canModerate(user, photo.graduation_year_id)) {
    return { error: 'You do not have permission to moderate this photo.' };
  }

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    hide: 'hidden',
  } as const;

  const newStatus = statusMap[action];

  const { error: updateErr } = await supabase
    .from('student_photos')
    .update({
      moderation_status: newStatus,
      rejection_reason: action === 'reject' ? reason : null,
      approved_by: action === 'approve' ? user.userId : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('id', photoId);

  if (updateErr) {
    console.error('[moderatePhoto] update failed:', updateErr.message);
    return { error: 'Failed to update photo status.' };
  }

  // Moderation log — best-effort
  const { error: logErr } = await supabase.from('moderation_logs').insert({
    actor_user_id: user.userId,
    target_type: 'student_photo',
    target_id: photoId,
    action,
    old_status: photo.moderation_status,
    new_status: newStatus,
    reason,
  });
  if (logErr) {
    console.warn('[moderatePhoto] log insert failed:', logErr.message);
  }

  // Both the admin queue and the super-admin audit/queue view read this data.
  revalidatePath('/admin/moderation');
  revalidatePath('/super-admin/moderation');
  revalidatePath('/student/status');
  return { success: true };
}

export async function bulkModeratePhotos(
  photoIds: string[],
  action: 'approve' | 'reject',
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
  reason?: string,
) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  // Same RLS story as moderatePhoto — `student_profiles` has no admin-write
  // policy, so the user-session update silently no-ops. Role-gated with
  // isAdmin + canModerate before reaching the service role.
  const supabase = await createAdminClient();

  // Need the student's graduation year for the year-scope check.
  const { data: student, error: loadErr } = await supabase
    .from('students')
    .select('id, graduation_year_id')
    .eq('id', studentId)
    .single();

  if (loadErr || !student) return { error: 'Student not found.' };

  if (!canModerate(user, student.graduation_year_id)) {
    return { error: 'You do not have permission to moderate this profile.' };
  }

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    hide: 'hidden',
  } as const;

  const newStatus = statusMap[action];

  const { error: updateErr } = await supabase
    .from('student_profiles')
    .update({
      profile_status: newStatus,
      approved_by: action === 'approve' ? user.userId : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('student_id', studentId);

  if (updateErr) {
    console.error('[moderateProfile] update failed:', updateErr.message);
    return { error: 'Failed to update profile status.' };
  }

  // Moderation log — best-effort
  const { error: logErr } = await supabase.from('moderation_logs').insert({
    actor_user_id: user.userId,
    target_type: 'student_profile',
    target_id: studentId,
    action,
    new_status: newStatus,
    reason,
  });
  if (logErr) {
    console.warn('[moderateProfile] log insert failed:', logErr.message);
  }

  revalidatePath('/admin/moderation');
  revalidatePath('/super-admin/moderation');
  revalidatePath('/student/status');
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

  // `staff_profiles` has RLS on with no policies, so user-session writes
  // silently fail. `isAdmin(user)` above already gates this action to admins
  // and super admins — admin client is safe after that check.
  const supabase = await createAdminClient();

  const { error } = await supabase.from('staff_profiles').insert({
    graduation_year_id: yearId,
    full_name: fullName,
    role_title: roleTitle,
    department,
    short_message: shortMessage,
  });

  if (error) return { error: 'Failed to create staff profile.' };

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function updateStaffProfile(staffId: string, formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('staff_profiles')
    .update({
      full_name: formData.get('fullName') as string,
      role_title: formData.get('roleTitle') as string,
      department: (formData.get('department') as string) || null,
      short_message: (formData.get('shortMessage') as string) || null,
    })
    .eq('id', staffId);

  if (error) return { error: 'Failed to update staff profile.' };

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function deleteStaffProfile(staffId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createAdminClient();
  const { error } = await supabase.from('staff_profiles').delete().eq('id', staffId);

  if (error) return { error: 'Failed to delete staff profile.' };

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

  const { error } = await supabase.from('courses').insert({
    graduation_year_id: yearId,
    name,
    slug: slugify(name),
    description,
  });

  if (error) {
    // Unique-violation (graduation_year_id + slug already exists)
    if (error.code === '23505') {
      return { error: 'A course with this name already exists for this year.' };
    }
    return { error: 'Failed to create course.' };
  }

  revalidatePath('/admin/courses');
  return { success: true };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('courses')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', courseId);

  if (error) return { error: 'Failed to update course.' };

  revalidatePath('/admin/courses');
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { error } = await supabase.from('courses').delete().eq('id', courseId);

  if (error) return { error: 'Failed to delete course.' };

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

  const { error } = await supabase
    .from('graduation_years')
    .update({ editing_lock_at: new Date().toISOString() })
    .eq('id', yearId);

  if (error) return { error: 'Failed to lock the year.' };

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

  const { error } = await supabase
    .from('graduation_years')
    .update({ editing_lock_at: null })
    .eq('id', yearId);

  if (error) return { error: 'Failed to unlock the year.' };

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'year_unlocked',
    entity_type: 'graduation_year',
    entity_id: yearId,
  });

  revalidatePath('/admin/settings');
  return { success: true };
}
