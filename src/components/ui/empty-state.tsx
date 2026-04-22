import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Quiet empty state — a hairline-bordered paper card rather than a block of
 * tinted beige. Reads as "this space is reserved", not as an error.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        'rounded-xl border border-dashed border-soft-border bg-white/40',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-beige flex items-center justify-center mb-4 ring-1 ring-soft-border">
        <Icon className="w-5 h-5 text-warm-gray" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-heading font-semibold text-night tracking-tight mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-warm-gray max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
