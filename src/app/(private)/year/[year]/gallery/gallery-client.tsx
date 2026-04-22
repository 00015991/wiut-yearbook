'use client';

import { useState } from 'react';
import { PhotoLightbox } from '@/components/media/photo-lightbox';
import Link from 'next/link';

interface GalleryPhoto {
  id: string;
  displayUrl: string;
  thumbUrl: string;
  caption: string | null;
  orientation: string | null;
  studentName: string;
  studentSlug: string;
}

interface GalleryClientProps {
  photos: GalleryPhoto[];
  yearSlug: string;
}

/**
 * Masonry grid via CSS columns — respects each photo's natural aspect ratio
 * without cropping, which matters for a gallery that mixes portraits and
 * landscapes. Clicking any tile opens the lightbox.
 */
export function GalleryClient({ photos, yearSlug }: GalleryClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const lightboxPhotos = photos.map((p) => ({
    src: p.displayUrl,
    alt: p.caption || `Photo by ${p.studentName}`,
    caption: p.caption || undefined,
  }));

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {photos.map((photo, index) => (
          <button
            type="button"
            key={photo.id}
            onClick={() => {
              setCurrentIndex(index);
              setLightboxOpen(true);
            }}
            className="block w-full break-inside-avoid group cursor-zoom-in text-left mb-4"
          >
            <div className="relative rounded-md overflow-hidden bg-beige ring-1 ring-soft-border shadow-paper-sm transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-0.5 group-hover:shadow-paper-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
              <img
                src={photo.thumbUrl}
                alt={photo.caption || 'Gallery photo'}
                className="w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-hidden="true"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {photo.studentName && (
                  <Link
                    href={`/year/${yearSlug}/students/${photo.studentSlug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-white text-[12px] uppercase tracking-[0.14em] hover:underline underline-offset-2"
                  >
                    {photo.studentName}
                  </Link>
                )}
                {photo.caption && (
                  <p className="accent-italic text-white/90 text-[13px] mt-1 line-clamp-2 leading-snug">
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <PhotoLightbox
        photos={lightboxPhotos}
        currentIndex={currentIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentIndex}
      />
    </>
  );
}
