'use client';

import { useState } from 'react';
import { toggleMessageVisibility } from '@/lib/actions/student';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MessageToggleProps {
  messageId: string;
  isVisible: boolean;
}

export function MessageToggle({ messageId, isVisible }: MessageToggleProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    await toggleMessageVisibility(messageId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="p-2 rounded-lg hover:bg-beige transition-colors flex-shrink-0"
      title={isVisible ? 'Hide this message' : 'Show this message'}
    >
      {isVisible ? (
        <Eye className="w-4 h-4 text-warm-gray" />
      ) : (
        <EyeOff className="w-4 h-4 text-warm-gray" />
      )}
    </button>
  );
}
