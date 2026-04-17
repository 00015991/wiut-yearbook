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
}

export function ModerationCard({
  photoId,
  thumbUrl,
  category,
  status,
  studentName,
  courseName,
  uploadedAt,
}: ModerationCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleAction(action: 'approve' | 'reject' | 'hide') {
    setLoading(action);
    await moderatePhoto(photoId, action);
    setLoading(null);
    setDone(true);
    router.refresh();
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border border-soft-border ${done ? 'opacity-40' : ''} transition-opacity`}>
      {/* Image */}
      <div className="aspect-square bg-beige relative">
        {thumbUrl && (
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
        <p className="text-xs text-warm-gray mt-0.5">
          {new Date(uploadedAt).toLocaleDateString()}
        </p>

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
