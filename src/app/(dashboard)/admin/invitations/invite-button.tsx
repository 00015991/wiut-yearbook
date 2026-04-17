'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendInvitation } from '@/lib/actions/admin';
import { Mail, Check, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function InviteButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [loading, setLoading] = useState(false);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSend() {
    setLoading(true);
    const result = await sendInvitation(studentId);
    setLoading(false);

    if (result.success && result.activationUrl) {
      setActivationUrl(result.activationUrl);
    }
    router.refresh();
  }

  async function handleCopy() {
    if (activationUrl) {
      await navigator.clipboard.writeText(activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (activationUrl) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-success flex items-center gap-1">
          <Check className="w-3 h-3" /> Invite sent
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-beige hover:bg-beige-dark transition-colors"
          title="Copy activation link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-warm-gray" />}
        </button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={handleSend} loading={loading}>
      <Mail className="w-3.5 h-3.5 mr-1" /> Send Invite
    </Button>
  );
}
