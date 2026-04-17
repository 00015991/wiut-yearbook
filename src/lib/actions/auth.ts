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

  // Update last login
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

export async function submitAccessRequest(formData: FormData) {
  const supabase = await createClient();

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

  // Check for duplicate request
  const { data: existing } = await supabase
    .from('access_requests')
    .select('id')
    .eq('wiut_email', parsed.data.wiutEmail)
    .eq('graduation_year_id', parsed.data.graduationYearId)
    .eq('request_status', 'pending')
    .single();

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

  // Find the invitation
  const { data: invitation } = await adminSupabase
    .from('invitations')
    .select('*, student:students(*)')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

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

  if (authError) {
    return { error: 'Failed to create account. The email may already be in use.' };
  }

  // Create app_user
  await adminSupabase.from('app_users').insert({
    id: authUser.user.id,
    email: student.wiut_email,
    role: 'student',
  });

  // Link student to auth user and activate
  await adminSupabase
    .from('students')
    .update({
      user_id: authUser.user.id,
      approval_status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('id', student.id);

  // Create empty profile
  await adminSupabase.from('student_profiles').insert({
    student_id: student.id,
  });

  // Mark invitation as used
  await adminSupabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id);

  // Log the activation
  await adminSupabase.from('audit_logs').insert({
    actor_user_id: authUser.user.id,
    action_type: 'student_activated',
    entity_type: 'student',
    entity_id: student.id,
    details_json: { full_name: student.full_name },
  });

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
