'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-night">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white text-night',
            'placeholder:text-warm-gray/60 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy',
            error
              ? 'border-error focus:ring-error/30 focus:border-error'
              : 'border-soft-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        {hint && !error && <p className="text-sm text-warm-gray">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
