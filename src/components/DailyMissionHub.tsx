import React, { useState, useEffect } from 'react';
import { Flame, Clock, ArrowRight, Play, BookOpen, Sparkles, Mic, Brain, Layers, CheckCircle } from 'lucide-react';
import { Card } from './ui/Card.tsx';
import { Button } from './ui/Button.tsx';
import { StatusPill } from './ui/StatusPill.tsx';
import { apiClient, UserProfile } from '../services/apiClient.ts';

interface HomeViewProps {
  profile?: UserProfile | null;
  curriculum?: any;
  onStartPractice?: (scenarioId?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onRetakeOnboarding?: () => void;
  onSwitchToVoiceTutor?: () => void;
}

export const DailyMissionHub: React.FC<HomeViewProps> = ({
  profile,
  onStartPractice,
  onNavigateTab,
  onRetakeOnboarding,
  onSwitchToVoiceTutor
}) => {
  const handleStart = (scenarioId?: string) => {
    if (onStartPractice) onStartPractice(scenarioId);
    else if (onSwitchToVoiceTutor) onSwitchToVoiceTutor();
    else if (onNavigateTab) onNavigateTab('talk');
  };

  const [streak, setStreak] = useState<number>(profile?.streakCount ?? profile?.streak_count ?? 0);
  const [weeklyMinutes, setWeeklyMinutes] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(profile?.dailyGoalMinutes ?? profile?.daily_goal_minutes ?? 15);
  const [recentLesson, setRecentLesson] = useState<{ id: string; title: string; level: string } | null>(null);

  const targetLang = profile?.targetLanguage || profile?.target_language || 'ar';
  const isArabic = targetLang === 'ar';
  const displayName = profile?.displayName || profile?.display_name || 'Learner';

  // 70/20/10 rule breakdown
  const speakingMinutes = Math.round(dailyGoal * 0.70);
  const listeningMinutes = Math.round(dailyGoal * 0.20);
  const writingMinutes = Math.max(1, dailyGoal - speakingMinutes - listeningMinutes);

  useEffect(() => {
    // Fetch real weekly activity and recent practice
    apiClient.getProgress()
      .then((progress) => {
        const lessonIds = Object.keys(progress || {});
        let totalSec = 0;
        let lastPracticed: any = null;

        lessonIds.forEach((id) => {
          const item = progress[id];
          totalSec += item.time_spent_seconds || 0;
          if (!lastPracticed || (item.last_practiced_at && item.last_practiced_at > lastPracticed.last_practiced_at)) {
            lastPracticed = item;
          }
        });

        setWeeklyMinutes(Math.round(totalSec / 60));
        if (lastPracticed) {
          setRecentLesson({
            id: lastPracticed.lesson_id,
            title: lastPracticed.lesson_id.replace('lesson_', '').replace(/_/g, ' '),
            level: 'Beginner'
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateGoal = async (minutes: number) => {
    setDailyGoal(minutes);
    try {
      await apiClient.updateProfile({ dailyGoalMinutes: minutes, daily_goal_minutes: minutes });
    } catch {}
  };

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-[var(--text)]">
      {/* 1. Greeting & Target Language Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[32px] font-bold text-[var(--text)] leading-[1.2]">
            {isArabic ? `أَهْلًا بِكَ، ${displayName}` : `Welcome back, ${displayName}`}
          </h1>
          <p className="text-[14px] sm:text-[16px] text-[var(--muted)] mt-1">
            {isArabic ? 'جاهز للمحادثة اليومية باللغة العربية؟' : 'Ready for your daily spoken conversation?'}
          </p>
        </div>

        {/* Streak and weekly minutes summary */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-[14px] font-semibold text-[var(--text)]">
            <Flame className="w-4 h-4 text-[var(--warning)] shrink-0" />
            <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-[14px] font-semibold text-[var(--text)]">
            <Clock className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>{weeklyMinutes}m this week</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Featured Card: Today's Practice */}
      <Card padding="lg" className="relative overflow-hidden bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[var(--accent)] uppercase tracking-wider">
                {isArabic ? 'تَدْرِيبُ اليَوْمِ الرَّئِيسِيّ' : "Today's practice"}
              </span>
              <StatusPill label={`${dailyGoal} mins`} variant="accent" />
            </div>

            <h2 className={`text-[20px] sm:text-[24px] font-bold text-[var(--text)] leading-[1.3] ${isArabic ? 'font-arabic' : ''}`}>
              {isArabic 
                ? 'التَّحِيَّاتُ وَالتَّعَارُفُ وَالضِّيَافَة (Greetings & Introductions)' 
                : 'Everyday Situational Dialogue'}
            </h2>

            <p className="text-[14px] sm:text-[16px] text-[var(--muted)] leading-[1.5]">
              {isArabic
                ? 'تدرّب على إلقاء التحية، والردّ عليها بأدب، والتعرّف على آداب الضيافة والمحادثة الحية مع معلم لُوما الذكي.'
                : 'Practice ordering, asking for recommendations, and natural conversational back-and-forth with your speaking coach.'}
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleStart(isArabic ? 'lesson_ar_01' : 'lesson_beg_01')}
              className="w-full sm:w-auto shadow-[var(--shadow-md)]"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              <span>{isArabic ? 'ابْدَأِ التَّدْرِيبَ الآن' : 'Start practice'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. 70/20/10 Spoken Mastery Framework */}
      <Card padding="md" className="border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-[16px] font-bold text-[var(--text)]">
              Daily Practice Allocation
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Grounded in the 70% Speaking · 20% Listening · 10% Writing fluency principle
            </p>
          </div>

          {/* Goal adjustment pills */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Daily goal">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleUpdateGoal(mins)}
                className={`min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  dailyGoal === mins
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
                aria-pressed={dailyGoal === mins}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* 3 Metrics visual bars */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
              <span>Speaking</span>
              <span className="text-[var(--accent)]">70%</span>
            </div>
            <div className="text-xl font-black text-[var(--text)] mt-1">{speakingMinutes} min</div>
            <div className="w-full bg-[var(--border)] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[var(--accent)] h-full w-[70%]" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
              <span>Listening</span>
              <span className="text-[var(--success)]">20%</span>
            </div>
            <div className="text-xl font-black text-[var(--text)] mt-1">{listeningMinutes} min</div>
            <div className="w-full bg-[var(--border)] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[var(--success)] h-full w-[20%]" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
              <span>Writing</span>
              <span className="text-[var(--warning)]">10%</span>
            </div>
            <div className="text-xl font-black text-[var(--text)] mt-1">{writingMinutes} min</div>
            <div className="w-full bg-[var(--border)] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[var(--warning)] h-full w-[10%]" />
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Functional Launchers: All Practice Pathways */}
      <div>
        <h3 className="text-[18px] font-bold text-[var(--text)] mb-3">
          Practice Pathways
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card padding="md" className="hover:border-[var(--accent)] transition-all cursor-pointer flex flex-col justify-between group" onClick={() => onNavigateTab ? onNavigateTab('talk') : handleStart()}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)]">Speaking Coach</h4>
              <p className="text-xs text-[var(--muted)] mt-1">Interactive spoken articulation practice with real-time feedback.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-cyan-400">
              <span>Start session</span><ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          <Card padding="md" className="hover:border-[var(--accent)] transition-all cursor-pointer flex flex-col justify-between group" onClick={() => onNavigateTab ? onNavigateTab('learn') : undefined}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)]">Explain It Back</h4>
              <p className="text-xs text-[var(--muted)] mt-1">Teach a concept back to test your deep intuitive grasp.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-400">
              <span>Teach concept</span><ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          <Card padding="md" className="hover:border-[var(--accent)] transition-all cursor-pointer flex flex-col justify-between group" onClick={() => onNavigateTab ? onNavigateTab('learn') : undefined}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)]">Word Flashcards</h4>
              <p className="text-xs text-[var(--muted)] mt-1">Active recall phoneme vocabulary with spaced repetition.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-400">
              <span>Review cards</span><ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          <Card padding="md" className="hover:border-[var(--accent)] transition-all cursor-pointer flex flex-col justify-between group" onClick={() => onNavigateTab ? onNavigateTab('learn') : undefined}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text)]">Curriculum</h4>
              <p className="text-xs text-[var(--muted)] mt-1">Structured 12-week program and phoneme roadmaps.</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-indigo-400">
              <span>Explore lessons</span><ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
