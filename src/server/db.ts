import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SessionUser, UserSession, ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS } from './auth.ts';

// In-Memory Multi-User Store for Non-Production Development
interface InMemoryStorage {
  users: Map<string, SessionUser & { passwordHash: string; emailVerified: boolean; resetToken?: string; resetTokenExpiresAt?: number }>;
  usersByEmail: Map<string, string>; // lowercase email -> userId
  sessions: Map<string, UserSession>;
  progress: Map<string, Map<string, any>>; // userId -> (lessonId -> record)
  vocabulary: Map<string, any[]>; // userId -> vocab items
  assessments: Map<string, any[]>; // userId -> assessments
  conversations: Map<string, any[]>; // userId -> conversations
  consents: Map<string, any>; // userId -> consent
  onboarding: Map<string, any>; // userId -> onboarding
  curricula: Map<string, any>; // userId -> curriculum
  missionLogs: Map<string, any[]>; // userId -> mission logs
  auditLogs: any[];
}

const memDb: InMemoryStorage = {
  users: new Map(),
  usersByEmail: new Map(),
  sessions: new Map(),
  progress: new Map(),
  vocabulary: new Map(),
  assessments: new Map(),
  conversations: new Map(),
  consents: new Map(),
  onboarding: new Map(),
  curricula: new Map(),
  missionLogs: new Map(),
  auditLogs: []
};

let pool: Pool | null = null;
let isConnectedToLiveDb = false;
let dbErrorDetail: string | null = null;

