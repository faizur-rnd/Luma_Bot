import { z } from 'zod';

export const DrillCategorySchema = z.enum([
  'minimal_pair',
  'consonant_cluster',
  'vowel_contrast',
  'word_stress',
  'sentence_stress',
  'tongue_twister',
  'shadowing',
  'baseline_diagnostic'
]);
export type DrillCategory = z.infer<typeof DrillCategorySchema>;

export const DrillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type DrillLevel = z.infer<typeof DrillLevelSchema>;

export const ReviewStatusSchema = z.enum(['draft', 'reviewed', 'clinical_verified']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const MinimalPairItemSchema = z.object({
  wordA: z.string(),
  ipaA: z.string(),
  wordB: z.string(),
  ipaB: z.string(),
  contrastDescription: z.string()
});
export type MinimalPairItem = z.infer<typeof MinimalPairItemSchema>;

export const DrillPayloadSchema = z.object({
  targetPhonemes: z.array(z.string()).min(1),
  contrastPhonemes: z.array(z.string()).optional(),
  referenceText: z.string().min(1),
  cueText: z.string().min(1),
  cueTranslation: z.object({
    ta: z.string().optional(),
    ar: z.string().optional()
  }).optional(),
  words: z.array(z.string()).optional(),
  stressPattern: z.string().optional(),
  pairs: z.array(MinimalPairItemSchema).optional(),
  audioReferenceKey: z.string().optional(),
  difficultyScore: z.number().min(1).max(5).default(1),
  estimatedSeconds: z.number().int().positive().default(30)
});
export type DrillPayload = z.infer<typeof DrillPayloadSchema>;

export const ArticulationDrillSchema = z.object({
  id: z.string().min(1),
  language: z.string().default('en'),
  l1: z.enum(['ta', 'ar', 'all', 'en']),
  category: DrillCategorySchema,
  level: DrillLevelSchema.default('beginner'),
  reviewStatus: ReviewStatusSchema.default('draft'),
  payload: DrillPayloadSchema
});
export type ArticulationDrill = z.infer<typeof ArticulationDrillSchema>;

export const ConfusionContrastSchema = z.object({
  id: z.string(),
  targetPhoneme: z.string(),
  l1Substitutes: z.array(z.string()),
  acousticConfusionType: z.string(),
  articulationTip: z.string(),
  bridgeExplanation: z.object({
    ta: z.string().optional(),
    ar: z.string().optional()
  }).optional(),
  exampleWords: z.array(z.string())
});
export type ConfusionContrast = z.infer<typeof ConfusionContrastSchema>;

export const ConfusionMapSchema = z.object({
  sourceL1: z.string(),
  targetLanguage: z.string(),
  description: z.string(),
  contrasts: z.array(ConfusionContrastSchema)
});
export type ConfusionMap = z.infer<typeof ConfusionMapSchema>;

export const BaselinePassageSchema = z.object({
  id: z.string(),
  level: DrillLevelSchema,
  title: z.string(),
  text: z.string(),
  targetPhonemeCoverage: z.array(z.string()),
  wordCount: z.number().int().positive(),
  suggestedPacingWpm: z.number().int().positive()
});
export type BaselinePassage = z.infer<typeof BaselinePassageSchema>;
