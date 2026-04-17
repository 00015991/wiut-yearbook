import { requireRole } from '@/lib/auth';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export default async function PlatformSettingsPage() {
  await requireRole('super_admin');

  return (
    <div>
      <SectionHeading title="Platform Settings" subtitle="Global configuration" />

      <div className="space-y-4">
        <Card>
          <CardTitle>Upload Limits</CardTitle>
          <CardDescription>Maximum file sizes for uploads</CardDescription>
          <div className="mt-4 space-y-2">
            <SettingRow label="Max upload size" value="10 MB" />
            <SettingRow label="Allowed types" value="JPEG, PNG, WebP" />
            <SettingRow label="Portrait limit" value="1 per student" />
            <SettingRow label="General photos limit" value="5 per student" />
            <SettingRow label="Course photos limit" value="3 per student" />
            <SettingRow label="Childhood photo limit" value="1 per student" />
          </div>
        </Card>

        <Card>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Storage configuration</CardDescription>
          <div className="mt-4 space-y-2">
            <SettingRow label="Provider" value="Supabase Storage" />
            <SettingRow label="Bucket" value="graduation-book-private (private)" />
            <SettingRow label="Signed URL TTL" value="3600 seconds" />
          </div>
        </Card>

        <Card>
          <CardTitle>Security</CardTitle>
          <CardDescription>Platform security settings</CardDescription>
          <div className="mt-4 space-y-2">
            <SettingRow label="Public registration" value="Disabled" />
            <SettingRow label="Invite expiry" value="7 days" />
            <SettingRow label="Token hashing" value="SHA-256" />
            <SettingRow label="RLS" value="Enabled on all tables" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-soft-border last:border-0">
      <span className="text-sm text-night">{label}</span>
      <span className="text-sm text-warm-gray font-mono">{value}</span>
    </div>
  );
}
