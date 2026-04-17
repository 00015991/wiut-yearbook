import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-beige flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-warm-gray" />
      </div>
      <h3 className="text-lg font-heading font-semibold text-night mb-1">{title}</h3>
      {description && <p className="text-sm text-warm-gray max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
