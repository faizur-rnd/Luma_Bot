import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth } from '../routes.ts';

export const checkpointRouter = Router();

const BaselineSubmissionSchema = z.object({
  passageId: z.string().default('baseline_passage_mid'),
  passageAttemptId: z.string().uuid().optional(),
  spontaneousAttemptId: z.string().uuid().optional(),
  passageText: z.string().max(2000).optional(),
  spontaneousTranscript: z.string().max(5000).optional(),
  metrics: z.object({
    passageAccuracy: z.number().min(0).max(100).nullable().optional(),
    fluencyWpm: z.number().min(0).max(500).nullable().optional(),
    phonemeScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
    targetPhonemesToPractice: z.array(z.string()).optional(),
    clarityScore: z.number().min(0).max(100).nullable().optional(),
    measurementStatus: z.enum(['measured', 'estimated', 'unavailable', 'not_measured_yet']).default('estimated')
  }).strict()
}).strict();

const RetestSubmissionSchema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  type: z.enum(['weekly', 'retest']).default('retest'),
  attemptId: z.string().uuid().optional(),
  metrics: z.record(z.string(), z.any())
}).strict();

// 1. Record Day-0 Baseline Checkpoint
checkpointRouter.post('/checkpoints/baseline', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = BaselineSubmissionSchema.parse(req.body);
    const userId = req.user!.id;

    const checkpoint = await db.recordCheckpoint(
      userId,
      0, // Week 0 = Baseline Day-0
      'baseline',
      data.passageAttemptId || null,
      {
        passageId: data.passageId,
        spontaneousAttemptId: data.spontaneousAttemptId,
        metrics: data.metrics,
        recordedAt: new Date().toISOString()
      }
    );

    // If phoneme scores were calculated, initialize phoneme mastery table
    if (data.metrics.phonemeScores) {
      for (const [ph, sc] of Object.entries(data.metrics.phonemeScores)) {
        await db.updatePhonemeMastery(userId, 'en', ph, sc);
      }
    }

    res.status(201).json({
      success: true,
      checkpointId: checkpoint.id,
      checkpoint,
      message: 'Day-0 Baseline Assessment successfully recorded'
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid baseline schema', details: err.issues });
    }
    res.status(500).json({ error: 'Failed to record baseline checkpoint' });
  }
});

// 2. Get All Checkpoints for User
checkpointRouter.get('/checkpoints', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const checkpoints = await db.getCheckpoints(userId);
    res.json({ checkpoints });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load checkpoints' });
  }
});

// 3. Record Retest Checkpoint (Weeks 4, 8, 12)
checkpointRouter.post('/checkpoints/retest', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = RetestSubmissionSchema.parse(req.body);
    const userId = req.user!.id;

    const checkpoint = await db.recordCheckpoint(
      userId,
      data.weekNumber,
      data.type,
      data.attemptId || null,
      {
        ...data.metrics,
        recordedAt: new Date().toISOString()
      }
    );

    res.status(201).json({
      success: true,
      checkpointId: checkpoint.id,
      checkpoint
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid retest data', details: err.issues });
    }
    res.status(500).json({ error: 'Failed to record retest' });
  }
});

// 4. Get Phoneme Mastery Table
checkpointRouter.get('/checkpoints/phonemes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const lang = (req.query.language as string) || 'en';
    const masteryList = await db.getPhonemeMastery(userId, lang);
    res.json({ phonemes: masteryList });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get phoneme mastery' });
  }
});
