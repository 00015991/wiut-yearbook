'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { lockYearEditing, unlockYearEditing } from '@/lib/actions/admin';
import { Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function YearActions({ yearId, isLocked }: { yearId: string; isLocked: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    if (isLocked) {
      await unlockYearEditing(yearId);
    } else {
      await lockYearEditing(yearId);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant={isLocked ? 'outline' : 'danger'}
      size="sm"
      onClick={handleToggle}
      loading={loading}
    >
      {isLocked ? (
        <>
          <Unlock className="w-4 h-4 mr-2" /> Unlock Editing
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 mr-2" /> Lock Editing
        </>
      )}
    </Button>
  );
}
