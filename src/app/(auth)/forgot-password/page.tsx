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
        <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-burgundy" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-night mb-2">
          Check Your Email
        </h1>
        <p className="text-warm-gray mb-6">
          If an account exists with that email, we sent password reset instructions.
        </p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h1 className="text-2xl font-heading font-bold text-night text-center mb-2">
        Reset Password
      </h1>
      <p className="text-warm-gray text-sm text-center mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@wiut.uz"
          required
        />

        {error && (
          <p className="text-sm text-error text-center">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-warm-gray">
        <Link href="/login" className="text-burgundy hover:underline">
          Back to Login
        </Link>
      </p>
    </Card>
  );
}
