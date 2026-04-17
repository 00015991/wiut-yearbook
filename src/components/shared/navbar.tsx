'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  GraduationCap,
  Image,
  Baby,
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
    { href: `${basePath}/childhood`, label: 'Then & Now', icon: Baby },
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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-soft-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={basePath} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-burgundy flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-night text-sm">WIUT</span>
              <span className="text-warm-gray text-xs ml-1">Class of {yearLabel}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-burgundy/10 text-burgundy font-medium'
                      : 'text-warm-gray hover:text-night hover:bg-beige'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href={dashboardLink}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-beige hover:bg-beige-dark transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">{userName || 'Dashboard'}</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-beige transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-soft-border bg-white animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                    isActive
                      ? 'bg-burgundy/10 text-burgundy font-medium'
                      : 'text-warm-gray hover:bg-beige'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <hr className="border-soft-border my-2" />
            <Link
              href={dashboardLink}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-warm-gray hover:bg-beige"
            >
              <User className="w-4 h-4" />
              Dashboard
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error/5 w-full">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
