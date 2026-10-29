import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth } from '../routes.ts';
import { generate12WeekProgram, WeekPlan } from '../program/programEngine.ts';

export const programRouter = Router();

const EnrollProgramSchema = z.object({
  nativeLanguage: z.enum(['ta', 'ar', 'en']).default('ta'),
  targetAccent: z.enum(['en-US', 'en-IN']).default('en-US')
}).strict();

const CompleteStepSchema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  dayNumber: z.number().int().min(1).max(5),
  stepNumber: z.number().int().min(1).max(5),
  durationSeconds: z.number().int().min(0).max(3600).default(120),
  phonemeScores: z.record(z.string(), z.number().min(0).max(100)).optional()
}).strict();

const CompleteDaySchema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  dayNumber: z.number().int().min(1).max(5),
  reflectionNotes: z.string().max(1000).optional()
}).strict();

const OverrideWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(12)
}).strict();

// 1. Enroll / Initialize 12-Week Program
programRouter.post('/program/enroll', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = EnrollProgramSchema.parse(req.body);
    const userId = req.user!.id;

    // Update user preferences
    await db.updateUserProfile(userId, {
      bridgeLanguage: data.nativeLanguage,
      targetLanguage: 'en'
    });

    // Generate 12-week program
    const weeks: WeekPlan[] = generate12WeekProgram(data.nativeLanguage, data.targetAccent);

    // Persist week enrollments
    for (const week of weeks) {
      await db.saveProgramEnrollment(
        userId,
        week.weekNumber,
        {
          ...week,
          completedDays: [],
          completedSteps: {},
          activeDay: 1
        },
        week.weekNumber === 1 ? 'active' : 'active'
      );
    }

    const currentWeek = await db.getProgramEnrollment(userId, 1);
    res.json({
      success: true,
      message: 'Enrolled in LUMA 12-Week Program',
      currentWeek: currentWeek?.plan,
      totalWeeks: 12
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid enrollment data', details: err.issues });
    }
    res.status(500).json({ error: 'Failed to enroll in program', details: err?.message });
  }
});

// 2. Get Current Active Week & Session
programRouter.get('/program/current', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    let enrollments = await db.getAllProgramEnrollments(userId);

    // If user has not enrolled yet, auto-enroll with user's defaults
    if (enrollments.length === 0) {
      const l1 = req.user?.bridgeLanguage === 'ar' ? 'ar' : 'ta';
      const weeks = generate12WeekProgram(l1, 'en-US');
      for (const week of weeks) {
        await db.saveProgramEnrollment(
          userId,
          week.weekNumber,
          {
            ...week,
            completedDays: [],
            completedSteps: {},
            activeDay: 1
          },
          'active'
        );
      }
      enrollments = await db.getAllProgramEnrollments(userId);
    }

    // Find first incomplete week or week 1
    let activeEnrollment = enrollments.find(e => {
      const compDays = (e.plan as any)?.completedDays || [];
      return compDays.length < 5;
    }) || enrollments[0];

    const plan = activeEnrollment.plan;
    const activeDay = (plan as any)?.activeDay || 1;
    const currentSession = (plan as any)?.sessions?.find((s: any) => s.dayNumber === activeDay) || plan.sessions?.[0];

    res.json({
      weekNumber: activeEnrollment.weekNumber,
      title: plan.title,
      focusPhonemes: plan.focusPhonemes,
      theme: plan.theme,
      milestoneType: plan.milestoneType,
      activeDay,
      completedDays: (plan as any)?.completedDays || [],
      completedSteps: (plan as any)?.completedSteps || {},
      currentSession,
      status: activeEnrollment.status
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve current program session' });
  }
});

