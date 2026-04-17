import { requireAuth } from '@/lib/auth';

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
