'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { accessRequestSchema, loginSchema, activateInviteSchema } from '@/lib/validators';
import { createHash, randomBytes } from 'crypto';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  // Update last login — fire and forget. Missing a timestamp shouldn't
  // block the user from signing in.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('app_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  const redirectTo = formData.get('redirect') as string;
  redirect(redirectTo || '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Public list of graduation years for the access-request dropdown.
 *
 * RLS on `graduation_years` only grants SELECT to authenticated users, but
 * the request-access page is for people who don't have an account yet.
 * We use the admin client so the dropdown can populate without loosening
 * RLS. Only non-sensitive fields are returned.
 */
export async function getPublicGraduationYears() {
  const adminSupabase = await createAdminClient();
  const { data } = await adminSupabase
    .from('graduation_years')
    .select('id, year_label, title, slug')
    .eq('is_visible', true)
    .in('status', ['draft', 'active'])
    .order('year_label', { ascending: false });
  return data ?? [];
}

export async function submitAccessRequest(formData: FormData) {
  // Anonymous visitors can't insert into access_requests through the
  // user-session client — there is no permissive INSERT policy for the
  // anon role, and there shouldn't be one (it would let anyone write
  // arbitrary rows). Use the admin client so a public form can file a
  // request without weakening RLS. The Zod schema validates the shape
  // before anything reaches the DB.
  const supabase = await createAdminClient();

  const parsed = accessRequestSchema.safeParse({
    fullName: formData.get('fullName'),
    wiutEmail: formData.get('wiutEmail'),
    studentIdCode: formData.get('studentIdCode') || undefined,
    graduationYearId: formData.get('graduationYearId'),
    courseNameRaw: formData.get('courseNameRaw') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check for duplicate request — maybeSingle because zero rows is the
  // expected happy path.
  const { data: existing } = await supabase
    .from('access_requests')
    .select('id')
    .eq('wiut_email', parsed.data.wiutEmail)
    .eq('graduation_year_id', parsed.data.graduationYearId)
    .eq('request_status', 'pending')
    .maybeSingle();

  if (existing) {
    return { error: 'You already have a pending access request.' };
  }

  const { error } = await supabase.from('access_requests').insert({
    full_name: parsed.data.fullName,
    wiut_email: parsed.data.wiutEmail,
    student_id_code: parsed.data.studentIdCode,
    graduation_year_id: parsed.data.graduationYearId,
    course_name_raw: parsed.data.courseNameRaw,
  });

  if (error) {
    console.error('[submitAccessRequest] insert failed:', error.message);
    return { error: 'Failed to submit request. Please try again.' };
  }

  return { success: true };
}

export async function activateInvitation(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const parsed = activateInviteSchema.safeParse({ token, password, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const adminSupabase = await createAdminClient();

  // Find the invitation — expect zero rows is possible (bad link),
  // so use maybeSingle instead of single.
  const { data: invitation } = await adminSupabase
    .from('invitations')
    .select('*, student:students(*)')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!invitation) {
    return { error: 'Invalid or expired invitation link.' };
  }

  const student = invitation.student as { id: string; wiut_email: string; full_name: string };

  // Create auth user
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email: student.wiut_email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    return { error: 'Failed to create account. The email may already be in use.' };
  }

  const newUserId = authUser.user.id;

  // If anything downstream fails, roll back the auth user so the student
  // can retry activation with the same invitation link.
  const rollback = async () => {
    await adminSupabase.auth.admin.deleteUser(newUserId).catch(() => {});
  };

  // Create app_user row — without this, the user can log in but nothing works.
  const { error: appUserErr } = await adminSupabase.from('app_users').insert({
    id: newUserId,
    email: student.wiut_email,
    role: 'student',
  });

  if (appUserErr) {
    await rollback();
    return { error: 'Failed to finalize account. Please try again.' };
  }

  // Link student to auth user and flip to active.
  const { error: studentErr } = await adminSupabase
    .from('students')
    .update({
      user_id: newUserId,
      approval_status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('id', student.id);

  if (studentErr) {
    // Clean up app_users row first, then the auth user, so we don't
    // leave orphans in either table.
    try {
      await adminSupabase.from('app_users').delete().eq('id', newUserId);
    } catch {
      // best-effort
    }
    await rollback();
    return { error: 'Failed to link student record. Please try again.' };
  }

  // Create empty profile — if this fails we can still continue, the user
  // can fill it in themselves. Same for marking the invitation used.
  const { error: profileErr } = await adminSupabase.from('student_profiles').insert({
    student_id: student.id,
  });
  if (profileErr) {
    console.warn('[activateInvitation] empty profile insert failed:', profileErr.message);
  }

  const { error: inviteErr } = await adminSupabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id);
  if (inviteErr) {
    console.warn('[activateInvitation] mark invitation used failed:', inviteErr.message);
  }

  // Best-effort audit log — don't fail the activation if this errors.
  try {
    await adminSupabase.from('audit_logs').insert({
      actor_user_id: newUserId,
      action_type: 'student_activated',
      entity_type: 'student',
      entity_id: student.id,
      details_json: { full_name: student.full_name },
    });
  } catch {
    // swallow — telemetry, not business logic
  }

  redirect('/login?activated=true');
}

export async function generateInviteToken(): Promise<{ token: string; hash: string }> {
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  if (!email) return { error: 'Please enter your email.' };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/login`,
  });

  if (error) {
    return { error: 'Failed to send reset email. Please try again.' };
  }

  return { success: true };
}
