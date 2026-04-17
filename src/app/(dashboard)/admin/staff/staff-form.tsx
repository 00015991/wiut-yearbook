'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createStaffProfile } from '@/lib/actions/admin';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function StaffForm({ yearId }: { yearId: string }) {
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
    const result = await createStaffProfile(formData);

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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-heading font-semibold text-night text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-burgundy" /> Add Staff Member
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-warm-gray" /> : <ChevronDown className="w-4 h-4 text-warm-gray" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input name="fullName" label="Full Name" required placeholder="Prof. John Smith" />
            <Input name="roleTitle" label="Role / Title" required placeholder="e.g. Head of Department" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input name="department" label="Department (optional)" placeholder="e.g. Business School" />
            <Input name="shortMessage" label="Short Message (optional)" placeholder="A brief message to graduates" />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" size="sm" loading={loading}>Add Staff Member</Button>
        </form>
      )}
    </Card>
  );
}
