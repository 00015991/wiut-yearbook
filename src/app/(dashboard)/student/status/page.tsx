import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getStudentDashboard } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SubmitButton } from './submit-button';
import { CheckCircle, Clock, AlertCircle, Camera, FileText, Lock } from 'lucide-react';

export default async function StudentStatusPage() {
  const user = await requireRole('student');
  if (!user.studentId) redirect('/login');

  const { student, profile, photos } = await getStudentDashboard(user.studentId);
  if (!student) redirect('/login');

  // Check year lock status
  const supabase = await createClient();
  const { data: year } = await supabase
    .from('graduation_years')
    .select('editing_lock_at, submission_deadline')
    .eq('id', student.graduation_year_id)
    .single();

  const isLocked = year?.editing_lock_at && new Date(year.editing_lock_at) <= new Date();
  const hasPortrait = photos.some((p) => p.category === 'portrait' && !p.is_deleted);
  const hasQuote = !!profile?.quote;
  const canSubmit = hasPortrait && hasQuote && !isLocked && profile?.profile_status === 'draft';

  const photosByStatus = {
    draft: photos.filter((p) => p.moderation_status === 'draft').length,
    pending: photos.filter((p) => p.moderation_status === 'pending').length,
    approved: photos.filter((p) => p.moderation_status === 'approved').length,
    rejected: photos.filter((p) => p.moderation_status === 'rejected').length,
  };

  return (
    <div>
      <SectionHeading
        title="Submission Status"
        subtitle="Track the status of your profile and photos"
      />

      {/* Lock Warning */}
      {isLocked && (
        <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
          <Lock className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-night text-sm">Editing is locked</p>
            <p className="text-sm text-warm-gray">
              The submission period has ended. Your profile is now final. Contact an admin if you need changes.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Status */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Profile</CardTitle>
            <StatusBadge status={profile?.profile_status || 'draft'} />
          </div>

          <div className="space-y-3">
            <StatusRow
              icon={<FileText className="w-4 h-4" />}
              label="Quote"
              done={hasQuote}
            />
            <StatusRow
              icon={<Camera className="w-4 h-4" />}
              label="Portrait photo"
              done={hasPortrait}
            />
            <StatusRow
              icon={<CheckCircle className="w-4 h-4" />}
              label="Profile submitted"
              done={profile?.profile_status !== 'draft'}
            />
          </div>

          <Progress
            value={student.profile_completion_pct}
            label="Completion"
            className="mt-4"
          />

          {/* Submit Button */}
          <div className="mt-6">
            {canSubmit ? (
              <SubmitButton />
            ) : profile?.profile_status === 'pending' ? (
              <p className="text-sm text-warning flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Your profile is awaiting admin review
              </p>
            ) : profile?.profile_status === 'approved' ? (
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Your profile has been approved!
              </p>
            ) : profile?.profile_status === 'rejected' ? (
              <p className="text-sm text-error flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Your profile needs changes. Please update and resubmit.
              </p>
            ) : null}
          </div>
        </Card>

        {/* Photo Status */}
        <Card>
          <CardTitle className="mb-4">Photos</CardTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-night">Total uploaded</span>
              <span className="font-medium text-night">{photos.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-soft-border">
              <span className="text-sm text-warm-gray">Draft</span>
              <span className="text-sm">{photosByStatus.draft}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-soft-border">
              <span className="text-sm text-warning">Pending Review</span>
              <span className="text-sm">{photosByStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-soft-border">
              <span className="text-sm text-success">Approved</span>
              <span className="text-sm">{photosByStatus.approved}</span>
            </div>
            {photosByStatus.rejected > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-soft-border">
                <span className="text-sm text-error">Rejected</span>
                <span className="text-sm">{photosByStatus.rejected}</span>
              </div>
            )}
          </div>

          {/* Deadline */}
          {year?.submission_deadline && (
            <div className="mt-4 pt-4 border-t border-soft-border">
              <p className="text-xs text-warm-gray">Submission deadline</p>
              <p className="text-sm font-medium text-night">
                {new Date(year.submission_deadline).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${done ? 'text-success' : 'text-warm-gray'}`}>{icon}</div>
      <span className={`text-sm ${done ? 'text-night' : 'text-warm-gray'}`}>{label}</span>
      {done && <CheckCircle className="w-3.5 h-3.5 text-success ml-auto" />}
    </div>
  );
}
