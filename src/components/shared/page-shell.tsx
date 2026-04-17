import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('min-h-screen bg-beige-light', className)}>
      {children}
    </div>
  );
}

export function PageContainer({ children, className }: PageShellProps) {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="text-3xl sm:text-4xl font-heading font-bold text-night tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-warm-gray text-lg">{subtitle}</p>
      )}
    </div>
  );
}
