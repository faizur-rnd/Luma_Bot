import http from 'http';
import app from '../server/index.ts';
import { tamilToEnglishConfusionMap } from '../content/articulation/confusionMaps/tamilToEnglish.ts';
import { arabicToEnglishConfusionMap } from '../content/articulation/confusionMaps/arabicToEnglish.ts';
import {
  allTamilEnglishDrills,
  allArabicEnglishDrills,
  baselinePassages
} from '../content/articulation/seeds/index.ts';
import {
  validateDrill,
  validateConfusionMap,
  validateBaselinePassage,
  queryDrills,
  getDrillById,
  importAllSeedsToDatabase
} from '../content/articulation/importer.ts';

export async function runArticulationContentTests(): Promise<{ total: number; passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      passed++;
      console.log(`[✓ PASS] Articulation Content - ${name}`);
    } catch (e: any) {
      failed++;
      const msg = `[✗ FAIL] Articulation Content - ${name}: ${e.message || e}`;
      console.error(msg);
      errors.push(msg);
    }
  };

  // 1. Tamil to English confusion map
  await test('Tamil to English phonological confusion map', () => {
    const v = validateConfusionMap(tamilToEnglishConfusionMap);
    if (v.sourceL1 !== 'ta') throw new Error(`Expected ta, got ${v.sourceL1}`);
    const phonemes = v.contrasts.map(c => c.targetPhoneme);
    if (!phonemes.includes('θ') || !phonemes.includes('ð') || !phonemes.includes('f') || !phonemes.includes('w')) {
      throw new Error('Missing core dental or labiodental contrasts');
    }
    for (const c of v.contrasts) {
      if (!c.bridgeExplanation?.ta) throw new Error(`Missing Tamil bridge explanation for ${c.id}`);
    }
  });

  // 2. Arabic to English confusion map
  await test('Arabic to English phonological confusion map', () => {
    const v = validateConfusionMap(arabicToEnglishConfusionMap);
    if (v.sourceL1 !== 'ar') throw new Error(`Expected ar, got ${v.sourceL1}`);
    const phonemes = v.contrasts.map(c => c.targetPhoneme);
    if (!phonemes.includes('p') || !phonemes.includes('v') || !phonemes.includes('ɪ') || !phonemes.includes('ʊ')) {
      throw new Error('Missing core plosive voicing or lax vowel contrasts');
    }
    for (const c of v.contrasts) {
      if (!c.bridgeExplanation?.ar) throw new Error(`Missing Arabic bridge explanation for ${c.id}`);
    }
  });

  // 3. Tamil L1 drills inventory
  await test('Tamil L1 drills inventory (>= 40 drills, all validated)', () => {
    if (allTamilEnglishDrills.length < 40) throw new Error(`Expected >= 40, got ${allTamilEnglishDrills.length}`);
    for (const d of allTamilEnglishDrills) {
      validateDrill(d);
      if (d.l1 !== 'ta') throw new Error(`Invalid L1: ${d.l1}`);
    }
  });

  // 4. Arabic L1 drills inventory
  await test('Arabic L1 drills inventory (>= 40 drills, all validated)', () => {
    if (allArabicEnglishDrills.length < 40) throw new Error(`Expected >= 40, got ${allArabicEnglishDrills.length}`);
    for (const d of allArabicEnglishDrills) {
      validateDrill(d);
      if (d.l1 !== 'ar') throw new Error(`Invalid L1: ${d.l1}`);
    }
  });

  // 5. Baseline diagnostic passages
  await test('3 baseline diagnostic passages across difficulty levels', () => {
    if (baselinePassages.length !== 3) throw new Error(`Expected 3, got ${baselinePassages.length}`);
    for (const p of baselinePassages) {
      const v = validateBaselinePassage(p);
      if (v.wordCount <= 30 || v.suggestedPacingWpm < 100) throw new Error(`Invalid passage specs: ${p.id}`);
    }
  });

  // 6. Idempotent seeding and DB lookup
  await test('Idempotent database seeding and drill retrieval', async () => {
    const r1 = await importAllSeedsToDatabase();
    if (r1.drillsImported < 80) throw new Error(`Expected >= 80 imported, got ${r1.drillsImported}`);
    if (r1.diagnosticPassagesImported !== 3) throw new Error('Expected 3 diagnostic passages');

    const r2 = await importAllSeedsToDatabase();
    if (r2.drillsImported !== r1.drillsImported) throw new Error('Seeding was not idempotent');

    const drill = await getDrillById('drill_ta_01');
    if (!drill || drill.payload.referenceText !== 'think vs tink') {
      throw new Error('Failed to retrieve seeded drill drill_ta_01');
    }
  });

  // 7. Drill filtering
  await test('Filter drills by L1, category, and level', async () => {
    const taDrills = await queryDrills({ l1: 'ta' });
    if (taDrills.length < 40 || !taDrills.every(d => d.l1 === 'ta')) {
      throw new Error('Filtered Tamil drills failed validation');
    }

    const arPairs = await queryDrills({ l1: 'ar', category: 'minimal_pair' });
    if (arPairs.length === 0 || !arPairs.every(d => d.l1 === 'ar' && d.category === 'minimal_pair')) {
      throw new Error('Filtered Arabic minimal pairs failed');
    }
  });

  // 8. HTTP API endpoints
  await test('HTTP API endpoints for catalog queries and confusion maps', async () => {
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as any).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const res1 = await fetch(`${baseUrl}/api/drills?l1=ta&limit=5`);
      if (res1.status !== 200) throw new Error(`Expected 200, got ${res1.status}`);
      const body1 = await res1.json();
      if (body1.count !== 5) throw new Error(`Expected count 5, got ${body1.count}`);

      const res2 = await fetch(`${baseUrl}/api/drills/confusion-map/ta`);
      if (res2.status !== 200) throw new Error(`Expected 200, got ${res2.status}`);
      const body2 = await res2.json();
      if (body2.confusionMap.sourceL1 !== 'ta') throw new Error('Expected ta confusion map');

      const res3 = await fetch(`${baseUrl}/api/drills/confusion-map/ar`);
      if (res3.status !== 200) throw new Error(`Expected 200, got ${res3.status}`);

      const res4 = await fetch(`${baseUrl}/api/drills/confusion-map/unknown`);
      if (res4.status !== 404) throw new Error(`Expected 404, got ${res4.status}`);

      const res5 = await fetch(`${baseUrl}/api/drills/baseline-passages`);
      if (res5.status !== 200) throw new Error(`Expected 200, got ${res5.status}`);
      const body5 = await res5.json();
      if (body5.baselinePassages.length !== 3) throw new Error('Expected 3 baseline passages');

      const res6 = await fetch(`${baseUrl}/api/drills/drill_ar_01`);
      if (res6.status !== 200) throw new Error(`Expected 200, got ${res6.status}`);
      const body6 = await res6.json();
      if (body6.drill.id !== 'drill_ar_01') throw new Error('Expected drill_ar_01');
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  return { total: passed + failed, passed, failed, errors };
}
