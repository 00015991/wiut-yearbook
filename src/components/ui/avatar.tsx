import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-12 h-12 text-xs',
  lg: 'w-20 h-20 text-base',
  xl: 'w-32 h-32 text-2xl',
};

/**
 * Round portrait chip. Thin ring instead of the chunky `border-2` — sits
 * closer to printed-photo feel. Initials fallback uses the serif to stay
 * on-brand even without an image.
 */
export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover ring-1 ring-soft-border',
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-heading font-medium',
        'bg-beige-dark/60 text-night/70 ring-1 ring-soft-border',
        sizeStyles[size],
        className
      )}
    >
      {initials || '·'}
    </div>
  );
}
