import { requireRole } from '@/lib/auth';
import { getGraduationYears } from '@/lib/queries';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateYearForm } from './create-year-form';
import { formatDate } from '@/lib/utils';

export default async function ManageYearsPage() {
  await requireRole('super_admin');
  const years = await getGraduationYears();

  return (
    <div>
      <SectionHeading title="Manage Years" subtitle="Create and configure graduation years" />

      <CreateYearForm />

      <div className="space-y-3 mt-6">
        {years.map((year) => (
          <Card key={year.id}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-night">{year.title}</h3>
                  <Badge variant={year.status === 'active' ? 'success' : year.status === 'archived' ? 'muted' : 'warning'}>
                    {year.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-warm-gray mt-1">
                  <span>Slug: /{year.slug}</span>
                  {year.submission_deadline && (
                    <span>Deadline: {formatDate(year.submission_deadline)}</span>
                  )}
                  {year.editing_lock_at && (
                    <span>Lock: {formatDate(year.editing_lock_at)}</span>
                  )}
                  <span>Visible: {year.is_visible ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
