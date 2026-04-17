import { requireRole } from '@/lib/auth';
import { getModerationLogs } from '@/lib/queries';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default async function AdminLogsPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const logs = await getModerationLogs(user.yearId);

  return (
    <div>
      <SectionHeading
        title="Moderation Logs"
        subtitle="Recent moderation activity"
      />

      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="info">{log.action}</Badge>
                  <div>
                    <span className="text-sm text-night">{log.target_type}</span>
                    {log.reason && (
                      <p className="text-xs text-warm-gray mt-0.5">{log.reason}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-warm-gray">
                    {(log as { actor?: { email?: string } }).actor?.email || 'System'}
                  </p>
                  <p className="text-xs text-warm-gray">
                    {formatRelativeTime(log.created_at)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No logs yet"
          description="Moderation activity will appear here."
        />
      )}
    </div>
  );
}
