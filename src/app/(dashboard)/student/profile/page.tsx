import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getStudentDashboard } from '@/lib/queries';
import { SectionHeading } from '@/components/shared/page-shell';
import { Progress } from '@/components/ui/progress';
import { ProfileWizard } from './profile-wizard';

export default async function StudentProfilePage() {
  const user = await requireRole('student');
  if (!user.studentId) redirect('/login');

  const { student, profile, photos } = await getStudentDashboard(user.studentId);
  if (!student) redirect('/login');

  const hasPortrait = photos.some((p) => p.category === 'portrait' && !p.is_deleted);

  return (
    <div>
      <SectionHeading
        title="My Profile"
        subtitle="Build your yearbook page — make it memorable"
      />

      {/* Completion Progress */}
      <div className="mb-8">
        <Progress
          value={student.profile_completion_pct}
          label="Profile Completion"
          className="max-w-md"
        />
        {student.profile_completion_pct < 100 && (
          <p className="text-sm text-warm-gray mt-2">
            Complete your profile to appear in the yearbook. Most of your classmates are already ahead!
          </p>
        )}
      </div>

      {/* Profile Wizard */}
      <ProfileWizard
        profile={profile}
        studentName={student.full_name}
        hasPortrait={hasPortrait}
      />
    </div>
  );
}
