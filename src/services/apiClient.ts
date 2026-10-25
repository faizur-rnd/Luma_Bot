// LUMA Secure REST API Client with CSRF & Session Management

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

let storedCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  storedCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return storedCsrfToken;
}

function normalizeUser(user: any): UserProfile {
  if (!user) return user;
  return {
    ...user,
    display_name: user.displayName || user.display_name || '',
    displayName: user.displayName || user.display_name || '',
    avatar_url: user.avatarUrl || user.avatar_url,
    avatarUrl: user.avatarUrl || user.avatar_url,
    target_language: user.targetLanguage || user.target_language || 'en',
    targetLanguage: user.targetLanguage || user.target_language || 'en',
    bridge_language: user.bridgeLanguage || user.bridge_language || 'ta',
    bridgeLanguage: user.bridgeLanguage || user.bridge_language || 'ta',
    proficiency_level: user.proficiencyLevel || user.proficiency_level || 'B1',
    proficiencyLevel: user.proficiencyLevel || user.proficiency_level || 'B1',
    daily_goal_minutes: user.dailyGoalMinutes ?? user.daily_goal_minutes ?? 15,
    dailyGoalMinutes: user.dailyGoalMinutes ?? user.daily_goal_minutes ?? 15,
    streak_count: user.streakCount ?? user.streak_count ?? 0,
    streakCount: user.streakCount ?? user.streak_count ?? 0
  };
}

async function request(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && storedCsrfToken) {
    headers['X-CSRF-Token'] = storedCsrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  return response;
}

