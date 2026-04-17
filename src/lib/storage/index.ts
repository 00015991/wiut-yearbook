import type { PhotoCategory } from '@/types';

const BUCKET_NAME = 'graduation-book-private';

// ============================================================================
// Storage Path Builders
// ============================================================================

export function getStudentPhotoPath(
  yearLabel: number,
  studentId: string,
  category: PhotoCategory,
  photoId: string,
  variant: 'display' | 'thumb'
): string {
  if (category === 'portrait' || category === 'childhood') {
    return `years/${yearLabel}/students/${studentId}/${category}/${variant}/${photoId}.webp`;
  }
  return `years/${yearLabel}/students/${studentId}/${category}/${photoId}/${variant}/${photoId}.webp`;
}

export function getStaffPhotoPath(
  yearLabel: number,
  staffId: string,
  variant: 'display' | 'thumb'
): string {
  return `years/${yearLabel}/staff/${staffId}/portrait/${variant}/${staffId}.webp`;
}

export function getCourseCoverPath(
  yearLabel: number,
  courseId: string,
  variant: 'display' | 'thumb'
): string {
  return `years/${yearLabel}/courses/${courseId}/cover/${variant}/${courseId}.webp`;
}

export { BUCKET_NAME };

// ============================================================================
// Image Processing Config
// ============================================================================

export const IMAGE_CONFIG = {
  maxUploadSizeMB: 10,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  variants: {
    display: {
      portrait: { height: 1200 },
      landscape: { width: 1600 },
    },
    thumb: {
      maxDimension: 400,
    },
  },
  quality: {
    display: 82,
    thumb: 75,
  },
} as const;

export function isAllowedMimeType(mime: string): boolean {
  return (IMAGE_CONFIG.allowedMimeTypes as readonly string[]).includes(mime);
}

export function isWithinSizeLimit(sizeBytes: number): boolean {
  return sizeBytes <= IMAGE_CONFIG.maxUploadSizeMB * 1024 * 1024;
}

export function detectOrientation(width: number, height: number): 'portrait' | 'landscape' {
  return height > width ? 'portrait' : 'landscape';
}
