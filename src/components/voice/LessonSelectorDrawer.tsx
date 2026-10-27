import React from 'react';
import { BookOpen, Check, ChevronRight } from 'lucide-react';
import { CurriculumModule, CurriculumLesson } from '../../services/apiClient.ts';
import { Dialog } from '../ui/Dialog.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';

interface LessonSelectorDrawerProps {
  isOpen: boolean;
  modules: CurriculumModule[];
  selectedLesson: CurriculumLesson | null;
  onSelectLesson: (module: CurriculumModule, lesson: CurriculumLesson) => void;
  onClose: () => void;
}

export const LessonSelectorDrawer: React.FC<LessonSelectorDrawerProps> = ({
  isOpen,
  modules,
  selectedLesson,
  onSelectLesson,
  onClose
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Practice Scenarios"
      description="Choose a real-world scenario to practice with your coach."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 py-2">
        {modules.map((mod) => (
          <div key={mod.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[var(--text)]">
                {mod.title}
              </h3>
              <StatusPill label={mod.level || 'Beginner'} variant="neutral" />
            </div>
            <div className="flex flex-col gap-2">
              {mod.lessons?.map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      onSelectLesson(mod, lesson);
                      onClose();
                    }}
                    className={`w-full text-left p-4 rounded-[16px] border transition-all flex items-center justify-between cursor-pointer select-none min-h-[44px] ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] ring-1 ring-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[16px]">{lesson.title}</span>
                      </div>
                      {lesson.scenario && (
                        <p className="text-[14px] text-[var(--muted)] mt-1 line-clamp-2 leading-[1.4]">
                          {lesson.scenario}
                        </p>
                      )}
                    </div>
                    {isSelected ? (
                      <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--muted)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
};
