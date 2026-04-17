import { requireRole } from '@/lib/auth';
import { getAdminDashboardMetrics } from '@/lib/queries';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, UserCheck, Image, Shield, Mail, Settings } from 'lucide-react';

export default async function AdminDashboardPage() {
  const user = await requireRole('admin', 'super_admin');

  if (!user.yearId) {
    return (
      <div>
        <SectionHeading title="Admin Dashboard" />
        <p className="text-warm-gray">No year assigned. Contact a super admin.</p>
      </div>
    );
  }

  const metrics = await getAdminDashboardMetrics(user.yearId);

  const cards = [
    { label: 'Total Students', value: metrics.totalStudents, icon: Users, href: '/admin/students', color: 'text-night' },
    { label: 'Active Students', value: metrics.activeStudents, icon: UserCheck, href: '/admin/students', color: 'text-success' },
    { label: 'Pending Requests', value: metrics.pendingRequests, icon: Mail, href: '/admin/access-requests', color: 'text-warning' },
    { label: 'Pending Photos', value: metrics.pendingPhotos, icon: Shield, href: '/admin/moderation', color: 'text-burgundy' },
    { label: 'Approved Photos', value: metrics.approvedPhotos, icon: Image, href: '/admin/moderation', color: 'text-success' },
  ];

  return (
    <div>
      <SectionHeading title="Admin Dashboard" subtitle="Overview of your graduation year" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 stagger-children">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card hover className="text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${card.color}`} />
                <p className="text-2xl font-heading font-bold text-night">{card.value}</p>
                <p className="text-xs text-warm-gray mt-1">{card.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="font-heading font-semibold text-night mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/access-requests">
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-2" /> Review Requests
            </Button>
          </Link>
          <Link href="/admin/moderation">
            <Button variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" /> Moderate Photos
            </Button>
          </Link>
          <Link href="/admin/invitations">
            <Button variant="outline" size="sm">
              <UserCheck className="w-4 h-4 mr-2" /> Send Invitations
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Year Settings
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
