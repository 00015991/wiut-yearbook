import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getStaffByYear } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
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

  const supabase = await createClient();
  const staffWithUrls = await Promise.all(
    staff.map(async (s) => {
      let url = '';
      if (s.portrait_thumb_path) {
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(s.portrait_thumb_path, 3600);
        url = data?.signedUrl || '';
      }
      return { ...s, portraitUrl: url };
    })
  );

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Our Staff"
        subtitle="The people who guided, inspired, and supported us"
      />

      {staffWithUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 stagger-children">
          {staffWithUrls.map((member) => (
            <div key={member.id} className="text-center group">
              <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-beige border-3 border-soft-border">
                {member.portraitUrl ? (
                  <img
                    src={member.portraitUrl}
                    alt={member.full_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Avatar alt={member.full_name} size="xl" className="w-full h-full" />
                )}
              </div>
              <h3 className="font-heading font-semibold text-night">{member.full_name}</h3>
              <p className="text-sm text-burgundy">{member.role_title}</p>
              {member.department && (
                <p className="text-xs text-warm-gray mt-0.5">{member.department}</p>
              )}
              {member.short_message && (
                <p className="text-xs text-warm-gray mt-2 italic font-accent max-w-[200px] mx-auto">
                  &ldquo;{member.short_message}&rdquo;
                </p>
              )}
            </div>
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
