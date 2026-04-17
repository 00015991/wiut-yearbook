'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitStudentProfile } from '@/lib/actions/student';
import { useRouter } from 'next/navigation';

export function SubmitButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const result = await submitStudentProfile();

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        Submit Profile for Review
      </Button>
      {error && <p className="text-sm text-error mt-2">{error}</p>}
      <p className="text-xs text-warm-gray mt-2">
        After submission, your profile and photos will be reviewed by an admin before appearing in the yearbook.
      </p>
    </div>
  );
}
