import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug, getCourseBySlug } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

export default async function SingleCoursePage({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { year: yearSlug, slug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const course = await getCourseBySlug(yearData.id, slug);
  if (!course) notFound();

  const supabase = await createClient();

  // Get students in this course.
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, slug')
    .eq('course_id', course.id)
    .eq('approval_status', 'active')
    .order('full_name');

  // Get portraits for these students.
  const studentsWithPhotos = await Promise.all(
    (students || []).map(async (student) => {
      const { data: photo } = await supabase
        .from('student_photos')
        .select('storage_thumb_path')
        .eq('student_id', student.id)
        .eq('category', 'portrait')
        .eq('moderation_status', 'approved')
        .eq('is_deleted', false)
        .limit(1)
        .single();

      let portraitUrl = '';
      if (photo?.storage_thumb_path) {
        portraitUrl = (await signStoragePath(photo.storage_thumb_path)) ?? '';
      }
      return { ...student, portraitUrl };
    }),
  );

  // Get course photos.
  const { data: coursePhotos } = await supabase
    .from('student_photos')
    .select('id, storage_display_path, caption, student:students(full_name)')
    .eq('course_id', course.id)
    .eq('category', 'course')
    .eq('moderation_status', 'approved')
    .eq('is_deleted', false)
    .order('uploaded_at', { ascending: false });

  const coursePhotoUrls = await Promise.all(
    (coursePhotos || []).map(async (p) => ({
      id: p.id,
      url: (await signStoragePath(p.storage_display_path)) ?? '',
      caption: p.caption,
    })),
  );

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow={`Class of ${yearData.year_label}`}
        title={course.name}
        subtitle={
          course.description ||
          `${studentsWithPhotos.length} ${
            studentsWithPhotos.length === 1 ? 'graduate' : 'graduates'
          } on the roster.`
        }
      />

      {/* Course Photos */}
      {coursePhotoUrls.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="eyebrow">In the field</p>
              <h2 className="display-serif text-[24px] sm:text-[28px] text-night mt-2">
                Course photos
              </h2>
            </div>
            <div className="hidden sm:block h-px w-24 bg-gold/60" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {coursePhotoUrls.map((photo) => (
              <figure
                key={photo.id}
                className="overflow-hidden rounded-md aspect-video bg-beige ring-1 ring-soft-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
                <img
                  src={photo.url}
                  alt={photo.caption || 'Course photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Students in Course */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="eyebrow">The roster</p>
            <h2 className="display-serif text-[24px] sm:text-[28px] text-night mt-2">
              Graduates{' '}
              <span className="text-warm-gray/70 text-[18px] font-normal align-middle">
                · {studentsWithPhotos.length}
              </span>
            </h2>
          </div>
          <div className="hidden sm:block h-px w-24 bg-gold/60" aria-hidden="true" />
        </div>
        {studentsWithPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 stagger-children">
            {studentsWithPhotos.map((student) => (
              <Link
                key={student.id}
                href={`/year/${yearSlug}/students/${student.slug}`}
                className="group block"
              >
                <figure className="overflow-hidden rounded-md bg-beige ring-1 ring-soft-border shadow-paper-sm transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-paper-md">
                  <div className="aspect-[3/4] overflow-hidden">
                    {student.portraitUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL
                      <img
                        src={student.portraitUrl}
                        alt={student.full_name}
                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Avatar alt={student.full_name} size="lg" />
                      </div>
                    )}
                  </div>
                </figure>
                <figcaption className="mt-3">
                  <h3 className="font-heading text-[15px] text-night truncate group-hover:text-burgundy transition-colors">
                    {student.full_name}
                  </h3>
                </figcaption>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No graduates yet" />
        )}
      </section>
    </PageContainer>
  );
}
