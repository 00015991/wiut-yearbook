import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default async function GlobalModerationPage() {
  await requireRole('super_admin');

  const supabase = await createClient();
  const { data: recentLogs } = await supabase
    .from('moderation_logs')
    .select('*, actor:app_users(email)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <SectionHeading title="Global Moderation" subtitle="All moderation activity across years" />

      {recentLogs && recentLogs.length > 0 ? (
        <div className="space-y-2">
          {recentLogs.map((log) => (
            <Card key={log.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="info">{log.action}</Badge>
                  <div>
                    <span className="text-sm text-night">{log.target_type}</span>
                    {log.old_status && log.new_status && (
                      <span className="text-xs text-warm-gray ml-2">
                        {log.old_status} &rarr; {log.new_status}
                      </span>
                    )}
                    {log.reason && <p className="text-xs text-warm-gray">{log.reason}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-warm-gray">
                    {(log.actor as { email?: string } | null)?.email || 'System'}
                  </p>
                  <p className="text-xs text-warm-gray">{formatRelativeTime(log.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Shield} title="No moderation activity" />
      )}
    </div>
  );
}
