import { BookOpen } from 'lucide-react';
import Link from 'next/link';

/**
 * Auth pages share a centered-card layout on a cream background with a fine
 * editorial masthead (small monogram, serif wordmark, muted eyebrow caption)
 * instead of a loud logo. No gradients, no skewed decorations — just paper.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-beige-light px-4 py-14 sm:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex flex-col items-center gap-3 group"
          >
            <div className="w-12 h-12 rounded-md bg-burgundy text-white flex items-center justify-center shadow-paper-sm group-hover:bg-burgundy-light transition-colors">
              <BookOpen className="w-5 h-5" strokeWidth={1.7} />
            </div>
            <div className="flex flex-col items-center">
              <span className="display-serif text-[22px] text-night">
                WIUT Yearbook
              </span>
              <span className="eyebrow mt-1.5 text-warm-gray">
                A private graduation book
              </span>
            </div>
          </Link>
        </div>
        {children}
        <p className="text-center text-[11px] text-warm-gray/70 tracking-wider uppercase mt-8">
          Westminster International University · Tashkent
        </p>
      </div>
    </div>
  );
}
