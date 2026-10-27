import crypto from 'crypto';
import { getPool, isDbConnected, handleDbError } from '../connection.ts';
import { memDb } from '../memoryStore.ts';
import { AudioRecordingRecord, RecordingKind } from '../types.ts';

export const audioRepository = {
  async createRecording(data: {
    userId: string;
    kind: RecordingKind;
    storageKey: string;
    durationMs: number;
    sampleRate?: number;
  }): Promise<AudioRecordingRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: AudioRecordingRecord = {
      id,
      userId: data.userId,
      kind: data.kind,
      storageKey: data.storageKey,
      durationMs: data.durationMs,
      sampleRate: data.sampleRate || 16000,
      createdAt: now,
      deletedAt: null
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO audio_recordings (id, user_id, kind, storage_key, duration_ms, sample_rate, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, data.userId, data.kind, data.storageKey, data.durationMs, record.sampleRate, now]
        );
      } catch (e) {
        handleDbError(e, 'createRecording');
      }
    }

    memDb.audioRecordings.set(id, record);
    return record;
  },

  async findRecordingById(id: string, userId?: string): Promise<AudioRecordingRecord | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const query = userId
          ? 'SELECT * FROM audio_recordings WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1'
          : 'SELECT * FROM audio_recordings WHERE id = $1 AND deleted_at IS NULL LIMIT 1';
        const params = userId ? [id, userId] : [id];
        const res = await pool.query(query, params);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            kind: r.kind,
            storageKey: r.storage_key,
            durationMs: r.duration_ms,
            sampleRate: r.sample_rate,
            createdAt: new Date(r.created_at).toISOString(),
            deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : null
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'findRecordingById');
      }
    }

    const rec = memDb.audioRecordings.get(id);
    if (!rec || rec.deletedAt) return null;
    if (userId && rec.userId !== userId) return null;
    return rec;
  },

  async softDeleteRecording(id: string, userId: string): Promise<boolean> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'UPDATE audio_recordings SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
          [id, userId]
        );
        return (res.rowCount || 0) > 0;
      } catch (e) {
        handleDbError(e, 'softDeleteRecording');
      }
    }

    const rec = memDb.audioRecordings.get(id);
    if (rec && rec.userId === userId) {
      rec.deletedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  async purgeExpiredRecordings(retentionDays = 90): Promise<AudioRecordingRecord[]> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const expiredList: AudioRecordingRecord[] = [];

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        // Find recordings that are expired and not baseline recordings
        const res = await pool.query(
          "SELECT * FROM audio_recordings WHERE created_at < $1 AND kind != 'baseline' AND deleted_at IS NULL",
          [cutoff]
        );
        for (const r of res.rows) {
          expiredList.push({
            id: r.id,
            userId: r.user_id,
            kind: r.kind,
            storageKey: r.storage_key,
            durationMs: r.duration_ms,
            sampleRate: r.sample_rate,
            createdAt: new Date(r.created_at).toISOString()
          });
        }
        await pool.query(
          "UPDATE audio_recordings SET deleted_at = NOW() WHERE created_at < $1 AND kind != 'baseline' AND deleted_at IS NULL",
          [cutoff]
        );
      } catch (e) {
        handleDbError(e, 'purgeExpiredRecordings');
      }
    }

    for (const [id, rec] of memDb.audioRecordings.entries()) {
      if (rec.createdAt < cutoff && rec.kind !== 'baseline' && !rec.deletedAt) {
        rec.deletedAt = new Date().toISOString();
        expiredList.push(rec);
      }
    }

    return expiredList;
  },

  async getRecordingsByUser(userId: string, kind?: RecordingKind): Promise<AudioRecordingRecord[]> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const query = kind
          ? 'SELECT * FROM audio_recordings WHERE user_id = $1 AND kind = $2 AND deleted_at IS NULL ORDER BY created_at DESC'
          : 'SELECT * FROM audio_recordings WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC';
        const params = kind ? [userId, kind] : [userId];
        const res = await pool.query(query, params);
        return res.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          kind: r.kind,
          storageKey: r.storage_key,
          durationMs: r.duration_ms,
          sampleRate: r.sample_rate,
          createdAt: new Date(r.created_at).toISOString(),
          deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : null
        }));
      } catch (e) {
        handleDbError(e, 'getRecordingsByUser');
      }
    }

    const list: AudioRecordingRecord[] = [];
    for (const rec of memDb.audioRecordings.values()) {
      if (rec.userId === userId && !rec.deletedAt) {
        if (!kind || rec.kind === kind) {
          list.push(rec);
        }
      }
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
};
