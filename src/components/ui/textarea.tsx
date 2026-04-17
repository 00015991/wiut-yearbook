'use client';

import { cn } from '@/lib/utils';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: number;
  maxChars?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, charCount, maxChars, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-sm font-medium text-night">
              {label}
            </label>
            {maxChars !== undefined && (
              <span className={cn(
                'text-xs',
                charCount !== undefined && charCount > maxChars ? 'text-error' : 'text-warm-gray'
              )}>
                {charCount ?? 0}/{maxChars}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white text-night resize-none',
            'placeholder:text-warm-gray/60 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy',
            error
              ? 'border-error focus:ring-error/30 focus:border-error'
              : 'border-soft-border',
            className
          )}
          rows={4}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        {hint && !error && <p className="text-sm text-warm-gray">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea };
