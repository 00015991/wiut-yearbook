import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug, getVisibleStudentsByYear, getCoursesByYear } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default async function StudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ course?: string; search?: string }>;
}) {
  const { year: yearSlug } = await params;
  const filters = await searchParams;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const [students, courses] = await Promise.all([
    getVisibleStudentsByYear(yearData.id),
    getCoursesByYear(yearData.id),
  ]);

  // Generate signed URLs for portraits
  const supabase = await createClient();
  const studentsWithUrls = await Promise.all(
    students.map(async (student) => {
      let portraitUrl = '';
      const portrait = student.portrait;
      if (portrait) {
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(portrait.storage_thumb_path, 3600);
        portraitUrl = data?.signedUrl || '';
      }
      return { ...student, portraitUrl };
    })
  );

  // Filter
  let filtered = studentsWithUrls;
  if (filters.course) {
    filtered = filtered.filter((s) => s.course_id === filters.course);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((s) => s.full_name.toLowerCase().includes(q));
  }

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Our Graduates"
        subtitle={`${filtered.length} students from the Class of ${yearData.year_label}`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href={`/year/${yearSlug}/students`}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !filters.course
              ? 'bg-burgundy text-white'
              : 'bg-white border border-soft-border text-warm-gray hover:bg-beige'
          }`}
        >
          All
        </Link>
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/year/${yearSlug}/students?course=${course.id}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filters.course === course.id
                ? 'bg-burgundy text-white'
                : 'bg-white border border-soft-border text-warm-gray hover:bg-beige'
            }`}
          >
            {course.name}
          </Link>
        ))}
      </div>

      {/* Student Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
          {filtered.map((student) => (
            <Link
              key={student.id}
              href={`/year/${yearSlug}/students/${student.slug}`}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-soft-border hover:shadow-lg hover:shadow-burgundy/5 transition-all duration-300">
                <div className="aspect-[3/4] relative overflow-hidden bg-beige">
                  {student.portraitUrl ? (
                    <img
                      src={student.portraitUrl}
                      alt={student.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar alt={student.full_name} size="xl" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-night text-sm truncate">{student.full_name}</h3>
                  {student.course && (
                    <p className="text-xs text-warm-gray truncate mt-0.5">{student.course.name}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Students will appear here once they complete their profiles."
        />
      )}
    </PageContainer>
  );
}
