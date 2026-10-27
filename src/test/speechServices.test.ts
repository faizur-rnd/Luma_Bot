import { resolveSpeechLocale, normalizeReferenceText, generateReferenceAudioCacheKey } from '../server/speech/localeHelper.ts';
import { referenceAudioService } from '../server/speech/referenceAudioService.ts';
import { serverAsrService } from '../server/speech/serverAsrService.ts';

export async function runSpeechServicesTests(): Promise<{ total: number; passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
      console.log(`[✓ PASS] Speech & Reference Audio - ${name}`);
    } catch (e: any) {
      failed++;
      const msg = `[✗ FAIL] Speech & Reference Audio - ${name}: ${e.message || e}`;
      console.error(msg);
      errors.push(msg);
    }
  };

  // Test 1: Locale selection & dialect mapping
  await test('Locale resolution maps English (US, IN), Tamil, and Arabic (SA, EG)', () => {
    const enUS = resolveSpeechLocale('en', 'en-US');
    if (enUS.locale !== 'en-US') throw new Error(`Expected en-US, got ${enUS.locale}`);

    const enIN = resolveSpeechLocale('en', 'en-IN');
    if (enIN.locale !== 'en-IN') throw new Error(`Expected en-IN, got ${enIN.locale}`);

    const ta = resolveSpeechLocale('ta');
    if (ta.locale !== 'ta-IN') throw new Error(`Expected ta-IN, got ${ta.locale}`);

    const arSA = resolveSpeechLocale('ar', 'ar-SA');
    if (arSA.locale !== 'ar-SA') throw new Error(`Expected ar-SA, got ${arSA.locale}`);

    const arEG = resolveSpeechLocale('ar', 'ar-EG');
    if (arEG.locale !== 'ar-EG') throw new Error(`Expected ar-EG, got ${arEG.locale}`);
  });

  // Test 2: Text normalization for caching
  await test('Text normalization strips punctuation and collapses whitespace', () => {
    const raw = '   "Think, about... that rhythm!"  \n  ';
    const normalized = normalizeReferenceText(raw);
    if (normalized !== 'think about that rhythm') {
      throw new Error(`Expected "think about that rhythm", got "${normalized}"`);
    }
  });

  // Test 3: Cache key deterministic uniqueness
  await test('Reference audio cache keys are deterministic and differentiate dialect/gender', () => {
    const key1 = generateReferenceAudioCacheKey('Think about that', 'en', 'en-US', 'male');
    const key2 = generateReferenceAudioCacheKey('think about that!', 'en', 'en-US', 'male');
    if (key1 !== key2) throw new Error('Normalized identical text must yield matching cache keys');

    const keyIndian = generateReferenceAudioCacheKey('Think about that', 'en', 'en-IN', 'male');
    if (key1 === keyIndian) throw new Error('Different locales must yield different cache keys');

    const keyFemale = generateReferenceAudioCacheKey('Think about that', 'en', 'en-US', 'female');
    if (key1 === keyFemale) throw new Error('Different genders must yield different cache keys');
  });

  // Test 4: Reference audio generation and cache hit verification
  await test('ReferenceAudioService caches generated model audio and returns cache hit on second call', async () => {
    const req = {
      text: 'Breathe smoothly through the sound.',
      language: 'en',
      accent: 'en-US',
      voiceGender: 'male' as const
    };

    const first = await referenceAudioService.getOrGenerateReferenceAudio(req);
    if (!first.audioUrl || !first.storageKey) throw new Error('First call must return audioUrl and storageKey');

    const second = await referenceAudioService.getOrGenerateReferenceAudio(req);
    if (second.cached !== true) throw new Error('Second call for model audio must be cached');
    if (second.storageKey !== first.storageKey) throw new Error('Storage key mismatch on cache hit');
  });

  // Test 5: Server ASR handles audio buffer and returns structured result
  await test('ServerAsrService returns structured result with locale metadata', async () => {
    const sampleAudio = Buffer.alloc(100);
    const result = await serverAsrService.transcribe({
      audio: sampleAudio,
      language: 'ta',
      locale: 'ta-IN'
    });

    if (result.language !== 'ta') throw new Error('Result language must be ta');
    if (result.locale !== 'ta-IN') throw new Error('Result locale must be ta-IN');
    if (!result.provider) throw new Error('Result must identify ASR provider');
  });

  return { total: passed + failed, passed, failed, errors };
}
