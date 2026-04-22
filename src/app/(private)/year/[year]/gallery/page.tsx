import { notFound } from 'next/navigation';
import {
  getGraduationYearBySlug,
  getApprovedGalleryPhotos,
} from '@/lib/queries';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { GalleryClient } from './gallery-client';
import { Image } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { year: yearSlug } = await params;
  const filters = await searchParams;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const photos = await getApprovedGalleryPhotos(yearData.id, {
    category: filters.category || undefined,
    limit: 48,
  });

  const photosWithUrls = await Promise.all(
    photos.map(
      async (photo: {
        id: string;
        storage_display_path: string;
        storage_thumb_path: string;
        caption: string | null;
        orientation: string | null;
        category: string;
        student?: { full_name: string; slug: string };
      }) => {
        const [displayUrl, thumbUrl] = await Promise.all([
          signStoragePath(photo.storage_display_path),
          signStoragePath(photo.storage_thumb_path),
        ]);
        return {
          id: photo.id,
          displayUrl: displayUrl || '',
          thumbUrl: thumbUrl || '',
          caption: photo.caption,
          orientation: photo.orientation,
          category: photo.category,
          studentName: photo.student?.full_name || '',
          studentSlug: photo.student?.slug || '',
        };
      },
    ),
  );

  const categories = [
    { value: '', label: 'All' },
    { value: 'general', label: 'General' },
    { value: 'course', label: 'Course' },
    { value: 'portrait', label: 'Portraits' },
  ];

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Memories"
        title="Gallery"
        subtitle="The years we spent making memories, in no particular order."
      />

      {/* Category Filters */}
      <nav
        aria-label="Filter gallery"
        className="flex flex-wrap gap-2 mb-10 pb-5 hairline border-b"
      >
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={
              cat.value
                ? `/year/${yearSlug}/gallery?category=${cat.value}`
                : `/year/${yearSlug}/gallery`
            }
            className={cn(
              'px-3.5 py-1.5 text-[13px] rounded-md border transition-colors',
              (filters.category || '') === cat.value
                ? 'bg-night text-white border-night'
                : 'bg-white text-warm-gray border-soft-border hover:text-night hover:border-warm-gray/30',
            )}
          >
            {cat.label}
          </Link>
        ))}
      </nav>

      {photosWithUrls.length > 0 ? (
        <GalleryClient photos={photosWithUrls} yearSlug={yearSlug} />
      ) : (
        <EmptyState
          icon={Image}
          title="No photos yet"
          description="Photos will appear here once students upload and admins approve them."
        />
      )}
    </PageContainer>
  );
}
