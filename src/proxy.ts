import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

// Next 16 renamed `middleware` to `proxy` — behaviour is identical.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude Next internals, favicon, common static assets, and PWA
    // manifest files — otherwise /manifest.json gets caught by the auth
    // redirect and bounces to /login, which breaks installability.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|robots.txt|sitemap.xml|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
