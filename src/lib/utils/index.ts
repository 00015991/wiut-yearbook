import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function slugifyWithId(text: string): string {
  const base = slugify(text);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export function normalizeFullName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(d);
}

export function calculateProfileCompletion(profile: {
  quote?: string | null;
  work_future_plan?: string | null;
  favorite_song?: string | null;
  favorite_memory?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
}, hasPortrait: boolean): number {
  let score = 0;
  const total = 7;

  if (hasPortrait) score++;
  if (profile.quote) score++;
  if (profile.work_future_plan) score++;
  if (profile.favorite_song) score++;
  if (profile.favorite_memory) score++;
  if (profile.instagram_url || profile.linkedin_url) score++;
  // Base point for existing profile
  score++;

  return Math.round((score / total) * 100);
}

// Quote prompts — show a random one to nudge creativity
export const QUOTE_PROMPTS = [
  'What is the one thing you will tell your future self about these years?',
  'If your university life was a movie, what would the tagline be?',
  'What advice would you give to a first-year student in 3 words or fewer?',
  'Finish this sentence: The thing nobody told me about university is...',
  'What will you miss most about WIUT?',
  'In 10 years, what do you hope to remember about today?',
  'What is your favourite inside joke from university?',
  'Describe your WIUT journey in one sentence.',
] as const;

export function getRandomQuotePrompt(): string {
  return QUOTE_PROMPTS[Math.floor(Math.random() * QUOTE_PROMPTS.length)];
}

// Keyword filter for yearbook messages
const BLOCKED_KEYWORDS: string[] = [
  // Add actual blocked keywords here
];

export function isMessageFlagged(content: string): boolean {
  const lower = content.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword));
}
