'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { login } from '@/lib/actions/auth';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const activated = searchParams.get('activated');
  const redirect = searchParams.get('redirect') || '';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('redirect', redirect);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      {activated && (
        <div className="mb-4 p-3 rounded-xl bg-success/10 text-success text-sm text-center">
          Account activated successfully! You can now sign in.
        </div>
      )}

      <h1 className="text-2xl font-heading font-bold text-night text-center mb-6">
        Welcome Back
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@wiut.uz"
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-sm text-error text-center">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <Link href="/forgot-password" className="text-burgundy hover:underline block">
          Forgot your password?
        </Link>
        <p className="text-warm-gray">
          Don&apos;t have an account?{' '}
          <Link href="/request-access" className="text-burgundy hover:underline">
            Request Access
          </Link>
        </p>
      </div>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card padding="lg" className="text-center">
      <p className="text-warm-gray text-sm">Loading…</p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
