import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService, PutObjectOptions } from './types.ts';

export class S3StorageService implements IStorageService {
  name = 's3_compatible';
  private client: S3Client;
  private bucket: string;

  constructor(config?: {
    bucket?: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    this.bucket = config?.bucket || process.env.S3_BUCKET || 'luma-audio';
    this.client = new S3Client({
      region: config?.region || process.env.AWS_REGION || 'auto',
      endpoint: config?.endpoint || process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || '',
        secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || ''
      },
      forcePathStyle: Boolean(process.env.S3_FORCE_PATH_STYLE === 'true' || process.env.S3_ENDPOINT?.includes('localhost'))
    });
  }

  async putObject(options: PutObjectOptions): Promise<{ key: string; sizeBytes: number }> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      Body: options.buffer,
      ContentType: options.contentType,
      Metadata: options.metadata
    });
    await this.client.send(cmd);
    return { key: options.key, sizeBytes: options.buffer.length };
  }

  async getObject(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const cmd = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      const res = await this.client.send(cmd);
      if (!res.Body) return null;
      const byteArray = await res.Body.transformToByteArray();
      return {
        buffer: Buffer.from(byteArray),
        contentType: res.ContentType || 'audio/wav'
      };
    } catch {
      return null;
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const cmd = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      await this.client.send(cmd);
      return true;
    } catch {
      return false;
    }
  }

  async hasObject(key: string): Promise<boolean> {
    try {
      const cmd = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      await this.client.send(cmd);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedPlaybackUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    return await getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }
}
