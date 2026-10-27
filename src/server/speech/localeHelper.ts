import crypto from 'crypto';
import { LocaleMapping } from './types.ts';

export const SUPPORTED_LOCALES: Record<string, LocaleMapping> = {
  'en-US': {
    language: 'en',
    locale: 'en-US',
    dialectName: 'General American English',
    ttsVoiceName: 'en-US-JennyNeural'
  },
  'en-IN': {
    language: 'en',
    locale: 'en-IN',
    dialectName: 'Indian English',
    ttsVoiceName: 'en-IN-NeerjaNeural'
  },
  'ta-IN': {
    language: 'ta',
    locale: 'ta-IN',
    dialectName: 'Tamil (India)',
    ttsVoiceName: 'ta-IN-PallaviNeural'
  },
  'ar-SA': {
    language: 'ar',
    locale: 'ar-SA',
    dialectName: 'Arabic (Saudi Arabia / Modern Standard)',
    ttsVoiceName: 'ar-SA-ZariyahNeural'
  },
  'ar-EG': {
    language: 'ar',
    locale: 'ar-EG',
    dialectName: 'Arabic (Egyptian)',
    ttsVoiceName: 'ar-EG-SalmaNeural'
  }
};

export function resolveSpeechLocale(language: string, accent?: string): LocaleMapping {
  const normalizedLang = language.toLowerCase();

  if (normalizedLang === 'ta') {
    return SUPPORTED_LOCALES['ta-IN'];
  }

  if (normalizedLang === 'ar') {
    if (accent && accent.toLowerCase().includes('eg')) {
      return SUPPORTED_LOCALES['ar-EG'];
    }
    return SUPPORTED_LOCALES['ar-SA'];
  }

  // English target
  if (accent && (accent.toLowerCase().includes('in') || accent === 'en-IN')) {
    return SUPPORTED_LOCALES['en-IN'];
  }

  return SUPPORTED_LOCALES['en-US'];
}

export function normalizeReferenceText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ');
}

export function generateReferenceAudioCacheKey(
  text: string,
  language: string,
  locale: string,
  gender: 'male' | 'female' = 'male',
  speed = 1.0
): string {
  const normalized = normalizeReferenceText(text);
  const hash = crypto
    .createHash('sha256')
    .update(normalized)
    .update(locale)
    .update(gender)
    .update(String(speed))
    .digest('hex')
    .slice(0, 24);

  return `ref_audio/${language}/${locale}/${gender}_${hash}.wav`;
}
