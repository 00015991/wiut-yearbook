import { notFound } from 'next/navigation';
import {
  getGraduationYearBySlug,
  getStudentBySlug,
  getStudentPhotos,
  getMessagesForStudent,
} from '@/lib/queries';
import { getUserWithRole } from '@/lib/auth';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer } from '@/components/shared/page-shell';
import { SignedImage } from '@/components/media/signed-image';
import { MessageWall } from './message-wall';
import {
  AtSign,
  Link as LinkIcon,
  Globe,
  Send,
  Music,
  MapPin,
  Heart,
} from 'lucide-react';
import Link from 'next/link';

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { year: yearSlug, slug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const student = await getStudentBySlug(yearData.id, slug);
  if (!student || !student.profile) notFound();

  const [photos, messages, currentUser] = await Promise.all([
    getStudentPhotos(student.id),
    getMessagesForStudent(student.id, yearData.id),
    getUserWithRole(),
  ]);

  // Wrap the helper so `?? ''` lives in one place — the caller code below
  // gets a guaranteed string back.
  const getSignedUrl = async (path: string) =>
    (await signStoragePath(path)) ?? '';

  const portrait = photos.find((p) => p.category === 'portrait');
  const generalPhotos = photos.filter((p) => p.category === 'general');
  const childhoodPhoto = photos.find((p) => p.category === 'childhood');

  const portraitUrl = portrait
    ? await getSignedUrl(portrait.storage_display_path)
    : '';
  const childhoodUrl = childhoodPhoto
    ? await getSignedUrl(childhoodPhoto.storage_display_path)
    : '';

  const generalUrls = await Promise.all(
    generalPhotos.map(async (p) => ({
      id: p.id,
      url: await getSignedUrl(p.storage_display_path),
      caption: p.caption,
    })),
  );

  const profile = student.profile;
  const firstName = student.full_name.split(' ')[0];

  return (
    <PageContainer className="py-12 sm:py-16 max-w-5xl">
      {/* Hero: Portrait + Info */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 md:gap-14 mb-16">
        {/* Portrait */}
        <div className="w-full">
          {portraitUrl ? (
            <div className="aspect-[3/4] overflow-hidden rounded-lg bg-beige ring-1 ring-soft-border shadow-paper-md">
              <SignedImage
                src={portraitUrl}
                alt={student.full_name}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-lg bg-beige ring-1 ring-soft-border flex items-center justify-center">
              <span className="text-7xl font-heading text-warm-gray/30">
                {student.full_name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 pt-1">
          {student.course && (
            <p className="eyebrow mb-3">{student.course.name}</p>
          )}
          <h1 className="display-serif text-[40px] sm:text-[52px] leading-[1.02] text-night mb-2">
            {student.full_name}
          </h1>
          <div className="h-px w-12 bg-gold/70 my-5" aria-hidden="true" />

          {/* Quote */}
          {profile.quote && (
            <blockquote className="mb-8">
              {profile.quote_prompt && (
                <p className="text-[11px] text-warm-gray uppercase tracking-[0.16em] mb-2">
                  {profile.quote_prompt}
                </p>
              )}
              <p className="accent-italic text-[19px] text-night/85 leading-[1.45] relative pl-5 before:content-['“'] before:absolute before:-left-0 before:-top-1 before:text-3xl before:text-burgundy/40 before:font-heading">
                {profile.quote}
              </p>
            </blockquote>
          )}

          {/* Details */}
          <dl className="space-y-3.5 text-[15px]">
            {profile.work_future_plan && (
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 text-burgundy mt-1 flex-shrink-0"
                  strokeWidth={1.6}
                />
                <div>
                  <dt className="sr-only">Future plan</dt>
                  <dd className="text-night/90">{profile.work_future_plan}</dd>
                </div>
              </div>
            )}
            {profile.favorite_song && (
              <div className="flex items-start gap-3">
                <Music
                  className="w-4 h-4 text-burgundy mt-1 flex-shrink-0"
                  strokeWidth={1.6}
                />
                <div>
                  <dt className="sr-only">Favorite song</dt>
                  <dd className="text-night/90">
                    {profile.favorite_song}
                    {profile.favorite_song_url && (
                      <a
                        href={profile.favorite_song_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-burgundy underline-offset-2 hover:underline text-xs tracking-wide uppercase"
                      >
                        Listen
                      </a>
                    )}
                  </dd>
                </div>
              </div>
            )}
            {profile.favorite_memory && (
              <div className="flex items-start gap-3">
                <Heart
                  className="w-4 h-4 text-burgundy mt-1 flex-shrink-0"
                  strokeWidth={1.6}
                />
                <div>
                  <dt className="sr-only">Favorite memory</dt>
                  <dd className="text-night/90">{profile.favorite_memory}</dd>
                </div>
              </div>
            )}
          </dl>

          {/* Social Links */}
          {(profile.instagram_url ||
            profile.linkedin_url ||
            profile.facebook_url ||
            profile.telegram_username) && (
            <div className="flex gap-2 mt-8">
              {profile.instagram_url && (
                <a
                  href={
                    profile.instagram_url.startsWith('http')
                      ? profile.instagram_url
                      : `https://instagram.com/${profile.instagram_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-md border border-soft-border bg-white flex items-center justify-center text-warm-gray hover:text-burgundy hover:border-burgundy/30 transition-colors"
                >
                  <AtSign className="w-4 h-4" strokeWidth={1.8} />
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-md border border-soft-border bg-white flex items-center justify-center text-warm-gray hover:text-burgundy hover:border-burgundy/30 transition-colors"
                >
                  <LinkIcon className="w-4 h-4" strokeWidth={1.8} />
                </a>
              )}
              {profile.facebook_url && (
                <a
                  href={profile.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-md border border-soft-border bg-white flex items-center justify-center text-warm-gray hover:text-burgundy hover:border-burgundy/30 transition-colors"
                >
                  <Globe className="w-4 h-4" strokeWidth={1.8} />
                </a>
              )}
              {profile.telegram_username && (
                <a
                  href={`https://t.me/${profile.telegram_username.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="w-9 h-9 rounded-md border border-soft-border bg-white flex items-center justify-center text-warm-gray hover:text-burgundy hover:border-burgundy/30 transition-colors"
                >
                  <Send className="w-4 h-4" strokeWidth={1.8} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Childhood — a single framed photo, not a slider. */}
      {childhoodUrl && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="eyebrow">A younger self</p>
              <h2 className="display-serif text-[24px] sm:text-[28px] text-night mt-2">
                {firstName}, once upon a time
              </h2>
            </div>
            <div className="hidden sm:block h-px w-24 bg-gold/60" aria-hidden="true" />
          </div>
          <div className="max-w-xs">
            <figure className="overflow-hidden rounded-lg ring-1 ring-soft-border shadow-paper-md bg-beige">
              <div className="aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
                <img
                  src={childhoodUrl}
                  alt={`${student.full_name} as a child`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </figure>
          </div>
        </section>
      )}

      {/* General Photos */}
      {generalUrls.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="eyebrow">Memories</p>
              <h2 className="display-serif text-[24px] sm:text-[28px] text-night mt-2">
                Photos
              </h2>
            </div>
            <div className="hidden sm:block h-px w-24 bg-gold/60" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {generalUrls.map((photo) => (
              <figure
                key={photo.id}
                className="overflow-hidden rounded-md bg-beige ring-1 ring-soft-border"
              >
                <div className="aspect-square">
                  <SignedImage
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full"
                  />
                </div>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Yearbook Signing Wall */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="eyebrow">The signing wall</p>
            <h2 className="display-serif text-[24px] sm:text-[28px] text-night mt-2">
              Messages{' '}
              <span className="text-warm-gray/70 text-[18px] font-normal align-middle">
                · {messages.length}
              </span>
            </h2>
          </div>
          <div className="hidden sm:block h-px w-24 bg-gold/60" aria-hidden="true" />
        </div>

        {/* Existing Messages */}
        <div className="space-y-3 mb-8">
          {messages.map(
            (msg: {
              id: string;
              content: string;
              created_at: string;
              sender?: { full_name: string; slug: string };
            }) => (
              <article
                key={msg.id}
                className="bg-white rounded-lg p-5 border border-soft-border/70 shadow-paper-sm"
              >
                <p className="accent-italic text-[16px] text-night/90 leading-relaxed">
                  {msg.content}
                </p>
                <footer className="flex items-center justify-between mt-3 pt-3 hairline border-t">
                  <Link
                    href={`/year/${yearSlug}/students/${msg.sender?.slug || ''}`}
                    className="text-[13px] text-burgundy hover:underline underline-offset-2"
                  >
                    — {msg.sender?.full_name || 'Anonymous'}
                  </Link>
                  <span className="text-[11px] text-warm-gray uppercase tracking-wider">
                    {new Date(msg.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </footer>
              </article>
            ),
          )}
        </div>

        {/* Write a message form */}
        {currentUser?.studentId && currentUser.studentId !== student.id && (
          <MessageWall
            recipientStudentId={student.id}
            recipientName={student.full_name}
          />
        )}
      </section>
    </PageContainer>
  );
}
