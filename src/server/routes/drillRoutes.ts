import { Router, Request, Response } from 'express';
import {
  queryDrills,
  getDrillById,
  getConfusionMapForL1,
  getBaselinePassageByLevel,
  importAllSeedsToDatabase
} from '../../content/articulation/importer.js';
import { baselinePassages } from '../../content/articulation/seeds/index.js';

export const drillRouter = Router();

// GET /api/drills - Query catalog of articulation drills
drillRouter.get('/drills', async (req: Request, res: Response): Promise<void> => {
  try {
    const l1 = req.query.l1 as string | undefined;
    const category = req.query.category as string | undefined;
    const level = req.query.level as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const drills = await queryDrills({ l1, category, level, limit, offset });
    res.json({
      drills,
      count: drills.length,
      limit,
      offset
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query drills', details: err.message });
  }
});

// GET /api/drills/confusion-map/:l1 - Retrieve L1-to-English confusion map
drillRouter.get('/drills/confusion-map/:l1', (req: Request, res: Response): void => {
  const l1 = req.params.l1;
  const map = getConfusionMapForL1(l1);
  if (!map) {
    res.status(404).json({ error: `No confusion map found for language code '${l1}'. Supported: 'ta', 'ar'` });
    return;
  }
  res.json({ confusionMap: map });
});

// GET /api/drills/baseline-passages - List all baseline diagnostic passages
drillRouter.get('/drills/baseline-passages', (_req: Request, res: Response): void => {
  res.json({ baselinePassages });
});

// GET /api/drills/baseline-passages/:level - Retrieve diagnostic passage by level
drillRouter.get('/drills/baseline-passages/:level', (req: Request, res: Response): void => {
  const level = req.params.level as 'beginner' | 'intermediate' | 'advanced';
  if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
    res.status(400).json({ error: "Invalid level. Must be 'beginner', 'intermediate', or 'advanced'" });
    return;
  }
  try {
    const passage = getBaselinePassageByLevel(level);
    res.json({ passage });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/drills/:id - Retrieve single drill
drillRouter.get('/drills/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const drill = await getDrillById(req.params.id);
    if (!drill) {
      res.status(404).json({ error: `Drill '${req.params.id}' not found` });
      return;
    }
    res.json({ drill });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve drill', details: err.message });
  }
});

// POST /api/drills/seed - Admin/system idempotent seed endpoint
drillRouter.post('/drills/seed', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await importAllSeedsToDatabase();
    res.json({
      success: true,
      message: 'All articulation seeds and baseline passages successfully imported',
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed drills', details: err.message });
  }
});
