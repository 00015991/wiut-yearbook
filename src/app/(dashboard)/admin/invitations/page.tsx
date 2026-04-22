import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { InviteButton, ResendInviteButton } from './invite-button';
import { Mail } from 'lucide-react';

export default async function InvitationsPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const supabase = await createClient();

  // Students who can be invited (approved but not yet active)
  const { data: invitable } = await supabase
    .from('students')
    .select('id, full_name, wiut_email, approval_status')
    .eq('graduation_year_id', user.yearId)
    .in('approval_status', ['approved', 'not_requested'])
    .order('full_name');

  // Already invited / active
  const { data: invited } = await supabase
    .from('students')
    .select('id, full_name, wiut_email, approval_status, invited_at, joined_at')
    .eq('graduation_year_id', user.yearId)
    .in('approval_status', ['invited', 'active'])
    .order('full_name');

  return (
    <div>
      <SectionHeading
        title="Invitations"
        subtitle="Send activation links to approved students"
      />

      {/* Invitable Students */}
      {invitable && invitable.length > 0 ? (
        <div className="space-y-2 mb-10">
          <h3 className="text-sm font-medium text-warm-gray uppercase tracking-wider mb-2">
            Ready to Invite ({invitable.length})
          </h3>
          {invitable.map((student) => (
            <Card key={student.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-night text-sm">{student.full_name}</p>
                  <p className="text-xs text-warm-gray">{student.wiut_email}</p>
                </div>
                <InviteButton studentId={student.id} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Mail}
          title="No students to invite"
          description="Approve access requests or upload a CSV to add students first."
          className="mb-10"
        />
      )}

      {/* Already Invited */}
      {invited && invited.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-warm-gray uppercase tracking-wider mb-2">
            Invited / Active ({invited.length})
          </h3>
          <div className="space-y-2">
            {invited.map((student) => (
              <Card key={student.id} padding="sm" className="opacity-80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-night">{student.full_name}</p>
                    <p className="text-xs text-warm-gray">{student.wiut_email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={student.approval_status} />
                    {student.joined_at && (
                      <span className="text-xs text-warm-gray">
                        Joined {new Date(student.joined_at).toLocaleDateString()}
                      </span>
                    )}
                    {student.approval_status === 'invited' && (
                      <ResendInviteButton studentId={student.id} />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
