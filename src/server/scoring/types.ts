// LUMA Pronunciation Scoring Provider Domain Types

import { MeasurementStatus, PhonemeScore, WordScore } from '../db/types.ts';

export interface ScoringRequest {
  audio: Buffer;
  referenceText: string;
  targetLanguage: string; // e.g. 'en', 'ta', 'ar'
  targetAccent: string;   // e.g. 'en-US', 'en-IN', 'ar-SA'
  drillId?: string;
  kind?: string;
}

export interface ScoringCapabilities {
  supportsPhonemes: boolean;
  supportsProsody: boolean;
  supportsFluency: boolean;
  supportsCompleteness: boolean;
  supportedLocales: string[];
}

export interface ScoringResult {
  provider: string;
  measurementStatus: MeasurementStatus;
  accuracy: number | null;
  fluency: number | null;
  prosody: number | null;
  completeness: number | null;
  overall: number | null;
  phonemes: PhonemeScore[];
  words: WordScore[];
  rawTranscript?: string;
  feedbackTips?: string[];
  capabilities: ScoringCapabilities;
}

export interface IScoringProvider {
  name: string;
  getCapabilities(targetLanguage: string, targetAccent: string): ScoringCapabilities;
  score(request: ScoringRequest): Promise<ScoringResult>;
}
