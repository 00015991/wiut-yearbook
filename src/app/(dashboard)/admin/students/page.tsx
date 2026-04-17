import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CSVUpload } from './csv-upload';
import { Users, Upload } from 'lucide-react';

export default async function AdminStudentsPage() {
  const user = await requireRole('admin', 'super_admin');
  if (!user.yearId) return <p>No year assigned.</p>;

  const supabase = await createClient();
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, wiut_email, slug, approval_status, profile_completion_pct, course:courses(name)')
    .eq('graduation_year_id', user.yearId)
    .order('full_name');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeading
          title="Students"
          subtitle={`${students?.length || 0} students in this year`}
          className="mb-0"
        />
      </div>

      {/* CSV Upload — Pre-seeded Activation */}
      <CSVUpload yearId={user.yearId} />

      {/* Students List */}
      {students && students.length > 0 ? (
        <div className="space-y-2 mt-6">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-warm-gray uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Course</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Completion</div>
          </div>
          {students.map((student) => (
            <Card key={student.id} padding="sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <p className="font-medium text-night text-sm">{student.full_name}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-sm text-warm-gray truncate">{student.wiut_email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-warm-gray">
                    {(() => {
                      const c = student.course as { name: string } | { name: string }[] | null;
                      if (!c) return '—';
                      return Array.isArray(c) ? (c[0]?.name ?? '—') : c.name;
                    })()}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <StatusBadge status={student.approval_status} />
                </div>
                <div className="md:col-span-2">
                  <Progress value={student.profile_completion_pct} size="sm" showPercentage={false} />
                  <p className="text-xs text-warm-gray mt-0.5">{student.profile_completion_pct}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Upload a CSV or approve access requests to add students."
        />
      )}
    </div>
  );
}
