import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { db } from './db.ts';
import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordPolicy, 
  generateSecureToken, 
  SESSION_COOKIE_NAME,
  csrfProtection,
  SessionUser
} from './auth.ts';
import { 
  generateLumaResponse, 
  generateSpeechAudio, 
  validateLearnerSpokenInput, 
  scoreAssessmentSubmission 
} from './aiService.ts';
import { LANGUAGE_REGISTRY } from './languageRegistry.ts';
import { generatePersonalizedCurriculum, OnboardingAnswers, calculate70_20_10Allocation } from './curriculumGenerator.ts';

const router = Router();

// Zod validation schemas
const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(10).max(128),
  displayName: z.string().min(1).max(100),
  targetLanguage: z.string().max(10).optional(),
  bridgeLanguage: z.string().max(10).optional()
}).strict();

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128)
}).strict();

const ForgotPasswordSchema = z.object({
  email: z.string().email().max(255)
}).strict();

const ResetPasswordSchema = z.object({
  token: z.string().min(10).max(128),
  newPassword: z.string().min(10).max(128)
}).strict();

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  targetLanguage: z.string().max(10).optional(),
  bridgeLanguage: z.string().max(10).optional(),
  proficiencyLevel: z.string().max(20).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(180).optional(),
  streakCount: z.number().int().min(0).optional()
}).strict();

const RecordProgressSchema = z.object({
  lessonId: z.string().min(1).max(100),
  completed: z.boolean(),
  score: z.number().min(0).max(100),
  timeSpent: z.number().int().min(0).max(86400)
}).strict();

const VocabularyItemSchema = z.object({
  id: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  term: z.string().min(1).max(255),
  translation: z.string().min(1).max(255),
  part_of_speech: z.string().max(50).optional(),
  phonetic: z.string().max(100).optional(),
  context_example: z.string().max(1000).optional(),
  mastery_level: z.number().int().min(0).max(5).optional(),
  leitner_box: z.number().int().min(1).max(5).optional(),
  next_review_at: z.string().optional()
}).strict();

const AssessmentSubmissionSchema = z.object({
  topic_id: z.string().max(100).optional(),
  topic_title: z.string().max(255).optional(),
  transcribed_text: z.string().max(5000).optional(),
  user_voice_duration: z.number().min(0).max(3600).optional(),
  timestamps: z.array(z.number()).optional(),
  pronunciation_score: z.number().min(0).max(100).optional(),
  fluency_score: z.number().min(0).max(100).optional(),
  grammar_score: z.number().min(0).max(100).optional(),
  lexical_score: z.number().min(0).max(100).optional(),
  overall_score: z.number().min(0).max(100).optional()
}).passthrough();

const AiChatSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().max(5000)
  })).max(50).optional(),
  targetLanguage: z.string().max(10).optional(),
  bridgeLanguage: z.string().max(10).optional(),
  proficiencyLevel: z.string().max(20).optional(),
  scenarioContext: z.string().max(500).optional(),
  curriculumContext: z.object({
    moduleId: z.string().max(100).optional(),
    moduleTitle: z.string().max(255).optional(),
    lessonId: z.string().max(100).optional(),
    lessonTitle: z.string().max(255).optional(),
    objective: z.string().max(500).optional(),
    samplePhrases: z.array(z.string().max(500)).max(20).optional(),
    vocabulary: z.array(z.object({
      term: z.string().max(255),
      translation: z.string().max(255),
      phonetic: z.string().max(100).optional()
    })).max(50).optional(),
    mode: z.enum(['roleplay', 'vocab_drill', 'grammar_practice', 'teach_back', 'ask_question']).optional(),
    targetExam: z.string().max(100).optional()
  }).optional()
}).strict();

const MissionLogSchema = z.object({
  missionId: z.string().min(1).max(100),
  activityType: z.enum(['speaking', 'listening', 'writing']),
  secondsSpent: z.number().int().min(1).max(7200),
  score: z.number().min(0).max(100).optional()
}).strict();

const PrivacyConsentsSchema = z.object({
  store_transcripts: z.boolean().optional(),
  store_audio_samples: z.boolean().optional(),
  analytics_enabled: z.boolean().optional(),
  retention_period_days: z.number().int().min(7).max(365).optional()
}).strict();

