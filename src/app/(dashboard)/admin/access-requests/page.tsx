import { requireRole } from '@/lib/auth';
import { getAccessRequests } from '@/lib/queries';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestActions } from './request-actions';
import { UserCheck } from 'lucide-react';

export default async function AccessRequestsPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const requests = await getAccessRequests(user.yearId);
  const pending = requests.filter((r) => r.request_status === 'pending');
  const reviewed = requests.filter((r) => r.request_status !== 'pending');

  return (
    <div>
      <SectionHeading
        title="Access Requests"
        subtitle={`${pending.length} pending request${pending.length !== 1 ? 's' : ''}`}
      />

      {pending.length > 0 ? (
        <div className="space-y-3 mb-10">
          {pending.map((req) => (
            <Card key={req.id} padding="sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-night">{req.full_name}</p>
                  <p className="text-sm text-warm-gray">{req.wiut_email}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {req.student_id_code && (
                      <span className="text-xs bg-beige px-2 py-0.5 rounded">ID: {req.student_id_code}</span>
                    )}
                    {req.course_name_raw && (
                      <span className="text-xs bg-beige px-2 py-0.5 rounded">{req.course_name_raw}</span>
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
          <h3 className="font-heading font-semibold text-night mb-3">Previously Reviewed</h3>
          <div className="space-y-2">
            {reviewed.slice(0, 20).map((req) => (
              <Card key={req.id} padding="sm" className="opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-night">{req.full_name}</span>
                    <span className="text-xs text-warm-gray ml-2">{req.wiut_email}</span>
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
