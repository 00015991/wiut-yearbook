'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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

export function DashboardSidebar({ role, yearLabel }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: '/student/profile', label: 'My Profile', icon: User },
    { href: '/student/photos', label: 'My Photos', icon: Camera },
    { href: '/student/preview', label: 'Preview Page', icon: Eye },
    { href: '/student/status', label: 'Submission Status', icon: CheckCircle },
    { href: '/student/messages', label: 'Messages', icon: MessageSquare },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/access-requests', label: 'Access Requests', icon: UserCheck },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/invitations', label: 'Invitations', icon: Mail },
    { href: '/admin/moderation', label: 'Moderation', icon: Shield },
    { href: '/admin/staff', label: 'Staff', icon: GraduationCap },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/settings', label: 'Year Settings', icon: Settings },
    { href: '/admin/logs', label: 'Logs', icon: FileText },
  ];

  const superAdminLinks = [
    { href: '/super-admin', label: 'Global Dashboard', icon: LayoutDashboard },
    { href: '/super-admin/years', label: 'Manage Years', icon: Globe },
    { href: '/super-admin/admins', label: 'Manage Admins', icon: KeyRound },
    { href: '/super-admin/moderation', label: 'Global Moderation', icon: Shield },
    { href: '/super-admin/settings', label: 'Platform Settings', icon: Settings },
    { href: '/super-admin/audit', label: 'Audit Logs', icon: Activity },
  ];

  const links =
    role === 'super_admin'
      ? superAdminLinks
      : role === 'admin'
        ? adminLinks
        : studentLinks;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-soft-border flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-soft-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-burgundy flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-night text-sm">WIUT Yearbook</div>
            {yearLabel && (
              <div className="text-xs text-warm-gray">Class of {yearLabel}</div>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                isActive
                  ? 'bg-burgundy/10 text-burgundy font-medium'
                  : 'text-warm-gray hover:text-night hover:bg-beige'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-soft-border">
        <form action="/api/auth/signout" method="POST">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-warm-gray hover:text-error hover:bg-error/5 w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
