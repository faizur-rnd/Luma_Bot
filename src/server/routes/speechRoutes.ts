import express, { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../routes.ts';
import { referenceAudioService } from '../speech/referenceAudioService.ts';
import { serverAsrService } from '../speech/serverAsrService.ts';

export const speechRouter = express.Router();

const ReferenceAudioSchema = z.object({
  text: z.string().min(1).max(500),
  language: z.string().default('en'),
  accent: z.string().optional(),
  voiceGender: z.enum(['male', 'female']).default('male'),
  speakingRate: z.number().min(0.5).max(1.5).default(1.0)
});

// POST /api/speech/reference - Model reference audio endpoint with private storage caching
speechRouter.post('/speech/reference', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = ReferenceAudioSchema.parse(req.body);
    const result = await referenceAudioService.getOrGenerateReferenceAudio(data);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid reference audio request.', details: err.issues.map(i => i.message) });
    }
    res.status(500).json({ error: 'Failed to generate reference model audio.' });
  }
});

// POST /api/speech/transcribe - Server-side ASR fallback
speechRouter.post(
  '/speech/transcribe',
  requireAuth,
  express.raw({ type: ['audio/wav', 'audio/webm', 'application/octet-stream'], limit: '10mb' }),
  async (req: Request, res: Response) => {
    try {
      const rawAudio = req.body;
      if (!rawAudio || !Buffer.isBuffer(rawAudio) || rawAudio.length === 0) {
        return res.status(400).json({ error: 'No audio data received.' });
      }

      const language = (req.headers['x-language'] as string) || 'en';
      const locale = (req.headers['x-locale'] as string) || (language === 'ta' ? 'ta-IN' : language === 'ar' ? 'ar-SA' : 'en-US');

      const result = await serverAsrService.transcribe({
        audio: rawAudio,
        language,
        locale
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Server transcription failed.' });
    }
  }
);
