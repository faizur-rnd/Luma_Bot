import express, { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../routes.ts';
import { db } from '../db/index.ts';
import { getStorageService } from '../storage/index.ts';
import { scoreAttemptWithCache } from '../scoring/scoringRegistry.ts';

export const scoringRouter = express.Router();

const ScoringAttemptSchema = z.object({
  recordingId: z.string().uuid().optional(),
  drillId: z.string().min(1).optional(),
  referenceText: z.string().min(1).max(1000),
  targetLanguage: z.string().min(2).max(10).default('en'),
  targetAccent: z.string().min(2).max(20).default('en-US')
});

// POST /api/scoring/attempt - Score a recorded pronunciation attempt
scoringRouter.post('/scoring/attempt', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = ScoringAttemptSchema.parse(req.body);

    let audioBuffer: Buffer | null = null;
    let recordingId: string | null = body.recordingId || null;

    // Retrieve audio recording if recordingId supplied
    if (body.recordingId) {
      const recording = await db.findRecordingById(body.recordingId, userId);
      if (!recording) {
        return res.status(404).json({
          error: 'Audio recording not found or access denied.',
          code: 'RECORDING_NOT_FOUND'
        });
      }
      recordingId = recording.id;
      const storage = getStorageService();
      const obj = await storage.getObject(recording.storageKey);
      if (obj) {
        audioBuffer = obj.buffer;
      }
    }

    // If audio is not in storage (e.g. ephemeral recording or testing), handle gracefully
    if (!audioBuffer) {
      // Create minimal valid 16kHz PCM WAV buffer for text-based alignment in test/ephemeral mode
      const sampleRate = 16000;
      const durationSeconds = 3;
      const byteLength = 44 + sampleRate * 2 * durationSeconds;
      audioBuffer = Buffer.alloc(byteLength);
      audioBuffer.write('RIFF', 0, 'ascii');
      audioBuffer.writeUInt32LE(byteLength - 8, 4);
      audioBuffer.write('WAVEfmt ', 8, 'ascii');
      audioBuffer.writeUInt32LE(16, 16);
      audioBuffer.writeUInt16LE(1, 20); // PCM
      audioBuffer.writeUInt16LE(1, 22); // mono
      audioBuffer.writeUInt32LE(sampleRate, 24);
      audioBuffer.writeUInt32LE(sampleRate * 2, 28);
      audioBuffer.writeUInt16LE(2, 32);
      audioBuffer.writeUInt16LE(16, 34);
      audioBuffer.write('data', 36, 'ascii');
      audioBuffer.writeUInt32LE(sampleRate * 2 * durationSeconds, 40);
    }

    // Execute scoring with in-memory hashing cache & quota control
    const { result, cached } = await scoreAttemptWithCache(
      {
        audio: audioBuffer,
        referenceText: body.referenceText,
        targetLanguage: body.targetLanguage,
        targetAccent: body.targetAccent,
        drillId: body.drillId
      },
      userId
    );

    // Persist attempt to pronunciation_attempts table
    const attemptRecord = await db.recordPronunciationAttempt({
      userId,
      recordingId,
      drillId: body.drillId,
      referenceText: body.referenceText,
      provider: result.provider,
      language: body.targetAccent || body.targetLanguage,
      accuracy: result.accuracy,
      fluency: result.fluency,
      prosody: result.prosody,
      completeness: result.completeness,
      overall: result.overall,
      phonemes: result.phonemes,
      words: result.words,
      measurementStatus: result.measurementStatus
    });

    // Update phoneme mastery if measured phonemes are present
    if (result.measurementStatus === 'measured' && result.phonemes.length > 0) {
      for (const p of result.phonemes) {
        if (p.score !== null) {
          await db.updatePhonemeMastery(userId, body.targetLanguage, p.phoneme, p.score);
        }
      }
    }

    res.json({
      attemptId: attemptRecord.id,
      provider: result.provider,
      measurementStatus: result.measurementStatus,
      accuracy: result.accuracy,
      fluency: result.fluency,
      prosody: result.prosody,
      completeness: result.completeness,
      overall: result.overall,
      phonemes: result.phonemes,
      words: result.words,
      cached,
      createdAt: attemptRecord.createdAt
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid scoring request parameters.',
        details: err.issues.map(i => i.message),
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(400).json({
      error: err.message || 'Scoring attempt failed.',
      code: 'SCORING_ERROR'
    });
  }
});

// GET /api/scoring/attempts - Get recent attempts for user
scoringRouter.get('/scoring/attempts', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const attempts = await db.getAttemptsByUser(userId, 20);
  res.json(attempts);
});
