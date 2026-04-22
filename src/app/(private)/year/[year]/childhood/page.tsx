import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { Sparkles } from 'lucide-react';

export default async function ChildhoodPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const supabase = await createClient();

  // Pull every approved childhood photo for this year, plus the student the
  // photo belongs to. We intentionally do not fetch a "now" portrait — the
  // page is a tribute to the younger selves, not a side-by-side comparison.
  const { data: childhoodPhotos } = await supabase
    .from('student_photos')
    .select(
      'id, storage_display_path, uploaded_at, student:students(full_name, slug)',
    )
    .eq('graduation_year_id', yearData.id)
    .eq('category', 'childhood')
    .eq('moderation_status', 'approved')
    .eq('is_deleted', false)
    .order('uploaded_at', { ascending: false });

  const entries = await Promise.all(
    (childhoodPhotos || []).map(async (cp) => {
      const student = cp.student as unknown as { full_name: string; slug: string };
      const url = (await signStoragePath(cp.storage_display_path)) ?? '';
      return {
        id: cp.id,
        studentName: student?.full_name ?? 'Unknown',
        studentSlug: student?.slug ?? '',
        url,
      };
    }),
  );

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow={`Class of ${yearData.year_label}`}
        title="Childhood"
        subtitle="A gallery of our younger selves — the versions of us long before lectures, deadlines, and caps in the air."
      />

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 stagger-children">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={
                entry.studentSlug
                  ? `/year/${yearSlug}/students/${entry.studentSlug}`
                  : '#'
              }
              className="group block"
            >
              <figure className="relative overflow-hidden rounded-lg bg-beige ring-1 ring-soft-border shadow-paper-sm transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-paper-md">
                <div className="aspect-[3/4] overflow-hidden">
                  {entry.url && (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL
                    <img
                      src={entry.url}
                      alt={`${entry.studentName} as a child`}
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  )}
                  {/* Thin gradient so the caption stays legible on any image. */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-night/55 to-transparent"
                    aria-hidden="true"
                  />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 p-3">
                  <p className="accent-italic text-white text-[15px] leading-tight drop-shadow-sm">
                    {entry.studentName}
                  </p>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No childhood photos yet"
          description="Once classmates upload a photo of their younger selves, they'll appear here as a quiet little gallery."
        />
      )}
    </PageContainer>
  );
}
