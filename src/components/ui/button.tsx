'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

// Restrained variant palette — primary is burgundy, secondary is night-ink,
// outline is a hairline border, ghost is chromeless for inline actions,
// danger is the red error for destructive moves. No gradients, no gloss.
const variantStyles: Record<Variant, string> = {
  primary:
    'bg-burgundy text-white shadow-paper-sm hover:bg-burgundy-light active:bg-burgundy-dark',
  secondary:
    'bg-night text-white shadow-paper-sm hover:bg-night-light active:bg-night',
  outline:
    'border border-soft-border text-night bg-white hover:bg-beige hover:border-warm-gray/40 active:bg-beige-dark',
  ghost:
    'text-night hover:bg-beige active:bg-beige-dark',
  danger:
    'bg-error text-white shadow-paper-sm hover:opacity-90 active:opacity-85',
};

// Editorial radius scale — modest rounding, never pill-shaped.
const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px] rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-[15px] rounded-lg gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium tracking-tight',
          'transition-[background-color,color,opacity,box-shadow,transform] duration-200 ease-out',
          'active:scale-[0.98] select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
