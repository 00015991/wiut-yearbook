'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { activateInvitation } from '@/lib/actions/auth';
import { Sparkles } from 'lucide-react';

function ActivateForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Card padding="lg" className="text-center">
        <h1 className="display-serif text-[26px] text-night mb-2">
          Invalid link
        </h1>
        <p className="text-warm-gray text-[15px] leading-relaxed">
          This activation link is invalid or has expired. Please contact your
          administrator.
        </p>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('token', token);
    const result = await activateInvitation(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <div className="text-center mb-7">
        <div className="w-12 h-12 rounded-md bg-burgundy/10 ring-1 ring-burgundy/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-5 h-5 text-burgundy" strokeWidth={1.7} />
        </div>
        <p className="eyebrow mb-2">Finish your invite</p>
        <h1 className="display-serif text-[28px] text-night">
          Welcome to the yearbook
        </h1>
        <p className="text-warm-gray text-sm mt-3 max-w-xs mx-auto leading-relaxed">
          Set your password to activate your account and start building your profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          required
          autoComplete="new-password"
        />
        <Input
          name="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="Enter it once more"
          required
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-error text-center">{error}</p>}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Activate my account
        </Button>
      </form>
    </Card>
  );
}

function ActivateFallback() {
  return (
    <Card padding="lg" className="text-center">
      <p className="text-warm-gray text-sm">Loading&hellip;</p>
    </Card>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<ActivateFallback />}>
      <ActivateForm />
    </Suspense>
  );
}
