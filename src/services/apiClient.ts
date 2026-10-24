// LUMA REST API Client

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  target_language: string;
  bridge_language: string;
  proficiency_level: string;
  daily_goal_minutes: number;
  streak_count: number;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  scenario: string;
  durationMinutes: number;
  objective: string;
  samplePhrases: string[];
  bridgeNotes?: Record<string, string>;
}

export interface CurriculumModule {
  id: string;
  level: string;
  title: string;
  description: string;
  badge: string;
  accentColor: string;
  lessons: CurriculumLesson[];
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
  topic_id: string;
  topic_title: string;
  pronunciation_score: number;
  fluency_score: number;
  grammar_score: number;
  lexical_score: number;
  overall_score: number;
  coaching_feedback: string;
  transcribed_text: string;
  created_at: string;
}

export interface DbStatusInfo {
  isLive: boolean;
  provider: string;
  error?: string | null;
  hasConnectionString: boolean;
}

export const apiClient = {
  async getDbHealth(): Promise<{ status: string; database: DbStatusInfo }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'offline',
        database: {
          isLive: false,
          provider: 'Local Cache (Resilient Fallback)',
          hasConnectionString: false,
          error: 'Backend API connection failed'
        }
      };
    }
  },

  async runDbMigrations(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/migrate', { method: 'POST' });
    return await res.json();
  },

  async getProfile(): Promise<UserProfile> {
    const res = await fetch('/api/auth/profile');
    if (!res.ok) throw new Error('Failed to load profile');
    return await res.json();
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getCurriculum(targetLanguage?: string): Promise<CurriculumModule[]> {
    const url = targetLanguage ? `/api/curriculum?targetLanguage=${encodeURIComponent(targetLanguage)}` : '/api/curriculum';
    const res = await fetch(url);
    return await res.json();
  },

  async getProgress(): Promise<Record<string, any>> {
    const res = await fetch('/api/progress');
    return await res.json();
  },

  async saveProgress(lessonId: string, completed: boolean, score: number, timeSpent: number) {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed, score, timeSpent })
    });
    return await res.json();
  },

  async getVocabulary(): Promise<VocabularyItem[]> {
    const res = await fetch('/api/vocabulary');
    return await res.json();
  },

  async saveVocabulary(item: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const res = await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return await res.json();
  },

  async getAssessments(): Promise<AssessmentAttempt[]> {
    const res = await fetch('/api/assessments');
    return await res.json();
  },

  async submitAssessment(payload: {
    topic_id: string;
    topic_title: string;
    transcribed_text: string;
  }): Promise<AssessmentAttempt> {
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async sendChatMessage(payload: {
    message: string;
    history?: Array<{ role: 'user' | 'model'; content: string }>;
    targetLanguage?: string;
    bridgeLanguage?: string;
    proficiencyLevel?: string;
    scenarioContext?: string;
    curriculumContext?: {
      moduleId?: string;
      moduleTitle?: string;
      lessonId?: string;
      lessonTitle?: string;
      objective?: string;
      samplePhrases?: string[];
      mode?: 'roleplay' | 'vocab_drill' | 'grammar_practice' | 'teach_back' | 'ask_question';
      targetExam?: string;
    };
  }) {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async purgeUserData() {
    const res = await fetch('/api/privacy/purge', { method: 'POST' });
    return await res.json();
  },

  getTtsAudioUrl(text: string, lang: string = 'ar', gender: 'male' | 'female' = 'male'): string {
    return `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}&gender=${encodeURIComponent(gender)}`;
  },

  // Language Capability Registry
  async getLanguageCapabilities() {
    const res = await fetch('/api/languages/capabilities');
    return await res.json();
  },

  // Onboarding
  async getOnboarding() {
    const res = await fetch('/api/onboarding');
    return await res.json();
  },

  async saveOnboarding(answers: any) {
    const res = await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await res.json();
  },

  // Personalized Curriculum
  async generateCurriculum(answers: any) {
    const res = await fetch('/api/curriculum/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await res.json();
  },

  async getPersonalizedCurriculum() {
    const res = await fetch('/api/curriculum/personalized');
    return await res.json();
  },

  async acceptCurriculum(curriculumId: string) {
    const res = await fetch('/api/curriculum/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculumId })
    });
    return await res.json();
  },

  // Daily Mission & 70/20/10 Tracking
  async logMissionActivity(payload: {
    missionId: string;
    activityType: 'speaking' | 'listening' | 'writing';
    secondsSpent: number;
    score?: number;
  }) {
    const res = await fetch('/api/missions/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getMissionsSummary() {
    const res = await fetch('/api/missions/summary');
    return await res.json();
  },

  async synthesizeSpeech(text: string, language?: string, gender?: 'male' | 'female'): Promise<{ audioBase64: string; mimeType: string } | null> {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, gender })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
};
