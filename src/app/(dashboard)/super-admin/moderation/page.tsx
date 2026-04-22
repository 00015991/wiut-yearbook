import { requireRole } from '@/lib/auth';
import {
  getModerationQueue,
  getProfileModerationQueue,
  getModerationLogs,
} from '@/lib/queries';
import { signStoragePath } from '@/lib/storage/signed-url';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield, UserCheck, Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { ModerationCard } from '../../admin/moderation/moderation-card';
import { ProfileModerationCard } from '../../admin/moderation/profile-moderation-card';

type QueueRow = {
  id: string;
  storage_thumb_path: string;
  category: string;
  moderation_status: string;
  uploaded_at: string;
  graduation_year_id: string;
  student?: { full_name: string; slug: string; course?: { name: string } };
  year?: { year_label: number; slug: string } | null;
};

type ProfileRow = {
  student_id: string;
  profile_status: string;
  submitted_at: string | null;
  quote: string | null;
  quote_prompt: string | null;
  work_future_plan: string | null;
  favorite_song: string | null;
  favorite_memory: string | null;
  student?: {
    id: string;
    full_name: string;
    slug: string;
    graduation_year_id: string;
    course?: { name: string } | null;
    year?: { year_label: number; slug: string } | null;
  } | null;
};

/**
 * Global moderation view — super-admin can approve pending items across all
 * years AND see the audit trail of previous moderation actions.
 *
 * Shares the same `ModerationCard` / `ProfileModerationCard` components as
 * `/admin/moderation`; the `moderatePhoto` and `moderateProfile` server
 * actions enforce year-scope via `canModerate()`, which lets super-admin
 * through unconditionally.
 */
export default async function GlobalModerationPage() {
  await requireRole('super_admin');

  // `null` yearId = across all years.
  const [photoQueue, profileQueue, recentLogs] = await Promise.all([
    getModerationQueue(null),
    getProfileModerationQueue(null),
    getModerationLogs(null, 50),
  ]);

  // Supabase's generated types model foreign-key relations as arrays even
  // when the FK is single-valued, so we widen through `unknown` to land on
  // the shape the UI actually sees at runtime.
  const queueWithUrls = await Promise.all(
    (photoQueue as unknown as QueueRow[]).map(async (item) => ({
      ...item,
      thumbUrl: (await signStoragePath(item.storage_thumb_path)) ?? '',
    })),
  );

  const profileRows = profileQueue as unknown as ProfileRow[];

  return (
    <div>
      <SectionHeading
        title="Global Moderation"
        subtitle={`${queueWithUrls.length} photos and ${profileRows.length} profiles pending across all years`}
      />

      {/* Profile queue */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-burgundy" />
          <h2 className="text-lg font-heading font-semibold text-night">
            Profile submissions ({profileRows.length})
          </h2>
        </div>

        {profileRows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileRows.map((row) => (
              <ProfileModerationCard
                key={row.student_id}
                studentId={row.student_id}
                studentName={row.student?.full_name || 'Unknown student'}
                courseName={row.student?.course?.name || ''}
                yearLabel={row.student?.year?.year_label ?? null}
                quote={row.quote}
                quotePrompt={row.quote_prompt}
                workFuturePlan={row.work_future_plan}
                favoriteSong={row.favorite_song}
                favoriteMemory={row.favorite_memory}
                submittedAt={row.submitted_at}
                showYearBadge
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UserCheck}
            title="No profile submissions waiting"
            description="Student profiles awaiting review across all years will appear here."
          />
        )}
      </section>

      {/* Photo queue */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-burgundy" />
          <h2 className="text-lg font-heading font-semibold text-night">
            Photos ({queueWithUrls.length})
          </h2>
        </div>

        {queueWithUrls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {queueWithUrls.map((item) => (
              <ModerationCard
                key={item.id}
                photoId={item.id}
                thumbUrl={item.thumbUrl}
                category={item.category}
                status={item.moderation_status}
                studentName={item.student?.full_name || ''}
                courseName={item.student?.course?.name || ''}
                uploadedAt={item.uploaded_at}
                yearLabel={item.year?.year_label ?? null}
                showYearBadge
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title="No photos waiting"
            description="Photos pending review across all years will appear here."
          />
        )}
      </section>

      {/* Recent activity log */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-burgundy" />
          <h2 className="text-lg font-heading font-semibold text-night">
            Recent moderation activity
          </h2>
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const actor = (log as unknown as { actor?: { email?: string } | null }).actor;
              return (
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
                        {log.reason && (
                          <p className="text-xs text-warm-gray">{log.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-warm-gray">
                        {actor?.email || 'System'}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {formatRelativeTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Activity} title="No moderation activity yet" />
        )}
      </section>
    </div>
  );
}
