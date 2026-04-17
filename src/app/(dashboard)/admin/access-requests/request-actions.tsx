'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approveAccessRequest, rejectAccessRequest } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

export function RequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleApprove() {
    setLoading('approve');
    await approveAccessRequest(requestId);
    setLoading(null);
    router.refresh();
  }

  async function handleReject() {
    setLoading('reject');
    await rejectAccessRequest(requestId);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="primary"
        onClick={handleApprove}
        loading={loading === 'approve'}
        disabled={loading !== null}
      >
        <Check className="w-3.5 h-3.5 mr-1" /> Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        loading={loading === 'reject'}
        disabled={loading !== null}
      >
        <X className="w-3.5 h-3.5 mr-1" /> Reject
      </Button>
    </div>
  );
}
