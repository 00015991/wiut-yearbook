import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getGraduationYearBySlug,
  getVisibleStudentsByYear,
  getCoursesByYear,
} from '@/lib/queries';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

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

  // Generate signed URLs for portraits.
  const studentsWithUrls = await Promise.all(
    students.map(async (student) => {
      const portrait = student.portrait;
      const portraitUrl = portrait
        ? ((await signStoragePath(portrait.storage_thumb_path)) ?? '')
        : '';
      return { ...student, portraitUrl };
    }),
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
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow={`Class of ${yearData.year_label}`}
        title="Our graduates"
        subtitle={`${filtered.length} ${
          filtered.length === 1 ? 'portrait' : 'portraits'
        } from the class roster.`}
      />

      {/* Filters — tab-like chips, no rounded-full pills. */}
      <nav
        aria-label="Filter by course"
        className="flex flex-wrap gap-2 mb-10 pb-5 hairline border-b"
      >
        <FilterPill href={`/year/${yearSlug}/students`} active={!filters.course}>
          All courses
        </FilterPill>
        {courses.map((course) => (
          <FilterPill
            key={course.id}
            href={`/year/${yearSlug}/students?course=${course.id}`}
            active={filters.course === course.id}
          >
            {course.name}
          </FilterPill>
        ))}
      </nav>

      {/* Student Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 stagger-children">
          {filtered.map((student) => (
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
                      <Avatar alt={student.full_name} size="xl" />
                    </div>
                  )}
                </div>
              </figure>
              <figcaption className="mt-3">
                <h3 className="font-heading text-[15px] text-night truncate group-hover:text-burgundy transition-colors">
                  {student.full_name}
                </h3>
                {student.course && (
                  <p className="text-[12px] text-warm-gray truncate mt-0.5 tracking-wide">
                    {student.course.name}
                  </p>
                )}
              </figcaption>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Portraits will appear here once classmates complete their profiles."
        />
      )}
    </PageContainer>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3.5 py-1.5 text-[13px] rounded-md border transition-colors',
        active
          ? 'bg-night text-white border-night'
          : 'bg-white text-warm-gray border-soft-border hover:text-night hover:border-warm-gray/30',
      )}
    >
      {children}
    </Link>
  );
}
