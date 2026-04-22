import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Surface primitive. White paper on beige page — thin hairline border, a
 * barely-there paper shadow, and a modest radius. `hover` lifts the shadow
 * for interactive cards (e.g. link tiles) but stays quiet on static content.
 */
export function Card({ children, className, padding = 'md', hover }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-soft-border/70 shadow-paper-sm',
        paddingStyles[padding],
        hover && 'transition-[transform,box-shadow,border-color] duration-300 ease-out hover:shadow-paper-md hover:-translate-y-0.5 hover:border-soft-border',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-heading font-semibold text-night tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-warm-gray mt-1 leading-relaxed', className)}>
      {children}
    </p>
  );
}
