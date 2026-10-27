import crypto from 'crypto';
import { getPool, isDbConnected, handleDbError } from '../connection.ts';
import { memDb } from '../memoryStore.ts';
import {
  PronunciationAttemptRecord,
  DrillRecord,
  PhonemeMasteryRecord,
  MeasurementStatus,
  PhonemeScore,
  WordScore
} from '../types.ts';

export const scoringRepository = {
  async recordPronunciationAttempt(data: {
    userId: string;
    recordingId?: string | null;
    drillId?: string;
    referenceText: string;
    provider: string;
    language: string;
    accuracy: number | null;
    fluency: number | null;
    prosody: number | null;
    completeness: number | null;
    overall: number | null;
    phonemes: PhonemeScore[];
    words: WordScore[];
    measurementStatus: MeasurementStatus;
  }): Promise<PronunciationAttemptRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: PronunciationAttemptRecord = {
      id,
      ...data,
      createdAt: now
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO pronunciation_attempts (id, user_id, recording_id, drill_id, reference_text, provider, language,
            accuracy, fluency, prosody, completeness, overall, phonemes, words, measurement_status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [id, data.userId, data.recordingId || null, data.drillId || null, data.referenceText, data.provider,
           data.language, data.accuracy, data.fluency, data.prosody, data.completeness, data.overall,
           JSON.stringify(data.phonemes), JSON.stringify(data.words), data.measurementStatus, now]
        );
      } catch (e) {
        handleDbError(e, 'recordPronunciationAttempt');
      }
    }

    memDb.pronunciationAttempts.set(id, record);
    return record;
  },

  async findAttemptById(id: string, userId?: string): Promise<PronunciationAttemptRecord | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const query = userId
          ? 'SELECT * FROM pronunciation_attempts WHERE id = $1 AND user_id = $2 LIMIT 1'
          : 'SELECT * FROM pronunciation_attempts WHERE id = $1 LIMIT 1';
        const params = userId ? [id, userId] : [id];
        const res = await pool.query(query, params);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            recordingId: r.recording_id,
            drillId: r.drill_id,
            referenceText: r.reference_text,
            provider: r.provider,
            language: r.language,
            accuracy: r.accuracy,
            fluency: r.fluency,
            prosody: r.prosody,
            completeness: r.completeness,
            overall: r.overall,
            phonemes: typeof r.phonemes === 'string' ? JSON.parse(r.phonemes) : (r.phonemes || []),
            words: typeof r.words === 'string' ? JSON.parse(r.words) : (r.words || []),
            measurementStatus: r.measurement_status,
            createdAt: new Date(r.created_at).toISOString()
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'findAttemptById');
      }
    }

    const att = memDb.pronunciationAttempts.get(id);
    if (!att) return null;
    if (userId && att.userId !== userId) return null;
    return att;
  },

  async getAttemptsByUser(userId: string, limit = 20): Promise<PronunciationAttemptRecord[]> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM pronunciation_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
          [userId, limit]
        );
        return res.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          recordingId: r.recording_id,
          drillId: r.drill_id,
          referenceText: r.reference_text,
          provider: r.provider,
          language: r.language,
          accuracy: r.accuracy,
          fluency: r.fluency,
          prosody: r.prosody,
          completeness: r.completeness,
          overall: r.overall,
          phonemes: typeof r.phonemes === 'string' ? JSON.parse(r.phonemes) : (r.phonemes || []),
          words: typeof r.words === 'string' ? JSON.parse(r.words) : (r.words || []),
          measurementStatus: r.measurement_status,
          createdAt: new Date(r.created_at).toISOString()
        }));
      } catch (e) {
        handleDbError(e, 'getAttemptsByUser');
      }
    }

    const list: PronunciationAttemptRecord[] = [];
    for (const a of memDb.pronunciationAttempts.values()) {
      if (a.userId === userId) list.push(a);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },

  async upsertDrill(drill: DrillRecord): Promise<void> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO drills (id, language, l1, category, payload, level, review_status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO UPDATE SET
             payload = EXCLUDED.payload,
             level = EXCLUDED.level,
             review_status = EXCLUDED.review_status`,
          [drill.id, drill.language, drill.l1, drill.category, JSON.stringify(drill.payload), drill.level, drill.reviewStatus]
        );
      } catch (e) {
        handleDbError(e, 'upsertDrill');
      }
    }
    memDb.drills.set(drill.id, drill);
  },

  async findDrillById(id: string): Promise<DrillRecord | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query('SELECT * FROM drills WHERE id = $1 LIMIT 1', [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            language: r.language,
            l1: r.l1,
            category: r.category,
            payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
            level: r.level,
            reviewStatus: r.review_status,
            createdAt: new Date(r.created_at).toISOString()
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'findDrillById');
      }
    }
    return memDb.drills.get(id) || null;
  },

  async getDrills(language: string, l1: string, category?: string): Promise<DrillRecord[]> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const query = category
          ? 'SELECT * FROM drills WHERE language = $1 AND l1 = $2 AND category = $3'
          : 'SELECT * FROM drills WHERE language = $1 AND l1 = $2';
        const params = category ? [language, l1, category] : [language, l1];
        const res = await pool.query(query, params);
        return res.rows.map(r => ({
          id: r.id,
          language: r.language,
          l1: r.l1,
          category: r.category,
          payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
          level: r.level,
          reviewStatus: r.review_status,
          createdAt: new Date(r.created_at).toISOString()
        }));
      } catch (e) {
        handleDbError(e, 'getDrills');
      }
    }

    const list: DrillRecord[] = [];
    for (const d of memDb.drills.values()) {
      if (d.language === language && d.l1 === l1) {
        if (!category || d.category === category) list.push(d);
      }
    }
    return list;
  },

  async updatePhonemeMastery(userId: string, language: string, phoneme: string, accuracyScore: number): Promise<void> {
    const now = new Date();
    // Spaced repetition interval based on score
    const intervalDays = accuracyScore >= 80 ? 7 : accuracyScore >= 60 ? 3 : 1;
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO phoneme_mastery (user_id, language, phoneme, mastery, last_seen, next_review_at)
           VALUES ($1, $2, $3, $4, NOW(), $5)
           ON CONFLICT (user_id, language, phoneme) DO UPDATE SET
             mastery = (phoneme_mastery.mastery * 0.4 + EXCLUDED.mastery * 0.6),
             last_seen = NOW(),
             next_review_at = EXCLUDED.next_review_at`,
          [userId, language, phoneme, accuracyScore, nextReview.toISOString()]
        );
      } catch (e) {
        handleDbError(e, 'updatePhonemeMastery');
      }
    }

    if (!memDb.phonemeMastery.has(userId)) {
      memDb.phonemeMastery.set(userId, new Map());
    }
    const userMap = memDb.phonemeMastery.get(userId)!;
    const key = `${language}:${phoneme}`;
    const existing = userMap.get(key);
    const newMastery = existing ? Math.round(existing.mastery * 0.4 + accuracyScore * 0.6) : accuracyScore;
    userMap.set(key, {
      userId,
      language,
      phoneme,
      mastery: newMastery,
      lastSeen: now.toISOString(),
      nextReviewAt: nextReview.toISOString()
    });
  },

  async getPhonemeMastery(userId: string, language: string): Promise<PhonemeMasteryRecord[]> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM phoneme_mastery WHERE user_id = $1 AND language = $2 ORDER BY mastery ASC',
          [userId, language]
        );
        return res.rows.map(r => ({
          userId: r.user_id,
          language: r.language,
          phoneme: r.phoneme,
          mastery: r.mastery,
          lastSeen: new Date(r.last_seen).toISOString(),
          nextReviewAt: new Date(r.next_review_at).toISOString()
        }));
      } catch (e) {
        handleDbError(e, 'getPhonemeMastery');
      }
    }

    const userMap = memDb.phonemeMastery.get(userId);
    if (!userMap) return [];
    return Array.from(userMap.values())
      .filter(p => p.language === language)
      .sort((a, b) => a.mastery - b.mastery);
  }
};
