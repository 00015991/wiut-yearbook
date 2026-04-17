import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getSuperlativesByYear, getSuperlativeResults } from '@/lib/queries';
import { getUserWithRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { BUCKET_NAME } from '@/lib/storage';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { VoteForm } from './vote-form';
import { Award, Trophy, Crown } from 'lucide-react';
import Link from 'next/link';

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

  // For revealed categories, get results with photos
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
            const { data: signed } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(photo.storage_thumb_path, 3600);
            winnerPhotoUrl = signed?.signedUrl || '';
          }
        }

        return { ...cat, results, winnerPhotoUrl };
      }
      return { ...cat, results: [], winnerPhotoUrl: '' };
    })
  );

  // Get existing votes by current user
  let userVotes: Record<string, string> = {};
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

  // Get classmates for voting
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

  const openCategories = categoriesWithResults.filter((c) => c.voting_status === 'open');
  const revealedCategories = categoriesWithResults.filter((c) => c.voting_status === 'revealed');

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Class Awards"
        subtitle="Vote for your classmates and see who wins"
      />

      {/* Revealed Results */}
      {revealedCategories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-heading font-semibold text-night mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {revealedCategories.map((cat) => {
              const winner = cat.results[0];
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl overflow-hidden border border-soft-border hover:shadow-lg transition-shadow"
                >
                  {winner && cat.winnerPhotoUrl && (
                    <div className="aspect-square bg-beige relative">
                      <img
                        src={cat.winnerPhotoUrl}
                        alt={winner.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Crown className="w-8 h-8 text-gold drop-shadow-lg" />
                      </div>
                    </div>
                  )}
                  <div className="p-4 text-center">
                    <Badge variant="default" className="mb-2">{cat.title}</Badge>
                    {winner ? (
                      <Link href={`/year/${yearSlug}/students/${winner.slug}`}>
                        <h3 className="font-heading font-semibold text-night text-lg hover:text-burgundy transition-colors">
                          {winner.name}
                        </h3>
                      </Link>
                    ) : (
                      <p className="text-warm-gray text-sm">No votes</p>
                    )}
                    {winner && (
                      <p className="text-sm text-warm-gray mt-1">{winner.count} votes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Open Voting */}
      {openCategories.length > 0 && currentUser?.studentId && (
        <section className="mb-12">
          <h2 className="text-xl font-heading font-semibold text-night mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-burgundy" />
            Cast Your Votes
          </h2>
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
          description="Class awards will be set up by the admin. Stay tuned!"
        />
      )}
    </PageContainer>
  );
}
