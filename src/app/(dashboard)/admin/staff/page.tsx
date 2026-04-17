import { requireRole } from '@/lib/auth';
import { getStaffByYear } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { StaffForm } from './staff-form';
import { GraduationCap } from 'lucide-react';

export default async function AdminStaffPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('graduation_year_id', user.yearId)
    .order('display_order');

  return (
    <div>
      <SectionHeading
        title="Staff Management"
        subtitle="Add and manage staff profiles for this year"
      />

      <StaffForm yearId={user.yearId} />

      {staff && staff.length > 0 ? (
        <div className="space-y-3 mt-6">
          {staff.map((member) => (
            <Card key={member.id} padding="sm">
              <div className="flex items-center gap-4">
                <Avatar alt={member.full_name} size="md" />
                <div className="flex-1">
                  <p className="font-medium text-night">{member.full_name}</p>
                  <p className="text-sm text-burgundy">{member.role_title}</p>
                  {member.department && (
                    <p className="text-xs text-warm-gray">{member.department}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${member.is_visible ? 'bg-success/10 text-success' : 'bg-beige text-warm-gray'}`}>
                  {member.is_visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No staff members yet"
          description="Add staff profiles using the form above."
          className="mt-6"
        />
      )}
    </div>
  );
}
