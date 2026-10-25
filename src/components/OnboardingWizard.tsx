import React, { useState, useEffect } from 'react';
import { Card, Button, ProgressBar } from './ui';
import { apiClient } from '../services/apiClient';

interface OnboardingWizardProps {
  onComplete: (data?: any) => void;
  onCancel?: () => void;
}

const STORAGE_KEY = 'luma_onboarding_step_state';

const LANGUAGES_SPOKEN = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' }
];

const LANGUAGES_TO_LEARN = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italian' }
];

const LEVELS = [
  { id: 'Beginner', title: 'Beginner', desc: 'Starting from scratch or know a few simple words' },
  { id: 'Intermediate', title: 'Intermediate', desc: 'Can hold basic conversations and ask questions' },
  { id: 'Advanced', title: 'Advanced', desc: 'Comfortable speaking, looking for fluency and nuance' }
];

const DAILY_MINUTES = [5, 10, 15, 20, 30];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).step || 1 : 1;
    } catch {
      return 1;
    }
  });

  const [languageSpoken, setLanguageSpoken] = useState('en');
  const [languageToLearn, setLanguageToLearn] = useState('es');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [goal, setGoal] = useState('Travel & daily life');
  const [minutesPerDay, setMinutesPerDay] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  // Restore saved answers on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.languageSpoken) setLanguageSpoken(parsed.languageSpoken);
        if (parsed.languageToLearn) setLanguageToLearn(parsed.languageToLearn);
        if (parsed.level) setLevel(parsed.level);
        if (parsed.goal) setGoal(parsed.goal);
        if (parsed.minutesPerDay) setMinutesPerDay(parsed.minutesPerDay);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save progress for resumability
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step,
        languageSpoken,
        languageToLearn,
        level,
        goal,
        minutesPerDay
      }));
    } catch {
      // Storage unavailable
    }
  }, [step, languageSpoken, languageToLearn, level, goal, minutesPerDay]);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await apiClient.updateProfile({
        bridge_language: languageSpoken,
        target_language: languageToLearn,
        proficiency_level: level,
        daily_goal_minutes: minutesPerDay
      });
      localStorage.removeItem(STORAGE_KEY);
      onComplete({ languageSpoken, languageToLearn, level, minutesPerDay });
    } catch {
      // Fallback
      localStorage.removeItem(STORAGE_KEY);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercent = Math.round((step / 4) * 100);

  return (
    <div className="max-w-[640px] mx-auto px-4 py-8">
      {/* Header & Progress */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium">
          <span>Step {step} of 4</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="hover:text-[var(--text)] transition-colors p-1"
            >
              Skip setup
            </button>
          )}
        </div>
        <ProgressBar value={progressPercent} label={`Setup progress step ${step} of 4`} showPercentage={false} />
      </div>

      {/* Step 1: Language you speak */}
      {step === 1 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Language you speak</h2>
            <p className="text-sm text-[var(--muted)] mt-1">We will provide explanations and hints in this language.</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Language you speak">
            {LANGUAGES_SPOKEN.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={languageSpoken === lang.code}
                onClick={() => setLanguageSpoken(lang.code)}
                className={`min-h-[48px] p-3 text-left rounded-xl border text-sm font-medium transition-all ${
                  languageSpoken === lang.code
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
          <Button variant="primary" fullWidth onClick={() => setStep(2)}>
            Continue
          </Button>
        </Card>
      )}

      {/* Step 2: Language you want to learn */}
      {step === 2 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Language you want to learn</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Your conversational practice will focus on this language.</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Language you want to learn">
            {LANGUAGES_TO_LEARN.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={languageToLearn === lang.code}
                onClick={() => setLanguageToLearn(lang.code)}
                className={`min-h-[48px] p-3 text-left rounded-xl border text-sm font-medium transition-all ${
                  languageToLearn === lang.code
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" fullWidth onClick={() => setStep(3)}>Continue</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Your level and goal */}
      {step === 3 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Your level and goal</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Help us tailor lesson pacing and vocabulary difficulty.</p>
          </div>
          <div className="space-y-2.5" role="radiogroup" aria-label="Your proficiency level">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                role="radio"
                aria-checked={level === lvl.id}
                onClick={() => setLevel(lvl.id as any)}
                className={`w-full min-h-[56px] p-3.5 text-left rounded-xl border transition-all ${
                  level === lvl.id
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]'
                }`}
              >
                <div className="font-semibold text-sm text-[var(--text)]">{lvl.title}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{lvl.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" fullWidth onClick={() => setStep(4)}>Continue</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Minutes per day */}
      {step === 4 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Minutes per day</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Consistency is key. Even 10 minutes a day builds fluency.</p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center py-2" role="radiogroup" aria-label="Minutes per day">
            {DAILY_MINUTES.map((mins) => (
              <button
                key={mins}
                type="button"
                role="radio"
                aria-checked={minutesPerDay === mins}
                onClick={() => setMinutesPerDay(mins)}
                className={`min-h-[48px] min-w-[72px] px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  minutesPerDay === mins
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
            <Button
              variant="primary"
              fullWidth
              isLoading={isSaving}
              disabled={isSaving}
              onClick={handleFinish}
            >
              Start learning
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
