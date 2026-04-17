'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadStudentCSV } from '@/lib/actions/admin';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CSVUpload({ yearId }: { yearId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const router = useRouter();

  async function handleUpload() {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('graduationYearId', yearId);

    const res = await uploadStudentCSV(formData);

    if (res.success) {
      setResult({ imported: res.imported || 0, skipped: res.skipped || 0, errors: res.errors || [] });
      setFile(null);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card className="bg-beige-light border-dashed border-burgundy/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-night text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-burgundy" />
            Pre-seed Students via CSV
          </h3>
          <p className="text-xs text-warm-gray mt-1">
            Upload a CSV with columns: <code className="bg-white px-1 rounded">name, email, student_id, course</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-soft-border bg-white text-sm text-night hover:bg-beige transition-colors">
              <FileText className="w-4 h-4" />
              {file ? file.name : 'Choose CSV'}
            </span>
          </label>
          <Button size="sm" onClick={handleUpload} loading={loading} disabled={!file}>
            Import
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-3 p-3 rounded-xl bg-white border border-soft-border text-sm">
          <p className="text-success flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Imported {result.imported} students. Skipped {result.skipped}.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs text-error">
              {result.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
