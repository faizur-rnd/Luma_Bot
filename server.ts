import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import apiRouter from './src/server/routes.ts';
import { initDatabaseConnection, db } from './src/server/db.ts';
import { requestIdMiddleware } from './src/server/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  // AI Studio requires the dev server to run strictly on port 3000
  const PORT = isProd ? (process.env.PORT || 3000) : 3000;

  // 14. Production Safety Gate
  if (isProd) {
    const missing: string[] = [];
    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET');
    if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');

    if (missing.length > 0) {
      console.error(`[FATAL] Production launch blocked. Missing mandatory environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  } else {
    console.info('[LUMA NOTICE] Running in NON-PRODUCTION Development Mode with Resilient LocalStore fallback.');
  }

  const app = express();

  // Reverse Proxy & Transport
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security Headers via Helmet (configured to support AI Studio iframe embedding)
  app.use(
    helmet({
      frameguard: false, // Required for AI Studio preview iframe embedding
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval for Vite development
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'https://generativelanguage.googleapis.com', 'blob:', 'data:', 'ws:', 'wss:'],
          mediaSrc: ["'self'", 'blob:', 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ['*'], // Allow embedding in Google AI Studio preview iframe
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: isProd ? [] : null
        }
      },
      hsts: isProd
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    })
  );

  // Request ID and Structured Logging (no secrets or PII)
  app.use(requestIdMiddleware);
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      // Only log API requests or HTTP error statuses (>= 400) to keep console pristine and prevent static Vite asset logs
      if (!req.originalUrl.startsWith('/api') && res.statusCode < 400) {
        return;
      }
      const duration = Date.now() - start;
      // Sanitize URL to avoid leaking query params
      const cleanUrl = req.originalUrl.split('?')[0];
      console.log(`[REQ ${req.requestId}] ${req.method} ${cleanUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Body Parsing with 100 KB limit and Cookie Parser
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  // Abuse Controls: Rate Limiters
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' }
  });
  app.use('/api', globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.', code: 'AUTH_RATE_LIMITED' }
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'AI request limit reached for this minute. Please wait a moment.', code: 'AI_RATE_LIMITED' }
  });
  app.use('/api/ai', aiLimiter);

  // Health and Readiness probes
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/readyz', async (_req, res) => {
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

  // Mount API Router
  app.use('/api', apiRouter);

  // Catch unmatched /api routes so they never fall through to Vite HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route ${req.method} ${req.path} not found.`,
      code: 'NOT_FOUND',
      requestId: (req as any).requestId
    });
  });

  // Development vs Production serving
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  // Error Handler (returns 400 for malformed JSON, never leaks stack traces or err.message to clients)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
      return res.status(400).json({
        error: 'Malformed JSON payload.',
        code: 'MALFORMED_JSON',
        requestId: (req as any).requestId
      });
    }
    console.error(`[UNHANDLED ERROR] [${req.requestId}]`, err);
    res.status(500).json({
      error: 'An internal server error occurred.',
      code: 'INTERNAL_ERROR',
      requestId: req.requestId
    });
  });

  // Attempt database connection in the background
  initDatabaseConnection()
    .then(status => {
      console.log('[LUMA DB Status]:', status.provider);
    })
    .catch(err => {
      console.warn('[LUMA DB Notice]:', err?.message || err);
    });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[LUMA Server] Listening on http://0.0.0.0:${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch(err => {
  console.error('[LUMA Startup Error]:', err);
  process.exit(1);
});
