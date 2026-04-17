import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug, getCoursesByYear } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, ArrowRight } from 'lucide-react';

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const courses = await getCoursesByYear(yearData.id);

  // Count students per course
  const supabase = await createClient();
  const coursesWithCounts = await Promise.all(
    courses.map(async (course) => {
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('approval_status', 'active');
      return { ...course, studentCount: count || 0 };
    })
  );

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Programmes"
        subtitle={`${courses.length} courses in the Class of ${yearData.year_label}`}
      />

      {coursesWithCounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {coursesWithCounts.map((course) => (
            <Link
              key={course.id}
              href={`/year/${yearSlug}/courses/${course.slug}`}
              className="group"
            >
              <div className="bg-white rounded-2xl p-6 border border-soft-border hover:shadow-lg hover:shadow-burgundy/5 transition-all duration-300 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-night group-hover:text-burgundy transition-colors">
                    {course.name}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-warm-gray mt-1 line-clamp-2">{course.description}</p>
                  )}
                  <p className="text-sm text-burgundy mt-2 font-medium">
                    {course.studentCount} graduate{course.studentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-warm-gray group-hover:text-burgundy transition-colors flex-shrink-0" />
              </div>
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
