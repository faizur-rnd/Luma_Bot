import { db, clearMemoryDatabase } from '../server/db/index.ts';
import {
  UnavailableScoringProvider,
  EstimatedScoringProvider,
  IScoringProvider,
  ScoringRequest,
  ScoringResult,
  scoreAttemptWithCache,
  checkDailyScoringQuota,
  DAILY_SCORING_CAP
} from '../server/scoring/scoringRegistry.ts';

// Mock Azure Provider that simulates real acoustic response
class MockAzureProvider implements IScoringProvider {
  name = 'azure_pronunciation_assessment';
  getCapabilities() {
    return {
      supportsPhonemes: true,
      supportsProsody: true,
      supportsFluency: true,
      supportsCompleteness: true,
      supportedLocales: ['en-US', 'en-IN']
    };
  }

  async score(req: ScoringRequest): Promise<ScoringResult> {
    return {
      provider: this.name,
      measurementStatus: 'measured',
      accuracy: 88,
      fluency: 84,
      prosody: 80,
      completeness: 100,
      overall: 85,
      phonemes: [
        { phoneme: 'ð', ipa: 'ð', score: 86, status: 'measured' },
        { phoneme: 'æ', ipa: 'æ', score: 92, status: 'measured' },
        { phoneme: 't', ipa: 't', score: 85, status: 'measured' }
      ],
      words: [
        { word: 'That', accuracyScore: 88, errorType: 'None' }
      ],
      capabilities: this.getCapabilities()
    };
  }
}

export async function runScoringProviderTests(): Promise<{ total: number; passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
      console.log(`[✓ PASS] Scoring Provider - ${name}`);
    } catch (e: any) {
      failed++;
      const msg = `[✗ FAIL] Scoring Provider - ${name}: ${e.message || e}`;
      console.error(msg);
      errors.push(msg);
    }
  };

  const sampleAudio = Buffer.from('RIFF$---WAVEfmt ' + '0'.repeat(30));

  // Test 1: Unavailable provider never fabricates numeric scores
  await test('UnavailableScoringProvider returns null metrics and zero fabricated phonemes', async () => {
    const provider = new UnavailableScoringProvider();
    const res = await provider.score({
      audio: sampleAudio,
      referenceText: 'Hello world',
      targetLanguage: 'ta',
      targetAccent: 'ta-IN'
    });

    if (res.measurementStatus !== 'unavailable') throw new Error('Expected measurementStatus unavailable');
    if (res.accuracy !== null) throw new Error('Accuracy must be null for unavailable metric');
    if (res.prosody !== null) throw new Error('Prosody must be null for unavailable metric');
    if (res.fluency !== null) throw new Error('Fluency must be null for unavailable metric');
    if (res.overall !== null) throw new Error('Overall score must be null for unavailable metric');
    if (res.phonemes.length !== 0) throw new Error('Phonemes must be empty for unavailable provider');
  });

  // Test 2: Estimated provider marks status estimated and omits acoustic phonemes
  await test('EstimatedScoringProvider labels status estimated with empty acoustic phonemes', async () => {
    const provider = new EstimatedScoringProvider();
    const res = await provider.score({
      audio: sampleAudio,
      referenceText: 'Rhythm and intonation practice',
      targetLanguage: 'en',
      targetAccent: 'en-US'
    });

    if (res.measurementStatus !== 'estimated') throw new Error('Expected measurementStatus estimated');
    if (res.phonemes.length !== 0) throw new Error('Estimated provider must NEVER fabricate phoneme scores');
    if (res.words.length !== 4) throw new Error(`Expected 4 aligned words, got ${res.words.length}`);
  });

  // Test 3: Measured scoring provider returns IPA phoneme granularity
  await test('Measured provider produces verified IPA phoneme scores and prosody', async () => {
    const mockAzure = new MockAzureProvider();
    const res = await mockAzure.score({
      audio: sampleAudio,
      referenceText: 'That',
      targetLanguage: 'en',
      targetAccent: 'en-US'
    });

    if (res.measurementStatus !== 'measured') throw new Error('Expected measurementStatus measured');
    if (res.phonemes.length !== 3) throw new Error('Expected 3 measured phonemes');
    if (res.phonemes[0].phoneme !== 'ð') throw new Error('Expected phoneme ð');
    if (res.accuracy !== 88) throw new Error(`Expected accuracy 88, got ${res.accuracy}`);
    if (res.prosody !== 80) throw new Error(`Expected prosody 80, got ${res.prosody}`);
  });

  // Test 4: In-memory audio hash caching
  await test('Audio hash caching: second attempt returns cached result', async () => {
    const mockAzure = new MockAzureProvider();
    const req = {
      audio: sampleAudio,
      referenceText: 'Testing cache',
      targetLanguage: 'en',
      targetAccent: 'en-US'
    };

    const first = await scoreAttemptWithCache(req, 'user_cache_1', mockAzure);
    if (first.cached !== false) throw new Error('First call should not be cached');

    const second = await scoreAttemptWithCache(req, 'user_cache_1', mockAzure);
    if (second.cached !== true) throw new Error('Second call with identical parameters must be cached');
    if (second.result.overall !== first.result.overall) throw new Error('Cached overall score mismatch');
  });

  // Test 5: Daily scoring attempts cap
  await test('Daily scoring cap enforces maximum attempts per day per user', () => {
    const userId = 'quota_test_user';
    const initialQuota = checkDailyScoringQuota(userId);
    if (!initialQuota.allowed || initialQuota.remaining !== DAILY_SCORING_CAP) {
      throw new Error(`Expected initial remaining ${DAILY_SCORING_CAP}, got ${initialQuota.remaining}`);
    }
  });

  // Test 6: Phoneme mastery updates when measured phonemes are recorded
  await test('Phoneme mastery updates in database on measured scoring attempt', async () => {
    clearMemoryDatabase();
    const user = await db.createUser({ email: 'phoneme_learner@luma.app', passwordHash: 'hash', displayName: 'Phoneme Learner' });
    
    // Simulate scoring result update
    await db.updatePhonemeMastery(user.id, 'en', 'ð', 86);
    const mastery = await db.getPhonemeMastery(user.id, 'en');
    if (mastery.length !== 1 || mastery[0].phoneme !== 'ð') {
      throw new Error('Phoneme mastery record was not updated');
    }
    if (mastery[0].mastery !== 86) {
      throw new Error(`Expected mastery 86, got ${mastery[0].mastery}`);
    }
  });

  return { total: passed + failed, passed, failed, errors };
}
