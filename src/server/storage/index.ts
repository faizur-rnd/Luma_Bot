import { IStorageService } from './types.ts';
import { LocalStorageService } from './localStorage.ts';
import { S3StorageService } from './s3Storage.ts';
import { db } from '../db/index.ts';

export * from './types.ts';
export { LocalStorageService, S3StorageService };

let activeStorage: IStorageService | null = null;
let localStorageInstance: LocalStorageService | null = null;

export function getLocalStorageService(): LocalStorageService {
  if (!localStorageInstance) {
    localStorageInstance = new LocalStorageService();
  }
  return localStorageInstance;
}

export function getStorageService(): IStorageService {
  if (activeStorage) return activeStorage;

  const hasS3Config = Boolean(
    process.env.S3_BUCKET ||
    (process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  );

  if (hasS3Config) {
    try {
      activeStorage = new S3StorageService();
      console.log('[Storage] Initialized S3/R2-compatible cloud object storage.');
      return activeStorage;
    } catch (e: any) {
      console.warn('[Storage] Failed to initialize S3 storage, falling back to LocalStorageService:', e.message);
    }
  }

  activeStorage = getLocalStorageService();
  console.log('[Storage] Initialized private local filesystem storage.');
  return activeStorage;
}

export async function executeAudioRetentionCleanup(retentionDays = 90): Promise<{
  purgedRecordings: number;
  deletedStorageObjects: number;
}> {
  const storage = getStorageService();
  const expiredRecordings = await db.purgeExpiredRecordings(retentionDays);
  let deletedCount = 0;

  for (const rec of expiredRecordings) {
    try {
      const deleted = await storage.deleteObject(rec.storageKey);
      if (deleted) deletedCount++;
    } catch (e: any) {
      console.warn(`[Storage Retention] Failed to delete object ${rec.storageKey}:`, e.message);
    }
  }

  console.log(`[Storage Retention] Cleaned up ${expiredRecordings.length} recordings and ${deletedCount} storage objects older than ${retentionDays} days.`);
  return {
    purgedRecordings: expiredRecordings.length,
    deletedStorageObjects: deletedCount
  };
}

export async function purgeUserStorage(userId: string): Promise<number> {
  const storage = getStorageService();
  const recordings = await db.getRecordingsByUser(userId);
  let deletedCount = 0;

  for (const rec of recordings) {
    try {
      const deleted = await storage.deleteObject(rec.storageKey);
      if (deleted) deletedCount++;
    } catch (e: any) {
      console.warn(`[User Storage Purge] Failed to delete object ${rec.storageKey}:`, e.message);
    }
  }

  return deletedCount;
}
