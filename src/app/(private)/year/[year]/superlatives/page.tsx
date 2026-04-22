import { notFound } from 'next/navigation';
import {
  getGraduationYearBySlug,
  getSuperlativesByYear,
  getSuperlativeResults,
} from '@/lib/queries';
import { getUserWithRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { signStoragePath } from '@/lib/storage/signed-url';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { VoteForm } from './vote-form';
import { Award, Trophy, Crown } from 'lucide-react';
import Link from 'next/link';
// Note: <img> intentional here — photos come from Supabase signed URLs with short TTL,
// which doesn't play well with next/image's CDN loader without extra plumbing.

export default async function SuperlativesPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const [categories, currentUser] = await Promise.all([
    getSuperlativesByYear(yearData.id),
    getUserWithRole(),
  ]);

  const supabase = await createClient();

  // For revealed categories, get results with photos.
  const categoriesWithResults = await Promise.all(
    categories.map(async (cat) => {
      if (cat.voting_status === 'revealed') {
        const results = await getSuperlativeResults(cat.id);
        const winner = results[0];
        let winnerPhotoUrl = '';

        if (winner) {
          const { data: photo } = await supabase
            .from('student_photos')
            .select('storage_thumb_path')
            .eq('student_id', winner.studentId)
            .eq('category', 'portrait')
            .eq('moderation_status', 'approved')
            .eq('is_deleted', false)
            .limit(1)
            .single();

          if (photo) {
            winnerPhotoUrl = (await signStoragePath(photo.storage_thumb_path)) ?? '';
          }
        }

        return { ...cat, results, winnerPhotoUrl };
      }
      return { ...cat, results: [], winnerPhotoUrl: '' };
    }),
  );

  // Get existing votes by current user.
  const userVotes: Record<string, string> = {};
  if (currentUser?.studentId) {
    const { data: votes } = await supabase
      .from('superlative_votes')
      .select('category_id, nominee_student_id')
      .eq('voter_student_id', currentUser.studentId)
      .eq('graduation_year_id', yearData.id);

    for (const vote of votes || []) {
      userVotes[vote.category_id] = vote.nominee_student_id;
    }
  }

  // Get classmates for voting.
  let classmates: { id: string; full_name: string; slug: string }[] = [];
  if (currentUser?.studentId) {
    const { data } = await supabase
      .from('students')
      .select('id, full_name, slug')
      .eq('graduation_year_id', yearData.id)
      .eq('approval_status', 'active')
      .neq('id', currentUser.studentId)
      .order('full_name');
    classmates = data || [];
  }

  const openCategories = categoriesWithResults.filter(
    (c) => c.voting_status === 'open',
  );
  const revealedCategories = categoriesWithResults.filter(
    (c) => c.voting_status === 'revealed',
  );

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="Class awards"
        title="Superlatives"
        subtitle="Vote for your classmates in the categories below, then check back for the reveal."
      />

      {/* Revealed Results */}
      {revealedCategories.length > 0 && (
        <section className="mb-14">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-gold" strokeWidth={1.6} />
              <h2 className="display-serif text-[22px] sm:text-[26px] text-night">
                Winners
              </h2>
            </div>
            <div className="hidden sm:block h-px flex-1 ml-6 bg-gold/60" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {revealedCategories.map((cat) => {
              const winner = cat.results[0];
              return (
                <article
                  key={cat.id}
                  className="bg-white rounded-xl overflow-hidden border border-soft-border/70 shadow-paper-sm transition-shadow duration-300 hover:shadow-paper-md"
                >
                  {winner && cat.winnerPhotoUrl && (
                    <div className="aspect-square bg-beige relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase signed URL */}
                      <img
                        src={cat.winnerPhotoUrl}
                        alt={winner.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night/40" />
                      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 shadow-paper-sm flex items-center justify-center">
                        <Crown className="w-4 h-4 text-gold" strokeWidth={1.8} />
                      </div>
                    </div>
                  )}
                  <div className="p-5 text-center">
                    <Badge variant="gold" className="mb-3">
                      {cat.title}
                    </Badge>
                    {winner ? (
                      <Link href={`/year/${yearSlug}/students/${winner.slug}`}>
                        <h3 className="display-serif text-[22px] text-night hover:text-burgundy transition-colors leading-tight">
                          {winner.name}
                        </h3>
                      </Link>
                    ) : (
                      <p className="text-warm-gray text-sm">No votes</p>
                    )}
                    {winner && (
                      <p className="text-[11px] text-warm-gray mt-2 uppercase tracking-[0.16em]">
                        {winner.count} {winner.count === 1 ? 'vote' : 'votes'}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Open Voting */}
      {openCategories.length > 0 && currentUser?.studentId && (
        <section className="mb-14">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-burgundy" strokeWidth={1.6} />
              <h2 className="display-serif text-[22px] sm:text-[26px] text-night">
                Cast your votes
              </h2>
            </div>
            <div className="hidden sm:block h-px flex-1 ml-6 bg-gold/60" aria-hidden="true" />
          </div>
          <div className="space-y-4">
            {openCategories.map((cat) => (
              <VoteForm
                key={cat.id}
                categoryId={cat.id}
                title={cat.title}
                description={cat.description || undefined}
                classmates={classmates}
                currentVote={userVotes[cat.id]}
                votingClosesAt={cat.voting_closes_at || undefined}
              />
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && (
        <EmptyState
          icon={Award}
          title="No superlatives yet"
          description="Class awards will be set up by the admin. Stay tuned."
        />
      )}
    </PageContainer>
  );
}
