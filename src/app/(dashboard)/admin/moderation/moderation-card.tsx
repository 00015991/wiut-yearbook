'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { moderatePhoto } from '@/lib/actions/admin';
import { Check, X, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ModerationCardProps {
  photoId: string;
  thumbUrl: string;
  category: string;
  status: string;
  studentName: string;
  courseName: string;
  uploadedAt: string;
  /** Class-of year label, shown when the viewer is a super-admin browsing all years. */
  yearLabel?: number | null;
  showYearBadge?: boolean;
}

export function ModerationCard({
  photoId,
  thumbUrl,
  category,
  status,
  studentName,
  courseName,
  uploadedAt,
  yearLabel,
  showYearBadge,
}: ModerationCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(action: 'approve' | 'reject' | 'hide') {
    setLoading(action);
    setErr(null);
    const result = await moderatePhoto(photoId, action);
    setLoading(null);
    if (result.error) {
      setErr(result.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border border-soft-border ${done ? 'opacity-40' : ''} transition-opacity`}>
      {/* Image */}
      <div className="aspect-square bg-beige relative">
        {thumbUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL
          <img src={thumbUrl} alt="Review" className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="info">{category}</Badge>
        </div>
        <div className="absolute top-2 right-2">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-night truncate">{studentName}</p>
        <p className="text-xs text-warm-gray">{courseName}</p>
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <p className="text-xs text-warm-gray">
            {new Date(uploadedAt).toLocaleDateString()}
          </p>
          {showYearBadge && yearLabel && (
            <Badge variant="info">&lsquo;{String(yearLabel).slice(-2)}</Badge>
          )}
        </div>

        {err && <p className="text-xs text-error mt-2">{err}</p>}

        {/* Actions */}
        {!done && status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleAction('approve')}
              loading={loading === 'approve'}
              disabled={loading !== null}
              className="flex-1"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleAction('reject')}
              loading={loading === 'reject'}
              disabled={loading !== null}
              className="flex-1"
            >
              <X className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction('hide')}
              loading={loading === 'hide'}
              disabled={loading !== null}
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
