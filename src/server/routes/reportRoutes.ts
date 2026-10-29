import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth } from '../routes.ts';

export const reportRouter = Router();

const ShareReportSchema = z.object({
  title: z.string().min(1).max(100).default('LUMA 12-Week Speech Progress Report'),
  daysValid: z.number().int().min(1).max(90).default(30)
}).strict();

const RevokeReportSchema = z.object({
  tokenHash: z.string().min(10).max(128)
}).strict();

// 1. Get Before-and-After Comparison (Day-0 vs Week-12)
reportRouter.get('/reports/comparison', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const checkpoints = await db.getCheckpoints(userId);

    const baseline = checkpoints.find(c => c.type === 'baseline' || c.weekNumber === 0);
    const retests = checkpoints.filter(c => c.type === 'retest').sort((a, b) => b.weekNumber - a.weekNumber);
    const latestRetest = retests[0] || null;

    const phonemeMastery = await db.getPhonemeMastery(userId, 'en');

    const baseMetrics = baseline?.metrics?.metrics || baseline?.metrics || {};
    const retestMetrics = latestRetest?.metrics || {};

    const baseAccuracy = baseMetrics.passageAccuracy ?? baseMetrics.clarityScore ?? null;
    const retestAccuracy = retestMetrics.passageAccuracy ?? retestMetrics.clarityScore ?? null;

    const accuracyDelta = (baseAccuracy !== null && retestAccuracy !== null)
      ? Math.round(retestAccuracy - baseAccuracy)
      : null;

    res.json({
      baseline: {
        recordedAt: baseline?.createdAt || null,
        metrics: baseMetrics,
        status: baseAccuracy !== null ? 'Measured' : 'Not measured yet'
      },
      latestRetest: {
        weekNumber: latestRetest?.weekNumber || null,
        recordedAt: latestRetest?.createdAt || null,
        metrics: retestMetrics,
        status: retestAccuracy !== null ? 'Measured' : 'Not measured yet'
      },
      comparison: {
        accuracyDelta,
        phonemeCountMastered: phonemeMastery.filter(p => p.mastery >= 75).length,
        totalPhonemesTracked: phonemeMastery.length,
        status: accuracyDelta !== null ? 'Measured' : 'Not available'
      },
      phonemeMastery
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate comparison report' });
  }
});

// 2. Create Expiring, Revocable Shareable Report Link
reportRouter.post('/reports/share', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = ShareReportSchema.parse(req.body);
    const userId = req.user!.id;

    // Fetch progress data to snapshot
    const checkpoints = await db.getCheckpoints(userId);
    const baseline = checkpoints.find(c => c.type === 'baseline' || c.weekNumber === 0);
    const retests = checkpoints.filter(c => c.type === 'retest').sort((a, b) => b.weekNumber - a.weekNumber);
    const phonemeMastery = await db.getPhonemeMastery(userId, 'en');

    // Create random unguessable token and cryptographic hash
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + data.daysValid * 24 * 60 * 60 * 1000).toISOString();

    // Snapshot payload - strictly stripped of email, name, user ID, internal secrets
    const reportSnapshot = {
      title: data.title,
      nativeLanguage: req.user?.bridgeLanguage || 'ta',
      targetAccent: 'en-US',
      baseline: baseline ? {
        weekNumber: 0,
        recordedAt: baseline.createdAt,
        metrics: baseline.metrics
      } : null,
      latestRetest: retests[0] ? {
        weekNumber: retests[0].weekNumber,
        recordedAt: retests[0].createdAt,
        metrics: retests[0].metrics
      } : null,
      phonemeMastery: phonemeMastery.map(p => ({
        phoneme: p.phoneme,
        mastery: p.mastery
      }))
    };

    const record = await db.createSharedReport({
      userId,
      tokenHash,
      title: data.title,
      reportData: reportSnapshot,
      expiresAt
    });

    res.status(201).json({
      success: true,
      shareToken: rawToken,
      tokenHash,
      shareUrl: `/shared-report/${rawToken}`,
      expiresAt: record.expiresAt
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid share parameters', details: err.issues });
    }
    res.status(500).json({ error: 'Failed to create shared report' });
  }
});

// 3. View Public Shared Report (Public, No Auth, Zero Email Exposure)
reportRouter.get('/reports/shared/:token', async (req: Request, res: Response) => {
  try {
    const rawToken = req.params.token;
    if (!rawToken || rawToken.length < 16) {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const report = await db.findSharedReportByToken(tokenHash);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found, expired, or access was revoked by the learner.',
        code: 'REPORT_NOT_FOUND_OR_EXPIRED'
      });
    }

    res.json({
      valid: true,
      title: report.title,
      reportData: report.reportData,
      expiresAt: report.expiresAt
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve shared report' });
  }
});

// 4. Revoke Shared Report Link
reportRouter.post('/reports/revoke', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = RevokeReportSchema.parse(req.body);
    const userId = req.user!.id;

    const revoked = await db.revokeSharedReport(userId, data.tokenHash);
    if (!revoked) {
      return res.status(404).json({ error: 'Shared report not found or already revoked' });
    }

    res.json({ success: true, message: 'Share link successfully revoked' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid token hash' });
    }
    res.status(500).json({ error: 'Failed to revoke report' });
  }
});
