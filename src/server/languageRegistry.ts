// LUMA Multilingual Capability Registry
// Honest, server-controlled reporting of language capabilities across speech & AI providers

export interface LanguageCapability {
  code: string;
  name: string;
  nativeName: string;
  role: 'target' | 'bridge' | 'both';
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
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Full target and bridge language. Supported by Web Speech API (en-US), Voice Orb reactivity, and CEFR A1-C1 curriculum.'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    role: 'both',
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Full target and bridge language. Modern Standard Arabic (الفصحى) with RTL typography, Web Speech API (ar-SA), and phonological root coaching.'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    role: 'both',
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Full target and bridge language. Supported by Web Speech API (de-DE), case declension coaching (der/die/das), and conversational generative AI.'
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    role: 'bridge',
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'standard_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Comprehensive bridge language support. Explanations, translations, and pedagogical insights natively supported.'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    role: 'bridge',
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Full bridge language support with Devanagari script explanations and audio model synthesis.'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    role: 'both',
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Full target and bridge language. Supported by Web Speech API (es-ES / es-MX), CEFR A1-B2 Spanish curriculum, DELE exam preparation, and rich conversational AI.'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    role: 'bridge',
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'verified',
    notes: 'Complete bridge support for French-speaking learners.'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    role: 'bridge',
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'standard_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'high',
    offlineAvailable: false,
    status: 'experimental',
    notes: 'Experimental bridge language. Basic Kanji and Kana support.'
  }
};

export function getLanguageCapabilities(langCode: string): LanguageCapability {
  return LANGUAGE_REGISTRY[langCode] || {
    code: langCode,
    name: 'Other',
    nativeName: 'Other',
    role: 'bridge',
    textGeneration: true,
    speechRecognition: 'browser_dependent',
    speechSynthesis: 'standard_tts',
    voiceActivityDetection: false,
    pronunciationEvaluation: 'unsupported',
    translationQuality: 'moderate',
    offlineAvailable: false,
    status: 'experimental',
    notes: 'Experimental unverified language. Relies on general LLM multilingual text processing.'
  };
}
