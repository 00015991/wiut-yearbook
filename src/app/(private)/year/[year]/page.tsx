import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGraduationYearBySlug, getApprovedGalleryPhotos, getStudentsCountByYear } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { PageContainer } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';
import { Users, Image, GraduationCap, Baby, Award, BarChart3, ArrowRight } from 'lucide-react';

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

  // Generate signed URLs for collage
  const supabase = await createClient();
  const photosWithUrls = await Promise.all(
    collagePhotos.map(async (photo) => {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(photo.storage_thumb_path, 3600);
      return { ...photo, url: data?.signedUrl || '' };
    })
  );

  const basePath = `/year/${yearSlug}`;

  const sections = [
    { href: `${basePath}/students`, icon: Users, title: 'Students', desc: `${studentCount} graduates` },
    { href: `${basePath}/gallery`, icon: Image, title: 'Gallery', desc: 'Memories & moments' },
    { href: `${basePath}/courses`, icon: GraduationCap, title: 'Courses', desc: 'Programmes & departments' },
    { href: `${basePath}/childhood`, icon: Baby, title: 'Then & Now', desc: 'See how we grew' },
    { href: `${basePath}/superlatives`, icon: Award, title: 'Superlatives', desc: 'Class awards' },
    { href: `${basePath}/statistics`, icon: BarChart3, title: 'Class Stats', desc: 'Our year in numbers' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-night text-white">
        {/* Photo Collage Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-1 h-full">
            {photosWithUrls.map((photo, i) => (
              <div key={photo.id} className="relative overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
                {photo.url && (
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover animate-fade-in"
                    loading={i < 6 ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <PageContainer className="py-20 md:py-32 text-center">
            <p className="text-gold font-medium text-sm uppercase tracking-widest mb-4 animate-fade-in">
              Westminster International University in Tashkent
            </p>
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4 animate-fade-in-up">
              {yearData.title}
            </h1>
            <p className="text-xl text-white/70 max-w-xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              A private digital yearbook celebrating our memories, friendships, and the journey we shared.
            </p>
            <div className="flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href={`${basePath}/students`}>
                <Button size="lg" variant="primary">
                  Browse Students
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={`${basePath}/gallery`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Gallery
                </Button>
              </Link>
            </div>

            {/* Live counter */}
            <p className="mt-8 text-white/50 text-sm">
              {studentCount} graduates have joined the yearbook
            </p>
          </PageContainer>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <PageContainer className="py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <div className="bg-white rounded-2xl p-6 border border-soft-border hover:shadow-lg hover:shadow-burgundy/5 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-beige flex items-center justify-center mb-4 group-hover:bg-burgundy/10 transition-colors">
                    <Icon className="w-6 h-6 text-warm-gray group-hover:text-burgundy transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-night text-lg">{section.title}</h3>
                  <p className="text-warm-gray text-sm mt-1">{section.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </PageContainer>

      {/* Countdown / Info Section */}
      {yearData.submission_deadline && new Date(yearData.submission_deadline) > new Date() && (
        <section className="bg-white border-t border-soft-border">
          <PageContainer className="py-12 text-center">
            <p className="text-warm-gray text-sm uppercase tracking-wider mb-2">Profile submissions close</p>
            <p className="text-3xl font-heading font-bold text-burgundy">
              {new Date(yearData.submission_deadline).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-warm-gray mt-2 text-sm">Make sure your profile is complete before the deadline.</p>
          </PageContainer>
        </section>
      )}
    </>
  );
}
