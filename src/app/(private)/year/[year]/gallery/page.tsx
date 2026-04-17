import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getApprovedGalleryPhotos } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { GalleryClient } from './gallery-client';
import { Image } from 'lucide-react';
import Link from 'next/link';

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

  const supabase = await createClient();
  const photosWithUrls = await Promise.all(
    photos.map(async (photo: { id: string; storage_display_path: string; storage_thumb_path: string; caption: string | null; orientation: string | null; category: string; student?: { full_name: string; slug: string } }) => {
      const [displaySigned, thumbSigned] = await Promise.all([
        supabase.storage.from(BUCKET_NAME).createSignedUrl(photo.storage_display_path, 3600),
        supabase.storage.from(BUCKET_NAME).createSignedUrl(photo.storage_thumb_path, 3600),
      ]);
      return {
        id: photo.id,
        displayUrl: displaySigned.data?.signedUrl || '',
        thumbUrl: thumbSigned.data?.signedUrl || '',
        caption: photo.caption,
        orientation: photo.orientation,
        category: photo.category,
        studentName: photo.student?.full_name || '',
        studentSlug: photo.student?.slug || '',
      };
    })
  );

  const categories = [
    { value: '', label: 'All' },
    { value: 'general', label: 'General' },
    { value: 'course', label: 'Course' },
    { value: 'portrait', label: 'Portraits' },
  ];

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Gallery"
        subtitle="Memories captured during our time together"
      />

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={cat.value ? `/year/${yearSlug}/gallery?category=${cat.value}` : `/year/${yearSlug}/gallery`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (filters.category || '') === cat.value
                ? 'bg-burgundy text-white'
                : 'bg-white border border-soft-border text-warm-gray hover:bg-beige'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {photosWithUrls.length > 0 ? (
        <GalleryClient photos={photosWithUrls} yearSlug={yearSlug} />
      ) : (
        <EmptyState
          icon={Image}
          title="No photos yet"
          description="Photos will appear once students upload and admins approve them."
        />
      )}
    </PageContainer>
  );
}