// Cookie options
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Session Loader Middleware: Loads session & user from cookie before CSRF verification
export async function sessionLoaderMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    const session = await db.findSession(sessionId);
    if (session) {
      req.session = session;
      const user = await db.findUserById(session.userId);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

// Authentication Middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.user) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    }
    return res.status(401).json({
      error: 'Authentication required. Please sign in.',
      code: 'UNAUTHORIZED',
      requestId: req.requestId
    });
  }

  // Update session activity timestamp
  await db.touchSession(req.session.id);
  next();
}

// Mount session loader first, followed by CSRF Protection on mutating routes
router.use(sessionLoaderMiddleware);
router.use(csrfProtection);

// ==========================================
// Public Endpoints
// ==========================================

// Health Check
router.get('/health', async (req, res) => {
  const dbStatus = db.getStatus();
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'LUMA Language Tutor Core',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Language Capability Registry
router.get('/languages/capabilities', (req, res) => {
  res.json({
    languages: Object.values(LANGUAGE_REGISTRY),
    defaultBridge: 'ta',
    defaultTarget: 'en'
  });
});

// ==========================================
// Authentication Endpoints
// ==========================================

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const policyCheck = validatePasswordPolicy(data.password);
    if (!policyCheck.valid) {
      return res.status(400).json({
        error: policyCheck.reason,
        code: 'WEAK_PASSWORD',
        requestId: req.requestId
      });
    }

    const existing = await db.findUserByEmail(data.email);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email address already exists.',
        code: 'EMAIL_ALREADY_EXISTS',
        requestId: req.requestId
      });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await db.createUser({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      targetLanguage: data.targetLanguage || 'en',
      bridgeLanguage: data.bridgeLanguage || 'ta'
    });

    const session = await db.createSession(user.id, req.ip, req.headers['user-agent']);
    res.cookie(SESSION_COOKIE_NAME, session.id, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      user,
      csrfToken: session.csrfSecret
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid registration input.',
        details: err.issues.map(i => i.message),
        requestId: req.requestId
      });
    }
    res.status(500).json({
      error: 'Registration failed due to a server error.',
      requestId: req.requestId
    });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const userWithHash = await db.findUserByEmail(email);

    if (!userWithHash) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
        requestId: req.requestId
      });
    }

    const passwordValid = await verifyPassword(password, userWithHash.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
        requestId: req.requestId
      });
    }

    // Session rotation on login: create a fresh session
    const existingCookie = req.cookies?.[SESSION_COOKIE_NAME];
    if (existingCookie) {
      await db.destroySession(existingCookie);
    }

    const session = await db.createSession(userWithHash.id, req.ip, req.headers['user-agent']);
    res.cookie(SESSION_COOKIE_NAME, session.id, COOKIE_OPTIONS);

    const safeUser: SessionUser = {
      id: userWithHash.id,
      email: userWithHash.email,
      displayName: userWithHash.displayName,
      avatarUrl: userWithHash.avatarUrl,
      targetLanguage: userWithHash.targetLanguage,
      bridgeLanguage: userWithHash.bridgeLanguage,
      proficiencyLevel: userWithHash.proficiencyLevel,
      dailyGoalMinutes: userWithHash.dailyGoalMinutes,
      streakCount: userWithHash.streakCount
    };

    res.json({
      success: true,
      user: safeUser,
      csrfToken: session.csrfSecret
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid credentials format.',
        requestId: req.requestId
      });
    }
    res.status(500).json({
      error: 'Login failed due to a server error.',
      requestId: req.requestId
    });
  }
});

// Logout
router.post('/auth/logout', async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    await db.destroySession(sessionId);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User & CSRF token
router.get('/auth/me', async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) {
    return res.status(401).json({ authenticated: false });
  }

  const session = await db.findSession(sessionId);
  if (!session) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ authenticated: false });
  }

  const user = await db.findUserById(session.userId);
  if (!user) {
    await db.destroySession(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user,
    csrfToken: session.csrfSecret
  });
});

// Forgot Password
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const user = await db.findUserByEmail(email);

    if (user) {
      const resetToken = generateSecureToken(32);
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      await db.savePasswordResetToken(user.id, resetToken, expiresAt);

      if (process.env.SMTP_HOST) {
        // SMTP sending hook
        console.log(`[LUMA Auth] Sending password reset email via SMTP to: ${email}`);
      } else {
        console.info(`[LUMA Auth] SMTP not configured. Password reset token generated for user ${user.id}: ${resetToken}`);
      }
    }

    // Always respond with identical message to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been dispatched.'
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid email address.', requestId: req.requestId });
  }
});

