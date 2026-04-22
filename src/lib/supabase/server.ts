import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be called from a Server Component where
            // cookies cannot be set. Ignore the error.
          }
        },
      },
    }
  );
}

/**
 * Admin client — bypasses Row Level Security.
 *
 * Uses the plain `@supabase/supabase-js` client with the service role key so
 * requests carry only the service role Authorization header. The `@supabase/ssr`
 * helper is designed for user-auth flows: it reads the auth cookie and swaps
 * in the signed-in user's JWT, which would *downgrade* this to the logged-in
 * user's permissions — useless for admin bypass, and the cause of the
 * "Failed to finalize admin account" insert failure when a super admin
 * tried to create another admin (no INSERT policy on app_users).
 *
 * `persistSession: false` + `autoRefreshToken: false` keep this stateless so
 * it never mutates cookies. The function stays async to match the old
 * signature and the existing `await createAdminClient()` callers.
 */
export async function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
