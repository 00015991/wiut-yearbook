'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxPhoto {
  src: string;
  alt: string;
  caption?: string;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  open,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    },
    [onClose, onNavigate, currentIndex, photos.length]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open || !photos[currentIndex]) return null;

  const photo = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-night/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
        <img
          src={photo.src}
          alt={photo.alt}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {photo.caption && (
          <p className="mt-3 text-white/80 text-sm text-center">{photo.caption}</p>
        )}
        <p className="mt-1 text-white/50 text-xs">
          {currentIndex + 1} of {photos.length}
        </p>
      </div>
    </div>
  );
}
