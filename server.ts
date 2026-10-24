import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './src/server/routes.ts';
import { initDatabaseConnection } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API endpoints
  app.use('/api', apiRouter);

  // Development vs Production serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Attempt database connection in the background
  initDatabaseConnection().then(status => {
    console.log('[LUMA] Database Status:', status);
  }).catch(err => {
    console.warn('[LUMA] Database initialization notice:', err?.message || err);
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[LUMA] Server listening on http://0.0.0.0:${PORT} (${process.env.NODE_ENV === 'production' ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[LUMA] Server startup error:', err);
  process.exit(1);
});
