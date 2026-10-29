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
let storedSessionId: string | null = null;

if (typeof window !== 'undefined') {
  try {
    storedSessionId = localStorage.getItem('luma_session_id');
    storedCsrfToken = localStorage.getItem('luma_csrf_token');
  } catch {}
}

export function setCsrfToken(token: string | null) {
  storedCsrfToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) localStorage.setItem('luma_csrf_token', token);
      else localStorage.removeItem('luma_csrf_token');
    } catch {}
  }
}

export function getCsrfToken(): string | null {
  return storedCsrfToken;
}

export function setSessionId(id: string | null) {
  storedSessionId = id;
  if (typeof window !== 'undefined') {
    try {
      if (id) localStorage.setItem('luma_session_id', id);
      else localStorage.removeItem('luma_session_id');
    } catch {}
  }
}

export function getSessionId(): string | null {
  return storedSessionId;
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

let authCheckPromise: Promise<string | null> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  if (storedCsrfToken && storedSessionId) return storedCsrfToken;
  if (!authCheckPromise) {
    const headers: Record<string, string> = {};
    if (storedSessionId) {
      headers['X-Session-ID'] = storedSessionId;
      headers['Authorization'] = `Bearer ${storedSessionId}`;
    }
    authCheckPromise = fetch('/api/auth/me', { headers, credentials: 'include' })
      .then(res => (res.ok ? safeParseJson(res) : null))
      .then(data => {
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
        if (data?.sessionId) setSessionId(data.sessionId);
        return data?.csrfToken || null;
      })
      .catch(() => null)
      .finally(() => {
        authCheckPromise = null;
      });
  }
  return authCheckPromise;
}