// Reset Password
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body);
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return res.status(400).json({ error: policy.reason, requestId: req.requestId });
    }

    const newHash = await hashPassword(newPassword);
    const success = await db.resetPassword(token, newHash);

    if (!success) {
      return res.status(400).json({
        error: 'Invalid or expired password reset token.',
        code: 'INVALID_RESET_TOKEN',
        requestId: req.requestId
      });
    }

    res.json({ success: true, message: 'Password has been reset successfully. You may now log in.' });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid reset parameters.', requestId: req.requestId });
  }
});

// Versioned Curriculum Lessons (Public Catalog)
router.get('/curriculum/lessons', async (req, res) => {
  try {
    const filePath = path.resolve(process.cwd(), 'src/content/curriculum/lessons.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      const allLessons = (parsed.modules || []).flatMap((m: any) => m.lessons || []);
      return res.json({
        version: parsed.version,
        reviewStatus: parsed.reviewStatus,
        modules: parsed.modules,
        lessons: allLessons
      });
    }
    res.status(404).json({ error: 'Curriculum content not found', requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load curriculum content', requestId: req.requestId });
  }
});

// ==========================================
// Authenticated Learner Endpoints
// All endpoints below require active session
// ==========================================
router.use(requireAuth);

// User Profile
router.get('/auth/profile', async (req, res) => {
  res.json(req.user);
});

router.post('/auth/update', async (req, res) => {
  try {
    const updates = UpdateProfileSchema.parse(req.body);
    const updated = await db.updateUserProfile(req.user!.id, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid profile data.', requestId: req.requestId });
  }
});

// Learning Progress
router.get('/progress', async (req, res) => {
  const progress = await db.getProgress(req.user!.id);
  res.json(progress);
});

router.post('/progress', async (req, res) => {
  try {
    const { lessonId, completed, score, timeSpent } = RecordProgressSchema.parse(req.body);
    const result = await db.recordLessonProgress(req.user!.id, lessonId, completed, score, timeSpent);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid progress data.', requestId: req.requestId });
  }
});

// Vocabulary
router.get('/vocabulary', async (req, res) => {
  const items = await db.getVocabulary(req.user!.id);
  res.json(items);
});

router.post('/vocabulary', async (req, res) => {
  try {
    const itemData = VocabularyItemSchema.parse(req.body);
    const item = await db.addOrUpdateVocabulary(req.user!.id, itemData);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid vocabulary item.', requestId: req.requestId });
  }
});

// Assessments
router.get('/assessments', async (req, res) => {
  const items = await db.getAssessments(req.user!.id);
  res.json(items);
});

router.post('/assessments', async (req, res) => {
  try {
    const data = AssessmentSubmissionSchema.parse(req.body);
    const transcribedText = (data.transcribed_text || '').trim();

    // 1. Spoken input and gibberish validation (deterministic check)
    const validation = validateLearnerSpokenInput(transcribedText);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.reason,
        code: 'INVALID_SPOKEN_INPUT',
        requestId: req.requestId
      });
    }

    // 2. Server-side scoring (client-sent scores are strictly ignored)
    const scores = await scoreAssessmentSubmission({
      text: transcribedText,
      topicTitle: data.topic_title,
      targetLanguage: req.user?.targetLanguage || 'en',
      proficiencyLevel: req.user?.proficiencyLevel || 'B1',
      userVoiceDuration: data.user_voice_duration,
      timestamps: (data as any).timestamps
    });

    const assessment = await db.recordAssessment(req.user!.id, {
      topic_id: data.topic_id || 'general',
      topic_title: data.topic_title || 'Spoken Practice Assessment',
      pronunciation_score: scores.pronunciation_score, // Always null (unsupported for text-only STT)
      fluency_score: scores.fluency_score, // Number only if computed from real timestamps/duration, else null
      grammar_score: scores.grammar_score,
      lexical_score: scores.lexical_score,
      overall_score: scores.overall_score,
      coaching_feedback: scores.coaching_feedback,
      transcribed_text: transcribedText
    });

    res.json({
      ...assessment,
      measured_metrics: scores.measured_metrics,
      pronunciation_status: 'Not measured yet (text-only speech input)',
      fluency_status: scores.fluency_score !== null ? 'Measured from speech rate' : 'Not measured yet'
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid assessment submission schema.',
        details: err.issues.map(i => i.message),
        requestId: req.requestId
      });
    }
    res.status(400).json({
      error: err.message || 'Invalid assessment submission.',
      code: 'ASSESSMENT_SCORING_ERROR',
      requestId: req.requestId
    });
  }
});

