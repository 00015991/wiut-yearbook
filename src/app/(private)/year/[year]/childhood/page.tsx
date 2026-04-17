import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { Baby } from 'lucide-react';

export default async function ChildhoodPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const supabase = await createClient();

  // Get all childhood photos with their student info and portrait
  const { data: childhoodPhotos } = await supabase
    .from('student_photos')
    .select('id, storage_display_path, student_id, student:students(full_name, slug)')
    .eq('graduation_year_id', yearData.id)
    .eq('category', 'childhood')
    .eq('moderation_status', 'approved')
    .eq('is_deleted', false);

  // For each student with a childhood photo, also get their portrait
  const entries = await Promise.all(
    (childhoodPhotos || []).map(async (cp) => {
      const student = cp.student as unknown as { full_name: string; slug: string };

      // Get childhood signed URL
      const { data: childSigned } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(cp.storage_display_path, 3600);

      // Get portrait
      const { data: portrait } = await supabase
        .from('student_photos')
        .select('storage_display_path')
        .eq('student_id', cp.student_id)
        .eq('category', 'portrait')
        .eq('moderation_status', 'approved')
        .eq('is_deleted', false)
        .limit(1)
        .single();

      let portraitUrl = '';
      if (portrait) {
        const { data: portraitSigned } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(portrait.storage_display_path, 3600);
        portraitUrl = portraitSigned?.signedUrl || '';
      }

      return {
        id: cp.id,
        studentName: student.full_name,
        studentSlug: student.slug,
        childhoodUrl: childSigned?.signedUrl || '',
        portraitUrl,
      };
    })
  );

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Then & Now"
        subtitle="From playground to graduation stage — see how we grew up"
      />

      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/year/${yearSlug}/students/${entry.studentSlug}`}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-soft-border hover:shadow-lg transition-all duration-300">
                {/* Side-by-side comparison */}
                <div className="grid grid-cols-2 aspect-[2/1.2]">
                  <div className="relative overflow-hidden bg-beige">
                    {entry.childhoodUrl && (
                      <img
                        src={entry.childhoodUrl}
                        alt={`${entry.studentName} as a child`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute bottom-2 left-2 bg-night/70 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-medium">
                      Then
                    </div>
                  </div>
                  <div className="relative overflow-hidden bg-beige">
                    {entry.portraitUrl && (
                      <img
                        src={entry.portraitUrl}
                        alt={`${entry.studentName} now`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute bottom-2 right-2 bg-night/70 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-medium">
                      Now
                    </div>
                  </div>
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-night text-sm group-hover:text-burgundy transition-colors">
                    {entry.studentName}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Baby}
          title="No childhood photos yet"
          description="Students can upload their childhood photos to create Then & Now comparisons."
        />
      )}
    </PageContainer>
  );
}
