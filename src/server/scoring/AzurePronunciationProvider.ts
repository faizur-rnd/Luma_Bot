// Azure Speech Pronunciation Assessment Provider
// Real acoustic-phonetic scoring with IPA phoneme granularity, accuracy, fluency, prosody, and completeness.

import { IScoringProvider, ScoringRequest, ScoringResult, ScoringCapabilities } from './types.ts';
import { PhonemeScore, WordScore } from '../db/types.ts';

export class AzurePronunciationProvider implements IScoringProvider {
  name = 'azure_pronunciation_assessment';
  private subscriptionKey: string;
  private region: string;

  constructor(key?: string, region?: string) {
    this.subscriptionKey = key || process.env.AZURE_SPEECH_KEY || '';
    this.region = region || process.env.AZURE_SPEECH_REGION || 'eastus';
  }

  getCapabilities(targetLanguage: string, targetAccent: string): ScoringCapabilities {
    const isEnglish = targetLanguage === 'en' || targetAccent.startsWith('en-');
    return {
      supportsPhonemes: isEnglish,
      supportsProsody: isEnglish,
      supportsFluency: true,
      supportsCompleteness: true,
      supportedLocales: ['en-US', 'en-IN', 'en-GB', 'en-AU']
    };
  }

  isConfigured(): boolean {
    return Boolean(this.subscriptionKey && this.subscriptionKey.length > 10 && !this.subscriptionKey.includes('placeholder'));
  }

  async score(request: ScoringRequest): Promise<ScoringResult> {
    if (!this.isConfigured()) {
      throw new Error('Azure Speech credentials (AZURE_SPEECH_KEY) not configured on server.');
    }

    const locale = request.targetAccent || (request.targetLanguage === 'en' ? 'en-US' : 'en-US');
    const endpoint = `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(locale)}&format=detailed`;

    const pronunciationAssessmentParams = {
      ReferenceText: request.referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: 'True',
      PhonemeAlphabet: 'IPA'
    };

    const paramHeader = Buffer.from(JSON.stringify(pronunciationAssessmentParams)).toString('base64');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': paramHeader,
        'Accept': 'application/json'
      },
      body: new Uint8Array(request.audio)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Azure Pronunciation Assessment API responded with ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!data.NBest || data.NBest.length === 0) {
      throw new Error('Azure speech assessment returned empty speech hypotheses.');
    }

    const nbest = data.NBest[0];
    const assessment = nbest.PronunciationAssessment || {};

    const words: WordScore[] = (nbest.Words || []).map((w: any) => ({
      word: w.Word,
      accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? null,
      errorType: w.PronunciationAssessment?.ErrorType || 'None',
      phonemes: (w.Phonemes || []).map((p: any) => ({
        phoneme: p.Phoneme,
        ipa: p.Phoneme,
        score: p.PronunciationAssessment?.AccuracyScore ?? null,
        status: 'measured' as const
      }))
    }));

    const phonemes: PhonemeScore[] = [];
    words.forEach(w => {
      if (w.phonemes) phonemes.push(...w.phonemes);
    });

    const accuracy = assessment.AccuracyScore ?? null;
    const fluency = assessment.FluencyScore ?? null;
    const prosody = assessment.ProsodyScore ?? null;
    const completeness = assessment.CompletenessScore ?? null;
    const overall = assessment.PronScore ?? null;

    return {
      provider: this.name,
      measurementStatus: 'measured',
      accuracy,
      fluency,
      prosody,
      completeness,
      overall,
      phonemes,
      words,
      rawTranscript: nbest.Display || nbest.Lexical,
      capabilities: this.getCapabilities(request.targetLanguage, request.targetAccent)
    };
  }
}
