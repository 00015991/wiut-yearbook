import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getMessagesForStudent, getMessagesSentByStudent } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { MESSAGE_LIMITS } from '@/types';
import { MessageToggle } from './message-toggle';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';

export default async function StudentMessagesPage() {
  const user = await requireRole('student');
  if (!user.studentId || !user.yearId) redirect('/login');

  const [messages, sentCount] = await Promise.all([
    getMessagesForStudent(user.studentId, user.yearId),
    getMessagesSentByStudent(user.studentId, user.yearId),
  ]);

  // Also get hidden messages (all messages including hidden)
  const supabase = await createClient();
  const { data: allMessages } = await supabase
    .from('yearbook_messages')
    .select('*, sender:students!sender_student_id(full_name, slug)')
    .eq('recipient_student_id', user.studentId)
    .eq('graduation_year_id', user.yearId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <SectionHeading
        title="My Messages"
        subtitle="Messages your classmates have written to you"
      />

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-heading font-bold text-night">{allMessages?.length || 0}</p>
          <p className="text-xs text-warm-gray">Messages Received</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-heading font-bold text-night">{sentCount}</p>
          <p className="text-xs text-warm-gray">
            Messages Sent ({sentCount}/{MESSAGE_LIMITS.maxPerSender})
          </p>
        </Card>
      </div>

      {allMessages && allMessages.length > 0 ? (
        <div className="space-y-3">
          {allMessages.map((msg: { id: string; content: string; is_visible: boolean; created_at: string; sender?: { full_name: string; slug: string } }) => (
            <Card key={msg.id} padding="sm" className={!msg.is_visible ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-night">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-burgundy font-medium">
                      &mdash; {msg.sender?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-warm-gray">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                    {!msg.is_visible && (
                      <Badge variant="muted">Hidden</Badge>
                    )}
                  </div>
                </div>
                <MessageToggle messageId={msg.id} isVisible={msg.is_visible} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="When classmates write messages to you, they will appear here. Share your profile link to get started!"
        />
      )}
    </div>
  );
}
