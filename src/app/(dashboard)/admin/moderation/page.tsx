import { requireRole } from '@/lib/auth';
import { getModerationQueue } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { ModerationCard } from './moderation-card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const filters = await searchParams;
  const queue = await getModerationQueue(user.yearId, {
    category: filters.category,
    status: filters.status || undefined,
  });

  const supabase = await createClient();
  const queueWithUrls = await Promise.all(
    queue.map(async (item: { id: string; storage_thumb_path: string; category: string; moderation_status: string; uploaded_at: string; student?: { full_name: string; slug: string; course?: { name: string } } }) => {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(item.storage_thumb_path, 3600);
      return { ...item, thumbUrl: data?.signedUrl || '' };
    })
  );

  const filterTabs = [
    { value: '', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hidden', label: 'Hidden' },
  ];

  return (
    <div>
      <SectionHeading
        title="Photo Moderation"
        subtitle={`${queue.length} items in queue`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterTabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/moderation?status=${tab.value}` : '/admin/moderation'}
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
    </div>
  );
}
