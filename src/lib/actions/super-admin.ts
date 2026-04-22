'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getUserWithRole } from '@/lib/auth';
import { isAdmin, isSuperAdmin } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// Audit log writes are best-effort — a missed audit entry should not break the
// primary action. Callers still return success when the mutation landed.
async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>> | Awaited<ReturnType<typeof createAdminClient>>,
  entry: {
    actor_user_id: string;
    action_type: string;
    entity_type: string;
    entity_id?: string;
    details_json?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from('audit_logs').insert(entry);
  } catch {
    // swallow — telemetry, not business logic
  }
}

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

  await writeAuditLog(supabase, {
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

  const { error } = await supabase
    .from('graduation_years')
    .update({
      title: formData.get('title') as string,
      status: formData.get('status') as string,
      submission_deadline: (formData.get('submissionDeadline') as string) || null,
      editing_lock_at: (formData.get('editingLockAt') as string) || null,
      is_visible: formData.get('isVisible') === 'true',
    })
    .eq('id', yearId);

  if (error) return { error: 'Failed to update year.' };

  await writeAuditLog(supabase, {
    actor_user_id: user.userId,
    action_type: 'year_updated',
    entity_type: 'graduation_year',
    entity_id: yearId,
  });

  revalidatePath('/super-admin/years');
  return { success: true };
}

export async function duplicateYearCourses(sourceYearId: string, targetYearId: string) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  const supabase = await createClient();

  const { data: sourceCourses, error: sourceErr } = await supabase
    .from('courses')
    .select('name, slug, description, display_order')
    .eq('graduation_year_id', sourceYearId)
    .eq('is_active', true);

  if (sourceErr) return { error: 'Failed to read source year courses.' };
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

  const { error: insertErr } = await supabase.from('courses').insert(newCourses);
  if (insertErr) return { error: 'Failed to copy courses.' };

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

  if (authError || !authUser?.user) {
    return { error: 'Failed to create admin account.' };
  }

  // Create app_user — if this fails we need to roll back the auth user to
  // avoid orphans that can't log in anywhere.
  const { error: appUserErr } = await adminSupabase.from('app_users').insert({
    id: authUser.user.id,
    email,
    role: 'admin',
  });

  if (appUserErr) {
    await adminSupabase.auth.admin.deleteUser(authUser.user.id).catch(() => {});
    return { error: 'Failed to finalize admin account.' };
  }

  // Create admin scope (best-effort — scope can be added later from the UI).
  if (yearId) {
    const { error: scopeErr } = await adminSupabase.from('admin_scopes').insert({
      user_id: authUser.user.id,
      graduation_year_id: yearId,
    });
    if (scopeErr) {
      // Not fatal — the account exists, scope can be re-added.
      console.warn('[createAdmin] scope insert failed:', scopeErr.message);
    }
  }

  await writeAuditLog(adminSupabase, {
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

  // `admin_scopes` has RLS on with no policies, so the user-session client
  // silently fails every read and write. Since the super_admin check above
  // already enforces authorization, the admin client is the right choice
  // here — same pattern as `createAdmin`.
  const supabase = await createAdminClient();

  const yearId = formData.get('graduationYearId') as string;
  const canManageStudents = formData.get('canManageStudents') === 'true';
  const canManageCourses = formData.get('canManageCourses') === 'true';
  const canManageStaff = formData.get('canManageStaff') === 'true';
  const canModerate = formData.get('canModerate') === 'true';

  // admin_scopes has no unique constraint on (user_id, graduation_year_id),
  // so we can't use upsert — check then insert/update manually.
  const { data: existing, error: lookupErr } = await supabase
    .from('admin_scopes')
    .select('id')
    .eq('user_id', adminUserId)
    .eq('graduation_year_id', yearId)
    .maybeSingle();

  if (lookupErr) return { error: 'Failed to look up existing scope.' };

  if (existing) {
    const { error: updateErr } = await supabase
      .from('admin_scopes')
      .update({
        can_manage_students: canManageStudents,
        can_manage_courses: canManageCourses,
        can_manage_staff: canManageStaff,
        can_moderate: canModerate,
      })
      .eq('id', existing.id);
    if (updateErr) return { error: 'Failed to update scope.' };
  } else {
    const { error: insertErr } = await supabase.from('admin_scopes').insert({
      user_id: adminUserId,
      graduation_year_id: yearId,
      can_manage_students: canManageStudents,
      can_manage_courses: canManageCourses,
      can_manage_staff: canManageStaff,
      can_moderate: canModerate,
    });
    if (insertErr) return { error: 'Failed to create scope.' };
  }

  await writeAuditLog(supabase, {
    actor_user_id: user.userId,
    action_type: 'admin_scope_updated',
    entity_type: 'app_user',
    entity_id: adminUserId,
    details_json: { year_id: yearId },
  });

  revalidatePath('/super-admin/admins');
  return { success: true };
}

export async function suspendUser(userId: string) {
  const user = await getUserWithRole();
  if (!user || !isSuperAdmin(user)) return { error: 'Unauthorized' };

  // `app_users` has a select policy for super admins but no update policy,
  // so the user-session client can't flip `is_active`. Admin client after
  // the super_admin gate is the right call.
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('app_users')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) return { error: 'Failed to suspend user.' };

  await writeAuditLog(supabase, {
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

  const { error } = await supabase.from('superlative_categories').insert({
    graduation_year_id: formData.get('graduationYearId') as string,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    voting_opens_at: (formData.get('votingOpensAt') as string) || null,
    voting_closes_at: (formData.get('votingClosesAt') as string) || null,
  });

  if (error) return { error: 'Failed to create category.' };

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

  const { error } = await supabase
    .from('superlative_categories')
    .update({ voting_status: status })
    .eq('id', categoryId);

  if (error) return { error: 'Failed to update voting status.' };

  return { success: true };
}
