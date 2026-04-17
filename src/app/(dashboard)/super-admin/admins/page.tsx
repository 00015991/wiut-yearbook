import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateAdminForm } from './create-admin-form';
import { KeyRound } from 'lucide-react';

export default async function ManageAdminsPage() {
  await requireRole('super_admin');

  const supabase = await createClient();

  const { data: admins } = await supabase
    .from('app_users')
    .select('id, email, role, is_active, created_at')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false });

  // Get scopes
  const { data: scopes } = await supabase
    .from('admin_scopes')
    .select('user_id, graduation_year:graduation_years(year_label, title)');

  const scopeMap: Record<string, string> = {};
  for (const scope of scopes || []) {
    const year = scope.graduation_year as unknown as { year_label: number; title: string } | null;
    if (year) {
      scopeMap[scope.user_id] = year.title;
    }
  }

  return (
    <div>
      <SectionHeading title="Manage Admins" subtitle="Create and manage admin accounts" />

      <CreateAdminForm />

      {admins && admins.length > 0 ? (
        <div className="space-y-2 mt-6">
          {admins.map((admin) => (
            <Card key={admin.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-night text-sm">{admin.email}</p>
                  <p className="text-xs text-warm-gray">
                    {scopeMap[admin.id] || 'No year assigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.role === 'super_admin' ? 'default' : 'info'}>
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                  {!admin.is_active && <Badge variant="error">Suspended</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={KeyRound} title="No admins" className="mt-6" />
      )}
    </div>
  );
}
