import React, { useState, useEffect } from 'react';
import { Award, Flame, Clock, BarChart3 } from 'lucide-react';
import { TeachBackAssessmentView } from './TeachBackAssessmentView.tsx';
import { apiClient, UserProfile } from '../services/apiClient.ts';

interface ProgressTabViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
}

export const ProgressTabView: React.FC<ProgressTabViewProps> = ({ profile, theme }) => {
  const [subTab, setSubTab] = useState<'explain' | 'overview'>('explain');
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    apiClient.getMissionsSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b pb-3"
        style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
        role="tablist"
        aria-label="Progress sub-navigation"
      >
        <button
          role="tab"
          aria-selected={subTab === 'explain'}
          onClick={() => setSubTab('explain')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'explain'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Explain It Back</span>
        </button>

        <button
          role="tab"
          aria-selected={subTab === 'overview'}
          onClick={() => setSubTab('overview')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'overview'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Practice Overview</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {subTab === 'explain' ? (
          <TeachBackAssessmentView profile={profile} theme={theme} />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border bg-slate-900/30"
                style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              >
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <Flame className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Practice Streak</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-100">
                  {profile?.streak_count || 1} <span className="text-sm font-normal text-slate-400">consecutive days</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Incremented after verifying at least 3 minutes of practice today.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-slate-900/30"
                style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              >
                <div className="flex items-center gap-2 text-violet-400 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Speaking Time</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-100">
                  {summary?.actual?.speakingMinutes || 0} <span className="text-sm font-normal text-slate-400">minutes</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Target: 70% of total practice duration.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-slate-900/30"
                style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              >
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Curriculum Level</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-100">
                  {profile?.proficiencyLevel || profile?.proficiency_level || 'Intermediate'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Lessons marked as Draft, not yet reviewed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
