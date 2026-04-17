import { requireRole } from '@/lib/auth';
import { getCoursesByYear } from '@/lib/queries';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CourseForm } from './course-form';
import { BookOpen } from 'lucide-react';

export default async function AdminCoursesPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const courses = await getCoursesByYear(user.yearId);

  return (
    <div>
      <SectionHeading
        title="Course Management"
        subtitle="Manage courses for this graduation year"
      />

      <CourseForm yearId={user.yearId} />

      {courses.length > 0 ? (
        <div className="space-y-2 mt-6">
          {courses.map((course, idx) => (
            <Card key={course.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-beige flex items-center justify-center text-xs font-bold text-warm-gray">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-night text-sm">{course.name}</p>
                    {course.description && (
                      <p className="text-xs text-warm-gray line-clamp-1">{course.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-warm-gray">/{course.slug}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Add courses using the form above."
          className="mt-6"
        />
      )}
    </div>
  );
}
