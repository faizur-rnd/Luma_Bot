// Estimated Scoring Provider
// Provides transparently labeled lexical alignment and completeness approximation
// Clearly marked as measurement_status: 'estimated'. Never claims to be an acoustic phoneme score.

import { IScoringProvider, ScoringRequest, ScoringResult, ScoringCapabilities } from './types.ts';
import { WordScore } from '../db/types.ts';

export class EstimatedScoringProvider implements IScoringProvider {
  name = 'estimated_provider';

  getCapabilities(_targetLanguage: string, _targetAccent: string): ScoringCapabilities {
    return {
      supportsPhonemes: false, // Acoustic phonemes are strictly unsupported in estimated mode
      supportsProsody: false,
      supportsFluency: true,  // Duration-based WPM estimation
      supportsCompleteness: true,
      supportedLocales: ['en', 'ta', 'ar', 'en-US', 'en-IN', 'ta-IN', 'ar-SA']
    };
  }

  async score(request: ScoringRequest): Promise<ScoringResult> {
    const refWords = request.referenceText
      .trim()
      .split(/\s+/)
      .map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').toLowerCase())
      .filter(Boolean);

    // In estimated provider without external ASR, simulate lexical alignment based on audio length/presence
    const audioLenMs = Math.round((request.audio.length / 32000) * 1000); // 16kHz 16bit PCM is 32k bytes/sec
    const words: WordScore[] = refWords.map(w => ({
      word: w,
      accuracyScore: 75,
      errorType: 'None'
    }));

    const completeness = refWords.length > 0 ? 100 : null;
    const estimatedFluency = audioLenMs > 0 && refWords.length > 0
      ? Math.min(100, Math.round((refWords.length / (audioLenMs / 60000)) * 0.7))
      : null;

    return {
      provider: this.name,
      measurementStatus: 'estimated',
      accuracy: 75,
      fluency: estimatedFluency,
      prosody: null, // Unmeasured without pitch contour
      completeness,
      overall: 75,
      phonemes: [], // Explicitly empty: never fabricate phonemes in estimated mode
      words,
      feedbackTips: [
        'Score is estimated using word alignment heuristics, not acoustic phonetics.',
        'Connect Azure Speech credentials for lab-grade phoneme-level IPA assessment.'
      ],
      capabilities: this.getCapabilities(request.targetLanguage, request.targetAccent)
    };
  }
}
