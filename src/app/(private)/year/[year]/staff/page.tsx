import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getStaffByYear } from '@/lib/queries';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap } from 'lucide-react';

export default async function StaffPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const staff = await getStaffByYear(yearData.id);

  const staffWithUrls = await Promise.all(
    staff.map(async (s) => ({
      ...s,
      portraitUrl: s.portrait_thumb_path
        ? ((await signStoragePath(s.portrait_thumb_path)) ?? '')
        : '',
    })),
  );

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Faculty"
        title="Our staff"
        subtitle="The people who guided, challenged, and stayed late with us."
      />

      {staffWithUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-10 sm:gap-12 stagger-children">
          {staffWithUrls.map((member) => (
            <article key={member.id} className="text-center group">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-beige ring-1 ring-soft-border shadow-paper-sm transition-transform duration-500 group-hover:scale-[1.03]">
                {member.portraitUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL
                  <img
                    src={member.portraitUrl}
                    alt={member.full_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Avatar
                    alt={member.full_name}
                    size="xl"
                    className="w-full h-full"
                  />
                )}
              </div>
              <h3 className="font-heading text-[17px] font-semibold text-night tracking-tight">
                {member.full_name}
              </h3>
              <p className="text-[12px] text-burgundy uppercase tracking-[0.14em] mt-1">
                {member.role_title}
              </p>
              {member.department && (
                <p className="text-xs text-warm-gray mt-1">{member.department}</p>
              )}
              {member.short_message && (
                <p className="accent-italic text-[13px] text-night/70 mt-4 max-w-[220px] mx-auto leading-relaxed">
                  &ldquo;{member.short_message}&rdquo;
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Staff profiles coming soon"
          description="Staff members will be added by the admin."
        />
      )}
    </PageContainer>
  );
}
