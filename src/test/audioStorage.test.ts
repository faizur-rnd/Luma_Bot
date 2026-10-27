import { db, clearMemoryDatabase } from '../server/db/index.ts';
import { validateAudioHeader } from '../server/routes/audioRoutes.ts';
import { getLocalStorageService, executeAudioRetentionCleanup, purgeUserStorage } from '../server/storage/index.ts';

export async function runAudioStorageTests(): Promise<{ total: number; passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
      console.log(`[✓ PASS] Audio & Storage - ${name}`);
    } catch (e: any) {
      failed++;
      const msg = `[✗ FAIL] Audio & Storage - ${name}: ${e.message || e}`;
      console.error(msg);
      errors.push(msg);
    }
  };

  // Test 1: Audio header validation
  await test('Audio container header validation (WAV, WebM, invalid)', () => {
    // Valid WAV header (RIFF .... WAVE)
    const wavBuffer = Buffer.alloc(44);
    wavBuffer.write('RIFF', 0, 'ascii');
    wavBuffer.write('WAVE', 8, 'ascii');
    const wavCheck = validateAudioHeader(wavBuffer);
    if (!wavCheck.valid || wavCheck.format !== 'wav') throw new Error('Failed to validate valid WAV header');

    // Valid WebM header (1A 45 DF A3)
    const webmBuffer = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81]);
    const webmCheck = validateAudioHeader(webmBuffer);
    if (!webmCheck.valid || webmCheck.format !== 'webm') throw new Error('Failed to validate valid WebM header');

    // Corrupted / invalid media header
    const corruptBuffer = Buffer.from('NOT_A_VALID_AUDIO_CONTAINER_STREAM');
    const corruptCheck = validateAudioHeader(corruptBuffer);
    if (corruptCheck.valid) throw new Error('Corrupted audio header must be rejected');
  });

  // Test 2: Local storage put, get, signed URL, and token validation
  const storage = getLocalStorageService();
  const testKey = 'audio/test_user/drill_sample.wav';
  const sampleAudio = Buffer.from('RIFF$---WAVEfmt ' + '0'.repeat(30));

  await test('Storage put, get, and signed token playback verification', async () => {
    await storage.putObject({
      key: testKey,
      buffer: sampleAudio,
      contentType: 'audio/wav'
    });

    const hasObj = await storage.hasObject(testKey);
    if (!hasObj) throw new Error('Storage should report object exists');

    const retrieved = await storage.getObject(testKey);
    if (!retrieved || retrieved.buffer.length !== sampleAudio.length) {
      throw new Error('Retrieved audio buffer does not match stored content');
    }

    const signedUrl = await storage.getSignedPlaybackUrl(testKey, 60);
    const tokenMatch = signedUrl.match(/token=([^&]+)/);
    if (!tokenMatch) throw new Error('Signed URL must contain playback token');

    const token = tokenMatch[1];
    const verified = storage.verifyPlaybackToken(token);
    if (!verified.valid || verified.key !== testKey) {
      throw new Error('Valid playback token must verify correctly');
    }

    // Tampered token check
    const tampered = token.slice(0, -4) + 'AAAA';
    const tamperedCheck = storage.verifyPlaybackToken(tampered);
    if (tamperedCheck.valid) throw new Error('Tampered token must be rejected');
  });

  // Test 3: Audio storage consent enforcement
  await test('Audio storage consent: consent=false forbids persistent retention', async () => {
    clearMemoryDatabase();
    const user = await db.createUser({
      email: 'privacy_user@luma.app',
      passwordHash: '$argon2id$priv_hash',
      displayName: 'Privacy Learner'
    });

    // Default consent has storeAudioSamples = false
    const consents = await db.getPrivacyConsents(user.id);
    if (consents.storeAudioSamples !== false) {
      throw new Error('storeAudioSamples must default to false');
    }

    // Recordings for this user must be empty
    const userRecs = await db.getRecordingsByUser(user.id);
    if (userRecs.length !== 0) throw new Error('No recordings should exist when consent is off');
  });

  // Test 4: Ownership enforcement for recordings
  await test('Ownership check: User A cannot access User B audio recordings', async () => {
    const userA = await db.createUser({ email: 'user_a@luma.app', passwordHash: 'hash', displayName: 'User A' });
    const userB = await db.createUser({ email: 'user_b@luma.app', passwordHash: 'hash', displayName: 'User B' });

    const recA = await db.createRecording({
      userId: userA.id,
      kind: 'drill',
      storageKey: `audio/${userA.id}/drill_1.wav`,
      durationMs: 5000
    });

    const ownAccess = await db.findRecordingById(recA.id, userA.id);
    if (!ownAccess) throw new Error('User A must be able to access own recording');

    const crossAccess = await db.findRecordingById(recA.id, userB.id);
    if (crossAccess !== null) throw new Error('User B must NOT be able to access User A recording');
  });

  // Test 5: Configurable retention policy (90 days) preserves baseline
  await test('Retention policy cleans expired drill audio while preserving baseline', async () => {
    const user = await db.createUser({ email: 'retention_user@luma.app', passwordHash: 'hash', displayName: 'Retention Learner' });
    
    // Baseline recording (should NOT be expired)
    const baseline = await db.createRecording({
      userId: user.id,
      kind: 'baseline',
      storageKey: `audio/${user.id}/baseline_day0.wav`,
      durationMs: 45000
    });

    // Drill recording
    const drill = await db.createRecording({
      userId: user.id,
      kind: 'drill',
      storageKey: `audio/${user.id}/drill_old.wav`,
      durationMs: 12000
    });

    // Artificially age the drill recording to 95 days ago
    const oldDate = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString();
    drill.createdAt = oldDate;
    baseline.createdAt = oldDate;

    // Run retention cleanup
    const cleanupResult = await executeAudioRetentionCleanup(90);
    if (cleanupResult.purgedRecordings < 1) {
      throw new Error('Expired drill recording should be purged');
    }

    // Baseline should still be accessible
    const baselineAfter = await db.findRecordingById(baseline.id);
    if (!baselineAfter) throw new Error('Baseline recording must be preserved by retention policy');
  });

  // Test 6: Purge user storage
  await test('Purge user removes storage objects and recordings completely', async () => {
    const user = await db.createUser({ email: 'purge_test@luma.app', passwordHash: 'hash', displayName: 'Purge User' });
    const userKey = `audio/${user.id}/test_clip.wav`;
    await storage.putObject({ key: userKey, buffer: sampleAudio, contentType: 'audio/wav' });

    await db.createRecording({
      userId: user.id,
      kind: 'drill',
      storageKey: userKey,
      durationMs: 4000
    });

    const deletedObjects = await purgeUserStorage(user.id);
    if (deletedObjects !== 1) throw new Error('Storage purge should delete 1 object');

    const stillExists = await storage.hasObject(userKey);
    if (stillExists) throw new Error('Purged storage object must no longer exist');
  });

  return { total: passed + failed, passed, failed, errors };
}
