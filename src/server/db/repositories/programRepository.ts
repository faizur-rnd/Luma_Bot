import crypto from 'crypto';
import { getPool, isDbConnected, handleDbError } from '../connection.ts';
import { memDb } from '../memoryStore.ts';
import {
  ProgramEnrollmentRecord,
  CheckpointRecord,
  SharedReportRecord,
  EnrollmentStatus,
  CheckpointType
} from '../types.ts';

export const programRepository = {
  async saveProgramEnrollment(
    userId: string,
    weekNumber: number,
    plan: Record<string, any>,
    status: EnrollmentStatus = 'active'
  ): Promise<ProgramEnrollmentRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: ProgramEnrollmentRecord = {
      id,
      userId,
      weekNumber,
      plan,
      status,
      createdAt: now,
      updatedAt: now
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO program_enrollments (id, user_id, week_number, plan, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (user_id, week_number) DO UPDATE SET
             plan = EXCLUDED.plan,
             status = EXCLUDED.status,
             updated_at = NOW()`,
          [id, userId, weekNumber, JSON.stringify(plan), status]
        );
      } catch (e) {
        handleDbError(e, 'saveProgramEnrollment');
      }
    }

    if (!memDb.programEnrollments.has(userId)) {
      memDb.programEnrollments.set(userId, new Map());
    }
    memDb.programEnrollments.get(userId)!.set(weekNumber, record);
    return record;
  },

  async getProgramEnrollment(userId: string, weekNumber: number): Promise<ProgramEnrollmentRecord | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM program_enrollments WHERE user_id = $1 AND week_number = $2 LIMIT 1',
          [userId, weekNumber]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            weekNumber: r.week_number,
            plan: typeof r.plan === 'string' ? JSON.parse(r.plan) : r.plan,
            status: r.status,
            createdAt: new Date(r.created_at).toISOString(),
            updatedAt: new Date(r.updated_at).toISOString()
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'getProgramEnrollment');
      }
    }

    return memDb.programEnrollments.get(userId)?.get(weekNumber) || null;
  },

  async getAllProgramEnrollments(userId: string): Promise<ProgramEnrollmentRecord[]> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM program_enrollments WHERE user_id = $1 ORDER BY week_number ASC',
          [userId]
        );
        return res.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          weekNumber: r.week_number,
          plan: typeof r.plan === 'string' ? JSON.parse(r.plan) : r.plan,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
          updatedAt: new Date(r.updated_at).toISOString()
        }));
      } catch (e) {
        handleDbError(e, 'getAllProgramEnrollments');
      }
    }

    const userMap = memDb.programEnrollments.get(userId);
    if (!userMap) return [];
    return Array.from(userMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
  },

  async recordCheckpoint(
    userId: string,
    weekNumber: number,
    type: CheckpointType,
    attemptId: string | null,
    metrics: Record<string, any>
  ): Promise<CheckpointRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: CheckpointRecord = {
      id,
      userId,
      weekNumber,
      type,
      attemptId,
      metrics,
      createdAt: now
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO checkpoints (id, user_id, week_number, type, attempt_id, metrics, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [id, userId, weekNumber, type, attemptId, JSON.stringify(metrics)]
        );
      } catch (e) {
        handleDbError(e, 'recordCheckpoint');
      }
    }

    if (!memDb.checkpoints.has(userId)) {
      memDb.checkpoints.set(userId, []);
    }
    memDb.checkpoints.get(userId)!.push(record);
    return record;
  },

  async getCheckpoints(userId: string): Promise<CheckpointRecord[]> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM checkpoints WHERE user_id = $1 ORDER BY week_number ASC, created_at ASC',
          [userId]
        );
        return res.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          weekNumber: r.week_number,
          type: r.type,
          attemptId: r.attempt_id,
          metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics,
          createdAt: new Date(r.created_at).toISOString()
        }));
      } catch (e) {
        handleDbError(e, 'getCheckpoints');
      }
    }

    return (memDb.checkpoints.get(userId) || []).slice().sort((a, b) => a.weekNumber - b.weekNumber);
  },

  async createSharedReport(data: {
    userId: string;
    tokenHash: string;
    title: string;
    reportData: Record<string, any>;
    expiresAt: string;
  }): Promise<SharedReportRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: SharedReportRecord = {
      id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      title: data.title,
      reportData: data.reportData,
      expiresAt: data.expiresAt,
      revokedAt: null,
      createdAt: now
    };

    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        await pool.query(
          `INSERT INTO shared_reports (id, user_id, token_hash, title, report_data, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [id, data.userId, data.tokenHash, data.title, JSON.stringify(data.reportData), data.expiresAt]
        );
      } catch (e) {
        handleDbError(e, 'createSharedReport');
      }
    }

    memDb.sharedReports.set(data.tokenHash, record);
    return record;
  },

  async findSharedReportByToken(tokenHash: string): Promise<SharedReportRecord | null> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM shared_reports WHERE token_hash = $1 AND expires_at > NOW() AND revoked_at IS NULL LIMIT 1',
          [tokenHash]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            userId: r.user_id,
            tokenHash: r.token_hash,
            title: r.title,
            reportData: typeof r.report_data === 'string' ? JSON.parse(r.report_data) : r.report_data,
            expiresAt: new Date(r.expires_at).toISOString(),
            revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : null,
            createdAt: new Date(r.created_at).toISOString()
          };
        }
        return null;
      } catch (e) {
        handleDbError(e, 'findSharedReportByToken');
      }
    }

    const rec = memDb.sharedReports.get(tokenHash);
    if (!rec || rec.revokedAt) return null;
    if (new Date() > new Date(rec.expiresAt)) return null;
    return rec;
  },

  async revokeSharedReport(userId: string, tokenHash: string): Promise<boolean> {
    const pool = getPool();
    if (isDbConnected() && pool) {
      try {
        const res = await pool.query(
          'UPDATE shared_reports SET revoked_at = NOW() WHERE token_hash = $1 AND user_id = $2',
          [tokenHash, userId]
        );
        return (res.rowCount || 0) > 0;
      } catch (e) {
        handleDbError(e, 'revokeSharedReport');
      }
    }

    const rec = memDb.sharedReports.get(tokenHash);
    if (rec && rec.userId === userId) {
      rec.revokedAt = new Date().toISOString();
      return true;
    }
    return false;
  }
};