// 3. Get Overview of All 12 Weeks
programRouter.get('/program/weeks', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    let enrollments = await db.getAllProgramEnrollments(userId);

    if (enrollments.length === 0) {
      const l1 = req.user?.bridgeLanguage === 'ar' ? 'ar' : 'ta';
      const weeks = generate12WeekProgram(l1, 'en-US');
      for (const week of weeks) {
        await db.saveProgramEnrollment(userId, week.weekNumber, { ...week, completedDays: [], completedSteps: {}, activeDay: 1 });
      }
      enrollments = await db.getAllProgramEnrollments(userId);
    }

    const overview = enrollments.map(e => ({
      weekNumber: e.weekNumber,
      title: e.plan.title,
      focusPhonemes: e.plan.focusPhonemes,
      theme: e.plan.theme,
      milestoneType: e.plan.milestoneType,
      completedDays: (e.plan as any)?.completedDays || [],
      isComplete: ((e.plan as any)?.completedDays || []).length >= 5,
      status: e.status
    }));

    res.json({ weeks: overview });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve weeks overview' });
  }
});

// 4. Complete a Daily Step
programRouter.post('/program/step/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = CompleteStepSchema.parse(req.body);
    const userId = req.user!.id;

    const enrollment = await db.getProgramEnrollment(userId, data.weekNumber);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment for week not found' });
    }

    const plan = enrollment.plan as any;
    plan.completedSteps = plan.completedSteps || {};
    const stepKey = `w${data.weekNumber}d${data.dayNumber}s${data.stepNumber}`;
    plan.completedSteps[stepKey] = {
      completedAt: new Date().toISOString(),
      durationSeconds: data.durationSeconds
    };

    // Update phoneme mastery if scores were provided
    if (data.phonemeScores) {
      for (const [phoneme, score] of Object.entries(data.phonemeScores)) {
        await db.updatePhonemeMastery(userId, 'en', phoneme, score);
      }
    }

    // Save updated plan
    await db.saveProgramEnrollment(userId, data.weekNumber, plan, enrollment.status);

    res.json({ success: true, stepKey, plan: { completedSteps: plan.completedSteps } });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid step data', details: err.issues });
    }
    res.status(500).json({ error: 'Failed to record step completion' });
  }
});

// 5. Complete a Daily Session
programRouter.post('/program/session/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = CompleteDaySchema.parse(req.body);
    const userId = req.user!.id;

    const enrollment = await db.getProgramEnrollment(userId, data.weekNumber);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment for week not found' });
    }

    const plan = enrollment.plan as any;
    plan.completedDays = plan.completedDays || [];
    if (!plan.completedDays.includes(data.dayNumber)) {
      plan.completedDays.push(data.dayNumber);
    }

    // Advance active day or unlock next week
    if (data.dayNumber < 5) {
      plan.activeDay = data.dayNumber + 1;
    } else {
      plan.activeDay = 5;
    }

    const isWeekComplete = plan.completedDays.length >= 5;
    const status = isWeekComplete ? 'completed' : 'active';

    await db.saveProgramEnrollment(userId, data.weekNumber, plan, status);

    // Log mission activity for streak tracking (15 minutes typical daily session = 900s)
    await db.recordMissionActivity(userId, {
      missionId: `w${data.weekNumber}_d${data.dayNumber}`,
      activityType: 'speaking',
      secondsSpent: 900,
      score: 85
    });

    // Increment user streak count if practice happened
    const currentStreak = req.user!.streakCount || 0;
    await db.updateUserProfile(userId, { streakCount: currentStreak + 1 });

    res.json({
      success: true,
      weekNumber: data.weekNumber,
      completedDay: data.dayNumber,
      isWeekComplete,
      nextDay: plan.activeDay,
      newStreak: currentStreak + 1
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid session data', details: err.issues });
    }
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// 6. Override Active Week
programRouter.post('/program/override-week', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = OverrideWeekSchema.parse(req.body);
    const userId = req.user!.id;

    const enrollment = await db.getProgramEnrollment(userId, data.weekNumber);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment for target week not found' });
    }

    const plan = enrollment.plan as any;
    plan.activeDay = 1;
    await db.saveProgramEnrollment(userId, data.weekNumber, plan, 'active');

    res.json({ success: true, activeWeek: data.weekNumber });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid week override' });
  }
});
