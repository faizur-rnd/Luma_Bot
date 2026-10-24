import React from 'react';
import { BookOpen, Check, X, ChevronRight } from 'lucide-react';
import { CurriculumModule, CurriculumLesson } from '../../services/apiClient.ts';

interface LessonSelectorDrawerProps {
  isOpen: boolean;
  modules: CurriculumModule[];
  selectedLesson: CurriculumLesson | null;
  theme: 'dark' | 'light';
  onSelectLesson: (module: CurriculumModule, lesson: CurriculumLesson) => void;
  onClose: () => void;
}

export const LessonSelectorDrawer: React.FC<LessonSelectorDrawerProps> = ({
  isOpen,
  modules,
  selectedLesson,
  theme,
  onSelectLesson,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-drawer-title"
    >
      <div
        className="w-full max-w-xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#334155' : '#E2E8F0'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-violet-500" />
            <h2 id="lesson-drawer-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Practice Scenarios
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                {mod.title}
              </h3>
              <div className="grid gap-2">
                {mod.lessons?.map((lesson) => {
                  const isSelected = selectedLesson?.id === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onSelectLesson(mod, lesson)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                          : theme === 'dark'
                          ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{lesson.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">
                            {mod.level || 'Intermediate'}
                          </span>
                        </div>
                        {lesson.scenario && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {lesson.scenario}
                          </p>
                        )}
                      </div>
                      {isSelected ? (
                        <Check className="w-5 h-5 text-violet-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
