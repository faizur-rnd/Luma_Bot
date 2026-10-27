import crypto from 'crypto';
import { getPool, isDbConnected, handleDbError } from '../connection.ts';
import { memDb } from '../memoryStore.ts';
import { SessionUser, UserSession, ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS } from '../../auth.ts';
import { UserRecord, PrivacyConsentsRecord } from '../types.ts';

export const userRepository = {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    const pool = getPool();
    if (isDbConnected() && pool) {
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
            nativeLanguage: row.native_language || 'ta',
            targetAccent: row.target_accent || 'en-US',
            goal: row.goal || 'conversation',
            programStartDate: row.program_start_date ? new Date(row.program_start_date).toISOString() : undefined,
            resetToken: row.reset_token,
            resetTokenExpiresAt: row.reset_token_expires_at ? new Date(row.reset_token_expires_at).getTime() : undefined
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'findUserByEmail');
      }
    }

    const userId = memDb.usersByEmail.get(normalized);
    if (!userId) return null;
    return memDb.users.get(userId) || null;
  },

  async findUserById(id: string): Promise<SessionUser | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
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
      } catch (e) {
        handleDbError(e, 'findUserById');
      }
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
    nativeLanguage?: string;
    targetAccent?: string;
    goal?: string;
  }): Promise<SessionUser> {
    const id = crypto.randomUUID();
    const normalizedEmail = data.email.trim().toLowerCase();
    const pool = getPool();

    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, display_name, target_language, bridge_language, native_language, target_accent, goal, daily_goal_minutes, streak_count, email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 15, 0, false)`,
          [
            id,
            normalizedEmail,
            data.passwordHash,
            data.displayName,
            data.targetLanguage || 'en',
            data.bridgeLanguage || 'ta',
            data.nativeLanguage || 'ta',
            data.targetAccent || 'en-US',
            data.goal || 'conversation'
          ]
        );
        // Default privacy consents
        await pool.query(
          'INSERT INTO privacy_consents (user_id, store_transcripts, store_audio_samples, analytics_enabled) VALUES ($1, true, false, false) ON CONFLICT DO NOTHING;',
          [id]
        );
      } catch (e) {
        handleDbError(e, 'createUser');
      }
    }

    const newUser: UserRecord = {
      id,
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      targetLanguage: data.targetLanguage || 'en',
      bridgeLanguage: data.bridgeLanguage || 'ta',
      nativeLanguage: data.nativeLanguage || 'ta',
      targetAccent: data.targetAccent || 'en-US',
      goal: data.goal || 'conversation',
      proficiencyLevel: 'B1',
      dailyGoalMinutes: 15,
      streakCount: 0,
      emailVerified: false
    };

    memDb.users.set(id, newUser);
    memDb.usersByEmail.set(normalizedEmail, id);
    memDb.consents.set(id, { storeTranscripts: true, storeAudioSamples: false, analyticsEnabled: false });

    return {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      targetLanguage: newUser.targetLanguage,
      bridgeLanguage: newUser.bridgeLanguage,
      proficiencyLevel: newUser.proficiencyLevel,
      dailyGoalMinutes: newUser.dailyGoalMinutes,
      streakCount: newUser.streakCount
    };
  },

  async updateUserProfile(userId: string, updates: Partial<UserRecord>): Promise<SessionUser | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.displayName !== undefined) { fields.push(`display_name = $${idx++}`); values.push(updates.displayName); }
        if (updates.avatarUrl !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(updates.avatarUrl); }
        if (updates.targetLanguage !== undefined) { fields.push(`target_language = $${idx++}`); values.push(updates.targetLanguage); }
        if (updates.bridgeLanguage !== undefined) { fields.push(`bridge_language = $${idx++}`); values.push(updates.bridgeLanguage); }
        if (updates.nativeLanguage !== undefined) { fields.push(`native_language = $${idx++}`); values.push(updates.nativeLanguage); }
        if (updates.targetAccent !== undefined) { fields.push(`target_accent = $${idx++}`); values.push(updates.targetAccent); }
        if (updates.goal !== undefined) { fields.push(`goal = $${idx++}`); values.push(updates.goal); }
        if (updates.proficiencyLevel !== undefined) { fields.push(`proficiency_level = $${idx++}`); values.push(updates.proficiencyLevel); }
        if (updates.dailyGoalMinutes !== undefined) { fields.push(`daily_goal_minutes = $${idx++}`); values.push(updates.dailyGoalMinutes); }
        if (updates.streakCount !== undefined) { fields.push(`streak_count = $${idx++}`); values.push(updates.streakCount); }

        if (fields.length > 0) {
          values.push(userId);
          await pool.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx}`, values);
        }
      } catch (e) {
        handleDbError(e, 'updateUserProfile');
      }
    }

    const memUser = memDb.users.get(userId);
    if (memUser) {
      Object.assign(memUser, updates);
      return {
        id: memUser.id,
        email: memUser.email,
        displayName: memUser.displayName,
        avatarUrl: memUser.avatarUrl,
        targetLanguage: memUser.targetLanguage,
        bridgeLanguage: memUser.bridgeLanguage,
        proficiencyLevel: memUser.proficiencyLevel,
        dailyGoalMinutes: memUser.dailyGoalMinutes,
        streakCount: memUser.streakCount
      };
    }
    return this.findUserById(userId);
  },

  async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfSecret = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: UserSession = {
      id: sessionId,
      userId,
      csrfSecret,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + IDLE_TIMEOUT_MS
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO sessions (id, user_id, csrf_secret, ip_address, user_agent, created_at, last_active_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, TO_TIMESTAMP($6 / 1000.0), TO_TIMESTAMP($7 / 1000.0), TO_TIMESTAMP($8 / 1000.0))`,
          [sessionId, userId, csrfSecret, ipAddress, userAgent, now, now, session.expiresAt]
        );
      } catch (e) {
        handleDbError(e, 'createSession');
      }
    }

    memDb.sessions.set(sessionId, session);
    return session;
  },

  async findSessionById(sessionId: string): Promise<UserSession | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query('SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW() LIMIT 1', [sessionId]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            csrfSecret: r.csrf_secret,
            createdAt: new Date(r.created_at).getTime(),
            lastActiveAt: new Date(r.last_active_at).getTime(),
            expiresAt: new Date(r.expires_at).getTime()
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'findSessionById');
      }
    }

    const sess = memDb.sessions.get(sessionId);
    if (!sess) return null;
    if (Date.now() > sess.expiresAt) {
      memDb.sessions.delete(sessionId);
      return null;
    }
    return sess;
  },

  async findSession(sessionId: string): Promise<UserSession | null> {
    return this.findSessionById(sessionId);
  },

  async savePasswordResetToken(email: string, token: string, expiresAt: number): Promise<boolean> {
    const user = await this.findUserByEmail(email);
    if (!user) return false;
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          'UPDATE users SET reset_token = $1, reset_token_expires_at = TO_TIMESTAMP($2 / 1000.0) WHERE id = $3',
          [token, expiresAt, user.id]
        );
      } catch (e) {
        handleDbError(e, 'savePasswordResetToken');
      }
    }
    const memUser = memDb.users.get(user.id);
    if (memUser) {
      memUser.resetToken = token;
      memUser.resetTokenExpiresAt = expiresAt;
    }
    return true;
  },

  async resetPassword(token: string, newPasswordHash: string): Promise<boolean> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE reset_token = $2 AND reset_token_expires_at > NOW()',
          [newPasswordHash, token]
        );
        return (res.rowCount || 0) > 0;
      } catch (e) {
        handleDbError(e, 'resetPassword');
      }
    }
    for (const u of memDb.users.values()) {
      if (u.resetToken === token && u.resetTokenExpiresAt && u.resetTokenExpiresAt > Date.now()) {
        u.passwordHash = newPasswordHash;
        u.resetToken = undefined;
        u.resetTokenExpiresAt = undefined;
        return true;
      }
    }
    return false;
  },

  async touchSession(sessionId: string): Promise<void> {
    const now = Date.now();
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          'UPDATE sessions SET last_active_at = NOW(), expires_at = TO_TIMESTAMP($1 / 1000.0) WHERE id = $2',
          [now + IDLE_TIMEOUT_MS, sessionId]
        );
      } catch (e) {
        handleDbError(e, 'touchSession');
      }
    }

    const sess = memDb.sessions.get(sessionId);
    if (sess) {
      sess.lastActiveAt = now;
      sess.expiresAt = Math.min(now + IDLE_TIMEOUT_MS, sess.createdAt + ABSOLUTE_TIMEOUT_MS);
    }
  },

  async destroySession(sessionId: string): Promise<void> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
      } catch (e) {
        handleDbError(e, 'destroySession');
      }
    }
    memDb.sessions.delete(sessionId);
  },

  async getPrivacyConsents(userId: string): Promise<PrivacyConsentsRecord> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query('SELECT * FROM privacy_consents WHERE user_id = $1 LIMIT 1', [userId]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            userId: r.user_id,
            storeTranscripts: r.store_transcripts ?? true,
            storeAudioSamples: r.store_audio_samples ?? false,
            analyticsEnabled: r.analytics_enabled ?? false,
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
          };
        }
      } catch (e) {
        handleDbError(e, 'getPrivacyConsents');
      }
    }

    const local = memDb.consents.get(userId);
    return {
      userId,
      storeTranscripts: local?.storeTranscripts ?? true,
      storeAudioSamples: local?.storeAudioSamples ?? false,
      analyticsEnabled: local?.analyticsEnabled ?? false,
      updatedAt: new Date().toISOString()
    };
  },

  async updatePrivacyConsents(userId: string, data: any): Promise<PrivacyConsentsRecord> {
    const current = await this.getPrivacyConsents(userId);
    const storeTranscripts = data.storeTranscripts ?? data.store_transcripts ?? current.storeTranscripts;
    const storeAudioSamples = data.storeAudioSamples ?? data.store_audio_samples ?? current.storeAudioSamples;
    const analyticsEnabled = data.analyticsEnabled ?? data.analytics_enabled ?? current.analyticsEnabled;
    const updated: PrivacyConsentsRecord = {
      userId,
      storeTranscripts,
      storeAudioSamples,
      analyticsEnabled,
      updatedAt: new Date().toISOString()
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO privacy_consents (user_id, store_transcripts, store_audio_samples, analytics_enabled, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id) DO UPDATE SET
             store_transcripts = EXCLUDED.store_transcripts,
             store_audio_samples = EXCLUDED.store_audio_samples,
             analytics_enabled = EXCLUDED.analytics_enabled,
             updated_at = NOW()`,
          [userId, updated.storeTranscripts, updated.storeAudioSamples, updated.analyticsEnabled]
        );
      } catch (e) {
        handleDbError(e, 'updatePrivacyConsents');
      }
    }

    memDb.consents.set(userId, updated);
    return updated;
  },

  async purgeUserAccount(userId: string): Promise<{ success: boolean; purgedRecords: number }> {
    const pool = getPool();
    let purgedCount = 0;

    if (isDbConnected() && pool) {
      try {
        // Cascade delete on user removes sessions, recordings, attempts, enrollments, checkpoints, phoneme mastery, consents, etc.
        const res = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        purgedCount += res.rowCount || 1;
      } catch (e) {
        handleDbError(e, 'purgeUserAccount');
      }
    }

    // Clear from in-memory stores
    const user = memDb.users.get(userId);
    if (user) {
      memDb.usersByEmail.delete(user.email.toLowerCase());
      memDb.users.delete(userId);
      purgedCount++;
    }

    for (const [sId, sess] of memDb.sessions.entries()) {
      if (sess.userId === userId) {
        memDb.sessions.delete(sId);
        purgedCount++;
      }
    }

    for (const [rId, rec] of memDb.audioRecordings.entries()) {
      if (rec.userId === userId) {
        memDb.audioRecordings.delete(rId);
        purgedCount++;
      }
    }

    for (const [aId, att] of memDb.pronunciationAttempts.entries()) {
      if (att.userId === userId) {
        memDb.pronunciationAttempts.delete(aId);
        purgedCount++;
      }
    }

    memDb.progress.delete(userId);
    memDb.vocabulary.delete(userId);
    memDb.assessments.delete(userId);
    memDb.conversations.delete(userId);
    memDb.consents.delete(userId);
    memDb.onboarding.delete(userId);
    memDb.curricula.delete(userId);
    memDb.missionLogs.delete(userId);
    memDb.programEnrollments.delete(userId);
    memDb.checkpoints.delete(userId);
    memDb.phonemeMastery.delete(userId);

    for (const [token, rep] of memDb.sharedReports.entries()) {
      if (rep.userId === userId) {
        memDb.sharedReports.delete(token);
        purgedCount++;
      }
    }

    return { success: true, purgedRecords: purgedCount };
  }
};
