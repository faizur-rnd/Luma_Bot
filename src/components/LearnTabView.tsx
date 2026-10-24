import React, { useState } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { CurriculumView } from './CurriculumView.tsx';
import { VocabularyVaultView } from './VocabularyVaultView.tsx';
import { UserProfile } from '../services/apiClient.ts';

interface LearnTabViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  onStartVoiceWithScenario: (lessonId: string) => void;
}

export const LearnTabView: React.FC<LearnTabViewProps> = ({
  profile,
  theme,
  onStartVoiceWithScenario
}) => {
  const [subTab, setSubTab] = useState<'lessons' | 'words'>('lessons');

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b pb-3"
        style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
        role="tablist"
        aria-label="Learn sub-navigation"
      >
        <button
          role="tab"
          aria-selected={subTab === 'lessons'}
          onClick={() => setSubTab('lessons')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'lessons'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Lessons</span>
        </button>

        <button
          role="tab"
          aria-selected={subTab === 'words'}
          onClick={() => setSubTab('words')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'words'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Words</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {subTab === 'lessons' ? (
          <CurriculumView
            profile={profile}
            theme={theme}
            onStartVoiceWithScenario={onStartVoiceWithScenario}
          />
        ) : (
          <VocabularyVaultView profile={profile} theme={theme} />
        )}
      </div>
    </div>
  );
};
