'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { saveStudentProfile } from '@/lib/actions/student';
import { getRandomQuotePrompt } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Check, Sparkles, Quote, Music, MapPin, Share2 } from 'lucide-react';

interface ProfileWizardProps {
  profile: {
    quote?: string;
    quote_prompt?: string | null;
    work_future_plan?: string | null;
    favorite_song?: string | null;
    favorite_song_url?: string | null;
    favorite_memory?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    telegram_username?: string | null;
  } | null;
  hasPortrait: boolean;
}

const steps = [
  { id: 'quote', title: 'Your Quote', icon: Quote, description: 'Something memorable for your page' },
  { id: 'details', title: 'About You', icon: MapPin, description: 'Future plans and favourite things' },
  { id: 'song', title: 'Favourite Song', icon: Music, description: 'The soundtrack of your uni life' },
  { id: 'social', title: 'Social Links', icon: Share2, description: 'Help classmates find you' },
];

export function ProfileWizard({ profile, hasPortrait }: ProfileWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quotePrompt] = useState(() => profile?.quote_prompt || getRandomQuotePrompt());
  const [quote, setQuote] = useState(profile?.quote || '');
  const [workFuturePlan, setWorkFuturePlan] = useState(profile?.work_future_plan || '');
  const [favoriteMemory, setFavoriteMemory] = useState(profile?.favorite_memory || '');
  const [favoriteSong, setFavoriteSong] = useState(profile?.favorite_song || '');
  const [favoriteSongUrl, setFavoriteSongUrl] = useState(profile?.favorite_song_url || '');
  const [instagram, setInstagram] = useState(profile?.instagram_url || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url || '');
  const [facebook, setFacebook] = useState(profile?.facebook_url || '');
  const [telegram, setTelegram] = useState(profile?.telegram_username || '');

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set('quote', quote);
    formData.set('quotePrompt', quotePrompt);
    formData.set('workFuturePlan', workFuturePlan);
    formData.set('favoriteMemory', favoriteMemory);
    formData.set('favoriteSong', favoriteSong);
    formData.set('favoriteSongUrl', favoriteSongUrl);
    formData.set('instagramUrl', instagram);
    formData.set('linkedinUrl', linkedin);
    formData.set('facebookUrl', facebook);
    formData.set('telegramUsername', telegram);

    const result = await saveStudentProfile(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
    setLoading(false);
  }

  const canGoNext = step < steps.length - 1;
  const canGoPrev = step > 0;
  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  return (
    <div>
      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              i === step
                ? 'bg-burgundy text-white font-medium'
                : i < step
                  ? 'bg-success/10 text-success'
                  : 'bg-white border border-soft-border text-warm-gray hover:bg-beige'
            }`}
          >
            {i < step ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{s.title}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <Card padding="lg" className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-burgundy/10 flex items-center justify-center">
            <StepIcon className="w-5 h-5 text-burgundy" />
          </div>
          <div>
            <CardTitle>{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </div>
        </div>

        {/* Step 0: Quote */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-beige rounded-xl p-4 mb-4">
              <p className="text-sm text-warm-gray mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Prompt for inspiration:
              </p>
              <p className="text-night font-accent italic">&ldquo;{quotePrompt}&rdquo;</p>
            </div>
            <Textarea
              label="Your Quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Write something that captures your uni experience..."
              maxChars={250}
              charCount={quote.length}
              rows={4}
            />
            <p className="text-xs text-warm-gray">
              This will appear prominently on your yearbook profile. Make it count!
            </p>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Future Plans / Career Goal"
              value={workFuturePlan}
              onChange={(e) => setWorkFuturePlan(e.target.value)}
              placeholder="e.g. Moving to London, joining Deloitte"
              hint="Where are you headed next?"
            />
            <Textarea
              label="Favourite Memory"
              value={favoriteMemory}
              onChange={(e) => setFavoriteMemory(e.target.value)}
              placeholder="That one time in the library at 3am..."
              maxChars={500}
              charCount={favoriteMemory.length}
              rows={3}
            />
          </div>
        )}

        {/* Step 2: Song */}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              label="Favourite Song"
              value={favoriteSong}
              onChange={(e) => setFavoriteSong(e.target.value)}
              placeholder="e.g. Night Changes — One Direction"
              hint="The song that defined your university years"
            />
            <Input
              label="Song Link (optional)"
              value={favoriteSongUrl}
              onChange={(e) => setFavoriteSongUrl(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              hint="Paste a Spotify or YouTube Music link to show a mini player"
            />
          </div>
        )}

        {/* Step 3: Social */}
        {step === 3 && (
          <div className="space-y-4">
            <Input
              label="Instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourusername or full URL"
            />
            <Input
              label="LinkedIn"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/you"
            />
            <Input
              label="Facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/you"
            />
            <Input
              label="Telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@yourusername"
            />
          </div>
        )}

        {/* Error / Success */}
        {error && <p className="text-sm text-error mt-4">{error}</p>}
        {saved && <p className="text-sm text-success mt-4">Profile saved successfully!</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-soft-border">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} loading={loading}>
              Save
            </Button>
            {canGoNext ? (
              <Button onClick={() => { handleSave(); setStep(step + 1); }}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} loading={loading}>
                <Check className="w-4 h-4 mr-1" />
                Save Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Reminder for portrait */}
      {!hasPortrait && (
        <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/20 text-sm text-warning">
          Don&apos;t forget to upload your portrait photo in the <strong>My Photos</strong> section!
        </div>
      )}
    </div>
  );
}
