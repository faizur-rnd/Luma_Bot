import React, { useState, useEffect } from 'react';
import { Card, StatusPill, Skeleton, EmptyState } from './ui';
import { apiClient, UserProfile, AssessmentAttempt } from '../services/apiClient';

interface ProgressTabViewProps {
  profile: UserProfile | null;
}

export const ProgressTabView: React.FC<ProgressTabViewProps> = ({ profile }) => {
  const [assessments, setAssessments] = useState<AssessmentAttempt[]>([]);
  const [summary, setSummary] = useState<{ actual?: { speakingMinutes?: number; completedCount?: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiClient.getAssessments(),
      apiClient.getMissionsSummary()
    ]).then(([assessmentsRes, summaryRes]) => {
      if (!active) return;
      if (assessmentsRes.status === 'fulfilled' && Array.isArray(assessmentsRes.value)) {
        setAssessments(assessmentsRes.value);
      }
      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setSummary(summaryRes.value);
      }
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const streak = profile?.streak_count || 0;
  const minutesSpoken = summary?.actual?.speakingMinutes || 0;
  const completedPractices = summary?.actual?.completedCount || assessments.length;

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 space-y-8">
      {/* Page Title */}
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Your Progress</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Honest metrics grounded in verified practice sessions.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Streak */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Practice streak</span>
            <span className="text-xl" aria-hidden="true">🔥</span>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text)]">
            {loading ? <Skeleton height={36} width={60} /> : `${streak} ${streak === 1 ? 'day' : 'days'}`}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Counts consecutive days with at least 3 minutes of practice.
          </p>
        </Card>

        {/* Minutes Spoken */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Minutes spoken this week</span>
            <span className="text-xl" aria-hidden="true">⏱️</span>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text)]">
            {loading ? <Skeleton height={36} width={60} /> : `${minutesSpoken} min`}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Logged across active conversational voice sessions.
          </p>
        </Card>

        {/* Completed practices */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--muted)]">Completed practices</span>
            <span className="text-xl" aria-hidden="true">✅</span>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text)]">
            {loading ? <Skeleton height={36} width={60} /> : completedPractices}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Total conversational sessions and explain-backs.
          </p>
        </Card>
      </div>

      {/* Unmeasured metrics disclosure */}
      <Card className="bg-[var(--surface-2)] border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--text)] mb-3">Measurement Disclosures</h3>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[var(--text)]">Pronunciation</span>
              <StatusPill label="Not measured yet" variant="neutral" />
            </div>
            <p className="text-xs text-[var(--muted)]">
              Browser speech recognition provides text transcripts only; acoustic scoring is not currently performed.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[var(--text)]">Fluency certification</span>
              <StatusPill label="Not measured yet" variant="neutral" />
            </div>
            <p className="text-xs text-[var(--muted)]">
              Formal standardized certification requires proctored spoken testing.
            </p>
          </div>
        </div>
      </Card>

      {/* Explain it back history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text)]">Explain-it-back history</h2>
          <span className="text-xs text-[var(--muted)]">{assessments.length} evaluated</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        ) : assessments.length === 0 ? (
          <EmptyState
            title="No explain-it-back attempts yet"
            description="Complete a practice session in the Learn tab to see your evaluations and feedback here."
          />
        ) : (
          <div className="space-y-3">
            {assessments.slice(0, 10).map((a) => (
              <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text)]">
                      {a.topic_title || 'Spoken Practice'}
                    </span>
                    <StatusPill
                      label={`${a.overall_score || 0}/100`}
                      variant={(a.overall_score || 0) >= 70 ? 'success' : 'warning'}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)] line-clamp-1">
                    {a.transcribed_text || 'Completed practice submission'}
                  </p>
                </div>
                <div className="text-right text-xs text-[var(--muted)] whitespace-nowrap">
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
