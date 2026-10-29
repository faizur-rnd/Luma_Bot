// LUMA API Types and Data Contracts

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  display_name?: string;
  avatarUrl?: string;
  avatar_url?: string;
  targetLanguage: string;
  target_language?: string;
  bridgeLanguage: string;
  bridge_language?: string;
  proficiencyLevel: string;
  proficiency_level?: string;
  dailyGoalMinutes: number;
  daily_goal_minutes?: number;
  streakCount: number;
  streak_count?: number;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  scenario: string;
  durationMinutes: number;
  objective: string;
  samplePhrases: string[];
  bridgeNotes?: Record<string, string>;
  status?: string;
  level?: string;
}

export interface CurriculumModule {
  id: string;
  level: string;
  title: string;
  description: string;
  badge: string;
  accentColor: string;
  lessons: CurriculumLesson[];
  targetLanguage?: string;
}

export interface VocabularyItem {
  id: string;
  language?: string;
  term: string;
  translation: string;
  part_of_speech: string;
  phonetic?: string;
  context_example?: string;
  mastery_level: number;
  leitner_box: number;
  next_review_at: string;
}

export interface AssessmentAttempt {
  id: string;
  topic_id?: string;
  topic_title: string;
  pronunciation_score?: number | null;
  fluency_score?: number | null;
  grammar_score?: number;
  lexical_score?: number;
  accuracy_score?: number;
  completion_score?: number;
  overall_score: number;
  feedback_tips?: string[];
  coaching_feedback?: string;
  transcribed_text: string;
  created_at: string;
}

export interface DbStatusInfo {
  isLive: boolean;
  provider: string;
  error?: string | null;
  hasConnectionString: boolean;
}

export interface ProgramStep {
  stepNumber: number;
  type: 'warmup' | 'drills' | 'shadowing' | 'spontaneous' | 'reflection';
  title: string;
  durationMinutes: number;
  instructions: string;
  payload: Record<string, any>;
}

export interface ProgramSession {
  dayNumber: number;
  dayTitle: string;
  theme: string;
  steps: ProgramStep[];
}

export interface ProgramWeekInfo {
  weekNumber: number;
  title: string;
  focusPhonemes: string[];
  theme: string;
  milestoneType: 'none' | 'weekly_checkpoint' | 'retest';
  completedDays: number[];
  isComplete: boolean;
  status: string;
}

export interface CurrentProgramSessionResponse {
  weekNumber: number;
  title: string;
  focusPhonemes: string[];
  theme: string;
  milestoneType: 'none' | 'weekly_checkpoint' | 'retest';
  activeDay: number;
  completedDays: number[];
  completedSteps: Record<string, { completedAt: string; durationSeconds: number }>;
  currentSession: ProgramSession;
  status: string;
}

export interface PhonemeMasteryItem {
  userId: string;
  language: string;
  phoneme: string;
  mastery: number;
  lastSeen: string;
  nextReviewAt: string;
}

export interface PronunciationPhonemeScore {
  phoneme: string;
  score: number | null;
}

export interface PronunciationScoreResult {
  status: 'measured' | 'estimated' | 'unavailable';
  overallScore: number | null;
  intelligibilityScore: number | null;
  fluencyScore: number | null;
  disclosure: string;
  phonemes?: PronunciationPhonemeScore[];
}

