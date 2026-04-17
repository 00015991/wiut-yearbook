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
        <h1 className="text-2xl font-heading font-bold text-night mb-2">
          Invalid Link
        </h1>
        <p className="text-warm-gray">
          This activation link is invalid or has expired. Please contact your administrator.
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
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-burgundy/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-burgundy" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-night mb-1">
          Welcome to the Yearbook
        </h1>
        <p className="text-warm-gray text-sm">
          Set your password to activate your account and start building your profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Create a password (min 8 characters)"
          required
          autoComplete="new-password"
        />
        <Input
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
        />

        {error && (
          <p className="text-sm text-error text-center">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Activate My Account
        </Button>
      </form>
    </Card>
  );
}

function ActivateFallback() {
  return (
    <Card padding="lg" className="text-center">
      <p className="text-warm-gray text-sm">Loading…</p>
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
