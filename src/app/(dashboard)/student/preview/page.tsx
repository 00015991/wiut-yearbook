import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getStudentDashboard } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { SectionHeading } from '@/components/shared/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignedImage } from '@/components/media/signed-image';
import { AtSign, Link as LinkIcon, Globe, Send, Music, MapPin, Heart } from 'lucide-react';

export default async function StudentPreviewPage() {
  const user = await requireRole('student');
  if (!user.studentId) redirect('/login');

  const { student, profile, photos } = await getStudentDashboard(user.studentId);
  if (!student) redirect('/login');

  const supabase = await createClient();

  const portrait = photos.find((p) => p.category === 'portrait' && !p.is_deleted);
  const generalPhotos = photos.filter((p) => p.category === 'general' && !p.is_deleted);

  let portraitUrl = '';
  if (portrait) {
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(portrait.storage_display_path, 3600);
    portraitUrl = data?.signedUrl || '';
  }

  const generalUrls = await Promise.all(
    generalPhotos.map(async (p) => {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(p.storage_thumb_path, 3600);
      return { id: p.id, url: data?.signedUrl || '' };
    })
  );

  return (
    <div>
      <SectionHeading
        title="Preview My Page"
        subtitle="This is how your profile will appear to classmates"
      />

      <div className="bg-beige-light rounded-2xl border border-dashed border-burgundy/20 p-2">
        <Card padding="lg">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Portrait */}
            <div className="w-full md:w-1/3 flex-shrink-0">
              {portraitUrl ? (
                <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                  <SignedImage src={portraitUrl} alt={student.full_name} className="w-full h-full" />
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-2xl bg-beige flex items-center justify-center border-2 border-dashed border-soft-border">
                  <p className="text-warm-gray text-sm text-center px-4">
                    Upload a portrait photo to see it here
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-heading font-bold text-night mb-1">
                {student.full_name}
              </h2>
              {(() => {
                const c = (student as unknown as { course?: { name: string } | { name: string }[] | null }).course;
                if (!c) return null;
                const name = Array.isArray(c) ? c[0]?.name : c.name;
                return name ? <p className="text-lg text-warm-gray mb-4">{name}</p> : null;
              })()}

              {profile?.quote ? (
                <blockquote className="mb-6 pl-4 border-l-2 border-burgundy/30">
                  <p className="text-lg font-accent italic text-night/80">
                    &ldquo;{profile.quote}&rdquo;
                  </p>
                </blockquote>
              ) : (
                <p className="text-warm-gray text-sm italic mb-6">No quote added yet</p>
              )}

              <div className="space-y-3">
                {profile?.work_future_plan && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-burgundy mt-0.5" />
                    <span className="text-sm">{profile.work_future_plan}</span>
                  </div>
                )}
                {profile?.favorite_song && (
                  <div className="flex items-start gap-2.5">
                    <Music className="w-4 h-4 text-burgundy mt-0.5" />
                    <span className="text-sm">{profile.favorite_song}</span>
                  </div>
                )}
                {profile?.favorite_memory && (
                  <div className="flex items-start gap-2.5">
                    <Heart className="w-4 h-4 text-burgundy mt-0.5" />
                    <span className="text-sm">{profile.favorite_memory}</span>
                  </div>
                )}
              </div>

              {/* Social */}
              <div className="flex gap-3 mt-6">
                {profile?.instagram_url && (
                  <div className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center">
                    <AtSign className="w-5 h-5 text-warm-gray" />
                  </div>
                )}
                {profile?.linkedin_url && (
                  <div className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-warm-gray" />
                  </div>
                )}
                {profile?.facebook_url && (
                  <div className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center">
                    <Globe className="w-5 h-5 text-warm-gray" />
                  </div>
                )}
                {profile?.telegram_username && (
                  <div className="w-10 h-10 rounded-xl bg-beige flex items-center justify-center">
                    <Send className="w-5 h-5 text-warm-gray" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* General Photos Preview */}
          {generalUrls.length > 0 && (
            <div className="mt-8 pt-6 border-t border-soft-border">
              <h3 className="font-heading font-semibold text-night mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-3">
                {generalUrls.map((p) => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-beige">
                    <img src={p.url} alt="Photo" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <p className="text-xs text-warm-gray text-center mt-4">
        This is a preview. Only approved content will be visible to your classmates.
      </p>
    </div>
  );
}
