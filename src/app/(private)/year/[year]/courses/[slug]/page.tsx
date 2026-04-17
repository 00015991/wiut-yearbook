import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug, getCourseBySlug } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
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

  // Get students in this course
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, slug')
    .eq('course_id', course.id)
    .eq('approval_status', 'active')
    .order('full_name');

  // Get portraits for these students
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
        const { data: signed } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(photo.storage_thumb_path, 3600);
        portraitUrl = signed?.signedUrl || '';
      }
      return { ...student, portraitUrl };
    })
  );

  // Get course photos
  const { data: coursePhotos } = await supabase
    .from('student_photos')
    .select('id, storage_display_path, caption, student:students(full_name)')
    .eq('course_id', course.id)
    .eq('category', 'course')
    .eq('moderation_status', 'approved')
    .eq('is_deleted', false)
    .order('uploaded_at', { ascending: false });

  const coursePhotoUrls = await Promise.all(
    (coursePhotos || []).map(async (p) => {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(p.storage_display_path, 3600);
      return { id: p.id, url: data?.signedUrl || '', caption: p.caption };
    })
  );

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title={course.name}
        subtitle={course.description || `${studentsWithPhotos.length} graduates`}
      />

      {/* Course Photos */}
      {coursePhotoUrls.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-heading font-semibold text-night mb-4">Course Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {coursePhotoUrls.map((photo) => (
              <div key={photo.id} className="rounded-xl overflow-hidden aspect-video bg-beige">
                <img
                  src={photo.url}
                  alt={photo.caption || 'Course photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Students in Course */}
      <section>
        <h2 className="text-xl font-heading font-semibold text-night mb-4">
          Graduates ({studentsWithPhotos.length})
        </h2>
        {studentsWithPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
            {studentsWithPhotos.map((student) => (
              <Link
                key={student.id}
                href={`/year/${yearSlug}/students/${student.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden border border-soft-border hover:shadow-lg transition-all duration-300">
                  <div className="aspect-[3/4] bg-beige overflow-hidden">
                    {student.portraitUrl ? (
                      <img
                        src={student.portraitUrl}
                        alt={student.full_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Avatar alt={student.full_name} size="lg" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-night text-sm truncate">{student.full_name}</h3>
                  </div>
                </div>
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
