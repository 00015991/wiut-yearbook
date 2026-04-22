import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestActions } from '@/app/(dashboard)/admin/access-requests/request-actions';
import { UserCheck } from 'lucide-react';

/**
 * Global access-requests view for super admins.
 *
 * The admin version is scoped to `user.yearId`, but super admins aren't tied
 * to a single year — they need to see (and approve/reject) requests across
 * every graduation year. We join on graduation_years so each row can show
 * which class the request was filed for.
 */
export default async function SuperAdminAccessRequestsPage() {
  await requireRole('super_admin');

  const supabase = await createClient();

  const { data: requests } = await supabase
    .from('access_requests')
    .select(
      `
        *,
        year:graduation_years!graduation_year_id(year_label, title, slug)
      `,
    )
    .order('created_at', { ascending: false });

  type RequestRow = {
    id: string;
    full_name: string;
    wiut_email: string;
    student_id_code: string | null;
    course_name_raw: string | null;
    request_status: string;
    created_at: string;
    // Supabase infers to-one joins as arrays; the runtime returns a single
    // object because `graduation_year_id` is a nullable FK. Cast through
    // `unknown` to reconcile the generated type with reality.
    year: { year_label: number; title: string | null; slug: string } | null;
  };

  const rows = (requests ?? []) as unknown as RequestRow[];
  const pending = rows.filter((r) => r.request_status === 'pending');
  const reviewed = rows.filter((r) => r.request_status !== 'pending');

  return (
    <div>
      <SectionHeading
        title="Access Requests"
        subtitle={`${pending.length} pending across all years`}
      />

      {pending.length > 0 ? (
        <div className="space-y-3 mb-10">
          {pending.map((req) => (
            <Card key={req.id} padding="sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-night">{req.full_name}</p>
                    {req.year && (
                      <Badge variant="info">
                        {req.year.title || `Class of ${req.year.year_label}`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-warm-gray">{req.wiut_email}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {req.student_id_code && (
                      <span className="text-xs bg-beige px-2 py-0.5 rounded">
                        ID: {req.student_id_code}
                      </span>
                    )}
                    {req.course_name_raw && (
                      <span className="text-xs bg-beige px-2 py-0.5 rounded">
                        {req.course_name_raw}
                      </span>
                    )}
                  </div>
                </div>
                <RequestActions requestId={req.id} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No pending requests"
          description="All access requests have been reviewed."
          className="mb-10"
        />
      )}

      {reviewed.length > 0 && (
        <>
          <h3 className="font-heading font-semibold text-night mb-3">
            Previously Reviewed
          </h3>
          <div className="space-y-2">
            {reviewed.slice(0, 30).map((req) => (
              <Card key={req.id} padding="sm" className="opacity-70">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-night">{req.full_name}</span>
                    <span className="text-xs text-warm-gray">
                      {req.wiut_email}
                    </span>
                    {req.year && (
                      <span className="text-xs text-warm-gray">
                        · {req.year.title || `Class of ${req.year.year_label}`}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={req.request_status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
