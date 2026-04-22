import { requireRole } from '@/lib/auth';
import { getModerationQueue, getProfileModerationQueue } from '@/lib/queries';
import { signStoragePath } from '@/lib/storage/signed-url';
import { SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { ModerationCard } from './moderation-card';
import { ProfileModerationCard } from './profile-moderation-card';
import { Shield, UserCheck } from 'lucide-react';
import Link from 'next/link';

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

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const user = await requireRole('admin', 'super_admin');

  // Super-admins have no assigned yearId — they moderate across all years.
  // Year-scoped admins filter to their own year. A year-admin with no yearId
  // is a misconfiguration — show a clear message instead of a confusing
  // empty queue.
  const isSuperAdmin = user.role === 'super_admin';
  if (!isSuperAdmin && !user.yearId) {
    return (
      <div>
        <SectionHeading title="Moderation" />
        <p className="text-warm-gray">
          Your admin account isn&apos;t assigned to a graduation year yet. Ask
          the super-admin to assign you a year in Manage Admins.
        </p>
      </div>
    );
  }

  const scopedYearId = isSuperAdmin ? null : user.yearId!;

  const filters = await searchParams;
  const [queue, profileQueue] = await Promise.all([
    getModerationQueue(scopedYearId, {
      category: filters.category,
      status: filters.status || undefined,
    }),
    // Profile queue always shows pending only — there's no "rejected profiles"
    // tab because rejection is a destructive UX for the student.
    getProfileModerationQueue(scopedYearId),
  ]);

  // Supabase's generated types model foreign-key relations as arrays even
  // when the FK is single-valued, so we widen through `unknown` to land on
  // the shape the UI actually sees at runtime.
  const queueWithUrls = await Promise.all(
    (queue as unknown as QueueRow[]).map(async (item) => ({
      ...item,
      thumbUrl: (await signStoragePath(item.storage_thumb_path)) ?? '',
    })),
  );

  const filterTabs = [
    { value: '', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hidden', label: 'Hidden' },
  ];

  const profileRows = profileQueue as unknown as ProfileRow[];

  return (
    <div>
      <SectionHeading
        title={isSuperAdmin ? 'Global Moderation' : 'Photo Moderation'}
        subtitle={
          isSuperAdmin
            ? `Reviewing ${queue.length} photos and ${profileRows.length} profiles across all years`
            : `${queue.length} photos and ${profileRows.length} profiles awaiting review`
        }
      />

      {/* Profile moderation — surfaced first because the student can't upload
          anything until the profile is reviewed, so it's the blocking step. */}
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
                showYearBadge={isSuperAdmin}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UserCheck}
            title="No profile submissions waiting"
            description="Student profiles awaiting review will appear here."
          />
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-burgundy" />
          <h2 className="text-lg font-heading font-semibold text-night">
            Photos ({queueWithUrls.length})
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabs.map((tab) => (
            <Link
              key={tab.value}
              href={
                tab.value
                  ? `/admin/moderation?status=${tab.value}`
                  : '/admin/moderation'
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                (filters.status || '') === tab.value
                  ? 'bg-burgundy text-white'
                  : 'bg-white border border-soft-border text-warm-gray hover:bg-beige'
              }`}
            >
              {tab.label}
            </Link>
          ))}
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
                showYearBadge={isSuperAdmin}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title="Queue is empty"
            description="No photos match the current filters."
          />
        )}
      </section>
    </div>
  );
}
