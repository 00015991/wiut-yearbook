import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Progress({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium text-night">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-warm-gray">{percentage}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-beige-dark overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            percentage >= 80
              ? 'bg-success'
              : percentage >= 50
                ? 'bg-gold'
                : 'bg-burgundy'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
