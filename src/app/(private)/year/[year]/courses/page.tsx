import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug, getCoursesByYear } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, ArrowUpRight } from 'lucide-react';

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const courses = await getCoursesByYear(yearData.id);

  // Count students per course (head-only query so we get the number without
  // pulling the rows).
  const supabase = await createClient();
  const coursesWithCounts = await Promise.all(
    courses.map(async (course) => {
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('approval_status', 'active');
      return { ...course, studentCount: count || 0 };
    }),
  );

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Programmes"
        title="Courses"
        subtitle={`${courses.length} ${
          courses.length === 1 ? 'programme' : 'programmes'
        } in the Class of ${yearData.year_label}.`}
      />

      {coursesWithCounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
          {coursesWithCounts.map((course, i) => (
            <Link
              key={course.id}
              href={`/year/${yearSlug}/courses/${course.slug}`}
              className="group"
            >
              <article className="relative h-full bg-white rounded-xl p-7 border border-soft-border/70 shadow-paper-sm transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-0.5 hover:shadow-paper-md hover:border-soft-border">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[11px] text-warm-gray tracking-[0.18em] uppercase">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <ArrowUpRight
                    className="w-4 h-4 text-warm-gray/50 group-hover:text-burgundy transition-colors"
                    strokeWidth={1.6}
                  />
                </div>
                <h3 className="display-serif text-[22px] text-night group-hover:text-burgundy transition-colors">
                  {course.name}
                </h3>
                {course.description && (
                  <p className="text-[14px] text-warm-gray mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}
                <div className="mt-5 pt-4 hairline border-t flex items-center justify-between">
                  <span className="text-[12px] text-burgundy tracking-wider uppercase">
                    {course.studentCount}{' '}
                    {course.studentCount === 1 ? 'graduate' : 'graduates'}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Courses will be added by the admin."
        />
      )}
    </PageContainer>
  );
}
