import crypto from 'crypto';
import * as argon2 from '@node-rs/argon2';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Argon2id hashing configuration
const ARGON2_OPTIONS: argon2.Options = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
  algorithm: 2 // Argon2id
};

// Password policy: minimum 10 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/;

export function validatePasswordPolicy(password: string): { valid: boolean; reason?: string } {
  if (password.length < 10) {
    return { valid: false, reason: 'Password must be at least 10 characters long.' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

export async function hashPassword(plainText: string): Promise<string> {
  return await argon2.hash(plainText, ARGON2_OPTIONS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

// Session definitions
export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  targetLanguage: string;
  bridgeLanguage: string;
  proficiencyLevel: string;
  dailyGoalMinutes: number;
  streakCount: number;
}

export interface UserSession {
  id: string;
  userId: string;
  csrfSecret: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

// Session timeouts: 7 days absolute, 24 hours idle
export const ABSOLUTE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
export const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = 'luma_session';

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      session?: UserSession;
      requestId?: string;
    }
  }
}

// In-memory store for session & token tracking in non-production fallback
export const memorySessions = new Map<string, UserSession>();
export const memoryUsers = new Map<string, SessionUser & { passwordHash: string; emailVerified: boolean; resetToken?: string; resetTokenExpiresAt?: number }>();

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}

// CSRF verification middleware for state-changing requests
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Strict Origin / Referer check: Require Origin or Referer on state-changing requests
  const originHeader = req.headers['origin'] || req.headers['referer'];
  if (!originHeader) {
    return res.status(403).json({
      error: 'Missing Origin or Referer header for state-changing request.',
      code: 'ORIGIN_REQUIRED',
      requestId: req.requestId
    });
  }

  const rawOrigin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  const host = req.headers['host'];

  try {
    const originUrl = new URL(rawOrigin);

    // Exact allow-list configuration
    const envAllowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
    const isSameHost = (host && originUrl.host === host) || (forwardedHost && originUrl.host === forwardedHost);
    const isExplicitlyAllowed = envAllowed.includes(originUrl.origin) || Boolean(process.env.APP_URL && originUrl.origin.includes(process.env.APP_URL));
    const isAiStudioDomain = originUrl.hostname.endsWith('.run.app') ||
                             originUrl.hostname.endsWith('.google.com') ||
                             originUrl.hostname.endsWith('.googleusercontent.com');
    const isDevLocalhost = process.env.NODE_ENV !== 'production' && (
      originUrl.origin === 'http://localhost:3000' ||
      originUrl.origin === 'http://127.0.0.1:3000' ||
      originUrl.origin === 'http://localhost:5173' ||
      originUrl.origin === 'http://127.0.0.1:5173' ||
      originUrl.hostname === '127.0.0.1' ||
      originUrl.hostname === 'localhost'
    );

    if (!isSameHost && !isExplicitlyAllowed && !isDevLocalhost && !isAiStudioDomain) {
      return res.status(403).json({
        error: 'Cross-origin request rejected.',
        code: 'ORIGIN_FORBIDDEN',
        requestId: req.requestId
      });
    }
  } catch {
    return res.status(403).json({
      error: 'Invalid request origin.',
      code: 'INVALID_ORIGIN',
      requestId: req.requestId
    });
  }

  // Exempt public auth and conversational AI generation routes from CSRF token (they validate Origin)
  const targetPath = (req.originalUrl ? req.originalUrl.split('?')[0] : req.path);
  const exemptPaths = [
    '/api/auth/login', '/auth/login',
    '/api/auth/register', '/auth/register',
    '/api/auth/forgot-password', '/auth/forgot-password',
    '/api/auth/reset-password', '/auth/reset-password',
    '/api/ai/chat', '/ai/chat',
    '/api/tts', '/tts'
  ];
  if (exemptPaths.includes(targetPath) || exemptPaths.includes(req.path)) {
    return next();
  }

  // Check CSRF token from header or body against current session
  const clientToken = (req.headers['x-csrf-token'] as string) || req.body?._csrf;
  if (!req.session || !clientToken || clientToken !== req.session.csrfSecret) {
    return res.status(403).json({
      error: 'Invalid or missing CSRF token.',
      code: 'CSRF_VALIDATION_FAILED',
      requestId: req.requestId
    });
  }

  next();
}
