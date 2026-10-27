// LUMA Multilingual Capability Registry
// Articulation & Accent Training Platform Language Configuration
// Wave 1: Tamil (ta) / Arabic (ar) L1 -> English (en) target training
// Wave 2: Tamil (ta) and Arabic (ar) target-language training behind feature flags

export interface LanguageCapability {
  code: string;
  name: string;
  nativeName: string;
  role: 'target' | 'bridge' | 'both';
  isCurrentReleaseTarget: boolean; // Wave 1 target: English (en)
  isCurrentReleaseL1: boolean;     // Wave 1 L1s: Tamil (ta), Arabic (ar), English (en)
  targetWave: 1 | 2 | null;
  l1Wave: 1 | 2 | null;
  featureFlagged: boolean;         // Non-Wave-1 languages require explicit enablement
  textGeneration: boolean;
  speechRecognition: 'full' | 'browser_dependent' | 'unsupported';
  speechSynthesis: 'natural_tts' | 'standard_tts' | 'unsupported';
  voiceActivityDetection: boolean;
  pronunciationEvaluation: 'acoustic_phonetic' | 'lexical_comparison' | 'unsupported';
  translationQuality: 'high' | 'moderate' | 'basic';
  offlineAvailable: boolean;
  status: 'verified' | 'experimental';
  notes: string;
}

export const LANGUAGE_REGISTRY: Record<string, LanguageCapability> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    role: 'both',
    isCurrentReleaseTarget: true,
    isCurrentReleaseL1: true,
    targetWave: 1,
    l1Wave: 1,
    featureFlagged: false,
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Primary Wave-1 Target Language. Accents: General American (en-US) & Indian English (en-IN). Supported by Azure Pronunciation Assessment for phoneme-level scoring.'
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    role: 'bridge',
    isCurrentReleaseTarget: false, // Target training in Wave 2
    isCurrentReleaseL1: true,      // Priority Wave 1 learner L1
    targetWave: 2,
    l1Wave: 1,
    featureFlagged: false,
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'standard_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Priority Wave-1 Learner L1 (ta-IN). Includes Tamil->English acoustic confusion maps and phonetic contrast drills. Wave-2 target training behind feature flag.'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    role: 'both',
    isCurrentReleaseTarget: false, // Target training in Wave 2
    isCurrentReleaseL1: true,      // Priority Wave 1 learner L1
    targetWave: 2,
    l1Wave: 1,
    featureFlagged: false,
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Priority Wave-1 Learner L1 (ar-SA). Modern Standard Arabic & Gulf/Egyptian mapping with Arabic->English confusion maps. Wave-2 target training behind feature flag.'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    role: 'both',
    isCurrentReleaseTarget: false,
    isCurrentReleaseL1: false,
    targetWave: null,
    l1Wave: null,
    featureFlagged: true,
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Future release candidate. Feature-flagged in current release.'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    role: 'bridge',
    isCurrentReleaseTarget: false,
    isCurrentReleaseL1: false,
    targetWave: null,
    l1Wave: null,
    featureFlagged: true,
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Future release candidate. Feature-flagged in current release.'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    role: 'both',
    isCurrentReleaseTarget: false,
    isCurrentReleaseL1: false,
    targetWave: null,
    l1Wave: null,
    featureFlagged: true,
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Future release candidate. Feature-flagged in current release.'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    role: 'bridge',
    isCurrentReleaseTarget: false,
    isCurrentReleaseL1: false,
    targetWave: null,
    l1Wave: null,
    featureFlagged: true,
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Future release candidate. Feature-flagged in current release.'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    role: 'bridge',
    isCurrentReleaseTarget: false,
    isCurrentReleaseL1: false,
    targetWave: null,
    l1Wave: null,
    featureFlagged: true,
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'standard_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'experimental',
    notes: 'Future release candidate. Feature-flagged in current release.'
  }
};

export function isSupportedWave1Target(lang: string): boolean {
  return lang === 'en';
}

export function isSupportedWave1L1(lang: string): boolean {
  return ['ta', 'ar', 'en'].includes(lang);
}

export function getActiveReleaseLanguages(): { targetLanguages: string[]; nativeLanguages: string[] } {
  return {
    targetLanguages: ['en'],
    nativeLanguages: ['ta', 'ar', 'en']
  };
}

export function getLanguageCapabilities(langCode: string): LanguageCapability {
  return LANGUAGE_REGISTRY[langCode] || {
    code: langCode,
    name: 'Other',
    nativeName: 'Other',
    role: 'bridge',
    isCurrentReleaseTarget: false,
    isCurrentReleaseL1: false,
    targetWave: null,
    l1Wave: null,
    featureFlagged: true,
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'standard_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'moderate',
    offlineAvailable: false,
    status: 'experimental',
    notes: 'Experimental unverified language. Not supported in current release.'
  };
}
