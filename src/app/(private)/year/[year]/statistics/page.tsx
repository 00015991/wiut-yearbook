import { notFound } from 'next/navigation';
import { getGraduationYearBySlug, getClassStatistics } from '@/lib/queries';
import { PageContainer, SectionHeading } from '@/components/shared/page-shell';
import { Card, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Image, MessageSquare, Music } from 'lucide-react';

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearSlug } = await params;
  const yearData = await getGraduationYearBySlug(yearSlug);
  if (!yearData) notFound();

  const stats = await getClassStatistics(yearData.id);

  // Top songs (count frequency)
  const songCounts: Record<string, number> = {};
  for (const song of stats.songs) {
    const normalized = song.trim().toLowerCase();
    songCounts[normalized] = (songCounts[normalized] || 0) + 1;
  }
  const topSongs = Object.entries(songCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <PageContainer className="py-10">
      <SectionHeading
        title="Class Statistics"
        subtitle={`The Class of ${yearData.year_label} in numbers`}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger-children">
        <StatCard
          icon={<Users className="w-6 h-6 text-burgundy" />}
          value={stats.totalStudents}
          label="Graduates"
        />
        <StatCard
          icon={<Image className="w-6 h-6 text-burgundy" />}
          value={stats.totalPhotos}
          label="Photos Shared"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6 text-burgundy" />}
          value={stats.totalMessages}
          label="Messages Written"
        />
        <StatCard
          icon={<Music className="w-6 h-6 text-burgundy" />}
          value={stats.songs.length}
          label="Songs Listed"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Breakdown */}
        <Card>
          <CardTitle>Graduates by Programme</CardTitle>
          <div className="mt-4 space-y-4">
            {stats.courseBreakdown
              .sort((a, b) => b.count - a.count)
              .map((course) => (
                <div key={course.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-night">{course.name}</span>
                    <span className="text-warm-gray">{course.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-beige-dark overflow-hidden">
                    <div
                      className="h-full rounded-full bg-burgundy transition-all duration-700"
                      style={{
                        width: `${stats.totalStudents > 0 ? (course.count / stats.totalStudents) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Profile Completion */}
        <Card>
          <CardTitle>Profile Completion</CardTitle>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E8DFD5"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8B2252"
                  strokeWidth="3"
                  strokeDasharray={`${stats.avgCompletion}, 100`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-heading font-bold text-night">{stats.avgCompletion}%</span>
                  <p className="text-xs text-warm-gray">Average</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-warm-gray text-center">
              Average profile completion across all graduates
            </p>
          </div>
        </Card>

        {/* Class Playlist */}
        {topSongs.length > 0 && (
          <Card className="md:col-span-2">
            <CardTitle>
              <span className="flex items-center gap-2">
                <Music className="w-5 h-5 text-burgundy" />
                Class Playlist — Most Popular Songs
              </span>
            </CardTitle>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topSongs.map(([song, count], index) => (
                <div
                  key={song}
                  className="flex items-center gap-3 p-3 rounded-xl bg-beige-light"
                >
                  <span className="w-8 h-8 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-night truncate capitalize">{song}</p>
                    <p className="text-xs text-warm-gray">{count} student{count > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
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
    <Card className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-3xl font-heading font-bold text-night">{value.toLocaleString()}</p>
      <p className="text-sm text-warm-gray">{label}</p>
    </Card>
  );
}
