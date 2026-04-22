import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  InviteButton,
  ResendInviteButton,
} from '@/app/(dashboard)/admin/invitations/invite-button';
import { Mail } from 'lucide-react';

/**
 * Global invitations view for super admins.
 *
 * Unlike the per-year admin page, super admins need to see (and kick off)
 * invites for students across every graduation year. The lists below are
 * grouped by invite readiness, same as the admin page, but each row shows
 * the class it belongs to.
 */
export default async function SuperAdminInvitationsPage() {
  await requireRole('super_admin');

  const supabase = await createClient();

  const { data: invitable } = await supabase
    .from('students')
    .select(
      `
        id,
        full_name,
        wiut_email,
        approval_status,
        year:graduation_years!graduation_year_id(year_label, title, slug)
      `,
    )
    .in('approval_status', ['approved', 'not_requested'])
    .order('full_name');

  const { data: invited } = await supabase
    .from('students')
    .select(
      `
        id,
        full_name,
        wiut_email,
        approval_status,
        invited_at,
        joined_at,
        year:graduation_years!graduation_year_id(year_label, title, slug)
      `,
    )
    .in('approval_status', ['invited', 'active'])
    .order('full_name');

  type StudentRow = {
    id: string;
    full_name: string;
    wiut_email: string;
    approval_status: string;
    invited_at?: string | null;
    joined_at?: string | null;
    // Supabase infers to-one joins as arrays; the runtime returns a single
    // object because `graduation_year_id` is a nullable FK. Cast through
    // `unknown` to reconcile the generated type with reality.
    year: { year_label: number; title: string | null; slug: string } | null;
  };

  const invitableRows = (invitable ?? []) as unknown as StudentRow[];
  const invitedRows = (invited ?? []) as unknown as StudentRow[];

  const yearLabel = (y: StudentRow['year']) =>
    y ? y.title || `Class of ${y.year_label}` : 'Unassigned';

  return (
    <div>
      <SectionHeading
        title="Invitations"
        subtitle="Send activation links to approved students across all years"
      />

      {invitableRows.length > 0 ? (
        <div className="space-y-2 mb-10">
          <h3 className="text-sm font-medium text-warm-gray uppercase tracking-wider mb-2">
            Ready to Invite ({invitableRows.length})
          </h3>
          {invitableRows.map((student) => (
            <Card key={student.id} padding="sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-night text-sm">
                      {student.full_name}
                    </p>
                    <Badge variant="info">{yearLabel(student.year)}</Badge>
                  </div>
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

      {invitedRows.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-warm-gray uppercase tracking-wider mb-2">
            Invited / Active ({invitedRows.length})
          </h3>
          <div className="space-y-2">
            {invitedRows.map((student) => (
              <Card key={student.id} padding="sm" className="opacity-80">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-night">{student.full_name}</p>
                      <span className="text-xs text-warm-gray">
                        · {yearLabel(student.year)}
                      </span>
                    </div>
                    <p className="text-xs text-warm-gray">{student.wiut_email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={student.approval_status} />
                    {student.joined_at && (
                      <span className="text-xs text-warm-gray">
                        Joined {new Date(student.joined_at).toLocaleDateString()}
                      </span>
                    )}
                    {/* Only invited (not yet active) students get a resend —
                        once they've activated, minting a fresh token would
                        be pointless because the invitation flow aborts. */}
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
