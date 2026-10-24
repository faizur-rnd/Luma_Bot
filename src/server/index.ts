import express from 'express';
import apiRouter from './routes.ts';
import { initDatabaseConnection } from './db.ts';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Attach API Router under /api
app.use('/api', apiRouter);

// Attempt database connection in the background on startup
initDatabaseConnection().catch(err => {
  console.warn('Initial Neon database check completed with notice:', err.message);
});

export default app;
