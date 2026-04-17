'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { submitAccessRequest } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function RequestAccessPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [years, setYears] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('graduation_years')
      .select('id, year_label, title')
      .eq('status', 'active')
      .order('year_label', { ascending: false })
      .then(({ data }) => {
        setYears(
          (data || []).map((y) => ({
            value: y.id,
            label: y.title || `Class of ${y.year_label}`,
          }))
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
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-night mb-2">
          Request Submitted
        </h1>
        <p className="text-warm-gray mb-6">
          Your access request has been submitted. You will receive an invitation email once approved.
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
        Request Access
      </h1>
      <p className="text-warm-gray text-sm text-center mb-6">
        Fill out the form below and an admin will review your request.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          required
        />
        <Input
          name="wiutEmail"
          type="email"
          label="WIUT Email"
          placeholder="you@wiut.uz"
          required
          hint="Use your university email address"
        />
        <Input
          name="studentIdCode"
          label="Student ID (optional)"
          placeholder="e.g. 12345"
        />
        <Select
          name="graduationYearId"
          label="Graduation Year"
          options={years}
          placeholder="Select your graduation year"
          required
        />
        <Input
          name="courseNameRaw"
          label="Course / Major (optional)"
          placeholder="e.g. Business Management"
        />

        {error && (
          <p className="text-sm text-error text-center">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Submit Request
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-warm-gray">
        Already have an account?{' '}
        <Link href="/login" className="text-burgundy hover:underline">
          Sign In
        </Link>
      </p>
    </Card>
  );
}
