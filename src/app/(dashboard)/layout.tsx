import { requireAuth, getUserWithRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const user = await getUserWithRole();
  if (!user) redirect('/login');

  // Get year label for sidebar
  let yearLabel: number | undefined;
  if (user.yearId) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('graduation_years')
      .select('year_label')
      .eq('id', user.yearId)
      .single();
    yearLabel = data?.year_label;
  }

  return (
    <div className="flex min-h-screen bg-beige-light">
      <DashboardSidebar role={user.role} yearLabel={yearLabel} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
