import { requireRole } from '@/lib/auth';
import { getGraduationYears } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Globe, Users, KeyRound, Shield, Settings, Activity } from 'lucide-react';

export default async function SuperAdminDashboardPage() {
  await requireRole('super_admin');

  const years = await getGraduationYears();
  const supabase = await createClient();

  const { count: totalUsers } = await supabase
    .from('app_users')
    .select('id', { count: 'exact', head: true });

  const { count: totalAdmins } = await supabase
    .from('app_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');

  const cards = [
    { label: 'Graduation Years', value: years.length, icon: Globe, href: '/super-admin/years' },
    { label: 'Total Users', value: totalUsers || 0, icon: Users, href: '/super-admin/admins' },
    { label: 'Admins', value: totalAdmins || 0, icon: KeyRound, href: '/super-admin/admins' },
  ];

  return (
    <div>
      <SectionHeading title="Global Dashboard" subtitle="Platform-wide overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card hover className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-burgundy" />
                <p className="text-3xl font-heading font-bold text-night">{card.value}</p>
                <p className="text-xs text-warm-gray mt-1">{card.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Years Overview */}
      <Card>
        <h3 className="font-heading font-semibold text-night mb-4">Graduation Years</h3>
        <div className="space-y-2">
          {years.map((year) => (
            <div key={year.id} className="flex items-center justify-between py-2 border-b border-soft-border last:border-0">
              <div>
                <span className="font-medium text-night">{year.title}</span>
                <span className="text-xs text-warm-gray ml-2">/{year.slug}</span>
              </div>
              <Badge variant={year.status === 'active' ? 'success' : year.status === 'archived' ? 'muted' : 'warning'}>
                {year.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
