import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-beige-light px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-burgundy flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-night">WIUT Yearbook</span>
          </Link>
          <p className="text-warm-gray text-sm">
            A private graduation book for WIUT students
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
