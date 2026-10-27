import {
  ArticulationDrill,
  ArticulationDrillSchema,
  ConfusionMap,
  ConfusionMapSchema,
  BaselinePassage,
  BaselinePassageSchema
} from './types.js';
import { tamilToEnglishConfusionMap } from './confusionMaps/tamilToEnglish.js';
import { arabicToEnglishConfusionMap } from './confusionMaps/arabicToEnglish.js';
import { allArticulationDrills, baselinePassages } from './seeds/index.js';
import { db } from '../../server/db/index.js';

export function validateDrill(drill: unknown): ArticulationDrill {
  const result = ArticulationDrillSchema.safeParse(drill);
  if (!result.success) {
    throw new Error(`Drill validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
  }
  return result.data;
}

export function validateConfusionMap(map: unknown): ConfusionMap {
  const result = ConfusionMapSchema.safeParse(map);
  if (!result.success) {
    throw new Error(`ConfusionMap validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
  }
  return result.data;
}

export function validateBaselinePassage(passage: unknown): BaselinePassage {
  const result = BaselinePassageSchema.safeParse(passage);
  if (!result.success) {
    throw new Error(`BaselinePassage validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
  }
  return result.data;
}

export function getConfusionMapForL1(l1: string): ConfusionMap | null {
  if (l1 === 'ta') return validateConfusionMap(tamilToEnglishConfusionMap);
  if (l1 === 'ar') return validateConfusionMap(arabicToEnglishConfusionMap);
  return null;
}

export function getBaselinePassageByLevel(level: 'beginner' | 'intermediate' | 'advanced'): BaselinePassage {
  const found = baselinePassages.find(p => p.level === level);
  if (!found) {
    throw new Error(`Baseline passage not found for level: ${level}`);
  }
  return validateBaselinePassage(found);
}

export async function getDrillById(id: string): Promise<ArticulationDrill | null> {
  const record = await db.findDrillById(id);
  if (record) {
    return {
      id: record.id,
      language: record.language,
      l1: record.l1 as any,
      category: record.category as any,
      level: record.level as any,
      reviewStatus: record.reviewStatus,
      payload: record.payload as any
    };
  }

  // Fallback to in-memory seeds
  const seed = allArticulationDrills.find(d => d.id === id);
  if (seed) return validateDrill(seed);

  return null;
}

export async function queryDrills(filter: {
  l1?: string;
  category?: string;
  level?: string;
  limit?: number;
  offset?: number;
}): Promise<ArticulationDrill[]> {
  const allSeeds = [...allArticulationDrills];
  let filtered = allSeeds;

  if (filter.l1 && filter.l1 !== 'all') {
    filtered = filtered.filter(d => d.l1 === filter.l1 || d.l1 === 'all');
  }
  if (filter.category) {
    filtered = filtered.filter(d => d.category === filter.category);
  }
  if (filter.level) {
    filtered = filtered.filter(d => d.level === filter.level);
  }

  const offset = filter.offset || 0;
  const limit = filter.limit || 50;
  return filtered.slice(offset, offset + limit);
}

export async function importAllSeedsToDatabase(): Promise<{
  drillsImported: number;
  diagnosticPassagesImported: number;
}> {
  let drillsCount = 0;
  let diagnosticCount = 0;

  for (const drill of allArticulationDrills) {
    const validated = validateDrill(drill);
    await db.upsertDrill({
      id: validated.id,
      language: validated.language,
      l1: validated.l1,
      category: validated.category,
      payload: validated.payload,
      level: validated.level,
      reviewStatus: validated.reviewStatus
    });
    drillsCount++;
  }

  for (const passage of baselinePassages) {
    const validatedPassage = validateBaselinePassage(passage);
    const passageDrillId = `diagnostic_${validatedPassage.id}`;
    await db.upsertDrill({
      id: passageDrillId,
      language: 'en',
      l1: 'all',
      category: 'baseline_diagnostic',
      payload: {
        targetPhonemes: validatedPassage.targetPhonemeCoverage,
        referenceText: validatedPassage.text,
        cueText: `Baseline diagnostic assessment for ${validatedPassage.level} level speakers.`,
        words: validatedPassage.text.split(/\s+/),
        difficultyScore: validatedPassage.level === 'beginner' ? 1 : validatedPassage.level === 'intermediate' ? 3 : 5,
        estimatedSeconds: Math.ceil((validatedPassage.wordCount / validatedPassage.suggestedPacingWpm) * 60)
      },
      level: validatedPassage.level,
      reviewStatus: 'draft'
    });
    diagnosticCount++;
  }

  return {
    drillsImported: drillsCount,
    diagnosticPassagesImported: diagnosticCount
  };
}
