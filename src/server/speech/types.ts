// LUMA Speech Services Domain Types

export interface LocaleMapping {
  language: 'en' | 'ta' | 'ar';
  locale: string;
  dialectName: string;
  ttsVoiceName: string;
}

export interface ReferenceAudioRequest {
  text: string;
  language: string; // 'en' | 'ta' | 'ar'
  accent?: string;   // 'en-US' | 'en-IN' | 'ta-IN' | 'ar-SA' | 'ar-EG'
  voiceGender?: 'male' | 'female';
  speakingRate?: number; // 0.8 to 1.2
}

export interface ReferenceAudioResult {
  audioUrl: string;
  storageKey: string;
  cached: boolean;
  language: string;
  locale: string;
  durationMs?: number;
}

export interface ServerAsrRequest {
  audio: Buffer;
  language: string;
  locale: string;
}

export interface ServerAsrResult {
  transcript: string;
  confidence: number | null; // 0..1 or null if estimated
  language: string;
  locale: string;
  provider: string;
}
