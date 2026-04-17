'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendYearbookMessage } from '@/lib/actions/student';
import { MESSAGE_LIMITS } from '@/types';
import { MessageSquare } from 'lucide-react';

interface MessageWallProps {
  recipientStudentId: string;
  recipientName: string;
}

export function MessageWall({ recipientStudentId, recipientName }: MessageWallProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set('recipientStudentId', recipientStudentId);
    formData.set('content', content);

    const result = await sendYearbookMessage(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setContent('');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-success/10 rounded-xl p-4 text-center text-success text-sm">
        Your message to {recipientName} has been posted!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 border border-soft-border">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-burgundy" />
        <span className="text-sm font-medium text-night">Write a message to {recipientName}</span>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write something memorable..."
        maxChars={MESSAGE_LIMITS.maxLength}
        charCount={content.length}
        rows={3}
      />
      {error && <p className="text-sm text-error mt-2">{error}</p>}
      <div className="flex justify-end mt-3">
        <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
          Post Message
        </Button>
      </div>
    </form>
  );
}
