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
      {/* Masonry-like Grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="break-inside-avoid group cursor-pointer"
            onClick={() => {
              setCurrentIndex(index);
              setLightboxOpen(true);
            }}
          >
            <div className="relative rounded-xl overflow-hidden bg-beige">
              <img
                src={photo.thumbUrl}
                alt={photo.caption || 'Gallery photo'}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link
                  href={`/year/${yearSlug}/students/${photo.studentSlug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-white text-xs hover:underline"
                >
                  {photo.studentName}
                </Link>
                {photo.caption && (
                  <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{photo.caption}</p>
                )}
              </div>
            </div>
          </div>
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
