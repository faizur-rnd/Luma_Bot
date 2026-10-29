import React, { useEffect, useState } from 'react';
import {
  Mic,
  Flame,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  Volume2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { apiClient, UserProfile } from '../services/apiClient.ts';
import { programApi } from '../services/api/programApi.ts';
import { checkpointReportApi } from '../services/api/checkpointReportApi.ts';
import { CurrentProgramSessionResponse } from '../services/api/types.ts';
import { Card, Button, ProgressBar } from './ui/index.ts';
import { ctaAnalytics } from '../services/analytics.ts';

interface HomeViewProps {
  profile?: UserProfile | null;
  curriculum?: any;
  onStartPractice?: (scenarioId?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onRetakeOnboarding?: () => void;
  onSwitchToVoiceTutor?: () => void;
  onOpenBaseline?: () => void;
}

export const DailyMissionHub: React.FC<HomeViewProps> = ({
  profile,
  onStartPractice,
  onNavigateTab,
  onRetakeOnboarding,
  onSwitchToVoiceTutor,
  onOpenBaseline
}) => {
  const [programData, setProgramData] = useState<CurrentProgramSessionResponse | null>(null);
  const [hasBaseline, setHasBaseline] = useState<boolean>(false);
  const [weeklyMinutes, setWeeklyMinutes] = useState<number>(0);
  const [completedDrills, setCompletedDrills] = useState<number>(0);

  const onboardingDone =
    typeof window === 'undefined' ||
    localStorage.getItem('luma_onboarding_done') === 'true' ||
    Boolean(profile?.email);

  useEffect(() => {
    programApi.getCurrentProgram().then((res) => setProgramData(res)).catch(() => {});
    checkpointReportApi
      .getCheckpoints()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.checkpoints || [];
        setHasBaseline(list.some((c: any) => c.type === 'baseline' || c.checkpointType === 'baseline'));
      })
      .catch(() => {});
    apiClient
      .getProgress()
      .then((prog) => {
        const keys = Object.keys(prog || {});
        setCompletedDrills(keys.length);
        let secs = 0;
        keys.forEach((k) => {
          secs += prog[k]?.time_spent_seconds || prog[k]?.time_spent || 0;
        });
        setWeeklyMinutes(Math.round(secs / 60));
      })
      .catch(() => {});
  }, [profile]);

  const currentWeek = programData?.weekNumber || 1;
  const currentDay = programData?.activeDay || 1;
  const weekTitle = programData?.title || 'Plosive Contrast & Articulation Clarity';
  const focusPhonemes = programData?.focusPhonemes || ['/θ/', '/ð/', '/v/', '/w/'];
  const totalStepsCount = programData?.currentSession?.steps?.length || 5;
  const completedStepsCount = programData?.completedSteps ? Object.keys(programData.completedSteps).length : 0;
  const isSessionComplete = completedStepsCount >= totalStepsCount && totalStepsCount > 0;

  const dailyGoalMinutes = profile?.dailyGoalMinutes ?? profile?.daily_goal_minutes ?? 15;
  const streak = profile?.streakCount ?? profile?.streak_count ?? 1;
  const sessionProgressPercent = Math.round((completedStepsCount / totalStepsCount) * 100);

  const handleStartTodaySession = () => {
    ctaAnalytics.track('daily_session_started', { week: currentWeek, day: currentDay });
    if (onStartPractice) onStartPractice();
    else if (onSwitchToVoiceTutor) onSwitchToVoiceTutor();
    else if (onNavigateTab) onNavigateTab('talk');
  };

  const practicePathways = [
    {
      id: 'pathway-talk',
      title: '5-Stage Daily Speaking Studio',
      subtitle: 'Warm-up, sound drill, shadowing, conversation & reflection',
      badge: `Week ${currentWeek} · Day ${currentDay}`,
      icon: <Mic className="w-5 h-5 text-[var(--accent)]" />,
      action: () => handleStartTodaySession()
    },
    {
      id: 'pathway-explain',
      title: 'Explain It Back Assessment',
      subtitle: 'Synthesize a concept aloud with honest rubric feedback',
      badge: 'Comprehension',
      icon: <MessageSquare className="w-5 h-5 text-[var(--success)]" />,
      action: () => onNavigateTab?.('learn:explain')
    },
    {
      id: 'pathway-words',
      title: 'Active Vocabulary & Phonetics',
      subtitle: 'Practice target vocabulary and pronunciation flashcards',
      badge: 'Lexicon',
      icon: <Volume2 className="w-5 h-5 text-[var(--warning)]" />,
      action: () => onNavigateTab?.('learn:words')
    },
    {
      id: 'pathway-lessons',
      title: 'Structured Articulation Drills',
      subtitle: 'Minimal pairs, tongue placement cues, and workplace dialogues',
      badge: 'Curriculum',
      icon: <BookOpen className="w-5 h-5 text-[var(--accent)]" />,
      action: () => onNavigateTab?.('learn:lessons')
    }
  ];

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-6 space-y-6 text-[var(--text)]">
      {(!onboardingDone || !hasBaseline) && (
        <Card className="p-4 border-[var(--warning)]/40 bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--warning)]/15 border border-[var(--warning)]/30 flex items-center justify-center text-[var(--warning)] shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">
                {!onboardingDone
                  ? 'Recommended Prerequisite: Complete Your Speaking Setup'
                  : 'Recommended Prerequisite: Complete Day-0 Baseline Assessment'}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {!onboardingDone
                  ? 'Configure your native language, target accent, microphone check, and privacy preferences.'
                  : 'Record a diagnostic passage and 60-second speech sample to benchmark your 12-week progress.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!onboardingDone ? (
              <Button variant="secondary" size="sm" onClick={onRetakeOnboarding}>Complete Setup</Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={onOpenBaseline || onRetakeOnboarding}>Start Baseline Assessment</Button>
            )}
          </div>
        </Card>
      )}

      {/* Hero Daily Mission Card — Exactly ONE Visually Dominant Primary CTA */}
      <Card className="relative overflow-hidden border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{`12-Week Program • Week ${currentWeek} · Day ${currentDay}`}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)] leading-tight">{weekTitle}</h1>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Target Focus Sounds: <strong className="text-[var(--text)] font-mono">{focusPhonemes.join('  ')}</strong>. Complete your 5-stage session (Warm-up, Sound Drill, Shadowing, Guided Conversation, and Reflection).
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button variant="primary" size="lg" onClick={handleStartTodaySession} className="font-bold px-6 shadow-md">
                <Mic className="w-4 h-4 mr-2" />
                <span>Start Today's Session</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {isSessionComplete && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--success)] px-3 py-1.5 rounded-lg bg-[var(--success)]/15 border border-[var(--success)]/30">
                  <CheckCircle2 className="w-4 h-4" />Today's 5/5 Stages Completed
                </span>
              )}
            </div>
          </div>

          <div className="w-full md:w-72 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--muted)] uppercase tracking-wider">Session Progress</span>
              <span className="font-bold text-[var(--text)]">{completedStepsCount} / {totalStepsCount} Stages</span>
            </div>
            <ProgressBar value={sessionProgressPercent} max={100} />
            <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
              <span>Daily Goal: {dailyGoalMinutes} min</span>
              <span>This Week: {weeklyMinutes} min</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3.5 p-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--warning)]/15 border border-[var(--warning)]/30 flex items-center justify-center text-[var(--warning)] shrink-0"><Flame className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-[var(--text)]">{streak} Day Streak</div>
            <div className="text-xs text-[var(--muted)]">{`Week ${currentWeek} · Day ${currentDay} active`}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3.5 p-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0"><Award className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-[var(--text)]">{completedDrills} Drills Practiced</div>
            <div className="text-xs text-[var(--muted)]">5-stage articulation curriculum</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3.5 p-4">
          <div className="w-11 h-11 rounded-xl bg-[var(--success)]/15 border border-[var(--success)]/30 flex items-center justify-center text-[var(--success)] shrink-0"><Clock className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-black text-[var(--text)]">{hasBaseline ? 'Baseline Saved' : 'Pending Baseline'}</div>
            <div className="text-xs text-[var(--muted)]">Day-0 diagnostic benchmark</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text)] tracking-tight">Practice Pathways</h2>
          <button type="button" onClick={() => onNavigateTab?.('progress')} className="text-xs text-[var(--accent)] hover:underline font-semibold cursor-pointer">
            View 12-Week Roadmap & Checkpoints →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {practicePathways.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="w-full text-left p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-start justify-between gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">{item.icon}</div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--muted)]">{item.badge}</span>
                  <h3 className="text-sm font-bold text-[var(--text)] mt-1.5 group-hover:text-[var(--accent)] transition-colors">{item.title}</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{item.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
