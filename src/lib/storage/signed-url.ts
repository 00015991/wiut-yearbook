import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from './index';

/**
 * Generate a signed URL for a private-bucket object using the service role.
 *
 * The user-session client can't sign URLs against this bucket because there
 * are no SELECT policies on `storage.objects` for it. Every page that
 * currently displays a photo (student dashboard, admin moderation, year
 * views, etc.) has already enforced authentication via `requireRole` or
 * `requireAuth` by the time it reaches this code, so using the service
 * role here only fills in the RLS gap — it doesn't widen the audience.
 *
 * Lives in a separate file from the pure helpers because it imports
 * `next/headers` (via the server Supabase client), which would poison the
 * client bundle for any component that pulls in `@/lib/storage` for things
 * like `BUCKET_NAME` or `isAllowedMimeType`.
 */
export async function signStoragePath(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!path) return null;
  const admin = await createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error('[signStoragePath] failed', { path, message: error.message });
    return null;
  }
  return data?.signedUrl ?? null;
}
