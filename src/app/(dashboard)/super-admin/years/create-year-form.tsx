'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createGraduationYear } from '@/lib/actions/super-admin';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateYearForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createGraduationYear(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Create New Year
      </Button>
    );
  }

  return (
    <Card className="bg-beige-light border-dashed border-burgundy/20">
      <h3 className="font-heading font-semibold text-night text-sm mb-4">Create Graduation Year</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            name="yearLabel"
            type="number"
            label="Year"
            required
            placeholder="2027"
            min={2020}
            max={2050}
          />
          <Input
            name="title"
            label="Title"
            required
            placeholder="WIUT Graduates 2027"
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={loading}>Create Year</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
