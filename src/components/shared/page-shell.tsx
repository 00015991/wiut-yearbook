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

/**
 * Section heading with a magazine-style eyebrow. The eyebrow is optional —
 * when omitted the title carries on its own. The underline below the title is
 * a short gold rule, a small editorial detail that ties the hierarchy together.
 */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  className,
  align = 'left',
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-10',
        align === 'center' && 'text-center',
        className
      )}
    >
      {eyebrow && (
        <p className={cn('eyebrow mb-3', align === 'center' && 'mx-auto')}>
          {eyebrow}
        </p>
      )}
      <h2 className="display-serif text-[28px] sm:text-[34px] leading-[1.08] text-night">
        {title}
      </h2>
      <div
        className={cn(
          'mt-3 h-px w-12 bg-gold/70',
          align === 'center' && 'mx-auto'
        )}
        aria-hidden="true"
      />
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-[15px] text-warm-gray leading-relaxed max-w-2xl',
            align === 'center' && 'mx-auto'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
