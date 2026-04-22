import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getClassStatistics } from '@/lib/queries';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { Card, CardTitle } from '@/components/ui/card';
import { Users, Image as ImageIcon, MessageSquare, Music } from 'lucide-react';

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const stats = await getClassStatistics(yearData.id);

  // Top songs (count frequency).
  const songCounts: Record<string, number> = {};
  for (const song of stats.songs) {
    const normalized = song.trim().toLowerCase();
    songCounts[normalized] = (songCounts[normalized] || 0) + 1;
  }
  const topSongs = Object.entries(songCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <PageContainer className="py-14 sm:py-20">
      <SectionHeading
        eyebrow="By the numbers"
        title="Class statistics"
        subtitle={`The Class of ${yearData.year_label}, counted up.`}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 stagger-children">
        <StatCard
          icon={<Users className="w-5 h-5 text-burgundy" strokeWidth={1.6} />}
          value={stats.totalStudents}
          label="Graduates"
        />
        <StatCard
          icon={<ImageIcon className="w-5 h-5 text-burgundy" strokeWidth={1.6} />}
          value={stats.totalPhotos}
          label="Photos shared"
        />
        <StatCard
          icon={
            <MessageSquare className="w-5 h-5 text-burgundy" strokeWidth={1.6} />
          }
          value={stats.totalMessages}
          label="Messages written"
        />
        <StatCard
          icon={<Music className="w-5 h-5 text-burgundy" strokeWidth={1.6} />}
          value={stats.songs.length}
          label="Songs listed"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Breakdown */}
        <Card>
          <CardTitle>Graduates by programme</CardTitle>
          <div className="mt-5 space-y-4">
            {stats.courseBreakdown
              .sort((a, b) => b.count - a.count)
              .map((course) => (
                <div key={course.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-night">{course.name}</span>
                    <span className="text-warm-gray tabular-nums">
                      {course.count}
                    </span>
                  </div>
                  <div className="h-[6px] rounded-full bg-beige-dark/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-burgundy transition-all duration-[800ms] ease-out"
                      style={{
                        width: `${
                          stats.totalStudents > 0
                            ? (course.count / stats.totalStudents) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Profile Completion */}
        <Card>
          <CardTitle>Profile completion</CardTitle>
          <div className="mt-5 flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E4DCCF"
                  strokeWidth="2.4"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#7A1E45"
                  strokeWidth="2.4"
                  strokeDasharray={`${stats.avgCompletion}, 100`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="display-serif text-[36px] text-night tabular-nums">
                    {stats.avgCompletion}%
                  </span>
                  <p className="text-[11px] text-warm-gray uppercase tracking-[0.16em] mt-0.5">
                    Average
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-warm-gray text-center leading-relaxed">
              Average profile completion across all graduates.
            </p>
          </div>
        </Card>

        {/* Class Playlist */}
        {topSongs.length > 0 && (
          <Card className="md:col-span-2">
            <CardTitle>
              <span className="flex items-center gap-2.5">
                <Music
                  className="w-4 h-4 text-burgundy"
                  strokeWidth={1.6}
                />
                Class playlist
              </span>
            </CardTitle>
            <p className="text-sm text-warm-gray mt-1">
              The songs our classmates named their favourite.
            </p>
            <ol className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topSongs.map(([song, count], index) => (
                <li
                  key={song}
                  className="flex items-center gap-3 p-3 rounded-md bg-beige-light border border-soft-border/60"
                >
                  <span className="w-7 h-7 rounded-md bg-burgundy/10 text-burgundy flex items-center justify-center text-[13px] font-medium tabular-nums flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-night truncate capitalize">
                      {song}
                    </p>
                    <p className="text-[11px] text-warm-gray uppercase tracking-wider">
                      {count} {count > 1 ? 'students' : 'student'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card className="text-center" padding="md">
      <div className="flex justify-center mb-3">
        <div className="w-10 h-10 rounded-md bg-beige flex items-center justify-center ring-1 ring-soft-border/70">
          {icon}
        </div>
      </div>
      <p className="display-serif text-[32px] text-night tabular-nums leading-none">
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] text-warm-gray mt-2 uppercase tracking-[0.16em]">
        {label}
      </p>
    </Card>
  );
}