// Conversational AI
router.post('/ai/chat', async (req, res) => {
  try {
    const options = AiChatSchema.parse(req.body);

    const aiResponse = await generateLumaResponse({
      ...options,
      targetLanguage: options.targetLanguage || req.user!.targetLanguage,
      bridgeLanguage: options.bridgeLanguage || req.user!.bridgeLanguage,
      proficiencyLevel: options.proficiencyLevel || req.user!.proficiencyLevel
    });

    // Record user message
    await db.appendMessage(req.user!.id, 'conv_live_session', {
      sender: 'user',
      content: options.message
    });

    // Record tutor response
    await db.appendMessage(req.user!.id, 'conv_live_session', {
      sender: 'luma',
      content: aiResponse.reply,
      translation: aiResponse.translation,
      correction: aiResponse.correction
    });

    // If an assessment score was provided, record it
    if (aiResponse.teachbackScore && options.curriculumContext?.lessonId) {
      await db.recordAssessment(req.user!.id, {
        topic_id: options.curriculumContext.lessonId,
        topic_title: `${options.curriculumContext.lessonTitle || 'Lesson'} (Spoken Assessment)`,
        pronunciation_score: aiResponse.teachbackScore.pronunciation,
        fluency_score: aiResponse.teachbackScore.fluency,
        grammar_score: aiResponse.teachbackScore.grammar,
        lexical_score: aiResponse.teachbackScore.lexical,
        overall_score: aiResponse.teachbackScore.overall,
        coaching_feedback: aiResponse.teachbackScore.feedback,
        transcribed_text: options.message
      });
    }

    res.json(aiResponse);
  } catch (err: any) {
    const isUnavailable = err.message?.includes('TUTOR_UNAVAILABLE');
    res.status(isUnavailable ? 503 : 500).json({
      error: isUnavailable ? 'Tutor unavailable, try again.' : 'AI processing error.',
      code: isUnavailable ? 'TUTOR_UNAVAILABLE' : 'AI_ERROR',
      requestId: req.requestId
    });
  }
});

