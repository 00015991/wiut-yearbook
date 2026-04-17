'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface VoteFormProps {
  categoryId: string;
  title: string;
  description?: string;
  classmates: { id: string; full_name: string; slug: string }[];
  currentVote?: string;
  votingClosesAt?: string;
}

export function VoteForm({
  categoryId,
  title,
  description,
  classmates,
  currentVote,
  votingClosesAt,
}: VoteFormProps) {
  const [selected, setSelected] = useState(currentVote || '');
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(!!currentVote);

  async function handleVote() {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get student id
    const { data: student } = await supabase
      .from('students')
      .select('id, graduation_year_id')
      .eq('user_id', user.id)
      .single();

    if (!student) return;

    if (currentVote) {
      // Update existing vote
      await supabase
        .from('superlative_votes')
        .update({ nominee_student_id: selected })
        .eq('category_id', categoryId)
        .eq('voter_student_id', student.id);
    } else {
      await supabase.from('superlative_votes').insert({
        category_id: categoryId,
        voter_student_id: student.id,
        nominee_student_id: selected,
        graduation_year_id: student.graduation_year_id,
      });
    }

    setVoted(true);
    setLoading(false);
  }

  return (
    <Card className="bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-night text-lg">{title}</h3>
          {description && <p className="text-sm text-warm-gray mt-0.5">{description}</p>}
          {votingClosesAt && (
            <p className="text-xs text-warm-gray mt-1">
              Closes: {new Date(votingClosesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 sm:min-w-[300px]">
          <select
            value={selected}
            onChange={(e) => { setSelected(e.target.value); setVoted(false); }}
            className="flex-1 px-3 py-2 rounded-xl border border-soft-border bg-white text-sm text-night focus:outline-none focus:ring-2 focus:ring-burgundy/30"
          >
            <option value="">Select a classmate</option>
            {classmates.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleVote}
            loading={loading}
            disabled={!selected || voted}
            variant={voted ? 'outline' : 'primary'}
          >
            {voted ? 'Voted' : 'Vote'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
