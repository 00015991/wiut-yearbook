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
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-night tracking-tight"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border bg-white text-[15px] text-night',
            'placeholder:text-warm-gray/60 transition-[border-color,box-shadow] duration-200',
            'focus:outline-none focus:ring-2 focus:ring-burgundy/25 focus:border-burgundy/80',
            error
              ? 'border-error/70 focus:ring-error/25 focus:border-error'
              : 'border-soft-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-warm-gray">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
