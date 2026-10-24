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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'acoustic_phonetic',
    translationQuality: 'high',
    offlineAvailable: true,
    notes: 'Full target and bridge language. Supported by Web Speech API (en-US), Three.js Supernova Orb live reactivity, and CEFR A1-C1 curriculum.'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    role: 'both',
    textGeneration: true,
    speechRecognition: 'full',
    speechSynthesis: 'natural_tts',
    voiceActivityDetection: true,
    pronunciationEvaluation: 'acoustic_phonetic',
    translationQuality: 'high',
    offlineAvailable: true,
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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'acoustic_phonetic',
    translationQuality: 'high',
    offlineAvailable: true,
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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'lexical_comparison',
    translationQuality: 'high',
    offlineAvailable: false,
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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'lexical_comparison',
    translationQuality: 'high',
    offlineAvailable: false,
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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'acoustic_phonetic',
    translationQuality: 'high',
    offlineAvailable: true,
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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'lexical_comparison',
    translationQuality: 'high',
    offlineAvailable: true,
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
    voiceActivityDetection: true,
    pronunciationEvaluation: 'lexical_comparison',
    translationQuality: 'high',
    offlineAvailable: false,
    notes: 'Kanji, Kana, and Romaji explanations supported.'
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
    notes: 'Custom language. Relies on general LLM multilingual text processing.'
  };
}
