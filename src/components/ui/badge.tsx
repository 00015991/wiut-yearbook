import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-burgundy/10 text-burgundy',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-night/10 text-night',
  muted: 'bg-beige-dark text-warm-gray',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
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
    pending: { label: 'Pending Review', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'error' },
    hidden: { label: 'Hidden', variant: 'muted' },
    removed: { label: 'Removed', variant: 'error' },
    active: { label: 'Active', variant: 'success' },
    invited: { label: 'Invited', variant: 'info' },
    not_requested: { label: 'Not Requested', variant: 'muted' },
    requested: { label: 'Requested', variant: 'warning' },
    uploading: { label: 'Uploading', variant: 'warning' },
    processing: { label: 'Processing', variant: 'warning' },
    ready: { label: 'Ready', variant: 'success' },
    failed: { label: 'Failed', variant: 'error' },
    open: { label: 'Voting Open', variant: 'success' },
    closed: { label: 'Voting Closed', variant: 'muted' },
    revealed: { label: 'Results Revealed', variant: 'info' },
  };

  const config = map[status] || { label: status, variant: 'muted' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
