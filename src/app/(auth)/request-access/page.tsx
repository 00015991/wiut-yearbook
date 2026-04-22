'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { submitAccessRequest, getPublicGraduationYears } from '@/lib/actions/auth';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function RequestAccessPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [years, setYears] = useState<{ value: string; label: string }[]>([]);

  // Load years through a server action — the table is RLS-gated to
  // authenticated users, and folks requesting access don't have accounts yet.
  useEffect(() => {
    getPublicGraduationYears().then((data) => {
      setYears(
        data.map((y) => ({
          value: y.id,
          label: y.title || `Class of ${y.year_label}`,
        })),
      );
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitAccessRequest(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <Card padding="lg" className="text-center">
        <div className="w-14 h-14 rounded-full bg-success/10 ring-1 ring-success/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-6 h-6 text-success" strokeWidth={1.7} />
        </div>
        <p className="eyebrow mb-2">Thank you</p>
        <h1 className="display-serif text-[26px] text-night mb-3">
          Request submitted
        </h1>
        <p className="text-warm-gray mb-6 text-[15px] leading-relaxed max-w-xs mx-auto">
          We&rsquo;ll email an invitation once an admin has reviewed your request.
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
        <p className="eyebrow mb-2">Alumni &amp; students</p>
        <h1 className="display-serif text-[28px] text-night">Request access</h1>
        <p className="text-warm-gray text-sm mt-3 max-w-xs mx-auto leading-relaxed">
          Fill out the form below and an admin will review your request shortly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="fullName"
          label="Full name"
          placeholder="Your full name"
          required
        />
        <Input
          name="wiutEmail"
          type="email"
          label="WIUT email"
          placeholder="you@wiut.uz"
          required
          hint="Please use your university email address."
        />
        <Input
          name="studentIdCode"
          label="Student ID (optional)"
          placeholder="e.g. 12345"
        />
        <Select
          name="graduationYearId"
          label="Graduation year"
          options={years}
          placeholder="Select your graduation year"
          required
        />
        <Input
          name="courseNameRaw"
          label="Course / Major (optional)"
          placeholder="e.g. Business Management"
        />

        {error && <p className="text-sm text-error text-center">{error}</p>}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Submit request
        </Button>
      </form>

      <p className="mt-7 pt-5 hairline border-t text-center text-sm text-warm-gray">
        Already have an account?{' '}
        <Link href="/login" className="text-burgundy hover:underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
