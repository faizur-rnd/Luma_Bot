// LUMA Private Object Storage Interface & Types
// Compatible with AWS S3, Cloudflare R2, MinIO, and local filesystem adapter

export interface PutObjectOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StoredObjectMetadata {
  key: string;
  sizeBytes: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface IStorageService {
  name: string;
  putObject(options: PutObjectOptions): Promise<{ key: string; sizeBytes: number }>;
  getObject(key: string): Promise<{ buffer: Buffer; contentType: string } | null>;
  deleteObject(key: string): Promise<boolean>;
  getSignedPlaybackUrl(key: string, expiresInSeconds?: number): Promise<string>;
  hasObject(key: string): Promise<boolean>;
}
