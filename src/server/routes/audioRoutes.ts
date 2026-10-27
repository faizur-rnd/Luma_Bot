import express, { Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../routes.ts';
import { db } from '../db/index.ts';
import { getStorageService, getLocalStorageService } from '../storage/index.ts';

export const audioRouter = express.Router();

// Rate limiter: 30 audio uploads per minute per user
const audioUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Audio upload limit reached. Maximum 30 uploads per minute.', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous'
});

// Helper: validate audio headers (WAV: RIFF/WAVE, WebM: 1A 45 DF A3)
export function validateAudioHeader(buffer: Buffer): { valid: boolean; format: 'wav' | 'webm' | 'unknown' } {
  if (buffer.length < 12) return { valid: false, format: 'unknown' };

  // WAV: 0-3 RIFF, 8-11 WAVE
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return { valid: true, format: 'wav' };
  }

  // WebM: 0-3 1A 45 DF A3
  if (
    buffer[0] === 0x1A &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xDF &&
    buffer[3] === 0xA3
  ) {
    return { valid: true, format: 'webm' };
  }

  return { valid: false, format: 'unknown' };
}

// POST /api/audio - Upload recorded audio
audioRouter.post(
  '/audio',
  requireAuth,
  audioUploadLimiter,
  express.raw({ type: ['audio/wav', 'audio/wave', 'audio/webm', 'application/octet-stream'], limit: '10mb' }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const rawBody = req.body;

      if (!rawBody || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
        return res.status(400).json({
          error: 'No audio data received or body is empty.',
          code: 'EMPTY_AUDIO'
        });
      }

      // Max size: 10MB
      if (rawBody.length > 10 * 1024 * 1024) {
        return res.status(413).json({
          error: 'Audio file exceeds 10MB limit.',
          code: 'AUDIO_TOO_LARGE'
        });
      }

      // Validate audio container format
      const headerCheck = validateAudioHeader(rawBody);
      if (!headerCheck.valid) {
        return res.status(415).json({
          error: 'Unsupported or corrupted audio format. Must be a valid WAV or WebM audio stream.',
          code: 'INVALID_AUDIO_FORMAT'
        });
      }

      const kindHeader = (req.headers['x-audio-kind'] as string) || 'drill';
      const validKinds = ['baseline', 'drill', 'conversation', 'retest'];
      const kind = validKinds.includes(kindHeader) ? (kindHeader as any) : 'drill';

      // Duration enforcement: max 90 seconds (90,000 ms)
      const durationHeader = parseInt(req.headers['x-audio-duration-ms'] as string, 10);
      const durationMs = Number.isFinite(durationHeader) && durationHeader > 0 ? durationHeader : Math.min(Math.round((rawBody.length / 32000) * 1000), 90000);

      if (durationMs > 90000) {
        return res.status(400).json({
          error: 'Audio exceeds maximum clip duration of 90 seconds.',
          code: 'DURATION_EXCEEDED'
        });
      }

      // Check user privacy consent for audio storage
      const consents = await db.getPrivacyConsents(userId);
      if (!consents.storeAudioSamples) {
        return res.status(200).json({
          success: true,
          ephemeral: true,
          recordingId: null,
          kind,
          durationMs,
          message: 'Audio received and processed in-memory. Persistent storage was omitted per privacy consent preference.'
        });
      }

      // Write to private object storage
      const storage = getStorageService();
      const fileExt = headerCheck.format === 'webm' ? 'webm' : 'wav';
      const objectId = crypto.randomUUID();
      const storageKey = `audio/${userId}/${kind}_${Date.now()}_${objectId}.${fileExt}`;

      await storage.putObject({
        key: storageKey,
        buffer: rawBody,
        contentType: headerCheck.format === 'webm' ? 'audio/webm' : 'audio/wav',
        metadata: {
          userId,
          kind,
          durationMs: String(durationMs)
        }
      });

      const recording = await db.createRecording({
        userId,
        kind,
        storageKey,
        durationMs,
        sampleRate: 16000
      });

      res.status(201).json({
        success: true,
        ephemeral: false,
        recordingId: recording.id,
        kind: recording.kind,
        durationMs: recording.durationMs,
        createdAt: recording.createdAt
      });
    } catch (err: any) {
      console.error('[Audio Upload Error]', err);
      res.status(500).json({
        error: 'Failed to process audio upload.',
        code: 'AUDIO_UPLOAD_ERROR'
      });
    }
  }
);

// GET /api/audio/:id - Get signed playback URL
audioRouter.get('/audio/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const recordingId = req.params.id;

    const recording = await db.findRecordingById(recordingId, userId);
    if (!recording) {
      return res.status(404).json({
        error: 'Recording not found or access denied.',
        code: 'RECORDING_NOT_FOUND'
      });
    }

    const storage = getStorageService();
    const playbackUrl = await storage.getSignedPlaybackUrl(recording.storageKey, 900); // 15 mins

    res.json({
      recordingId: recording.id,
      kind: recording.kind,
      durationMs: recording.durationMs,
      playbackUrl,
      expiresInSeconds: 900
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve recording.', code: 'AUDIO_RETRIEVAL_ERROR' });
  }
});

// GET /api/audio/stream - Stream local audio file with verified token
audioRouter.get('/audio/stream', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: 'Signed playback token required.' });
    }

    const localStorage = getLocalStorageService();
    const verified = localStorage.verifyPlaybackToken(token);
    if (!verified.valid || !verified.key) {
      return res.status(403).json({ error: 'Playback token has expired or is invalid.' });
    }

    const file = await localStorage.getObject(verified.key);
    if (!file) {
      return res.status(404).json({ error: 'Audio object not found.' });
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', file.buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.send(file.buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Stream playback failed.' });
  }
});

// DELETE /api/audio/:id - Delete an audio recording
audioRouter.delete('/audio/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const recordingId = req.params.id;

    const recording = await db.findRecordingById(recordingId, userId);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found.', code: 'NOT_FOUND' });
    }

    // Soft delete in database and remove object from storage
    await db.softDeleteRecording(recordingId, userId);
    const storage = getStorageService();
    await storage.deleteObject(recording.storageKey);

    res.json({ success: true, message: 'Audio recording permanently deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete audio recording.' });
  }
});
