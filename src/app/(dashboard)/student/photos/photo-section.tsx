'use client';

import { useState } from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { PhotoUploader } from '@/components/media/photo-uploader';
import { uploadStudentPhoto, deleteStudentPhoto } from '@/lib/actions/upload';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PhotoSectionProps {
  category: string;
  title: string;
  description: string;
  hint: string;
  maxCount: number;
  photos: {
    id: string;
    thumbUrl: string;
    status: string;
    processingStatus: string;
  }[];
}

export function PhotoSection({
  category,
  title,
  description,
  hint,
  maxCount,
  photos,
}: PhotoSectionProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.set('file', file);
    formData.set('category', category);

    const result = await uploadStudentPhoto(formData);
    if (result?.error) {
      throw new Error(result.error);
    }
    router.refresh();
  }

  async function handleDelete(photoId: string) {
    setDeleting(photoId);
    await deleteStudentPhoto(photoId);
    setDeleting(null);
    router.refresh();
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="text-xs text-warm-gray bg-beige px-2 py-1 rounded-full">
          {photos.length}/{maxCount}
        </span>
      </div>

      {/* Existing Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-beige">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
                <img
                  src={photo.thumbUrl}
                  alt={`${category} photo`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-2 left-2">
                <StatusBadge status={photo.status} />
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                disabled={deleting === photo.id}
                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-error" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {photos.length < maxCount && (
        <PhotoUploader
          category={category}
          onUpload={handleUpload}
          maxCount={maxCount}
          currentCount={photos.length}
        />
      )}

      <p className="text-xs text-warm-gray mt-3">{hint}</p>
    </Card>
  );
}
