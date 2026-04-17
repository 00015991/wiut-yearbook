'use client';

import { cn } from '@/lib/utils';
import { Upload, X, RotateCw } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { IMAGE_CONFIG, isAllowedMimeType, isWithinSizeLimit } from '@/lib/storage';

interface PhotoUploaderProps {
  category: string;
  onUpload: (file: File) => Promise<void>;
  currentPhotoUrl?: string | null;
  maxCount?: number;
  currentCount?: number;
  accept?: string;
  className?: string;
}

export function PhotoUploader({
  category,
  onUpload,
  currentPhotoUrl,
  maxCount = 1,
  currentCount = 0,
  className,
}: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUploadMore = currentCount < maxCount;

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAllowedMimeType(file.type)) {
        setError('Please upload a JPG, PNG, or WebP image.');
        return;
      }

      if (!isWithinSizeLimit(file.size)) {
        setError(`File too large. Maximum size is ${IMAGE_CONFIG.maxUploadSizeMB}MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreview(url);
      setUploading(true);

      try {
        await onUpload(file);
      } catch {
        setError('Upload failed. Please try again.');
        setPreview(currentPhotoUrl || null);
      } finally {
        setUploading(false);
      }
    },
    [onUpload, currentPhotoUrl]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canUploadMore && inputRef.current?.click()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center',
          preview ? 'aspect-square' : 'py-12',
          dragActive
            ? 'border-burgundy bg-burgundy/5'
            : 'border-soft-border hover:border-burgundy/40 hover:bg-beige/50',
          !canUploadMore && 'opacity-50 cursor-not-allowed'
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={`${category} preview`}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
                <RotateCw className="w-8 h-8 text-burgundy animate-spin" />
              </div>
            )}
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearPreview();
                }}
                className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-night" />
              </button>
            )}
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-warm-gray mb-3" />
            <p className="text-sm font-medium text-night">
              {canUploadMore
                ? `Upload ${category} photo`
                : `Maximum ${maxCount} ${category} photo${maxCount > 1 ? 's' : ''} reached`}
            </p>
            <p className="text-xs text-warm-gray mt-1">
              JPG, PNG, or WebP up to {IMAGE_CONFIG.maxUploadSizeMB}MB
            </p>
            {/* Mobile camera hint */}
            <p className="text-xs text-warm-gray mt-0.5 sm:hidden">
              Tap to take a photo or choose from gallery
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && <p className="text-sm text-error">{error}</p>}

      {maxCount > 1 && (
        <p className="text-xs text-warm-gray">
          {currentCount} of {maxCount} photos uploaded
        </p>
      )}
    </div>
  );
}
