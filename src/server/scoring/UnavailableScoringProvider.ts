// Unavailable Scoring Provider
// Returns measurement_status: 'unavailable' with strictly null metrics when
// acoustic evaluation is not possible or unsupported. Never fabricates scores.

import { IScoringProvider, ScoringRequest, ScoringResult, ScoringCapabilities } from './types.ts';

export class UnavailableScoringProvider implements IScoringProvider {
  name = 'unavailable_provider';

  getCapabilities(_targetLanguage: string, _targetAccent: string): ScoringCapabilities {
    return {
      supportsPhonemes: false,
      supportsProsody: false,
      supportsFluency: false,
      supportsCompleteness: false,
      supportedLocales: []
    };
  }

  async score(request: ScoringRequest): Promise<ScoringResult> {
    return {
      provider: this.name,
      measurementStatus: 'unavailable',
      accuracy: null,
      fluency: null,
      prosody: null,
      completeness: null,
      overall: null,
      phonemes: [],
      words: [],
      feedbackTips: [
        'Acoustic pronunciation scoring is unavailable for this language/environment.',
        'Audio recording was successfully captured and saved.'
      ],
      capabilities: this.getCapabilities(request.targetLanguage, request.targetAccent)
    };
  }
}
