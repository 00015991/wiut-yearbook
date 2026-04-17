'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getUserWithRole } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions';
import { slugify } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Graduation Year Management
// ============================================================================

export async function createGraduationYear(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const yearLabel = parseInt(formData.get('yearLabel') as string);
  const title = formData.get('title') as string;

  if (!yearLabel || !title) return { error: 'Year and title are required.' };

  const supabase = await createClient();

  const { error } = await supabase.from('graduation_years').insert({
    year_label: yearLabel,
    title,
    slug: `class-of-${yearLabel}`,
    status: 'draft',
    created_by: user.userId,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'A year with this label already exists.' };
    }
    return { error: 'Failed to create year.' };
  }

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'year_created',
    entity_type: 'graduation_year',
    details_json: { year_label: yearLabel, title },
  });

  revalidatePath('/super-admin/years');
  return { success: true };
}

export async function updateGraduationYear(yearId: string, formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('graduation_years')
    .update({
      title: formData.get('title') as string,
      status: formData.get('status') as string,
      submission_deadline: (formData.get('submissionDeadline') as string) || null,
      editing_lock_at: (formData.get('editingLockAt') as string) || null,
      is_visible: formData.get('isVisible') === 'true',
    })
    .eq('id', yearId);

  revalidatePath('/super-admin/years');
  return { success: true };
}

export async function duplicateYearCourses(sourceYearId: string, targetYearId: string) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data: sourceCourses } = await supabase
    .from('courses')
    .select('name, slug, description, display_order')
    .eq('graduation_year_id', sourceYearId)
    .eq('is_active', true);

  if (!sourceCourses?.length) {
    return { error: 'No courses found in the source year.' };
  }

  const newCourses = sourceCourses.map((c) => ({
    graduation_year_id: targetYearId,
    name: c.name,
    slug: c.slug,
    description: c.description,
    display_order: c.display_order,
  }));

  await supabase.from('courses').insert(newCourses);

  revalidatePath('/super-admin/years');
  return { success: true, count: newCourses.length };
}

// ============================================================================
// Admin Management
// ============================================================================

export async function createAdmin(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const yearId = formData.get('graduationYearId') as string;

  if (!email || !password) return { error: 'Email and password are required.' };

  const adminSupabase = await createAdminClient();

  // Create auth user
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: 'Failed to create admin account.' };
  }

  // Create app user
  await adminSupabase.from('app_users').insert({
    id: authUser.user.id,
    email,
    role: 'admin',
  });

  // Create admin scope
  if (yearId) {
    await adminSupabase.from('admin_scopes').insert({
      user_id: authUser.user.id,
      graduation_year_id: yearId,
    });
  }

  await adminSupabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'admin_created',
    entity_type: 'app_user',
    entity_id: authUser.user.id,
    details_json: { email, year_id: yearId },
  });

  revalidatePath('/super-admin/admins');
  return { success: true };
}

export async function updateAdminScope(adminUserId: string, formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const yearId = formData.get('graduationYearId') as string;
  const canManageStudents = formData.get('canManageStudents') === 'true';
  const canManageCourses = formData.get('canManageCourses') === 'true';
  const canManageStaff = formData.get('canManageStaff') === 'true';
  const canModerate = formData.get('canModerate') === 'true';

  // Upsert the admin scope
  const { data: existing } = await supabase
    .from('admin_scopes')
    .select('id')
    .eq('user_id', adminUserId)
    .eq('graduation_year_id', yearId)
    .single();

  if (existing) {
    await supabase
      .from('admin_scopes')
      .update({
        can_manage_students: canManageStudents,
        can_manage_courses: canManageCourses,
        can_manage_staff: canManageStaff,
        can_moderate: canModerate,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('admin_scopes').insert({
      user_id: adminUserId,
      graduation_year_id: yearId,
      can_manage_students: canManageStudents,
      can_manage_courses: canManageCourses,
      can_manage_staff: canManageStaff,
      can_moderate: canModerate,
    });
  }

  revalidatePath('/super-admin/admins');
  return { success: true };
}

export async function suspendUser(userId: string) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('app_users')
    .update({ is_active: false })
    .eq('id', userId);

  await supabase.from('audit_logs').insert({
    actor_user_id: user.userId,
    action_type: 'user_suspended',
    entity_type: 'app_user',
    entity_id: userId,
  });

  revalidatePath('/super-admin/admins');
  return { success: true };
}

// ============================================================================
// Superlatives Management
// ============================================================================

export async function createSuperlativeCategory(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase.from('superlative_categories').insert({
    graduation_year_id: formData.get('graduationYearId') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    voting_opens_at: (formData.get('votingOpensAt') as string) || null,
    voting_closes_at: (formData.get('votingClosesAt') as string) || null,
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function updateSuperlativeVotingStatus(
  categoryId: string,
  status: 'draft' | 'open' | 'closed' | 'revealed'
) {
  const user = await getUserWithRole();
  if (!user || !isAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  await supabase
    .from('superlative_categories')
    .update({ voting_status: status })
    .eq('id', categoryId);

  return { success: true };
}

function isAdmin(user: { role: string }): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}
