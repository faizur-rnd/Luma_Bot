import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, MessageSquareQuote } from 'lucide-react';
import { UserProfile } from '../services/apiClient.ts';
import { Tabs } from './ui/Tabs.tsx';
import { LessonsListView } from './learn/LessonsListView.tsx';
import { MyWordsView } from './learn/MyWordsView.tsx';
import { ExplainItBackView } from './learn/ExplainItBackView.tsx';

interface LearnTabViewProps {
  profile: UserProfile | null;
  initialTab?: 'lessons' | 'words' | 'explain';
  onStartPractice: (lessonId: string, topic: string) => void;
}

export const LearnTabView: React.FC<LearnTabViewProps> = ({
  profile,
  initialTab = 'lessons',
  onStartPractice,
}) => {
  const [subTab, setSubTab] = useState<'lessons' | 'words' | 'explain'>(initialTab);

  useEffect(() => {
    setSubTab(initialTab);
  }, [initialTab]);

  const tabItems = [
    { id: 'lessons', label: 'Lessons', icon: <BookOpen size={16} /> },
    { id: 'words', label: 'My Words', icon: <Sparkles size={16} /> },
    { id: 'explain', label: 'Explain It Back', icon: <MessageSquareQuote size={16} /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[var(--text)]">Learning Library</h1>
          <p className="text-sm text-[var(--muted)]">
            Structured lessons, vocabulary drills, and active recall exercises.
          </p>
        </div>

        <Tabs
          tabs={tabItems}
          activeTab={subTab}
          onChange={(id) => setSubTab(id as 'lessons' | 'words' | 'explain')}
        />
      </div>

      <div className="pt-2">
        {subTab === 'lessons' && <LessonsListView onStartLesson={onStartPractice} />}
        {subTab === 'words' && <MyWordsView profile={profile} />}
        {subTab === 'explain' && <ExplainItBackView profile={profile} />}
      </div>
    </div>
  );
};
