import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Award, TrendingUp, Calendar, Volume2 } from 'lucide-react';
import { apiClient, UserProfile, AssessmentAttempt } from '../services/apiClient.ts';
import { Card } from './ui/Card.tsx';
import { Skeleton } from './ui/Skeleton.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { ErrorState } from './ui/ErrorState.tsx';
import { StatusPill } from './ui/StatusPill.tsx';
import { ReportAndRetestPanel } from './progress/ReportAndRetestPanel.tsx';

interface ProgressTabViewProps {
  profile: UserProfile | null;
  onOpenBaseline?: () => void;
}

export const ProgressTabView: React.FC<ProgressTabViewProps> = ({ profile, onOpenBaseline }) => {
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAssessments();
      setAttempts(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load progress history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState message={error} onRetry={loadAttempts} />
      </div>
    );
  }

  const streak = profile?.streak_count || profile?.streakCount || 0;
  const totalSessions = attempts.length;

  const validClarityScores = attempts
    .map((a) => a.completion_score ?? a.overall_score)
    .filter((s): s is number => typeof s === 'number' && !isNaN(s));

  const avgClarity =
    validClarityScores.length > 0
      ? Math.round(validClarityScores.reduce((a, b) => a + b, 0) / validClarityScores.length)
      : null;

  const validPronunciationScores = attempts
    .map((a) => a.pronunciation_score)
    .filter((s): s is number => typeof s === 'number' && !isNaN(s));

  const avgPronunciation =
    validPronunciationScores.length > 0
      ? Math.round(validPronunciationScores.reduce((a, b) => a + b, 0) / validPronunciationScores.length)
      : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[var(--text)]">Your Progress</h1>
        <p className="text-sm text-[var(--muted)]">
          Verified performance metrics, 12-week checkpoints, and assessment history.
        </p>
      </div>

      <ReportAndRetestPanel onOpenBaseline={onOpenBaseline} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
            <Flame size={18} className="text-[var(--warning)]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text)]">
            {streak} <span className="text-sm font-sans font-normal text-[var(--muted)]">days</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Assessments</span>
            <CheckCircle2 size={18} className="text-[var(--success)]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text)]">
            {loading ? <Skeleton className="h-9 w-16" /> : totalSessions}
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Clarity</span>
            <TrendingUp size={18} className="text-[var(--accent)]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text)]">
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : avgClarity !== null ? (
              `${avgClarity}%`
            ) : (
              <span className="text-sm font-sans text-[var(--muted)]">Not Measured</span>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Pronunciation</span>
            <Volume2 size={18} className="text-[var(--accent)]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text)]">
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : avgPronunciation !== null ? (
              `${avgPronunciation}%`
            ) : (
              <span className="text-sm font-sans text-[var(--muted)]">Not Available</span>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-[var(--text)] flex items-center gap-2">
            <Calendar size={18} className="text-[var(--accent)]" /> Assessment History
          </h2>
          <span className="text-xs text-[var(--muted)]">Showing verified logs</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : attempts.length === 0 ? (
          <EmptyState
            icon={<Award size={28} />}
            title="No assessments recorded yet"
            description="Complete an Explain It Back challenge or Daily Session to see your verified scores here."
          />
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => {
              const hasPron = attempt.pronunciation_score !== null && attempt.pronunciation_score !== undefined;
              const clarityVal = attempt.completion_score ?? attempt.overall_score;
              const hasComp = clarityVal !== null && clarityVal !== undefined;
              return (
                <Card key={attempt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                        {attempt.topic_title}
                      </span>
                      <StatusPill status={hasPron ? 'measured' : hasComp ? 'estimated' : 'unavailable'} />
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(attempt.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)] line-clamp-2 italic">"{attempt.transcribed_text}"</p>
                    {attempt.coaching_feedback && (
                      <p className="text-xs text-[var(--muted)] line-clamp-2 pt-1">{attempt.coaching_feedback}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border)] shrink-0">
                    <div className="text-2xl font-serif font-bold text-[var(--accent)]">
                      {hasComp ? `${clarityVal}%` : '—'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Clarity Score
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