export const apiClient = {
  // Database Health (Public)
  async getDbHealth(): Promise<{ status: string; database: DbStatusInfo }> {
    try {
      const res = await request('/api/health');
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

  // Auth Operations
  async checkAuth(): Promise<{ authenticated: boolean; user?: UserProfile; csrfToken?: string }> {
    try {
      const res = await request('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.csrfToken) setCsrfToken(data.csrfToken);
        return {
          authenticated: true,
          user: normalizeUser(data.user),
          csrfToken: data.csrfToken
        };
      }
      return { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  },

  async register(data: { email: string; password: string; displayName: string; targetLanguage?: string; bridgeLanguage?: string }) {
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    if (result.csrfToken) setCsrfToken(result.csrfToken);
    return { ...result, user: normalizeUser(result.user) };
  },

  async login(credentials: { email: string; password: string }) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    if (result.csrfToken) setCsrfToken(result.csrfToken);
    return { ...result, user: normalizeUser(result.user) };
  },

  async logout() {
    await request('/api/auth/logout', { method: 'POST' });
    setCsrfToken(null);
  },

  async forgotPassword(email: string) {
    const res = await request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await res.json();
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Password reset failed');
    return result;
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    const res = await request('/api/auth/profile');
    if (!res.ok) throw new Error('Failed to load profile');
    const user = await res.json();
    return normalizeUser(user);
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const normalizedPayload = {
      displayName: data.displayName || data.display_name,
      targetLanguage: data.targetLanguage || data.target_language,
      bridgeLanguage: data.bridgeLanguage || data.bridge_language,
      proficiencyLevel: data.proficiencyLevel || data.proficiency_level,
      dailyGoalMinutes: data.dailyGoalMinutes ?? data.daily_goal_minutes,
      streakCount: data.streakCount ?? data.streak_count
    };
    const res = await request('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const user = await res.json();
    return normalizeUser(user);
  },

  // Curriculum
  async getCurriculum(targetLanguage?: string): Promise<CurriculumModule[]> {
    const res = await request('/api/curriculum/lessons');
    if (res.ok) {
      const data = await res.json();
      if (data?.modules) return data.modules;
    }
    const persRes = await request('/api/curriculum/personalized');
    if (persRes.ok) {
      const p = await persRes.json();
      if (p?.modules) return p.modules;
    }
    return [];
  },

  async acceptCurriculum(curriculumId?: string) {
    return { success: true };
  },

  // Progress
  async getProgress(): Promise<Record<string, any>> {
    const res = await request('/api/progress');
    if (!res.ok) return {};
    return await res.json();
  },

  async saveProgress(lessonId: string, completed: boolean, score: number, timeSpent: number) {
    const res = await request('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed, score, timeSpent })
    });
    return await res.json();
  },

  // Vocabulary
  async getVocabulary(): Promise<VocabularyItem[]> {
    const res = await request('/api/vocabulary');
    if (!res.ok) return [];
    return await res.json();
  },

  async saveVocabulary(item: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const res = await request('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return await res.json();
  },

  // Curriculum Lessons Endpoint
  async getCurriculumLessons(): Promise<{ version: string; reviewStatus: string; lessons: any[] }> {
    const res = await request('/api/curriculum/lessons');
    if (!res.ok) throw new Error('Failed to load lessons');
    return await res.json();
  },

  // Assessments
  async getAssessments(): Promise<AssessmentAttempt[]> {
    const res = await request('/api/assessments');
    if (!res.ok) return [];
    return await res.json();
  },

  async submitAssessment(payload: {
    topic?: string;
    topic_id?: string;
    topic_title?: string;
    target_language?: string;
    learner_speech?: string;
    transcribed_text?: string;
    duration_seconds?: number;
    user_voice_duration?: number;
    fluency_wpm?: number;
    pronunciation_score?: number;
    fluency_score?: number;
    grammar_score?: number;
    lexical_score?: number;
  }): Promise<{ success: boolean; assessment: AssessmentAttempt }> {
    const res = await request('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Assessment submission failed');
    return data;
  },

  // Conversational AI
  async chatWithTutor(payload: {
    message: string;
    targetLanguage?: string;
    bridgeLanguage?: string;
    scenario?: string;
    mode?: string;
    history?: Array<{ role: 'user' | 'model'; content: string }>;
  }) {
    const res = await request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: payload.message,
        targetLanguage: payload.targetLanguage,
        bridgeLanguage: payload.bridgeLanguage,
        scenarioContext: payload.scenario,
        history: payload.history,
        curriculumContext: {
          lessonTitle: payload.scenario,
          mode: payload.mode || 'conversation'
        }
      })
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Tutor unavailable, try again');
    }
    return result;
  },

  async sendChatMessage(payload: {
    message: string;
    history?: Array<{ role: 'user' | 'model'; content: string }>;
    targetLanguage?: string;
    bridgeLanguage?: string;
    proficiencyLevel?: string;
    scenarioContext?: string;
    curriculumContext?: any;
  }) {
    const res = await request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Tutor unavailable, try again');
    }
    return result;
  },

  // Text to Speech
  getTtsAudioUrl(text: string, lang = 'ar', gender: 'male' | 'female' = 'male'): string | null {
    // Stage 2 requirement: Return null so speechController cleanly uses native browser speech synthesis
    return null;
  },

  async generateTTSAudio(payload: { text: string; language?: string; gender?: 'male' | 'female' }) {
    try {
      const res = await request('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  // Privacy & GDPR
  async getPrivacyConsents() {
    const res = await request('/api/privacy/consents');
    if (!res.ok) return { store_transcripts: true, store_audio_samples: false, analytics_enabled: false };
    return await res.json();
  },

  async updatePrivacyConsents(consents: any) {
    const res = await request('/api/privacy/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consents)
    });
    return await res.json();
  },

  async exportUserData() {
    const res = await request('/api/privacy/export');
    if (!res.ok) throw new Error('Data export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luma-userdata-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async purgeAccount() {
    const res = await request('/api/privacy/purge', { method: 'POST' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Purge failed');
    setCsrfToken(null);
    return result;
  },

  async purgeUserData() {
    return this.purgeAccount();
  },

  // Onboarding & Curriculum
  async getOnboarding() {
    const res = await request('/api/onboarding');
    if (!res.ok) return null;
    return await res.json();
  },

  async saveOnboarding(answers: any) {
    const res = await request('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await res.json();
  },

  async generateCurriculum(answers: any) {
    const res = await request('/api/curriculum/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await res.json();
  },

  async getPersonalizedCurriculum() {
    const res = await request('/api/curriculum/personalized');
    if (!res.ok) return null;
    return await res.json();
  },

  // Missions
  async logMissionActivity(data: { missionId: string; activityType: 'speaking' | 'listening' | 'writing'; secondsSpent: number; score?: number }) {
    const res = await request('/api/missions/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getMissionSummary() {
    const res = await request('/api/missions/summary');
    if (!res.ok) return null;
    return await res.json();
  },

  async getMissionsSummary() {
    return this.getMissionSummary();
  },

  async runDbMigrations(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Database migrations are managed at deploy time.' };
  }
};
