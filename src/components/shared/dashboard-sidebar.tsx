'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/actions/auth';
import {
  User,
  Camera,
  Eye,
  CheckCircle,
  MessageSquare,
  LayoutDashboard,
  UserCheck,
  Mail,
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  FileText,
  Globe,
  KeyRound,
  Activity,
  LogOut,
} from 'lucide-react';
import type { AppRole } from '@/types';

interface SidebarProps {
  role: AppRole;
  yearLabel?: number;
}

/**
 * Dashboard sidebar. A thin vertical index — muted hairline dividers between
 * groups, the active link marked by a small burgundy bar instead of a filled
 * pill. Matches the editorial feel of the public navbar.
 */
export function DashboardSidebar({ role, yearLabel }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: '/student/profile', label: 'My profile', icon: User },
    { href: '/student/photos', label: 'My photos', icon: Camera },
    { href: '/student/preview', label: 'Preview page', icon: Eye },
    { href: '/student/status', label: 'Submission status', icon: CheckCircle },
    { href: '/student/messages', label: 'Messages', icon: MessageSquare },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/access-requests', label: 'Access requests', icon: UserCheck },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/invitations', label: 'Invitations', icon: Mail },
    { href: '/admin/moderation', label: 'Moderation', icon: Shield },
    { href: '/admin/staff', label: 'Staff', icon: GraduationCap },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/settings', label: 'Year settings', icon: Settings },
    { href: '/admin/logs', label: 'Logs', icon: FileText },
  ];

  const superAdminLinks = [
    { href: '/super-admin', label: 'Global dashboard', icon: LayoutDashboard },
    { href: '/super-admin/years', label: 'Manage years', icon: Globe },
    { href: '/super-admin/admins', label: 'Manage admins', icon: KeyRound },
    { href: '/super-admin/access-requests', label: 'Access requests', icon: UserCheck },
    { href: '/super-admin/invitations', label: 'Invitations', icon: Mail },
    { href: '/super-admin/moderation', label: 'Global moderation', icon: Shield },
    { href: '/super-admin/settings', label: 'Platform settings', icon: Settings },
    { href: '/super-admin/audit', label: 'Audit logs', icon: Activity },
  ];

  const links =
    role === 'super_admin'
      ? superAdminLinks
      : role === 'admin'
        ? adminLinks
        : studentLinks;

  const roleLabel =
    role === 'super_admin' ? 'Super admin' : role === 'admin' ? 'Admin' : 'Student';

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-soft-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-soft-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-md bg-burgundy text-white flex items-center justify-center shadow-paper-sm group-hover:bg-burgundy-light transition-colors">
            <BookOpen className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-[15px] font-semibold text-night tracking-tight">
              WIUT Yearbook
            </span>
            {yearLabel ? (
              <span className="text-[11px] text-warm-gray tracking-wider uppercase">
                Class of {yearLabel}
              </span>
            ) : (
              <span className="text-[11px] text-warm-gray tracking-wider uppercase">
                {roleLabel}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="eyebrow px-3 py-2 text-warm-gray">{roleLabel}</p>
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' &&
              item.href !== '/super-admin' &&
              pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors duration-200',
                isActive
                  ? 'bg-beige text-night font-medium'
                  : 'text-warm-gray hover:text-night hover:bg-beige/60',
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-burgundy rounded-full"
                />
              )}
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-burgundy' : 'text-warm-gray',
                )}
                strokeWidth={1.6}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-soft-border">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] text-warm-gray hover:text-error hover:bg-error/5 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.6} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