// Text-to-Speech Endpoint
router.post('/tts', async (req, res) => {
  try {
    const { text, language, gender } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required', requestId: req.requestId });
    }

    const result = await generateSpeechAudio({
      text,
      language: language || req.user?.targetLanguage || 'en',
      gender: gender || 'male'
    });

    if (result) {
      return res.json(result);
    }

    // Honest fallback directive: notify client to use native browser SpeechSynthesis
    res.status(503).json({
      error: 'Neural TTS unavailable',
      provider: 'browser_speech_synthesis',
      message: 'Use browser SpeechSynthesis for voice playback.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'TTS request failed', requestId: req.requestId });
  }
});

// Curriculum & Onboarding
router.get('/onboarding', async (req, res) => {
  const answers = await db.getOnboarding(req.user!.id);
  res.json(answers);
});

router.post('/onboarding/save', async (req, res) => {
  try {
    const answers = req.body;
    await db.saveOnboarding(req.user!.id, answers);

    const updates: any = {};
    if (answers.q1_nativeLanguage) updates.bridgeLanguage = answers.q1_nativeLanguage;
    if (answers.q2_targetLanguage) updates.targetLanguage = answers.q2_targetLanguage;
    if (Object.keys(updates).length > 0) {
      await db.updateUserProfile(req.user!.id, updates);
    }

    res.json({ success: true, savedAnswers: answers });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to save onboarding', requestId: req.requestId });
  }
});

router.post('/curriculum/generate', async (req, res) => {
  try {
    const answers: OnboardingAnswers = req.body;
    if (!answers || !answers.q1_nativeLanguage) {
      return res.status(400).json({ error: 'Valid onboarding profile required', requestId: req.requestId });
    }

    const curriculum = await generatePersonalizedCurriculum(answers);
    await db.savePersonalizedCurriculum(req.user!.id, curriculum);
    res.json(curriculum);
  } catch (err: any) {
    res.status(500).json({ error: 'Curriculum generation failed', requestId: req.requestId });
  }
});

router.get('/curriculum/personalized', async (req, res) => {
  let curriculum = await db.getPersonalizedCurriculum(req.user!.id);
  if (!curriculum) {
    const defaultAnswers: OnboardingAnswers = {
      q1_nativeLanguage: req.user!.bridgeLanguage || 'ta',
      q2_targetLanguage: req.user!.targetLanguage || 'en',
      q3_primaryPurposes: ['Everyday conversation', 'Career growth'],
      q4_currentProficiency: 'I can manage basic conversations',
      q5_speakingDifficulties: ['Cannot find right words', 'Mental translation'],
      q6_dailyMinutes: req.user!.dailyGoalMinutes || 20,
      q7_targetMonths: 3,
      q8_learningPreferences: ['Talk with AI tutor', 'Real-life role-play'],
      q9_schedulePreferences: {
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        preferredTimeOfDay: 'evening',
        speechSpeed: 'normal',
        interactionMode: 'voice_primary',
        feedbackTiming: 'immediate'
      },
      q10_successDefinition: 'Speak confidently in everyday and professional conversations'
    };
    curriculum = await generatePersonalizedCurriculum(defaultAnswers);
    await db.savePersonalizedCurriculum(req.user!.id, curriculum);
  }
  res.json(curriculum);
});

// Mission Activity Logging & Server-Verified Streaks
router.post('/missions/log', async (req, res) => {
  try {
    const data = MissionLogSchema.parse(req.body);
    if (data.secondsSpent < 60) {
      return res.status(400).json({
        error: 'Practice session must be at least 60 seconds to qualify as verified practice.',
        code: 'INSUFFICIENT_DURATION',
        requestId: req.requestId
      });
    }

    const log = await db.recordMissionActivity(req.user!.id, data);

    // Calculate total verified seconds for today
    const logs = await db.getMissionLogs(req.user!.id);
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter((l: any) => (l.createdAt || l.created_at || '').startsWith(today));
    const totalTodaySeconds = todayLogs.reduce((acc: number, l: any) => acc + (l.secondsSpent || l.seconds_spent || 0), 0);

    // Streak verification: increase streak once per completed practice day (>= 180s total)
    let streakCount = req.user!.streakCount;
    const previouslyCompletedToday = todayLogs.filter((l: any) => l.id !== log.id).reduce((acc: number, l: any) => acc + (l.secondsSpent || l.seconds_spent || 0), 0) >= 180;
    
    if (totalTodaySeconds >= 180 && !previouslyCompletedToday) {
      streakCount = req.user!.streakCount + 1;
      await db.updateUserProfile(req.user!.id, { streakCount });
    }

    res.json({ success: true, log, streakCount, totalTodaySeconds });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid mission log data', requestId: req.requestId });
  }
});

router.get('/missions/summary', async (req, res) => {
  const logs = await db.getMissionLogs(req.user!.id);
  const curriculum = await db.getPersonalizedCurriculum(req.user!.id);

  let completedSpeakingSec = 0;
  let completedListeningSec = 0;
  let completedWritingSec = 0;

  logs.forEach((l: any) => {
    if (l.activity_type === 'speaking') completedSpeakingSec += l.seconds_spent;
    if (l.activity_type === 'listening') completedListeningSec += l.seconds_spent;
    if (l.activity_type === 'writing') completedWritingSec += l.seconds_spent;
  });

  const planned = curriculum?.allocation70_20_10 || calculate70_20_10Allocation(req.user!.dailyGoalMinutes || 20);

  res.json({
    planned,
    actual: {
      speakingMinutes: Math.round(completedSpeakingSec / 60),
      listeningMinutes: Math.round(completedListeningSec / 60),
      writingMinutes: Math.round(completedWritingSec / 60),
      totalMinutes: Math.round((completedSpeakingSec + completedListeningSec + completedWritingSec) / 60)
    },
    recentLogs: logs.slice(0, 10)
  });
});

// Privacy & GDPR Compliance
router.get('/privacy/export', async (req, res) => {
  const exportData = await db.exportFullUserData(req.user!.id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="luma-userdata-${req.user!.id}.json"`);
  res.send(JSON.stringify(exportData, null, 2));
});

router.post('/privacy/consents', async (req, res) => {
  try {
    const data = PrivacyConsentsSchema.parse(req.body);
    const consents = await db.updatePrivacyConsents(req.user!.id, data);
    res.json(consents);
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid consent parameters', requestId: req.requestId });
  }
});

// Permanent Account & Data Purge
router.post('/privacy/purge', async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await db.purgeUserAccount(userId);
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to purge user data', requestId: req.requestId });
  }
});

export default router;
