import { notFound } from 'next/navigation';
import { getGraduationYearBySlug } from '@/lib/queries';
import { getUserWithRole } from '@/lib/auth';
import { Navbar } from '@/components/shared/navbar';

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const [yearData, user] = await Promise.all([
    getGraduationYearBySlug(yearSlug),
    getUserWithRole(),
  ]);

  if (!yearData || !user) notFound();

  return (
    <div className="min-h-screen bg-beige-light">
      <Navbar
        yearSlug={yearSlug}
        yearLabel={yearData.year_label}
        role={user.role}
        userName={user.email.split('@')[0]}
      />
      <main>{children}</main>
    </div>
  );
}
