import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getStudentBySlug, getStudentPhotos, getMessagesForStudent } from '@/lib/queries';
import { getUserWithRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { PageContainer } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { SignedImage } from '@/components/media/signed-image';
import { ThenAndNow } from '@/components/media/then-and-now';
import { MessageWall } from './message-wall';
import { AtSign, Link as LinkIcon, Globe, Send, Music, MapPin, Heart, Quote } from 'lucide-react';
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

  const supabase = await createClient();

  // Get signed URLs for all photos
  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);
    return data?.signedUrl || '';
  };

  const portrait = photos.find((p) => p.category === 'portrait');
  const generalPhotos = photos.filter((p) => p.category === 'general');
  const childhoodPhoto = photos.find((p) => p.category === 'childhood');

  const portraitUrl = portrait ? await getSignedUrl(portrait.storage_display_path) : '';
  const childhoodUrl = childhoodPhoto ? await getSignedUrl(childhoodPhoto.storage_display_path) : '';

  const generalUrls = await Promise.all(
    generalPhotos.map(async (p) => ({
      id: p.id,
      url: await getSignedUrl(p.storage_display_path),
      caption: p.caption,
    }))
  );

  const profile = student.profile;

  return (
    <PageContainer className="py-10 max-w-4xl">
      {/* Hero: Portrait + Info */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Portrait */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          {portraitUrl ? (
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
              <SignedImage src={portraitUrl} alt={student.full_name} className="w-full h-full" />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-2xl bg-beige flex items-center justify-center">
              <span className="text-6xl font-heading text-warm-gray/30">
                {student.full_name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 pt-2">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-night mb-2">
            {student.full_name}
          </h1>
          {student.course && (
            <p className="text-lg text-warm-gray mb-4">{student.course.name}</p>
          )}

          {/* Quote */}
          {profile.quote && (
            <blockquote className="mb-6 pl-4 border-l-2 border-burgundy/30">
              {profile.quote_prompt && (
                <p className="text-xs text-warm-gray italic mb-1">{profile.quote_prompt}</p>
              )}
              <p className="text-lg font-accent italic text-night/80">
                &ldquo;{profile.quote}&rdquo;
              </p>
            </blockquote>
          )}

          {/* Details */}
          <div className="space-y-3">
            {profile.work_future_plan && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-burgundy mt-0.5 flex-shrink-0" />
                <span className="text-sm text-night">{profile.work_future_plan}</span>
              </div>
            )}
            {profile.favorite_song && (
              <div className="flex items-start gap-2.5">
                <Music className="w-4 h-4 text-burgundy mt-0.5 flex-shrink-0" />
                <span className="text-sm text-night">
                  {profile.favorite_song}
                  {profile.favorite_song_url && (
                    <a
                      href={profile.favorite_song_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-burgundy hover:underline text-xs"
                    >
                      Listen
                    </a>
                  )}
                </span>
              </div>
            )}
            {profile.favorite_memory && (
              <div className="flex items-start gap-2.5">
                <Heart className="w-4 h-4 text-burgundy mt-0.5 flex-shrink-0" />
                <span className="text-sm text-night">{profile.favorite_memory}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="flex gap-3 mt-6">
            {profile.instagram_url && (
              <a
                href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://instagram.com/${profile.instagram_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center hover:bg-burgundy/10 transition-colors"
              >
                <AtSign className="w-5 h-5 text-warm-gray" />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center hover:bg-burgundy/10 transition-colors">
                <LinkIcon className="w-5 h-5 text-warm-gray" />
              </a>
            )}
            {profile.facebook_url && (
              <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center hover:bg-burgundy/10 transition-colors">
                <Globe className="w-5 h-5 text-warm-gray" />
              </a>
            )}
            {profile.telegram_username && (
              <a
                href={`https://t.me/${profile.telegram_username.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center hover:bg-burgundy/10 transition-colors"
              >
                <Send className="w-5 h-5 text-warm-gray" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Then & Now */}
      {childhoodUrl && portraitUrl && (
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-semibold text-night mb-4">Then & Now</h2>
          <ThenAndNow
            childhoodSrc={childhoodUrl}
            currentSrc={portraitUrl}
            name={student.full_name}
            className="max-w-sm"
          />
        </section>
      )}

      {/* General Photos */}
      {generalUrls.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-heading font-semibold text-night mb-4">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {generalUrls.map((photo) => (
              <div key={photo.id} className="rounded-xl overflow-hidden aspect-square">
                <SignedImage src={photo.url} alt={photo.caption || 'Photo'} className="w-full h-full" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Yearbook Signing Wall */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-semibold text-night mb-4">
          Messages
          <span className="text-warm-gray text-base font-normal ml-2">
            ({messages.length})
          </span>
        </h2>

        {/* Existing Messages */}
        <div className="space-y-3 mb-6">
          {messages.map((msg: { id: string; content: string; created_at: string; sender?: { full_name: string; slug: string } }) => (
            <div key={msg.id} className="bg-white rounded-xl p-4 border border-soft-border">
              <p className="text-night text-sm">{msg.content}</p>
              <div className="flex items-center justify-between mt-2">
                <Link
                  href={`/year/${yearSlug}/students/${msg.sender?.slug || ''}`}
                  className="text-xs text-burgundy hover:underline"
                >
                  &mdash; {msg.sender?.full_name || 'Anonymous'}
                </Link>
                <span className="text-xs text-warm-gray">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
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
