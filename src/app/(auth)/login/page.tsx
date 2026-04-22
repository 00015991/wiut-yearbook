'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { login } from '@/lib/actions/auth';
import { CheckCircle2 } from 'lucide-react';
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
        <div className="mb-6 flex items-start gap-2 p-3 rounded-md bg-success/10 text-success text-[13px]">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.8} />
          <span>Account activated. You can sign in below.</span>
        </div>
      )}

      <div className="text-center mb-7">
        <p className="eyebrow mb-2">Sign in</p>
        <h1 className="display-serif text-[28px] text-night">Welcome back</h1>
      </div>

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
          Sign in
        </Button>
      </form>

      <div className="mt-7 pt-5 hairline border-t space-y-2.5 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-burgundy hover:underline underline-offset-2 block"
        >
          Forgot your password?
        </Link>
        <p className="text-warm-gray">
          Don&apos;t have an account?{' '}
          <Link href="/request-access" className="text-burgundy hover:underline underline-offset-2">
            Request access
          </Link>
        </p>
      </div>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card padding="lg" className="text-center">
      <p className="text-warm-gray text-sm">Loading&hellip;</p>
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
