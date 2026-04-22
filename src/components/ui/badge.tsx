import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'gold';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  /** When true, use a pill shape — otherwise a soft rectangle that reads as a label. */
  pill?: boolean;
}

// Tonal, low-saturation chips — the type stays legible on the tinted background
// without shouting. The `gold` variant is for earned/winner states.
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-burgundy/10 text-burgundy',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/14 text-[color:var(--color-warning)]',
  error: 'bg-error/12 text-error',
  info: 'bg-night/8 text-night',
  muted: 'bg-beige-dark/60 text-warm-gray',
  gold: 'bg-gold/15 text-[color:var(--color-gold)]',
};

export function Badge({ children, variant = 'default', className, pill = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        pill ? 'rounded-full' : 'rounded',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    draft: { label: 'Draft', variant: 'muted' },
    pending: { label: 'Pending review', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'error' },
    hidden: { label: 'Hidden', variant: 'muted' },
    removed: { label: 'Removed', variant: 'error' },
    active: { label: 'Active', variant: 'success' },
    invited: { label: 'Invited', variant: 'info' },
    not_requested: { label: 'Not requested', variant: 'muted' },
    requested: { label: 'Requested', variant: 'warning' },
    uploading: { label: 'Uploading', variant: 'warning' },
    processing: { label: 'Processing', variant: 'warning' },
    ready: { label: 'Ready', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
    open: { label: 'Voting open', variant: 'success' },
    closed: { label: 'Voting closed', variant: 'muted' },
    revealed: { label: 'Results revealed', variant: 'info' },
  };

  const config = map[status] || { label: status, variant: 'muted' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
