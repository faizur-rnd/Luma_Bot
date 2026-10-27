import { ArticulationDrill, BaselinePassage } from '../types.js';
import { baselinePassages } from './baselinePassages.js';
import { tamilEnglishDrillsPart1 } from './tamilEnglishDrillsPart1.js';
import { tamilEnglishDrillsPart2 } from './tamilEnglishDrillsPart2.js';
import { tamilEnglishDrillsPart3 } from './tamilEnglishDrillsPart3.js';
import { arabicEnglishDrillsPart1 } from './arabicEnglishDrillsPart1.js';
import { arabicEnglishDrillsPart2 } from './arabicEnglishDrillsPart2.js';
import { arabicEnglishDrillsPart3 } from './arabicEnglishDrillsPart3.js';

export { baselinePassages } from './baselinePassages.js';
export { tamilEnglishDrillsPart1 } from './tamilEnglishDrillsPart1.js';
export { tamilEnglishDrillsPart2 } from './tamilEnglishDrillsPart2.js';
export { tamilEnglishDrillsPart3 } from './tamilEnglishDrillsPart3.js';
export { arabicEnglishDrillsPart1 } from './arabicEnglishDrillsPart1.js';
export { arabicEnglishDrillsPart2 } from './arabicEnglishDrillsPart2.js';
export { arabicEnglishDrillsPart3 } from './arabicEnglishDrillsPart3.js';

export const allTamilEnglishDrills: ArticulationDrill[] = [
  ...tamilEnglishDrillsPart1,
  ...tamilEnglishDrillsPart2,
  ...tamilEnglishDrillsPart3
];

export const allArabicEnglishDrills: ArticulationDrill[] = [
  ...arabicEnglishDrillsPart1,
  ...arabicEnglishDrillsPart2,
  ...arabicEnglishDrillsPart3
];

export const allArticulationDrills: ArticulationDrill[] = [
  ...allTamilEnglishDrills,
  ...allArabicEnglishDrills
];

export function getDiagnosticPassages(): BaselinePassage[] {
  return [...baselinePassages];
}
