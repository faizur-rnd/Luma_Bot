import React, { useState, useEffect } from 'react';
import { Flame, Clock, ArrowRight, Play, BookOpen, Sparkles } from 'lucide-react';
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
  const [streak, setStreak] = useState<number>(profile?.streakCount ?? 0);
  const [weeklyMinutes, setWeeklyMinutes] = useState<number>(0);
  const [recentLesson, setRecentLesson] = useState<{ id: string; title: string; level: string } | null>(null);

  const displayName = profile?.displayName || 'Learner';
  const estimatedMinutes = profile?.dailyGoalMinutes || 15;

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

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 text-[var(--text)]">
      {/* 1. Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[32px] font-bold text-[var(--text)] leading-[1.2]">
            Welcome back, {displayName}
          </h1>
          <p className="text-[14px] sm:text-[16px] text-[var(--muted)] mt-1">
            Ready for your daily spoken conversation?
          </p>
        </div>

        {/* Small streak and weekly minutes summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-[14px] font-semibold text-[var(--text)]">
            <Flame className="w-4 h-4 text-[var(--warning)] shrink-0" />
            <span>{streak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] text-[14px] font-semibold text-[var(--text)]">
            <Clock className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>{weeklyMinutes}m this week</span>
          </div>
        </div>
      </div>

      {/* 2. ONE Large Card "Today's practice" (ONE primary button above fold) */}
      <Card padding="lg" className="relative overflow-hidden bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[var(--accent)] uppercase tracking-wider">
                Today's practice
              </span>
              <StatusPill label={`${estimatedMinutes} mins`} variant="accent" />
            </div>

            <h2 className="text-[20px] sm:text-[24px] font-bold text-[var(--text)] leading-[1.3]">
              Everyday Situational Dialogue
            </h2>

            <p className="text-[14px] sm:text-[16px] text-[var(--muted)] leading-[1.5]">
              Practice ordering food, asking for recommendations, and natural conversational back-and-forth with your voice tutor.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleStart('lesson_beg_01')}
              className="w-full sm:w-auto shadow-[var(--shadow-md)]"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              <span>Start practice</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Continue where you left off */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[20px] font-bold text-[var(--text)]">
          Continue where you left off
        </h3>

        {recentLesson ? (
          <Card padding="md" className="hover:border-[var(--accent)] transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-[12px] bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[16px] font-semibold text-[var(--text)] capitalize">
                    {recentLesson.title}
                  </h4>
                  <p className="text-[14px] text-[var(--muted)]">
                    Pick up where your last session ended
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStart(recentLesson.id)}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-[12px] bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[16px] font-semibold text-[var(--text)]">
                    Ordering at a Cafe
                  </h4>
                  <p className="text-[14px] text-[var(--muted)]">
                    Beginner practice • 15 minutes
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStart('lesson_beg_01')}
              >
                <span>Start</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
