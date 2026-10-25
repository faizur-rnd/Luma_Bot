import React, { useState } from 'react';
import { Tabs } from './ui';
import { LessonsListView } from './learn/LessonsListView';
import { MyWordsView } from './learn/MyWordsView';
import { ExplainItBackView } from './learn/ExplainItBackView';
import { UserProfile } from '../services/apiClient';

interface LearnTabViewProps {
  profile: UserProfile | null;
  onStartPractice: (lessonId?: string, topic?: string) => void;
}

export const LearnTabView: React.FC<LearnTabViewProps> = ({
  profile,
  onStartPractice
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'words' | 'explain'>('lessons');

  const tabs = [
    { id: 'lessons', label: 'Lessons' },
    { id: 'words', label: 'My words' },
    { id: 'explain', label: 'Explain it back' }
  ];

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Learn</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Structured modules, active recall flashcards, and conceptual explain-backs.
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'lessons' | 'words' | 'explain')}
        ariaLabel="Learn navigation tabs"
      />

      <div className="mt-6">
        {activeTab === 'lessons' && (
          <LessonsListView onStartLesson={(lessonId: string, topic: string) => onStartPractice(lessonId, topic)} />
        )}
        {activeTab === 'words' && (
          <MyWordsView profile={profile} />
        )}
        {activeTab === 'explain' && (
          <ExplainItBackView profile={profile} />
        )}
      </div>
    </div>
  );
};
