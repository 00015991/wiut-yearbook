'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { moderateProfile } from '@/lib/actions/admin';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileModerationCardProps {
  studentId: string;
  studentName: string;
  courseName?: string;
  yearLabel?: number | null;
  quote?: string | null;
  quotePrompt?: string | null;
  workFuturePlan?: string | null;
  favoriteSong?: string | null;
  favoriteMemory?: string | null;
  submittedAt?: string | null;
  /** Shown to super-admin so they know which year they're approving for. */
  showYearBadge?: boolean;
}

/**
 * Card for reviewing a student's submitted profile.
 *
 * Shows enough of the profile content for an admin to judge whether it's
 * appropriate for publication, and exposes approve/reject buttons.
 * Mirrors the photo `ModerationCard` pattern — optimistic fade-out on
 * action, `router.refresh()` to re-fetch the queue, role-gated server
 * action handles the actual state change.
 */
export function ProfileModerationCard({
  studentId,
  studentName,
  courseName,
  yearLabel,
  quote,
  quotePrompt,
  workFuturePlan,
  favoriteSong,
  favoriteMemory,
  submittedAt,
  showYearBadge,
}: ProfileModerationCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action);
    setErr(null);
    const result = await moderateProfile(studentId, action);
    setLoading(null);
    if (result.error) {
      setErr(result.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden border border-soft-border p-4 ${
        done ? 'opacity-40' : ''
      } transition-opacity`}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <h3 className="font-semibold text-night text-sm">{studentName}</h3>
          {courseName && (
            <p className="text-xs text-warm-gray">{courseName}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {showYearBadge && yearLabel && (
            <Badge variant="info">Class of {yearLabel}</Badge>
          )}
          {submittedAt && (
            <span className="text-xs text-warm-gray">
              {new Date(submittedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {quote && (
        <blockquote className="mt-3 pl-3 border-l-2 border-burgundy/30">
          {quotePrompt && (
            <p className="text-xs text-warm-gray italic mb-0.5">{quotePrompt}</p>
          )}
          <p className="text-sm text-night/80 italic">&ldquo;{quote}&rdquo;</p>
        </blockquote>
      )}

      <dl className="mt-3 space-y-1 text-xs">
        {workFuturePlan && (
          <div>
            <dt className="text-warm-gray inline mr-1">Future plan:</dt>
            <dd className="inline text-night">{workFuturePlan}</dd>
          </div>
        )}
        {favoriteSong && (
          <div>
            <dt className="text-warm-gray inline mr-1">Favorite song:</dt>
            <dd className="inline text-night">{favoriteSong}</dd>
          </div>
        )}
        {favoriteMemory && (
          <div>
            <dt className="text-warm-gray inline mr-1">Favorite memory:</dt>
            <dd className="inline text-night">{favoriteMemory}</dd>
          </div>
        )}
      </dl>

      {err && (
        <p className="text-xs text-error mt-3">{err}</p>
      )}

      {!done && (
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleAction('approve')}
            loading={loading === 'approve'}
            disabled={loading !== null}
            className="flex-1"
          >
            <Check className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleAction('reject')}
            loading={loading === 'reject'}
            disabled={loading !== null}
            className="flex-1"
          >
            <X className="w-3 h-3 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
