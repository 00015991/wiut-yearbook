import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { YearActions } from './year-actions';
import { Calendar, Lock } from 'lucide-react';

export default async function AdminSettingsPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const supabase = await createClient();
  const { data: year } = await supabase
    .from('graduation_years')
    .select('*')
    .eq('id', user.yearId)
    .single();

  if (!year) return <p>Year not found.</p>;

  const isLocked = year.editing_lock_at && new Date(year.editing_lock_at) <= new Date();

  return (
    <div>
      <SectionHeading
        title="Year Settings"
        subtitle={year.title}
      />

      <div className="space-y-4">
        {/* Status */}
        <Card>
          <CardTitle>Year Status</CardTitle>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-night">Status</span>
              <Badge variant={year.status === 'active' ? 'success' : year.status === 'archived' ? 'muted' : 'warning'}>
                {year.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night">Visible to students</span>
              <Badge variant={year.is_visible ? 'success' : 'muted'}>
                {year.is_visible ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardTitle>Deadlines</CardTitle>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-warm-gray" />
                <span className="text-sm text-night">Submission Deadline</span>
              </div>
              <span className="text-sm text-warm-gray">
                {year.submission_deadline
                  ? new Date(year.submission_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-warm-gray" />
                <span className="text-sm text-night">Editing Lock</span>
              </div>
              <span className="text-sm text-warm-gray">
                {isLocked
                  ? `Locked since ${new Date(year.editing_lock_at!).toLocaleDateString()}`
                  : year.editing_lock_at
                    ? `Locks on ${new Date(year.editing_lock_at).toLocaleDateString()}`
                    : 'Not set'}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Lock or unlock editing for this year</CardDescription>
          <div className="mt-4">
            <YearActions yearId={user.yearId} isLocked={!!isLocked} />
          </div>
        </Card>
      </div>
    </div>
  );
}
