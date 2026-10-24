import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Play, 
  Clock, 
  Target, 
  Sparkles, 
  Volume2, 
  ChevronRight, 
  Award,
  Layers
} from 'lucide-react';
import { apiClient, CurriculumModule, CurriculumLesson, UserProfile } from '../services/apiClient.ts';

interface CurriculumViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  onStartVoiceWithScenario: (scenario: string) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  profile,
  theme,
  onStartVoiceWithScenario
}) => {
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [activeLesson, setActiveLesson] = useState<CurriculumLesson | null>(null);
  const [practiceCompleted, setPracticeCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurriculumAndProgress();
  }, [profile?.target_language]);

  const loadCurriculumAndProgress = async () => {
    try {
      setLoading(true);
      const [curriculumData, progressData] = await Promise.all([
        apiClient.getCurriculum(profile?.target_language),
        apiClient.getProgress()
      ]);
      setModules(curriculumData);
      setProgressMap(progressData);
      if (curriculumData.length > 0 && curriculumData[0].lessons.length > 0) {
        setActiveLesson(curriculumData[0].lessons[0]);
      }
    } catch (e) {
      console.error('Failed to load curriculum:', e);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lesson: CurriculumLesson) => {
    try {
      const score = Math.floor(Math.random() * 11) + 90; // 90 to 100
      await apiClient.saveProgress(lesson.id, true, score, lesson.durationMinutes * 60);
      setProgressMap(prev => ({
        ...prev,
        [lesson.id]: {
          lesson_id: lesson.id,
          completed: true,
          score,
          last_practiced_at: new Date().toISOString()
        }
      }));
      setPracticeCompleted(prev => ({ ...prev, [lesson.id]: true }));
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const speakPhrase = (phrase: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(phrase);
      const isArabic = /[ا-ي]/.test(phrase) || profile?.target_language === 'ar';
      const isSpanish = profile?.target_language === 'es';
      const isGerman = /[äöüßÄÖÜ]/.test(phrase) || profile?.target_language === 'de';
      u.lang = isArabic ? 'ar-SA' : isSpanish ? 'es-ES' : isGerman ? 'de-DE' : 'en-US';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  // Calculate overall completion statistics
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = Object.values(progressMap).filter(p => p?.completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-aurora p-[2px] flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-[#080B14] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#22D3EE]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Structured Speaking Curriculum</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
                CEFR A1 - C1
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Targeted oral progression with real-world scenarios and bridge-language notes.
            </p>
          </div>
        </div>

        {/* Global Progress Metric */}
        <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-black/5 dark:border-white/10">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8]">
              Curriculum Mastery
            </span>
            <span className="text-base font-extrabold text-[#34D399]">
              {completedCount} / {totalLessons} Lessons ({progressPercent}%)
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-[#34D399] flex items-center justify-center font-bold text-xs text-[#34D399]">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Grid: Module Navigator & Active Lesson Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Modules & Lessons */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {modules.map(mod => (
            <div
              key={mod.id}
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: mod.accentColor }}
                  >
                    Level {mod.level}
                  </span>
                  <h3 className="text-sm font-bold">{mod.title}</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
                  {mod.badge}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-3">
                {mod.description}
              </p>

              {/* Lesson Items */}
              <div className="space-y-2">
                {mod.lessons.map(lesson => {
                  const isCompleted = Boolean(progressMap[lesson.id]?.completed);
                  const isSelected = activeLesson?.id === lesson.id;
                  const score = progressMap[lesson.id]?.score;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-sm'
                          : 'border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-[#34D399] flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#64748B] flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-semibold">{lesson.title}</div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                            <span>{lesson.durationMinutes} mins</span>
                            {score && (
                              <span className="text-[#34D399] font-bold">
                                Score: {score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#64748B]" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Active Lesson Workspace */}
        {activeLesson && (
          <div className="lg:col-span-7 p-6 rounded-3xl border flex flex-col gap-6"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#8B5CF6] tracking-wider">
                  Lesson Focus
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeLesson.durationMinutes} minutes
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-1">
                {activeLesson.title}
              </h2>
            </div>

            {/* Scenario & Objective */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong className="text-white/90">Objective: </strong>
                  {activeLesson.objective}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#D946EF] flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong className="text-white/90">Scenario: </strong>
                  {activeLesson.scenario}
                </p>
              </div>
            </div>

            {/* Key Phrases with Audio & Bridge Language */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-3">
                Key Spoken Phrases & Model Pronunciation
              </h3>
              <div className="space-y-3">
                {activeLesson.samplePhrases.map((phrase, idx) => {
                  const isArabicPhrase = /[ا-ي]/.test(phrase);
                  return (
                    <div
                      key={idx}
                      dir={isArabicPhrase ? 'rtl' : 'ltr'}
                      className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between gap-4"
                      style={{
                        backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC'
                      }}
                    >
                      <p className={`font-medium leading-relaxed ${isArabicPhrase ? 'text-sm font-serif' : 'text-xs'}`}>
                        "{phrase}"
                      </p>
                      <button
                        onClick={() => speakPhrase(phrase)}
                        className="p-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-colors cursor-pointer flex-shrink-0"
                        title="Listen to model audio pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bridge Language Notes */}
            {activeLesson.bridgeNotes && (
              <div className="p-4 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5">
                <span className="text-[10px] font-bold uppercase text-[#38BDF8]">
                  Bridge Language Insight ({profile?.bridge_language?.toUpperCase() || 'TA'}):
                </span>
                <p className="text-xs text-[#38BDF8] mt-1 font-medium">
                  {activeLesson.bridgeNotes[profile?.bridge_language || 'ta'] ||
                    Object.values(activeLesson.bridgeNotes)[0]}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={() => onStartVoiceWithScenario(activeLesson.id)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-cosmic text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Practice Scenario in Voice AI</span>
              </button>

              <button
                onClick={() => markLessonComplete(activeLesson)}
                className={`w-full sm:w-auto py-3 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  progressMap[activeLesson.id]?.completed
                    ? 'border-[#34D399] bg-[#34D399]/10 text-[#34D399]'
                    : 'border-[#263044] bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {progressMap[activeLesson.id]?.completed
                    ? 'Completed (Update Score)'
                    : 'Mark as Mastered'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
