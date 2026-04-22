import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AppRole, PermissionContext } from '@/types';

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
}

export async function getUserWithRole(): Promise<{
  userId: string;
  email: string;
  role: AppRole;
  yearId?: string;
  studentId?: string;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // maybeSingle — an auth user without an app_users row is an expected
  // intermediate state (e.g. mid-invitation flow). Treat it as "no role".
  const { data: appUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!appUser) return null;

  const result: {
    userId: string;
    email: string;
    role: AppRole;
    yearId?: string;
    studentId?: string;
  } = {
    userId: user.id,
    email: user.email || '',
    role: appUser.role as AppRole,
  };

  // Get student-specific data — student row may not exist yet if invitation
  // is still in flight, so maybeSingle rather than single.
  if (appUser.role === 'student') {
    const { data: student } = await supabase
      .from('students')
      .select('id, graduation_year_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student) {
      result.studentId = student.id;
      result.yearId = student.graduation_year_id;
    }
  }

  // Get admin-specific data — a fresh admin might not have a scope yet.
  if (appUser.role === 'admin') {
    const { data: scope } = await supabase
      .from('admin_scopes')
      .select('graduation_year_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (scope) {
      result.yearId = scope.graduation_year_id;
    }
  }

  return result;
}

export async function requireRole(...roles: AppRole[]) {
  const user = await getUserWithRole();
  if (!user || !roles.includes(user.role)) {
    redirect('/login');
  }
  return user;
}

export async function getPermissionContext(): Promise<PermissionContext | null> {
  const user = await getUserWithRole();
  if (!user) return null;
  return {
    userId: user.userId,
    role: user.role,
    yearId: user.yearId,
    studentId: user.studentId,
  };
}
