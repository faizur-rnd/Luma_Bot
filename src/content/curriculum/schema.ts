import { z } from 'zod';

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  scenario: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  durationMinutes: z.number().int().positive(),
  objective: z.string(),
  samplePhrases: z.array(z.string()),
  bridgeNotes: z.record(z.string(), z.string()).optional(),
  reviewStatus: z.literal('Draft, not yet reviewed')
});

export const ModuleSchema = z.object({
  id: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  title: z.string(),
  description: z.string(),
  lessons: z.array(LessonSchema),
  reviewStatus: z.literal('Draft, not yet reviewed')
});

export const CurriculumContentSchema = z.object({
  version: z.string(),
  reviewStatus: z.literal('Draft, not yet reviewed'),
  modules: z.array(ModuleSchema)
});

export type Lesson = z.infer<typeof LessonSchema>;
export type CurriculumModule = z.infer<typeof ModuleSchema>;
export type CurriculumContent = z.infer<typeof CurriculumContentSchema>;
