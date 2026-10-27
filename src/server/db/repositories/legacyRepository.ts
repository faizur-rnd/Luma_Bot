import crypto from 'crypto';
import { getPool, isDbConnected, handleDbError } from '../connection.ts';
import { memDb } from '../memoryStore.ts';
import { OnboardingAnswers } from '../../curriculumGenerator.ts';

export const legacyRepository = {
  async getProgress(userId: string) {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const map: Record<string, any> = {};
        for (const row of res.rows) {
          map[row.lesson_id] = {
            lessonId: row.lesson_id,
            completed: row.completed,
            score: row.score,
            timeSpentSeconds: row.time_spent_seconds,
            lastPracticedAt: row.last_practiced_at
          };
        }
        return map;
      } catch (e) {
        handleDbError(e, 'getProgress');
      }
    }
    const userMap = memDb.progress.get(userId);
    if (!userMap) return {};
    const obj: Record<string, any> = {};
    for (const [k, v] of userMap.entries()) obj[k] = v;
    return obj;
  },

  async updateProgress(userId: string, lessonId: string, data: { completed?: boolean; score?: number; timeSpentSeconds?: number }) {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO user_progress (user_id, lesson_id, completed, score, time_spent_seconds, last_practiced_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id, lesson_id) DO UPDATE SET
             completed = COALESCE(EXCLUDED.completed, user_progress.completed),
             score = GREATEST(user_progress.score, EXCLUDED.score),
             time_spent_seconds = user_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
             last_practiced_at = NOW()`,
          [userId, lessonId, data.completed ?? false, data.score ?? 0, data.timeSpentSeconds ?? 0]
        );
      } catch (e) {
        handleDbError(e, 'updateProgress');
      }
    }
    if (!memDb.progress.has(userId)) memDb.progress.set(userId, new Map());
    const userMap = memDb.progress.get(userId)!;
    const current = userMap.get(lessonId) || { completed: false, score: 0, timeSpentSeconds: 0 };
    userMap.set(lessonId, {
      lessonId,
      completed: data.completed !== undefined ? data.completed : current.completed,
      score: Math.max(current.score, data.score || 0),
      timeSpentSeconds: current.timeSpentSeconds + (data.timeSpentSeconds || 0),
      lastPracticedAt: new Date().toISOString()
    });
  },

  async recordLessonProgress(userId: string, lessonId: string, completed?: boolean, score?: number, timeSpentSeconds?: number) {
    return this.updateProgress(userId, lessonId, { completed, score, timeSpentSeconds });
  },

  async getVocabulary(userId: string) {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query('SELECT * FROM vocabulary_items WHERE user_id = $1 ORDER BY next_review_at ASC', [userId]);
        return res.rows.map(r => ({
          id: r.id,
          language: r.language,
          term: r.term,
          translation: r.translation,
          part_of_speech: r.part_of_speech,
          context_example: r.context_example,
          phonetic: r.phonetic,
          mastery_level: r.mastery_level,
          leitner_box: r.leitner_box,
          next_review_at: r.next_review_at
        }));
      } catch (e) {
        handleDbError(e, 'getVocabulary');
      }
    }
    return memDb.vocabulary.get(userId) || [];
  },

  async addVocabulary(userId: string, item: any) {
    const id = crypto.randomUUID();
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO vocabulary_items (id, user_id, language, term, translation, part_of_speech, context_example, phonetic, mastery_level, leitner_box, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1, NOW())`,
          [id, userId, item.language || 'en', item.term, item.translation, item.partOfSpeech || 'word', item.contextExample || '', item.phonetic || '']
        );
      } catch (e) {
        handleDbError(e, 'addVocabulary');
      }
    }
    const entry = { id, userId, ...item, mastery_level: 1, leitner_box: 1, next_review_at: new Date().toISOString() };
    if (!memDb.vocabulary.has(userId)) memDb.vocabulary.set(userId, []);
    memDb.vocabulary.get(userId)!.push(entry);
    return entry;
  },

  async addOrUpdateVocabulary(userId: string, item: any) {
    return this.addVocabulary(userId, item);
  },

  async recordAssessment(userId: string, assessment: any) {
    const id = crypto.randomUUID();
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO assessment_attempts (id, user_id, topic_id, topic_title, pronunciation_score, fluency_score, grammar_score, lexical_score, overall_score, coaching_feedback, transcribed_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [id, userId, assessment.topic_id, assessment.topic_title, assessment.pronunciation_score, assessment.fluency_score, assessment.grammar_score, assessment.lexical_score, assessment.overall_score, assessment.coaching_feedback, assessment.transcribed_text]
        );
      } catch (e) {
        handleDbError(e, 'recordAssessment');
      }
    }
    const entry = { id, userId, ...assessment, created_at: new Date().toISOString() };
    if (!memDb.assessments.has(userId)) memDb.assessments.set(userId, []);
    memDb.assessments.get(userId)!.push(entry);
    return entry;
  },

  async getAssessments(userId: string) {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query('SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
      } catch (e) {
        handleDbError(e, 'getAssessments');
      }
    }
    return memDb.assessments.get(userId) || [];
  },

  async appendMessage(userId: string, sessionId: string, message: { sender: string; content: string; translation?: string; correction?: string }) {
    const id = crypto.randomUUID();
    const entry = { id, ...message, created_at: new Date().toISOString() };
    if (!memDb.conversations.has(userId)) memDb.conversations.set(userId, []);
    memDb.conversations.get(userId)!.push(entry);
    return entry;
  },

  async getMessages(userId: string) {
    return memDb.conversations.get(userId) || [];
  },

  async saveOnboarding(userId: string, answers: any) {
    memDb.onboarding.set(userId, answers);
    return answers;
  },

  async getOnboarding(userId: string) {
    return memDb.onboarding.get(userId) || null;
  },

  async savePersonalizedCurriculum(userId: string, curriculum: any) {
    memDb.curricula.set(userId, curriculum);
    return curriculum;
  },

  async getPersonalizedCurriculum(userId: string) {
    return memDb.curricula.get(userId) || null;
  },

  async recordMissionActivity(userId: string, log: any) {
    const id = crypto.randomUUID();
    const entry = { id, userId, ...log, createdAt: new Date().toISOString() };
    if (!memDb.missionLogs.has(userId)) memDb.missionLogs.set(userId, []);
    memDb.missionLogs.get(userId)!.push(entry);
    return entry;
  },

  async getMissionLogs(userId: string) {
    return memDb.missionLogs.get(userId) || [];
  },

  async exportFullUserData(userId: string) {
    return {
      userId,
      exportedAt: new Date().toISOString(),
      user: memDb.users.get(userId) || null,
      consents: memDb.consents.get(userId) || null,
      onboarding: memDb.onboarding.get(userId) || null,
      enrollments: Array.from(memDb.programEnrollments.get(userId)?.values() || []),
      checkpoints: memDb.checkpoints.get(userId) || [],
      phonemeMastery: Array.from(memDb.phonemeMastery.get(userId)?.values() || []),
      recordings: Array.from(memDb.audioRecordings.values()).filter(r => r.userId === userId),
      attempts: Array.from(memDb.pronunciationAttempts.values()).filter(a => a.userId === userId),
      vocabulary: memDb.vocabulary.get(userId) || [],
      assessments: memDb.assessments.get(userId) || []
    };
  }
};
