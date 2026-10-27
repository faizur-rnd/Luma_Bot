import { db, runMigrations, clearMemoryDatabase } from '../server/db/index.ts';

export async function runDatabaseMigrationTests(): Promise<{ total: number; passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
      console.log(`[✓ PASS] DB & Migration - ${name}`);
    } catch (e: any) {
      failed++;
      const msg = `[✗ FAIL] DB & Migration - ${name}: ${e.message || e}`;
      console.error(msg);
      errors.push(msg);
    }
  };

  // Test 1: Migration runner succeeds on empty or existing database
  await test('Migration runner executes successfully', async () => {
    const res = await runMigrations();
    if (!res.success) throw new Error(`Migration runner failed: ${res.message}`);
  });

  // Test 2: User creation with extended profile fields
  let testUserId = '';
  await test('Create user with native_language and target_accent', async () => {
    clearMemoryDatabase();
    const user = await db.createUser({
      email: 'speaker1@luma.app',
      passwordHash: '$argon2id$test_hash',
      displayName: 'Tamil Speaker',
      nativeLanguage: 'ta',
      targetLanguage: 'en',
      targetAccent: 'en-US',
      goal: 'client_calls'
    });
    if (!user.id) throw new Error('Expected user ID to be generated');
    testUserId = user.id;

    const fetched = await db.findUserByEmail('speaker1@luma.app');
    if (!fetched) throw new Error('User should be fetchable by email');
    if (fetched.nativeLanguage !== 'ta') throw new Error(`Expected nativeLanguage ta, got ${fetched.nativeLanguage}`);
    if (fetched.targetAccent !== 'en-US') throw new Error(`Expected targetAccent en-US, got ${fetched.targetAccent}`);
  });

  // Test 3: Audio recordings creation, user query and soft deletion
  let testRecordingId = '';
  await test('Audio recording lifecycle and user ownership', async () => {
    const rec = await db.createRecording({
      userId: testUserId,
      kind: 'baseline',
      storageKey: `audio/${testUserId}/baseline_passage.wav`,
      durationMs: 42000,
      sampleRate: 16000
    });
    if (!rec.id) throw new Error('Recording must have an ID');
    testRecordingId = rec.id;

    const userRecs = await db.getRecordingsByUser(testUserId);
    if (userRecs.length !== 1) throw new Error(`Expected 1 recording, got ${userRecs.length}`);
    if (userRecs[0].kind !== 'baseline') throw new Error(`Expected baseline recording, got ${userRecs[0].kind}`);

    // Verify non-owner cannot access
    const crossOwner = await db.findRecordingById(testRecordingId, 'different-user-uuid');
    if (crossOwner !== null) throw new Error('Cross-owner recording access must return null');
  });

  // Test 4: Pronunciation attempt persistence with valid measurement_status
  let testAttemptId = '';
  await test('Pronunciation attempt stores validated phoneme and word metrics', async () => {
    const attempt = await db.recordPronunciationAttempt({
      userId: testUserId,
      recordingId: testRecordingId,
      drillId: 'drill_ta_en_th_contrast',
      referenceText: 'Think about that rhythm.',
      provider: 'azure_pronunciation_assessment',
      language: 'en-US',
      accuracy: 86.5,
      fluency: 78.0,
      prosody: 82.0,
      completeness: 100.0,
      overall: 82.5,
      phonemes: [
        { phoneme: 'θ', ipa: 'θ', score: 84, status: 'measured' },
        { phoneme: 'ɪ', ipa: 'ɪ', score: 90, status: 'measured' },
        { phoneme: 'ŋ', ipa: 'ŋ', score: 88, status: 'measured' },
        { phoneme: 'k', ipa: 'k', score: 85, status: 'measured' }
      ],
      words: [
        { word: 'Think', accuracyScore: 86, errorType: 'None' }
      ],
      measurementStatus: 'measured'
    });

    if (!attempt.id) throw new Error('Attempt must have an ID');
    testAttemptId = attempt.id;

    const fetched = await db.findAttemptById(testAttemptId, testUserId);
    if (!fetched) throw new Error('Attempt must be fetchable');
    if (fetched.measurementStatus !== 'measured') throw new Error('Expected measurementStatus measured');
    if (fetched.phonemes.length !== 4) throw new Error('Expected 4 phoneme scores');
  });

  // Test 5: 12-Week Program Enrollment and Checkpoint
  await test('12-Week program enrollment and checkpoint tracking', async () => {
    const enroll = await db.saveProgramEnrollment(testUserId, 1, {
      theme: 'Voicing & Dental Fricatives',
      targetSounds: ['θ', 'ð', 'v', 'w'],
      sessionsPerWeek: 5
    });
    if (enroll.weekNumber !== 1) throw new Error('Expected week 1 enrollment');

    const checkpoint = await db.recordCheckpoint(testUserId, 1, 'baseline', testAttemptId, {
      overallAccuracy: 86.5,
      candidateSounds: ['θ', 'ð', 'v']
    });
    if (checkpoint.type !== 'baseline') throw new Error('Expected baseline checkpoint');

    const checkpoints = await db.getCheckpoints(testUserId);
    if (checkpoints.length !== 1) throw new Error('Expected 1 recorded checkpoint');
  });

  // Test 6: Phoneme Mastery Spaced Repetition
  await test('Phoneme mastery updates with spaced repetition interval', async () => {
    await db.updatePhonemeMastery(testUserId, 'en', 'θ', 85);
    const mastery = await db.getPhonemeMastery(testUserId, 'en');
    if (mastery.length !== 1) throw new Error('Expected 1 phoneme mastery record');
    if (mastery[0].phoneme !== 'θ') throw new Error('Expected phoneme θ');
    if (mastery[0].mastery !== 85) throw new Error(`Expected mastery 85, got ${mastery[0].mastery}`);
  });

  // Test 7: Shared Report Token Creation and Revocation
  await test('Shared report creation, resolution and revocation', async () => {
    const tokenHash = 'secure_crypto_hash_token_abc123';
    await db.createSharedReport({
      userId: testUserId,
      tokenHash,
      title: 'Baseline Assessment Report',
      reportData: { clarity: 82, week: 0 },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    const report = await db.findSharedReportByToken(tokenHash);
    if (!report) throw new Error('Report should be resolvable by token');
    if (report.title !== 'Baseline Assessment Report') throw new Error('Report title mismatch');

    const revoked = await db.revokeSharedReport(testUserId, tokenHash);
    if (!revoked) throw new Error('Revocation should return true');

    const revokedReport = await db.findSharedReportByToken(tokenHash);
    if (revokedReport !== null) throw new Error('Revoked report must not be accessible');
  });

  // Test 8: Comprehensive User Account & Data Purge
  await test('Comprehensive purge permanently removes all user-associated data', async () => {
    const purgeResult = await db.purgeUserAccount(testUserId);
    if (!purgeResult.success) throw new Error('Purge must report success');

    // Confirm user is deleted
    const userAfter = await db.findUserById(testUserId);
    if (userAfter !== null) throw new Error('User must be null after purge');

    // Confirm recordings are deleted
    const recsAfter = await db.getRecordingsByUser(testUserId);
    if (recsAfter.length !== 0) throw new Error('All recordings must be purged');

    // Confirm attempts are deleted
    const attemptsAfter = await db.getAttemptsByUser(testUserId);
    if (attemptsAfter.length !== 0) throw new Error('All attempts must be purged');

    // Confirm checkpoints are deleted
    const checkpointsAfter = await db.getCheckpoints(testUserId);
    if (checkpointsAfter.length !== 0) throw new Error('All checkpoints must be purged');

    // Confirm phoneme mastery is deleted
    const masteryAfter = await db.getPhonemeMastery(testUserId, 'en');
    if (masteryAfter.length !== 0) throw new Error('All phoneme mastery records must be purged');
  });

  return { total: passed + failed, passed, failed, errors };
}
