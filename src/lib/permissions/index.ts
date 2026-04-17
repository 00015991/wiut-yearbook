import type { AppRole, PermissionContext } from '@/types';

export function isSuperAdmin(ctx: PermissionContext): boolean {
  return ctx.role === 'super_admin';
}

export function isAdmin(ctx: PermissionContext): boolean {
  return ctx.role === 'admin' || ctx.role === 'super_admin';
}

export function isStudent(ctx: PermissionContext): boolean {
  return ctx.role === 'student';
}

export function isYearAdmin(ctx: PermissionContext, yearId: string): boolean {
  if (ctx.role === 'super_admin') return true;
  return ctx.role === 'admin' && ctx.yearId === yearId;
}

export function isStudentOwner(ctx: PermissionContext, studentId: string): boolean {
  return ctx.role === 'student' && ctx.studentId === studentId;
}

export function canModerate(ctx: PermissionContext, yearId: string): boolean {
  if (ctx.role === 'super_admin') return true;
  return ctx.role === 'admin' && ctx.yearId === yearId;
}

export function canViewYear(ctx: PermissionContext, yearId: string): boolean {
  if (ctx.role === 'super_admin') return true;
  if (ctx.role === 'admin' && ctx.yearId === yearId) return true;
  if (ctx.role === 'student' && ctx.yearId === yearId) return true;
  return false;
}

export function canEditStudentProfile(ctx: PermissionContext, studentId: string): boolean {
  if (ctx.role === 'super_admin') return true;
  if (ctx.role === 'admin') return true;
  return ctx.role === 'student' && ctx.studentId === studentId;
}

export function canManageStaff(ctx: PermissionContext): boolean {
  return ctx.role === 'super_admin' || ctx.role === 'admin';
}

export function canManageCourses(ctx: PermissionContext): boolean {
  return ctx.role === 'super_admin' || ctx.role === 'admin';
}

export function canSendInvitations(ctx: PermissionContext): boolean {
  return ctx.role === 'super_admin' || ctx.role === 'admin';
}

export function canViewAuditLogs(ctx: PermissionContext): boolean {
  return ctx.role === 'super_admin';
}

export function canViewModerationLogs(ctx: PermissionContext): boolean {
  return ctx.role === 'super_admin' || ctx.role === 'admin';
}

export function getRoleRedirect(role: AppRole): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin';
    case 'admin':
      return '/admin';
    case 'student':
      return '/student/profile';
    default:
      return '/login';
  }
}