export async function safeParseJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data as T;
    } catch (e: any) {
      if (!res.ok) {
        throw new Error(e?.message || `Request failed with status ${res.status}`);
      }
      throw e;
    }
  }

  // Fallback for non-JSON response body (e.g. proxy notices or html error pages)
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Your session or security token expired. Please refresh the page.');
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('AI service is temporarily warming up. Please try again in a moment.');
    }
    throw new Error(`Service notice (${res.status}): ${text.slice(0, 100)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Unexpected response format from server.');
  }
}

async function request(url: string, options: RequestInit = {}, isRetry = false): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const isBootstrapRoute = /\/api\/(health|auth\/(me|login|register|forgot-password|reset-password))/.test(url);

  if (!isBootstrapRoute && (!storedSessionId || (isMutating && !storedCsrfToken))) {
    await ensureCsrfToken();
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (storedSessionId) {
    headers['X-Session-ID'] = storedSessionId;
    if (!headers['Authorization']) {
      headers['Authorization'] = `Bearer ${storedSessionId}`;
    }
  }

  if (isMutating && storedCsrfToken) {
    headers['X-CSRF-Token'] = storedCsrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const respSessionId = response.headers.get('X-Session-ID');
  if (respSessionId) setSessionId(respSessionId);
  const respCsrf = response.headers.get('X-CSRF-Token');
  if (respCsrf) setCsrfToken(respCsrf);

  if (!isRetry && !isBootstrapRoute && (response.status === 401 || response.status === 403)) {
    setCsrfToken(null);
    setSessionId(null);
    authCheckPromise = null;
    await ensureCsrfToken();
    if (storedSessionId) {
      return request(url, options, true);
    }
  }

  return response;
}

export const apiClient = {
  // Database Health (Public)
  async getDbHealth(): Promise<{ status: string; database: DbStatusInfo }> {
    try {
      const res = await request('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await safeParseJson(res);
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
  async checkAuth(): Promise<{ authenticated: boolean; user?: UserProfile; csrfToken?: string; sessionId?: string }> {
    try {
      const res = await request('/api/auth/me');
      if (res.ok) {
        const data = await safeParseJson(res);
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
        if (data?.sessionId) setSessionId(data.sessionId);
        return {
          authenticated: true,
          user: normalizeUser(data?.user),
          csrfToken: data?.csrfToken,
          sessionId: data?.sessionId
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
    const result = await safeParseJson(res);
    if (result.csrfToken) setCsrfToken(result.csrfToken);
    if (result.sessionId) setSessionId(result.sessionId);
    return { ...result, user: normalizeUser(result.user) };
  },

  async login(credentials: { email: string; password: string }) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const result = await safeParseJson(res);
    if (result.csrfToken) setCsrfToken(result.csrfToken);
    if (result.sessionId) setSessionId(result.sessionId);
    return { ...result, user: normalizeUser(result.user) };
  },

  async logout() {
    await request('/api/auth/logout', { method: 'POST' });
    setCsrfToken(null);
    setSessionId(null);
  },

  async forgotPassword(email: string) {
    const res = await request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await safeParseJson(res);
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const result = await safeParseJson(res);
    return result;
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    const res = await request('/api/auth/profile');
    if (res.ok) {
      const user = await safeParseJson(res);
      return normalizeUser(user);
    }
    const authData = await this.checkAuth();
    if (authData.user) return authData.user;
    throw new Error('Failed to load profile');
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const rawPayload: Record<string, any> = {
      displayName: data.displayName || data.display_name,
      targetLanguage: data.targetLanguage || data.target_language,
      bridgeLanguage: data.bridgeLanguage || data.bridge_language,
      proficiencyLevel: data.proficiencyLevel || data.proficiency_level,
      dailyGoalMinutes: data.dailyGoalMinutes ?? data.daily_goal_minutes,
      streakCount: data.streakCount ?? data.streak_count
    };
    const normalizedPayload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    try {
      const res = await request('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedPayload)
      });
      if (res.ok) {
        const user = await safeParseJson(res);
        return normalizeUser(user);
      }
    } catch {
      // Fall back to normalized local profile merge if offline
    }
    return normalizeUser({
      id: data.id || 'local-user',
      displayName: normalizedPayload.displayName || 'Learner',
      targetLanguage: normalizedPayload.targetLanguage || 'en',
      bridgeLanguage: normalizedPayload.bridgeLanguage || 'ta',
      proficiencyLevel: normalizedPayload.proficiencyLevel || 'B1',
      dailyGoalMinutes: Number(normalizedPayload.dailyGoalMinutes) || 15,
      streakCount: Number(normalizedPayload.streakCount) || 0
    });
  },

  // Curriculum
  async getCurriculum(targetLanguage?: string): Promise<CurriculumModule[]> {
    const res = await request('/api/curriculum/lessons');
    if (res.ok) {
      const data = await safeParseJson(res);
      if (data?.modules) return data.modules;
    }
    const persRes = await request('/api/curriculum/personalized');
    if (persRes.ok) {
      const p = await safeParseJson(persRes);
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
    return await safeParseJson(res);
  },

  async saveProgress(lessonId: string, completed: boolean, score: number, timeSpent: number) {
    const res = await request('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed, score, timeSpent })
    });
    return await safeParseJson(res);
  },

  // Vocabulary
  async getVocabulary(): Promise<VocabularyItem[]> {
    const res = await request('/api/vocabulary');
    if (!res.ok) return [];
    return await safeParseJson(res);
  },

  async saveVocabulary(item: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const res = await request('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return await safeParseJson(res);
  },

  // Curriculum Lessons Endpoint
  async getCurriculumLessons(): Promise<{ version: string; reviewStatus: string; lessons: any[] }> {
    const res = await request('/api/curriculum/lessons');
    if (!res.ok) throw new Error('Failed to load lessons');
    return await safeParseJson(res);
  },

  // Assessments
  async getAssessments(): Promise<AssessmentAttempt[]> {
    const res = await request('/api/assessments');
    if (!res.ok) return [];
    return await safeParseJson(res);
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
    const topicTitle = payload.topic_title || payload.topic || 'Spoken Practice Assessment';
    const transcribedText = payload.transcribed_text || payload.learner_speech || '';
    const voiceDuration = payload.user_voice_duration ?? payload.duration_seconds;

    const res = await request('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        topic_title: topicTitle,
        transcribed_text: transcribedText,
        user_voice_duration: voiceDuration
      })
    });
    return await safeParseJson(res);
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
    return await safeParseJson(res);
  },

  async sendChatMessage(payload: {
    message: string;
    history?: Array<{ role: 'user' | 'model'; content: string }>;
    targetLanguage?: string;
    bridgeLanguage?: string;
    proficiencyLevel?: string;
    scenarioContext?: string;
    curriculumContext?: any;
    lessonContext?: any;
  }) {
    const res = await request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await safeParseJson(res);
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
    return await safeParseJson(res);
  },

  async updatePrivacyConsents(consents: any) {
    const res = await request('/api/privacy/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consents)
    });
    return await safeParseJson(res);
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
    const result = await safeParseJson(res);
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
    return await safeParseJson(res);
  },

  async saveOnboarding(answers: any) {
    const res = await request('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await safeParseJson(res);
  },

  async generateCurriculum(answers: any) {
    const res = await request('/api/curriculum/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    return await safeParseJson(res);
  },

  async getPersonalizedCurriculum() {
    const res = await request('/api/curriculum/personalized');
    if (!res.ok) return null;
    return await safeParseJson(res);
  },

  // Missions
  async logMissionActivity(data: { missionId: string; activityType: 'speaking' | 'listening' | 'writing'; secondsSpent: number; score?: number }) {
    const res = await request('/api/missions/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeParseJson(res);
  },

  async getMissionSummary() {
    const res = await request('/api/missions/summary');
    if (!res.ok) return null;
    return await safeParseJson(res);
  },

  async getMissionsSummary() {
    return this.getMissionSummary();
  },

  async runDbMigrations(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Database migrations are managed at deploy time.' };
  }
};
