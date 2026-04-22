import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getGraduationYearBySlug,
  getApprovedGalleryPhotos,
  getStudentsCountByYear,
} from '@/lib/queries';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';
import {
  Users,
  Image,
  GraduationCap,
  Sparkles,
  Award,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

export default async function YearLandingPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const [studentCount, collagePhotos] = await Promise.all([
    getStudentsCountByYear(yearData.id),
    getApprovedGalleryPhotos(yearData.id, { limit: 12 }),
  ]);

  // Generate signed URLs for the hero collage.
  const photosWithUrls = await Promise.all(
    collagePhotos.map(async (photo) => ({
      ...photo,
      url: (await signStoragePath(photo.storage_thumb_path)) ?? '',
    })),
  );

  const basePath = `/year/${yearSlug}`;

  const sections = [
    {
      href: `${basePath}/students`,
      icon: Users,
      title: 'Students',
      desc: `${studentCount} graduates`,
      meta: '01',
    },
    {
      href: `${basePath}/gallery`,
      icon: Image,
      title: 'Gallery',
      desc: 'Moments together',
      meta: '02',
    },
    {
      href: `${basePath}/courses`,
      icon: GraduationCap,
      title: 'Courses',
      desc: 'Programmes & departments',
      meta: '03',
    },
    {
      href: `${basePath}/childhood`,
      icon: Sparkles,
      title: 'Childhood',
      desc: 'Our younger selves',
      meta: '04',
    },
    {
      href: `${basePath}/superlatives`,
      icon: Award,
      title: 'Superlatives',
      desc: 'Class awards',
      meta: '05',
    },
    {
      href: `${basePath}/statistics`,
      icon: BarChart3,
      title: 'Class stats',
      desc: 'Our year in numbers',
      meta: '06',
    },
  ];

  return (
    <>
      {/* Hero — a dark masthead with a subtle photo wash behind it. */}
      <section className="relative overflow-hidden bg-night text-white">
        {/* Photo Collage Background */}
        <div className="absolute inset-0 opacity-25">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-[2px] h-full">
            {photosWithUrls.map((photo, i) => (
              <div
                key={photo.id}
                className="relative overflow-hidden"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {photo.url && (
                  // eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover animate-slow-zoom"
                    loading={i < 6 ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Vignette — keeps the text legible over any photo arrangement. */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-night/80 via-night/50 to-night/95"
            aria-hidden="true"
          />
        </div>

        <div className="relative">
          <PageContainer className="py-24 md:py-36 text-center">
            <p className="text-gold/90 font-medium text-[11px] uppercase tracking-[0.32em] mb-6 animate-fade-in">
              Westminster International University · Tashkent
            </p>
            <h1 className="display-serif text-[52px] sm:text-[72px] md:text-[88px] text-white animate-fade-in-up">
              {yearData.title}
            </h1>
            <div
              className="mx-auto mt-6 h-px w-16 bg-gold/70"
              aria-hidden="true"
            />
            <p
              className="accent-italic text-lg sm:text-xl text-white/75 max-w-xl mx-auto mt-8 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              A private digital yearbook for the memories we&rsquo;re still
              making, and the ones we want to keep.
            </p>

            <div
              className="flex flex-wrap gap-3 justify-center mt-10 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <Link href={`${basePath}/students`}>
                <Button size="lg" variant="primary">
                  Browse students
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.8} />
                </Button>
              </Link>
              <Link href={`${basePath}/gallery`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:border-white/40"
                >
                  View gallery
                </Button>
              </Link>
            </div>

            {/* Live counter */}
            <p className="mt-10 text-white/55 text-[13px] tracking-wide">
              {studentCount}{' '}
              {studentCount === 1 ? 'graduate has' : 'graduates have'} joined
              the yearbook
            </p>
          </PageContainer>
        </div>
      </section>

      {/* Index — the book's table of contents, styled as editorial cards. */}
      <PageContainer className="py-20 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow">Table of contents</p>
            <h2 className="display-serif text-[30px] sm:text-[36px] text-night mt-2">
              Explore the book
            </h2>
          </div>
          <div className="hidden sm:block h-px w-32 bg-gold/60" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <article className="relative h-full bg-white rounded-xl p-7 border border-soft-border/70 shadow-paper-sm transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:shadow-paper-md hover:border-soft-border">
                  <div className="flex items-start justify-between mb-7">
                    <div className="w-11 h-11 rounded-md bg-beige flex items-center justify-center ring-1 ring-soft-border/70 group-hover:bg-burgundy/10 group-hover:ring-burgundy/25 transition-colors">
                      <Icon
                        className="w-5 h-5 text-night/70 group-hover:text-burgundy transition-colors"
                        strokeWidth={1.6}
                      />
                    </div>
                    <span className="text-[11px] text-warm-gray tracking-[0.18em] uppercase">
                      {section.meta}
                    </span>
                  </div>
                  <h3 className="display-serif text-[22px] text-night group-hover:text-burgundy transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-[13px] text-warm-gray mt-1.5 leading-relaxed">
                    {section.desc}
                  </p>
                  <ArrowUpRight
                    className="absolute top-7 right-7 w-4 h-4 text-warm-gray/0 group-hover:text-burgundy transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                    strokeWidth={1.6}
                  />
                </article>
              </Link>
            );
          })}
        </div>
      </PageContainer>

      {/* Countdown / Info Section */}
      {yearData.submission_deadline &&
        new Date(yearData.submission_deadline) > new Date() && (
          <section className="bg-white border-t border-soft-border">
            <PageContainer className="py-14 text-center">
              <p className="eyebrow mb-3">Profile submissions close</p>
              <p className="display-serif text-[36px] sm:text-[44px] text-burgundy">
                {new Date(
                  yearData.submission_deadline,
                ).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <div
                className="mx-auto mt-5 h-px w-12 bg-gold/70"
                aria-hidden="true"
              />
              <p className="text-warm-gray mt-5 text-[15px] max-w-md mx-auto">
                Make sure your profile is complete before the deadline —
                it&rsquo;s your printed page in the class archive.
              </p>
            </PageContainer>
          </section>
        )}
    </>
  );
}
