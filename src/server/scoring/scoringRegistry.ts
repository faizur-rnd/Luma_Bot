import crypto from 'crypto';
import { IScoringProvider, ScoringRequest, ScoringResult } from './types.ts';
import { AzurePronunciationProvider } from './AzurePronunciationProvider.ts';
import { EstimatedScoringProvider } from './EstimatedScoringProvider.ts';
import { UnavailableScoringProvider } from './UnavailableScoringProvider.ts';

export * from './types.ts';
export { AzurePronunciationProvider, EstimatedScoringProvider, UnavailableScoringProvider };

// Result Cache: stores validated scores keyed by SHA-256 hash (never keeps raw audio)
interface CacheEntry {
  result: ScoringResult;
  timestamp: number;
}
const scoringCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Daily Scoring Cap: 60 scoring attempts per user per day
const userDailyUsage = new Map<string, { date: string; count: number }>();
export const DAILY_SCORING_CAP = 60;

export function checkDailyScoringQuota(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const usage = userDailyUsage.get(userId);

  if (!usage || usage.date !== today) {
    userDailyUsage.set(userId, { date: today, count: 0 });
    return { allowed: true, remaining: DAILY_SCORING_CAP };
  }

  if (usage.count >= DAILY_SCORING_CAP) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_SCORING_CAP - usage.count };
}

export function incrementDailyScoringUsage(userId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const usage = userDailyUsage.get(userId);
  if (!usage || usage.date !== today) {
    userDailyUsage.set(userId, { date: today, count: 1 });
  } else {
    usage.count++;
  }
}

export function getScoringProvider(targetLanguage: string, targetAccent: string): IScoringProvider {
  const configuredMode = process.env.SCORING_PROVIDER?.toLowerCase();

  if (configuredMode === 'unavailable') {
    return new UnavailableScoringProvider();
  }

  if (configuredMode === 'estimated') {
    return new EstimatedScoringProvider();
  }

  const azureProvider = new AzurePronunciationProvider();
  if (azureProvider.isConfigured()) {
    const caps = azureProvider.getCapabilities(targetLanguage, targetAccent);
    if (caps.supportsPhonemes || caps.supportedLocales.includes(targetAccent)) {
      return azureProvider;
    }
    // For non-English languages without phoneme support in Azure, use Estimated or Unavailable
    return new EstimatedScoringProvider();
  }

  // When Azure credentials are not configured, default safely to EstimatedProvider in dev, or Unavailable
  if (process.env.NODE_ENV === 'test') {
    return new EstimatedScoringProvider();
  }

  return new UnavailableScoringProvider();
}

export async function scoreAttemptWithCache(
  request: ScoringRequest,
  userId: string,
  customProvider?: IScoringProvider
): Promise<{ result: ScoringResult; cached: boolean }> {
  // 1. Check daily scoring quota
  const quota = checkDailyScoringQuota(userId);
  if (!quota.allowed) {
    throw new Error(`Daily pronunciation scoring cap of ${DAILY_SCORING_CAP} attempts reached. Resets at midnight.`);
  }

  // 2. Compute audio + parameter hash
  const hash = crypto
    .createHash('sha256')
    .update(request.audio)
    .update(request.referenceText)
    .update(request.targetLanguage)
    .update(request.targetAccent)
    .digest('hex');

  const cached = scoringCache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { result: cached.result, cached: true };
  }

  // 3. Resolve scoring provider
  const provider = customProvider || getScoringProvider(request.targetLanguage, request.targetAccent);

  // 4. Execute scoring
  const result = await provider.score(request);

  // 5. Cache result & increment quota
  scoringCache.set(hash, { result, timestamp: Date.now() });
  incrementDailyScoringUsage(userId);

  return { result, cached: false };
}
