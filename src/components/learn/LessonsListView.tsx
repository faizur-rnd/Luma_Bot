import React, { useState, useEffect } from 'react';
import { Card, Button, Input, StatusPill, ProgressBar, EmptyState, Skeleton } from '../ui';
import { apiClient } from '../../services/apiClient';

export interface LessonSummary {
  id: string;
  topic: string;
  level: string;
  reviewed: boolean;
  durationMinutes: number;
  objective: string;
}

interface LessonsListViewProps {
  onStartLesson: (lessonId: string, topic: string) => void;
}

export const LessonsListView: React.FC<LessonsListViewProps> = ({ onStartLesson }) => {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');

  useEffect(() => {
    let active = true;
    apiClient.getCurriculumLessons()
      .then((res: { lessons?: LessonSummary[] }) => {
        if (active && res.lessons) {
          setLessons(res.lessons);
        }
      })
      .catch(() => {
        // Fallback handled by parent or empty state
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = lessons.filter((l) => {
    const matchesSearch = l.topic.toLowerCase().includes(search.toLowerCase()) ||
      l.objective.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || l.level.toLowerCase() === selectedLevel.toLowerCase();
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Draft notice banner as required */}
      <div
        className="rounded-xl border border-[var(--warning)]/30 bg-[var(--surface-2)] p-4 text-[var(--text)] flex items-start gap-3"
        role="status"
      >
        <span className="text-lg" aria-hidden="true">ℹ️</span>
        <div className="text-sm">
          <p className="font-semibold text-[var(--warning)]">Draft, not yet reviewed</p>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            These curriculum modules are experimental. Human teacher review is pending.
          </p>
        </div>
      </div>

      {/* Search and level filter controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            id="lesson-search"
            label="Search lessons"
            placeholder="Search by topic or goal..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter lessons by level">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
            <Button
              key={lvl}
              variant={selectedLevel === lvl ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedLevel(lvl)}
              aria-pressed={selectedLevel === lvl}
            >
              {lvl}
            </Button>
          ))}
        </div>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton height={96} />
          <Skeleton height={96} />
          <Skeleton height={96} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No lessons found"
          description="Try clearing your search or picking a different level."
          action={<Button variant="secondary" onClick={() => { setSearch(''); setSelectedLevel('All'); }}>Show all lessons</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((l) => (
            <Card key={l.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusPill
                    label={l.level.charAt(0).toUpperCase() + l.level.slice(1)}
                    variant={l.level.toLowerCase() === 'beginner' ? 'success' : l.level.toLowerCase() === 'intermediate' ? 'warning' : 'accent'}
                  />
                  <span className="text-xs text-[var(--muted)] font-medium">
                    {l.durationMinutes} min
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-1">
                  {l.topic}
                </h3>
                <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4">
                  {l.objective}
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <ProgressBar value={l.reviewed ? 100 : 25} label="Completion progress" showPercentage={false} />
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => onStartLesson(l.id, l.topic)}
                >
                  Start practice
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
