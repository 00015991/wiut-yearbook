'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { requestPasswordReset } from '@/lib/actions/auth';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Card padding="lg" className="text-center">
        <div className="w-14 h-14 rounded-full bg-burgundy/10 ring-1 ring-burgundy/20 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-6 h-6 text-burgundy" strokeWidth={1.7} />
        </div>
        <p className="eyebrow mb-2">Reset sent</p>
        <h1 className="display-serif text-[26px] text-night mb-3">
          Check your email
        </h1>
        <p className="text-warm-gray mb-6 text-[15px] leading-relaxed max-w-xs mx-auto">
          If an account exists with that email, we&rsquo;ve sent password reset
          instructions to it.
        </p>
        <Link href="/login">
          <Button variant="outline">Back to sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="text-center mb-7">
        <p className="eyebrow mb-2">Recover access</p>
        <h1 className="display-serif text-[28px] text-night">Reset password</h1>
        <p className="text-warm-gray text-sm mt-3 max-w-xs mx-auto leading-relaxed">
          Enter your email and we&rsquo;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@wiut.uz"
          required
        />

        {error && <p className="text-sm text-error text-center">{error}</p>}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset link
        </Button>
      </form>

      <p className="mt-7 pt-5 hairline border-t text-center text-sm">
        <Link href="/login" className="text-burgundy hover:underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