export async function initDatabaseConnection(): Promise<{ connected: boolean; provider: string; details?: string }> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('ep-project-id.us-east-2.aws.neon.tech')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production environment.');
    }
    isConnectedToLiveDb = false;
    dbErrorDetail = 'DATABASE_URL not configured. Operating in Resilient LocalStore (Non-Production Development Mode).';
    return {
      connected: false,
      provider: 'Resilient LocalStore (Non-Production Development Mode)',
      details: dbErrorDetail
    };
  }

  try {
    if (!pool) {
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000
      });
    }

    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    isConnectedToLiveDb = true;
    dbErrorDetail = null;
    return {
      connected: true,
      provider: 'Neon Serverless PostgreSQL',
      details: `Connected to database: ${res.rows[0].db_name} at ${res.rows[0].current_time}`
    };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production database connection failure: ${err.message}`);
    }
    isConnectedToLiveDb = false;
    dbErrorDetail = err.message || 'Neon connection failed';
    return {
      connected: false,
      provider: 'Resilient LocalStore (Non-Production Development Mode - Neon Attempt Failed)',
      details: dbErrorDetail || undefined
    };
  }
}

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  if (!pool || !isConnectedToLiveDb) {
    return {
      success: true,
      message: 'Running in LocalStore mode. In-memory schema initialized.'
    };
  }

  try {
    const schemaPath = path.resolve(process.cwd(), 'src/server/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      return { success: true, message: 'PostgreSQL migrations applied successfully.' };
    }
    return { success: true, message: 'Migrations executed.' };
  } catch (err: any) {
    return { success: false, message: `Migration error: ${err.message}` };
  }
}

export const db = {
  isLive: () => isConnectedToLiveDb,
  getStatus: () => ({
    isLive: isConnectedToLiveDb,
    provider: isConnectedToLiveDb ? 'Neon Serverless PostgreSQL' : 'Resilient LocalStore (Non-Production Development Mode)',
    error: dbErrorDetail,
    hasConnectionString: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('ep-project-id'))
  }),

  // ==========================================
  // Authentication & Users
  // ==========================================
  async findUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            email: row.email,
            passwordHash: row.password_hash,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            targetLanguage: row.target_language || 'en',
            bridgeLanguage: row.bridge_language || 'ta',
            proficiencyLevel: row.proficiency_level || 'B1',
            dailyGoalMinutes: row.daily_goal_minutes || 15,
            streakCount: row.streak_count || 0,
            emailVerified: row.email_verified || false,
            resetToken: row.reset_token,
            resetTokenExpiresAt: row.reset_token_expires_at ? new Date(row.reset_token_expires_at).getTime() : undefined
          };
        }
        return null;
      } catch (e) {}
    }

    const userId = memDb.usersByEmail.get(normalized);
    if (!userId) return null;
    return memDb.users.get(userId) || null;
  },

  async findUserById(id: string): Promise<SessionUser | null> {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            targetLanguage: row.target_language || 'en',
            bridgeLanguage: row.bridge_language || 'ta',
            proficiencyLevel: row.proficiency_level || 'B1',
            dailyGoalMinutes: row.daily_goal_minutes || 15,
            streakCount: row.streak_count || 0
          };
        }
        return null;
      } catch (e) {}
    }

    const user = memDb.users.get(id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      targetLanguage: user.targetLanguage,
      bridgeLanguage: user.bridgeLanguage,
      proficiencyLevel: user.proficiencyLevel,
      dailyGoalMinutes: user.dailyGoalMinutes,
      streakCount: user.streakCount
    };
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    targetLanguage?: string;
    bridgeLanguage?: string;
  }): Promise<SessionUser> {
    const id = crypto.randomUUID();
    const normalizedEmail = data.email.trim().toLowerCase();
    const user: SessionUser = {
      id,
      email: normalizedEmail,
      displayName: data.displayName.trim(),
      targetLanguage: data.targetLanguage || 'en',
      bridgeLanguage: data.bridgeLanguage || 'ta',
      proficiencyLevel: 'A1',
      dailyGoalMinutes: 15,
      streakCount: 0
    };

    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query(
          `INSERT INTO users (id, email, password_hash, display_name, target_language, bridge_language, proficiency_level, daily_goal_minutes, streak_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           RETURNING id, email, display_name, avatar_url, target_language, bridge_language, proficiency_level, daily_goal_minutes, streak_count`,
          [id, normalizedEmail, data.passwordHash, user.displayName, user.targetLanguage, user.bridgeLanguage, user.proficiencyLevel, user.dailyGoalMinutes, user.streakCount]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          email: row.email,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          targetLanguage: row.target_language,
          bridgeLanguage: row.bridge_language,
          proficiencyLevel: row.proficiency_level,
          dailyGoalMinutes: row.daily_goal_minutes,
          streakCount: row.streak_count
        };
      } catch (e) {}
    }

    memDb.users.set(id, {
      ...user,
      passwordHash: data.passwordHash,
      emailVerified: false
    });
    memDb.usersByEmail.set(normalizedEmail, id);
    return user;
  },

  async updateUserProfile(userId: string, updates: Partial<SessionUser>) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query(
          `UPDATE users SET 
            display_name = COALESCE($1, display_name), 
            target_language = COALESCE($2, target_language), 
            bridge_language = COALESCE($3, bridge_language), 
            proficiency_level = COALESCE($4, proficiency_level),
            daily_goal_minutes = COALESCE($5, daily_goal_minutes),
            streak_count = COALESCE($6, streak_count),
            updated_at = NOW() 
           WHERE id = $7 RETURNING *`,
          [
            updates.displayName,
            updates.targetLanguage,
            updates.bridgeLanguage,
            updates.proficiencyLevel,
            updates.dailyGoalMinutes,
            updates.streakCount,
            userId
          ]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            targetLanguage: row.target_language,
            bridgeLanguage: row.bridge_language,
            proficiencyLevel: row.proficiency_level,
            dailyGoalMinutes: row.daily_goal_minutes,
            streakCount: row.streak_count
          };
        }
      } catch (e) {}
    }

    const existing = memDb.users.get(userId);
    if (!existing) throw new Error('User not found');
    const updated = {
      ...existing,
      displayName: updates.displayName ?? existing.displayName,
      targetLanguage: updates.targetLanguage ?? existing.targetLanguage,
      bridgeLanguage: updates.bridgeLanguage ?? existing.bridgeLanguage,
      proficiencyLevel: updates.proficiencyLevel ?? existing.proficiencyLevel,
      dailyGoalMinutes: updates.dailyGoalMinutes ?? existing.dailyGoalMinutes,
      streakCount: updates.streakCount ?? existing.streakCount
    };
    memDb.users.set(userId, updated);
    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      targetLanguage: updated.targetLanguage,
      bridgeLanguage: updated.bridgeLanguage,
      proficiencyLevel: updated.proficiencyLevel,
      dailyGoalMinutes: updated.dailyGoalMinutes,
      streakCount: updated.streakCount
    };
  },

  async savePasswordResetToken(userId: string, token: string, expiresAt: number) {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
          [token, new Date(expiresAt).toISOString(), userId]
        );
        return;
      } catch (e) {}
    }
    const user = memDb.users.get(userId);
    if (user) {
      user.resetToken = token;
      user.resetTokenExpiresAt = expiresAt;
    }
  },

  async resetPassword(token: string, newPasswordHash: string): Promise<boolean> {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query(
          'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE reset_token = $2 AND reset_token_expires_at > NOW() RETURNING id',
          [newPasswordHash, token]
        );
        return res.rowCount !== null && res.rowCount > 0;
      } catch (e) {}
    }

    for (const [id, user] of memDb.users.entries()) {
      if (user.resetToken === token && user.resetTokenExpiresAt && user.resetTokenExpiresAt > Date.now()) {
        user.passwordHash = newPasswordHash;
        delete user.resetToken;
        delete user.resetTokenExpiresAt;
        return true;
      }
    }
    return false;
  },

  // ==========================================
  // Session Management (Postgres / Memory)
  // ==========================================
  async createSession(userId: string, ip?: string, userAgent?: string): Promise<UserSession> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfSecret = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: UserSession = {
      id: sessionId,
      userId,
      csrfSecret,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + ABSOLUTE_TIMEOUT_MS
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO sessions (id, user_id, csrf_secret, ip_address, user_agent, created_at, last_active_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)`,
          [sessionId, userId, csrfSecret, ip || null, userAgent || null, new Date(session.expiresAt).toISOString()]
        );
        return session;
      } catch (e) {}
    }

    memDb.sessions.set(sessionId, session);
    return session;
  },

  async findSession(sessionId: string): Promise<UserSession | null> {
    const now = Date.now();
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM sessions WHERE id = $1 LIMIT 1', [sessionId]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          const expiresAt = new Date(row.expires_at).getTime();
          const lastActiveAt = new Date(row.last_active_at).getTime();

          // Check absolute and idle timeouts
          if (now > expiresAt || (now - lastActiveAt) > IDLE_TIMEOUT_MS) {
            await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
            return null;
          }
          return {
            id: row.id,
            userId: row.user_id,
            csrfSecret: row.csrf_secret,
            createdAt: new Date(row.created_at).getTime(),
            lastActiveAt,
            expiresAt
          };
        }
        return null;
      } catch (e) {}
    }

    const session = memDb.sessions.get(sessionId);
    if (!session) return null;
    if (now > session.expiresAt || (now - session.lastActiveAt) > IDLE_TIMEOUT_MS) {
      memDb.sessions.delete(sessionId);
      return null;
    }
    return session;
  },

  async touchSession(sessionId: string): Promise<void> {
    const now = Date.now();
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query('UPDATE sessions SET last_active_at = NOW() WHERE id = $1', [sessionId]);
        return;
      } catch (e) {}
    }
    const session = memDb.sessions.get(sessionId);
    if (session) {
      session.lastActiveAt = now;
    }
  },

  async destroySession(sessionId: string): Promise<void> {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
        return;
      } catch (e) {}
    }
    memDb.sessions.delete(sessionId);
  },

  async destroyAllUserSessions(userId: string): Promise<void> {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
        return;
      } catch (e) {}
    }
    for (const [id, session] of memDb.sessions.entries()) {
      if (session.userId === userId) {
        memDb.sessions.delete(id);
      }
    }
  },

  // ==========================================
  // Learning Progress (Isolated per User)
  // ==========================================
  async getProgress(userId: string): Promise<Record<string, any>> {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progressMap: Record<string, any> = {};
        res.rows.forEach(r => { progressMap[r.lesson_id] = r; });
        return progressMap;
      } catch (e) {}
    }

    const userProg = memDb.progress.get(userId);
    if (!userProg) return {};
    const result: Record<string, any> = {};
    for (const [lessonId, data] of userProg.entries()) {
      result[lessonId] = data;
    }
    return result;
  },

  async recordLessonProgress(userId: string, lessonId: string, completed: boolean, score: number, timeSpent: number) {
    const record = {
      lesson_id: lessonId,
      completed,
      score,
      time_spent_seconds: timeSpent,
      last_practiced_at: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO user_progress (user_id, lesson_id, completed, score, time_spent_seconds, last_practiced_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id, lesson_id) 
           DO UPDATE SET completed = $3, score = GREATEST(user_progress.score, $4), 
                         time_spent_seconds = user_progress.time_spent_seconds + $5,
                         last_practiced_at = NOW()`,
          [userId, lessonId, completed, score, timeSpent]
        );
        return record;
      } catch (e) {}
    }

    if (!memDb.progress.has(userId)) {
      memDb.progress.set(userId, new Map());
    }
    const userMap = memDb.progress.get(userId)!;
    const existing = userMap.get(lessonId);
    if (existing) {
      userMap.set(lessonId, {
        lesson_id: lessonId,
        completed: completed || existing.completed,
        score: Math.max(score, existing.score || 0),
        time_spent_seconds: (existing.time_spent_seconds || 0) + timeSpent,
        last_practiced_at: new Date().toISOString()
      });
    } else {
      userMap.set(lessonId, record);
    }
    return userMap.get(lessonId);
  },

  // ==========================================
  // Vocabulary Items (Isolated per User)
  // ==========================================
  async getVocabulary(userId: string) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM vocabulary_items WHERE user_id = $1 ORDER BY mastery_level ASC', [userId]);
        return res.rows;
      } catch (e) {}
    }
    return memDb.vocabulary.get(userId) || [];
  },

  async addOrUpdateVocabulary(userId: string, vocabItem: any) {
    const item = {
      id: vocabItem.id || crypto.randomUUID(),
      user_id: userId,
      language: vocabItem.language || (/[ا-ي]/.test(vocabItem.term) ? 'ar' : /[äöüßÄÖÜ]/.test(vocabItem.term) ? 'de' : 'en'),
      term: vocabItem.term,
      translation: vocabItem.translation,
      part_of_speech: vocabItem.part_of_speech || 'noun',
      phonetic: vocabItem.phonetic || '',
      context_example: vocabItem.context_example || '',
      mastery_level: vocabItem.mastery_level ?? 1,
      leitner_box: vocabItem.leitner_box ?? 1,
      next_review_at: vocabItem.next_review_at || new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO vocabulary_items (id, user_id, language, term, translation, part_of_speech, phonetic, context_example, mastery_level, leitner_box, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET 
             mastery_level = $9, leitner_box = $10, next_review_at = $11`,
          [item.id, userId, item.language, item.term, item.translation, item.part_of_speech, item.phonetic, item.context_example, item.mastery_level, item.leitner_box, item.next_review_at]
        );
        return item;
      } catch (e) {}
    }

    if (!memDb.vocabulary.has(userId)) {
      memDb.vocabulary.set(userId, []);
    }
    const list = memDb.vocabulary.get(userId)!;
    const idx = list.findIndex(v => v.id === item.id || v.term.toLowerCase() === item.term.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    return item;
  },

  // ==========================================
  // Assessments (Isolated per User)
  // ==========================================
  async getAssessments(userId: string) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
      } catch (e) {}
    }
    return memDb.assessments.get(userId) || [];
  },

  async recordAssessment(userId: string, assessmentData: any) {
    const item = {
      id: crypto.randomUUID(),
      user_id: userId,
      topic_id: assessmentData.topic_id || 'general',
      topic_title: assessmentData.topic_title || 'Spoken Practice Assessment',
      pronunciation_score: assessmentData.pronunciation_score ?? 80,
      fluency_score: assessmentData.fluency_score ?? 80,
      grammar_score: assessmentData.grammar_score ?? 80,
      lexical_score: assessmentData.lexical_score ?? 80,
      overall_score: assessmentData.overall_score ?? Math.round(
        ((assessmentData.pronunciation_score ?? 80) +
         (assessmentData.fluency_score ?? 80) +
         (assessmentData.grammar_score ?? 80) +
         (assessmentData.lexical_score ?? 80)) / 4
      ),
      coaching_feedback: assessmentData.coaching_feedback || 'Keep practicing conversational flow.',
      transcribed_text: assessmentData.transcribed_text || '',
      created_at: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO assessment_attempts (id, user_id, topic_id, topic_title, pronunciation_score, fluency_score, grammar_score, lexical_score, overall_score, coaching_feedback, transcribed_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [item.id, userId, item.topic_id, item.topic_title, item.pronunciation_score, item.fluency_score, item.grammar_score, item.lexical_score, item.overall_score, item.coaching_feedback, item.transcribed_text]
        );
        return item;
      } catch (e) {}
    }

    if (!memDb.assessments.has(userId)) {
      memDb.assessments.set(userId, []);
    }
    memDb.assessments.get(userId)!.unshift(item);
    return item;
  },

  // ==========================================
  // Conversations (Isolated per User)
  // ==========================================
  async getConversations(userId: string) {
    return memDb.conversations.get(userId) || [];
  },

  async appendMessage(userId: string, sessionId: string, message: { sender: string; content: string; translation?: string; correction?: string }) {
    if (!memDb.conversations.has(userId)) {
      memDb.conversations.set(userId, []);
    }
    const list = memDb.conversations.get(userId)!;
    let conv = list.find(c => c.id === sessionId);
    if (!conv) {
      conv = {
        id: sessionId,
        title: 'Voice Session',
        mode: 'conversation',
        started_at: new Date().toISOString(),
        messages: []
      };
      list.unshift(conv);
    }
    const newMsg = {
      id: crypto.randomUUID(),
      ...message,
      created_at: new Date().toISOString()
    };
    conv.messages.push(newMsg);
    return newMsg;
  },

  // ==========================================
  // Onboarding Profile (Isolated per User)
  // ==========================================
  async getOnboarding(userId: string) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT answers FROM onboarding_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [userId]);
        if (res.rows.length > 0) return res.rows[0].answers;
      } catch (e) {}
    }
    return memDb.onboarding.get(userId) || null;
  },

  async saveOnboarding(userId: string, answers: any) {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO onboarding_profiles (user_id, answers, updated_at)
           VALUES ($1, $2, NOW())`,
          [userId, JSON.stringify(answers)]
        );
        return answers;
      } catch (e) {}
    }
    memDb.onboarding.set(userId, answers);
    return answers;
  },

  // ==========================================
  // Personalized Curriculum (Isolated per User)
  // ==========================================
  async getPersonalizedCurriculum(userId: string) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT curriculum_data FROM personalized_curricula WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1', [userId]);
        if (res.rows.length > 0) return res.rows[0].curriculum_data;
      } catch (e) {}
    }
    return memDb.curricula.get(userId) || null;
  },

  async savePersonalizedCurriculum(userId: string, curriculum: any) {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query('UPDATE personalized_curricula SET is_active = FALSE WHERE user_id = $1', [userId]);
        await pool.query(
          `INSERT INTO personalized_curricula (user_id, curriculum_data, is_active)
           VALUES ($1, $2, TRUE)`,
          [userId, JSON.stringify(curriculum)]
        );
        return curriculum;
      } catch (e) {}
    }
    memDb.curricula.set(userId, curriculum);
    return curriculum;
  },

  // ==========================================
  // Mission Activity Logging (Isolated per User)
  // ==========================================
  async recordMissionActivity(userId: string, log: { missionId: string; activityType: 'speaking' | 'listening' | 'writing'; secondsSpent: number; score?: number }) {
    const entry = {
      id: crypto.randomUUID(),
      userId,
      missionId: log.missionId,
      activityType: log.activityType,
      secondsSpent: log.secondsSpent,
      score: log.score,
      createdAt: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO mission_activity_logs (id, user_id, mission_id, activity_type, seconds_spent, score)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [entry.id, userId, log.missionId, log.activityType, log.secondsSpent, log.score ?? null]
        );
        return entry;
      } catch (e) {}
    }

    if (!memDb.missionLogs.has(userId)) {
      memDb.missionLogs.set(userId, []);
    }
    memDb.missionLogs.get(userId)!.unshift(entry);
    return entry;
  },

  async getMissionLogs(userId: string) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM mission_activity_logs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
      } catch (e) {}
    }
    return memDb.missionLogs.get(userId) || [];
  },

  // ==========================================
  // Privacy, Consents, Export, & Purge
  // ==========================================
  async getPrivacyConsents(userId: string) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM privacy_consents WHERE user_id = $1 LIMIT 1', [userId]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {}
    }
    return memDb.consents.get(userId) || {
      store_transcripts: true,
      store_audio_samples: false,
      analytics_enabled: false,
      retention_period_days: 90,
      updated_at: new Date().toISOString()
    };
  },

  async updatePrivacyConsents(userId: string, consents: any) {
    const record = {
      user_id: userId,
      store_transcripts: consents.store_transcripts ?? true,
      store_audio_samples: consents.store_audio_samples ?? false,
      analytics_enabled: consents.analytics_enabled ?? false,
      retention_period_days: consents.retention_period_days ?? 90,
      updated_at: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO privacy_consents (user_id, store_transcripts, store_audio_samples, analytics_enabled, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id) DO UPDATE SET 
             store_transcripts = $2, store_audio_samples = $3, analytics_enabled = $4, updated_at = NOW()`,
          [userId, record.store_transcripts, record.store_audio_samples, record.analytics_enabled]
        );
        return record;
      } catch (e) {}
    }

    memDb.consents.set(userId, record);
    return record;
  },

  async exportFullUserData(userId: string) {
    const user = await this.findUserById(userId);
    const progress = await this.getProgress(userId);
    const vocabulary = await this.getVocabulary(userId);
    const assessments = await this.getAssessments(userId);
    const conversations = await this.getConversations(userId);
    const onboarding = await this.getOnboarding(userId);
    const curriculum = await this.getPersonalizedCurriculum(userId);
    const missionLogs = await this.getMissionLogs(userId);
    const consents = await this.getPrivacyConsents(userId);

    return {
      exported_at: new Date().toISOString(),
      user,
      progress,
      vocabulary,
      assessments,
      conversations,
      onboarding,
      personalized_curriculum: curriculum,
      mission_logs: missionLogs,
      privacy_consents: consents
    };
  },

  async purgeUserAccount(userId: string): Promise<{ success: boolean; message: string }> {
    if (isConnectedToLiveDb && pool) {
      try {
        // Cascade deletion through foreign keys deletes progress, vocab, sessions, etc.
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        await pool.query(
          `INSERT INTO audit_logs (action, details, created_at)
           VALUES ('USER_ACCOUNT_PURGED', $1, NOW())`,
          [JSON.stringify({ userId, timestamp: new Date().toISOString() })]
        );
        return { success: true, message: 'All user data permanently deleted from database.' };
      } catch (err: any) {
        throw new Error(`Failed to purge database records: ${err.message}`);
      }
    }

    // In-Memory deletion
    const user = memDb.users.get(userId);
    if (user) {
      memDb.usersByEmail.delete(user.email);
    }
    memDb.users.delete(userId);
    memDb.progress.delete(userId);
    memDb.vocabulary.delete(userId);
    memDb.assessments.delete(userId);
    memDb.conversations.delete(userId);
    memDb.onboarding.delete(userId);
    memDb.curricula.delete(userId);
    memDb.missionLogs.delete(userId);
    memDb.consents.delete(userId);

    for (const [sId, sess] of memDb.sessions.entries()) {
      if (sess.userId === userId) {
        memDb.sessions.delete(sId);
      }
    }

    memDb.auditLogs.push({
      action: 'USER_ACCOUNT_PURGED',
      userId,
      timestamp: new Date().toISOString()
    });

    return { success: true, message: 'All user data permanently deleted.' };
  }
};
