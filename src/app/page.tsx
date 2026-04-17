import { redirect } from 'next/navigation';
import { getUserWithRole } from '@/lib/auth';
import { getActiveGraduationYear } from '@/lib/queries';
import { getRoleRedirect } from '@/lib/permissions';

export default async function HomePage() {
  const user = await getUserWithRole();

  if (!user) {
    redirect('/login');
  }

  const activeYear = await getActiveGraduationYear();

  if (activeYear) {
    redirect(`/year/${activeYear.slug}`);
  }

  redirect(getRoleRedirect(user.role));
}
