import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes.ts';
import { initDatabaseConnection, db } from './db.ts';
import { requestIdMiddleware } from './auth.ts';

const app = express();
app.set('trust proxy', 1);

app.use(requestIdMiddleware);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Rate Limiter for Login/Auth (triggers 429 when threshold exceeded)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 15),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.', code: 'AUTH_RATE_LIMITED' }
});

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);

// Health and Readiness probes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/readyz', async (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const dbStatus = db.getStatus();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY'));
  const isReady = isProd ? (dbStatus.isLive && hasGemini) : true;

  if (!isReady) {
    return res.status(503).json({
      status: 'degraded',
      database: dbStatus,
      aiConfigured: hasGemini
    });
  }

  res.status(200).json({
    status: 'ready',
    database: dbStatus,
    aiConfigured: hasGemini
  });
});

// Attach API Router under /api
app.use('/api', apiRouter);

// Error Handler (returns 400 for malformed JSON, 500 otherwise)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return res.status(400).json({
      error: 'Malformed JSON payload.',
      code: 'MALFORMED_JSON',
      requestId: (req as any).requestId
    });
  }
  console.error(`[UNHANDLED ERROR] [${(req as any).requestId}]`, err);
  res.status(500).json({
    error: 'An internal server error occurred.',
    code: 'INTERNAL_ERROR',
    requestId: (req as any).requestId
  });
});

// Attempt database connection in the background on startup (if not testing)
if (process.env.NODE_ENV !== 'test') {
  initDatabaseConnection().catch(err => {
    console.warn('Initial database check completed with notice:', err.message);
  });
}

export default app;
