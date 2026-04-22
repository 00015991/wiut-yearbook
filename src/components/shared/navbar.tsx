'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/actions/auth';
import {
  BookOpen,
  Users,
  GraduationCap,
  Image,
  Sparkles,
  Award,
  BarChart3,
  Menu,
  X,
  User,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import type { AppRole } from '@/types';

interface NavbarProps {
  yearSlug: string;
  yearLabel: number;
  role: AppRole;
  userName?: string;
}

export function Navbar({ yearSlug, yearLabel, role, userName }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/year/${yearSlug}`;

  const navItems = [
    { href: basePath, label: 'Home', icon: BookOpen },
    { href: `${basePath}/students`, label: 'Students', icon: Users },
    { href: `${basePath}/staff`, label: 'Staff', icon: GraduationCap },
    { href: `${basePath}/courses`, label: 'Courses', icon: GraduationCap },
    { href: `${basePath}/gallery`, label: 'Gallery', icon: Image },
    { href: `${basePath}/childhood`, label: 'Childhood', icon: Sparkles },
    { href: `${basePath}/superlatives`, label: 'Awards', icon: Award },
    { href: `${basePath}/statistics`, label: 'Stats', icon: BarChart3 },
  ];

  const dashboardLink =
    role === 'super_admin'
      ? '/super-admin'
      : role === 'admin'
        ? '/admin'
        : '/student/profile';

  return (
    <header className="sticky top-0 z-40 bg-beige-light/85 backdrop-blur-xl border-b border-soft-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo — wordmark-first, small monogram for recognition at narrow widths. */}
          <Link href={basePath} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-md bg-burgundy text-white flex items-center justify-center shadow-paper-sm">
              <BookOpen className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-[15px] font-semibold text-night tracking-tight">
                WIUT Yearbook
              </span>
              <span className="text-[11px] text-warm-gray tracking-wider uppercase">
                Class of {yearLabel}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-3 py-2 text-[13px] rounded-md transition-colors duration-200',
                    isActive
                      ? 'text-night font-medium'
                      : 'text-warm-gray hover:text-night'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-3 right-3 -bottom-0.5 h-px bg-burgundy"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href={dashboardLink}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-[13px] rounded-md border border-soft-border bg-white text-night hover:bg-beige hover:border-warm-gray/30 transition-colors"
            >
              <User className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span className="hidden md:inline">{userName || 'Dashboard'}</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-night hover:bg-beige transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-soft-border bg-white animate-fade-in">
          <nav className="px-4 py-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-burgundy/8 text-burgundy font-medium'
                      : 'text-warm-gray hover:bg-beige hover:text-night'
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.6} />
                  {item.label}
                </Link>
              );
            })}
            <div className="hairline border-t my-2" />
            <Link
              href={dashboardLink}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-warm-gray hover:bg-beige"
            >
              <User className="w-4 h-4" strokeWidth={1.6} />
              Dashboard
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-error hover:bg-error/5 w-full"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.6} />
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
