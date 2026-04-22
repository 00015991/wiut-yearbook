'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SignedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  blurPlaceholder?: boolean;
}

export function SignedImage({
  src,
  alt,
  width,
  height,
  className,
  blurPlaceholder = true,
}: SignedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          'bg-beige flex items-center justify-center text-warm-gray text-sm',
          className
        )}
        style={{ width, height }}
      >
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {blurPlaceholder && !loaded && (
        <div className="absolute inset-0 bg-beige-dark animate-pulse-soft" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
