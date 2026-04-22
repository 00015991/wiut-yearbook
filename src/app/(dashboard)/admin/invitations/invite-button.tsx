'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendInvitation, resendInvitation } from '@/lib/actions/admin';
import { Mail, Check, Copy, X, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Send-invite flow.
 *
 * The previous version called `router.refresh()` the instant the link came
 * back, which caused the server component to re-render and move the student
 * out of "Ready to Invite" — unmounting this component and destroying the
 * URL before the admin could copy it. Now the link shows in a persistent
 * modal that stays until the admin explicitly closes it, and only then do
 * we refresh the list. Tokens are irrecoverable (only the hash is stored)
 * so this dismissal-gated refresh is the actual correctness fix, not just
 * a UX improvement.
 */
export function InviteButton({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSend() {
    setLoading(true);
    setError(null);
    const result = await sendInvitation(studentId);
    setLoading(false);

    if (result.success && result.activationUrl) {
      setActivationUrl(result.activationUrl);
    } else {
      setError(result.error || 'Failed to send invite.');
    }
  }

  function handleClose() {
    setActivationUrl(null);
    // Only refresh once the admin is done with the link — moving the row to
    // "Invited / Active" too early was the bug that swallowed the URL.
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleSend} loading={loading}>
        <Mail className="w-3.5 h-3.5 mr-1" /> Send Invite
      </Button>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
      {activationUrl && (
        <ActivationLinkModal url={activationUrl} onClose={handleClose} />
      )}
    </>
  );
}

/**
 * Resend button for already-invited students. The original token can't be
 * recovered (we only hash it), so "resend" really means "mint a fresh one"
 * — the old row is left to expire on its own. Same modal UI as first-send.
 */
export function ResendInviteButton({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleResend() {
    setLoading(true);
    setError(null);
    const result = await resendInvitation(studentId);
    setLoading(false);

    if (result.success && result.activationUrl) {
      setActivationUrl(result.activationUrl);
    } else {
      setError(result.error || 'Failed to resend invite.');
    }
  }

  function handleClose() {
    setActivationUrl(null);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleResend} loading={loading}>
        <RotateCw className="w-3.5 h-3.5 mr-1" /> Resend
      </Button>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
      {activationUrl && (
        <ActivationLinkModal url={activationUrl} onClose={handleClose} />
      )}
    </>
  );
}

function ActivationLinkModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-2xl shadow-xl max-w-lg w-full p-6 relative"
        // Clicks inside the card shouldn't dismiss — only the backdrop does.
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-beige transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-warm-gray" />
        </button>

        <h2 className="font-heading text-xl font-semibold text-night mb-1">
          Activation link ready
        </h2>
        <p className="text-sm text-warm-gray mb-4">
          Copy this link and send it to the student. We can&apos;t show it again — if
          you lose it, use <span className="font-medium">Resend</span> to mint a new one.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 px-3 py-2 bg-beige border border-soft-border rounded-lg text-sm font-mono text-night select-all focus:outline-none focus:ring-2 focus:ring-burgundy/30"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-burgundy text-cream text-sm font-medium hover:bg-burgundy-dark transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        <div className="flex justify-between items-center text-xs text-warm-gray">
          <span>Expires in 7 days · single-use</span>
          <button
            onClick={onClose}
            className="text-burgundy hover:text-burgundy-dark font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
