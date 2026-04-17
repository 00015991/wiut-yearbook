'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { createAdmin } from '@/lib/actions/super-admin';
import { createClient } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateAdminForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<{ value: string; label: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      supabase
        .from('graduation_years')
        .select('id, year_label, title')
        .order('year_label', { ascending: false })
        .then(({ data }) => {
          setYears((data || []).map((y) => ({ value: y.id, label: y.title })));
        });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createAdmin(formData);

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
        <Plus className="w-4 h-4 mr-2" /> Create Admin
      </Button>
    );
  }

  return (
    <Card className="bg-beige-light border-dashed border-burgundy/20">
      <h3 className="font-heading font-semibold text-night text-sm mb-4">Create Admin Account</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input name="email" type="email" label="Email" required placeholder="admin@wiut.uz" />
          <Input name="password" type="password" label="Password" required placeholder="Min 8 characters" />
        </div>
        <Select
          name="graduationYearId"
          label="Assigned Year"
          options={years}
          placeholder="Select a year"
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={loading}>Create Admin</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
