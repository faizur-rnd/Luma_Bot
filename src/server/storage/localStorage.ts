import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageService, PutObjectOptions } from './types.ts';

export class LocalStorageService implements IStorageService {
  name = 'local_filesystem';
  private baseDir: string;
  private signSecret: string;

  constructor(baseDir?: string, signSecret?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), '.data/private_audio');
    this.signSecret = signSecret || process.env.SESSION_SECRET || 'luma_dev_storage_secret_key_32bytes!';
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    const safeKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    const fullPath = path.resolve(this.baseDir, safeKey);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Invalid storage key path traversal.');
    }
    return fullPath;
  }

  async putObject(options: PutObjectOptions): Promise<{ key: string; sizeBytes: number }> {
    const fullPath = this.resolveSafePath(options.key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, options.buffer);
    return { key: options.key, sizeBytes: options.buffer.length };
  }

  async getObject(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const fullPath = this.resolveSafePath(key);
    if (!fs.existsSync(fullPath)) return null;
    const buffer = fs.readFileSync(fullPath);
    const contentType = key.endsWith('.wav') ? 'audio/wav' : key.endsWith('.webm') ? 'audio/webm' : 'application/octet-stream';
    return { buffer, contentType };
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async hasObject(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  async getSignedPlaybackUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const payload = `${key}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', this.signSecret).update(payload).digest('hex');
    const token = Buffer.from(JSON.stringify({ k: key, exp: expiresAt, sig: signature })).toString('base64url');
    return `/api/audio/stream?token=${token}`;
  }

  verifyPlaybackToken(token: string): { valid: boolean; key?: string } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      if (!decoded.k || !decoded.exp || !decoded.sig) return { valid: false };
      if (Date.now() > decoded.exp) return { valid: false };
      const expected = crypto.createHmac('sha256', this.signSecret).update(`${decoded.k}:${decoded.exp}`).digest('hex');
      if (expected !== decoded.sig) return { valid: false };
      return { valid: true, key: decoded.k };
    } catch {
      return { valid: false };
    }
  }
}
