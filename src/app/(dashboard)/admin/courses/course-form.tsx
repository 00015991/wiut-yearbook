'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createCourse } from '@/lib/actions/admin';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CourseForm({ yearId }: { yearId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('graduationYearId', yearId);
    const result = await createCourse(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card className="bg-beige-light border-dashed border-burgundy/20">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left">
        <span className="font-heading font-semibold text-night text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-burgundy" /> Add Course
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-warm-gray" /> : <ChevronDown className="w-4 h-4 text-warm-gray" />}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input name="name" label="Course Name" required placeholder="e.g. Business Management" />
          <Input name="description" label="Description (optional)" placeholder="Brief description of the programme" />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" size="sm" loading={loading}>Add Course</Button>
        </form>
      )}
    </Card>
  );
}
