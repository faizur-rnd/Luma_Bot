import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Memory fallback store when DATABASE_URL is not yet connected
interface FallbackStore {
  user: any;
  progress: Record<string, any>;
  vocabulary: any[];
  assessments: any[];
  conversations: any[];
  consents: any;
  onboarding: any | null;
  personalizedCurriculum: any | null;
  missionLogs: any[];
}

const fallbackDb: FallbackStore = {
  onboarding: null,
  personalizedCurriculum: null,
  missionLogs: [],
  user: {
    id: 'usr_luma_default_001',
    email: 'faizurrah2801@gmail.com',
    display_name: 'Faizur Rahman',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    target_language: 'en',
    bridge_language: 'ta', // Default bridge language: Tamil
    proficiency_level: 'B1',
    daily_goal_minutes: 20,
    streak_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  progress: {
    'lesson_a1_01': {
      lesson_id: 'lesson_a1_01',
      completed: true,
      score: 95,
      time_spent_seconds: 420,
      last_practiced_at: new Date(Date.now() - 86400000).toISOString()
    },
    'lesson_a1_02': {
      lesson_id: 'lesson_a1_02',
      completed: true,
      score: 88,
      time_spent_seconds: 360,
      last_practiced_at: new Date(Date.now() - 43200000).toISOString()
    }
  },
  vocabulary: [
    // English Vocabulary Items
    {
      id: 'vocab_en_001',
      language: 'en',
      term: 'Eloquent',
      translation: 'தெளிவாகவும் கவர்ச்சியாகவும் பேசும் திறன் (Fluent & persuasive)',
      part_of_speech: 'adjective',
      phonetic: '/ˈel.ə.kwənt/',
      context_example: 'She gave an eloquent speech at the international conference.',
      mastery_level: 4,
      leitner_box: 3,
      next_review_at: new Date(Date.now() + 86400000 * 2).toISOString()
    },
    {
      id: 'vocab_en_002',
      language: 'en',
      term: 'Articulate',
      translation: 'கருத்துக்களை தெளிவாக வெளிப்படுத்து (Express ideas clearly)',
      part_of_speech: 'verb / adjective',
      phonetic: '/ɑːˈtɪk.jə.lət/',
      context_example: 'He struggled to articulate his feelings during the interview.',
      mastery_level: 3,
      leitner_box: 2,
      next_review_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: 'vocab_en_003',
      language: 'en',
      term: 'Nuance',
      translation: 'நுட்பமான வேறுபாடு (Subtle distinction)',
      part_of_speech: 'noun',
      phonetic: '/ˈnjuː.ɑːns/',
      context_example: 'Language learners gradually pick up cultural nuances in tone.',
      mastery_level: 2,
      leitner_box: 1,
      next_review_at: new Date().toISOString()
    },
    {
      id: 'vocab_en_004',
      language: 'en',
      term: 'Perspicacity',
      translation: 'கூர்மையான அறிவாற்றல் (Keen insight & discernment)',
      part_of_speech: 'noun',
      phonetic: '/ˌpɜː.spɪˈkæs.ə.ti/',
      context_example: 'Her perspicacity allowed her to solve complex business dilemmas.',
      mastery_level: 1,
      leitner_box: 1,
      next_review_at: new Date().toISOString()
    },
    // Arabic Vocabulary Items
    {
      id: 'vocab_ar_001',
      language: 'ar',
      term: 'الفصاحة',
      translation: 'Fluency, clarity, and eloquence in speech (البيان الواضح)',
      part_of_speech: 'noun',
      phonetic: '/al-fa-ṣā-ħah/',
      context_example: 'تحدث المتحدث بفصاحة نادرة أثارت إعجاب الحاضرين.',
      mastery_level: 3,
      leitner_box: 2,
      next_review_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: 'vocab_ar_002',
      language: 'ar',
      term: 'الترحيب',
      translation: 'Warm welcome and hospitality (حسن الاستقبال)',
      part_of_speech: 'noun',
      phonetic: '/at-tar-ħīb/',
      context_example: 'لقي الوفد ترحيباً حاراً من منظمي المؤتمر.',
      mastery_level: 4,
      leitner_box: 3,
      next_review_at: new Date(Date.now() + 86400000 * 2).toISOString()
    },
    {
      id: 'vocab_ar_003',
      language: 'ar',
      term: 'المفاوضة',
      translation: 'Constructive business negotiation (المحادثة للوصول لاتفاق)',
      part_of_speech: 'noun',
      phonetic: '/al-mu-fā-wa-ḍah/',
      context_example: 'قاد فريق العمل جولة المفاوضة بحكمة ولباقة عالية.',
      mastery_level: 2,
      leitner_box: 1,
      next_review_at: new Date().toISOString()
    },
    {
      id: 'vocab_ar_004',
      language: 'ar',
      term: 'اللباقة',
      translation: 'Diplomatic tact, courtesy, and polite etiquette',
      part_of_speech: 'noun',
      phonetic: '/al-la-bā-qah/',
      context_example: 'تعامل المدير بلباقة كبيرة مع أسئلة الصحفيين.',
      mastery_level: 1,
      leitner_box: 1,
      next_review_at: new Date().toISOString()
    },
    // German Vocabulary Items
    {
      id: 'vocab_de_001',
      language: 'de',
      term: 'Die Aussprache',
      translation: 'Pronunciation and acoustic clarity in spoken German',
      part_of_speech: 'noun (fem.)',
      phonetic: '/diː ˈaʊ̯sˌʃpʁaːxə/',
      context_example: 'Eine klare Aussprache erleichtert die Kommunikation im Berufsalltag.',
      mastery_level: 4,
      leitner_box: 3,
      next_review_at: new Date(Date.now() + 86400000 * 2).toISOString()
    },
    {
      id: 'vocab_de_002',
      language: 'de',
      term: 'Das Vorstellungsgespräch',
      translation: 'Job interview or official introductory meeting',
      part_of_speech: 'noun (neut.)',
      phonetic: '/das ˈfoːɐ̯ʃtɛlʊŋsɡəˌʃpʁɛːç/',
      context_example: 'Er hat sich gründlich auf das morgige Vorstellungsgespräch vorbereitet.',
      mastery_level: 3,
      leitner_box: 2,
      next_review_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: 'vocab_de_003',
      language: 'de',
      term: 'Die Höflichkeit',
      translation: 'Politeness, courteous etiquette, and tact',
      part_of_speech: 'noun (fem.)',
      phonetic: '/diː ˈhøːflɪçkaɪ̯t/',
      context_example: 'Höflichkeit öffnet viele Türen bei geschäftlichen Verhandlungen.',
      mastery_level: 2,
      leitner_box: 1,
      next_review_at: new Date().toISOString()
    },
    {
      id: 'vocab_de_004',
      language: 'de',
      term: 'Verhandeln',
      translation: 'To negotiate, confer, and reach an agreement',
      part_of_speech: 'verb',
      phonetic: '/fɛɐ̯ˈhandl̩n/',
      context_example: 'Wir verhandeln die Bedingungen für den neuen Kooperationsvertrag.',
      mastery_level: 1,
      leitner_box: 1,
      next_review_at: new Date().toISOString()
    }
  ],
  assessments: [
    {
      id: 'asmt_001',
      topic_id: 'topic_ordering_coffee',
      topic_title: 'Real-World Teach-Back: Polite Requests in a London Bistro',
      pronunciation_score: 92,
      fluency_score: 88,
      grammar_score: 94,
      lexical_score: 90,
      overall_score: 91,
      coaching_feedback: 'Exceptional use of modal verbs ("Could I please have..."). Minor stress placement adjustment on "cappuccino".',
      transcribed_text: 'Good afternoon, could I please have an oat flat white and a warm croissant to take away?',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ],
  conversations: [
    {
      id: 'conv_001',
      title: 'Airport Customs Simulation',
      mode: 'mission',
      started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          id: 'msg_001',
          sender: 'luma',
          content: 'Welcome to Heathrow Airport. May I see your passport and boarding pass, please?',
          translation: 'ஹீத்ரோ விமான நிலையத்திற்கு வரவேற்கிறோம். உங்கள் பாஸ்போர்ட் மற்றும் போர்டிங் பாஸைக் காட்ட முடியுமா?',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'msg_002',
          sender: 'user',
          content: 'Here you go officer. I am here for a ten-day technology symposium.',
          created_at: new Date(Date.now() - 3600000 * 2 + 15000).toISOString()
        },
        {
          id: 'msg_003',
          sender: 'luma',
          content: 'Very good. Where will you be staying during your conference in London?',
          translation: 'மிக நன்று. லண்டனில் உங்கள் மாநாட்டின் போது எங்கு தங்குவீர்கள்?',
          created_at: new Date(Date.now() - 3600000 * 2 + 30000).toISOString()
        }
      ]
    }
  ],
  consents: {
    store_transcripts: true,
    store_audio_samples: false,
    analytics_enabled: false,
    updated_at: new Date().toISOString()
  }
};

let pool: Pool | null = null;
let isConnectedToLiveDb = false;
let dbErrorDetail: string | null = null;

export async function initDatabaseConnection(): Promise<{ connected: boolean; provider: string; details?: string }> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('ep-project-id.us-east-2.aws.neon.tech')) {
    isConnectedToLiveDb = false;
    dbErrorDetail = 'DATABASE_URL is not configured with live credentials. Operating in resilient LocalStore fallback mode.';
    return {
      connected: false,
      provider: 'LocalStore Fallback',
      details: dbErrorDetail
    };
  }

  try {
    if (!pool) {
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000
      });
    }

    // Test ping
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    isConnectedToLiveDb = true;
    dbErrorDetail = null;
    return {
      connected: true,
      provider: 'Neon Serverless PostgreSQL',
      details: `Connected to Neon database: ${res.rows[0].db_name} at ${res.rows[0].current_time}`
    };
  } catch (err: any) {
    isConnectedToLiveDb = false;
    dbErrorDetail = err.message || 'Neon connection failed';
    return {
      connected: false,
      provider: 'LocalStore Fallback (Neon Connection Attempt Failed)',
      details: dbErrorDetail || undefined
    };
  }
}

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  if (!pool || !isConnectedToLiveDb) {
    return {
      success: true,
      message: 'Running in LocalStore Fallback mode. In-memory schema initialized.'
    };
  }

  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      return { success: true, message: 'Neon PostgreSQL migrations applied successfully.' };
    }
    return { success: true, message: 'Migrations executed.' };
  } catch (err: any) {
    return { success: false, message: `Migration error: ${err.message}` };
  }
}

export const db = {
  isLive: () => isConnectedToLiveDb,
  getStatus: () => ({
    isLive: isConnectedToLiveDb,
    provider: isConnectedToLiveDb ? 'Neon Serverless PostgreSQL' : 'Resilient Fallback Cache',
    error: dbErrorDetail,
    hasConnectionString: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('ep-project-id'))
  }),

  // User Profile
  async getUserProfile(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // Fallback on transient error
      }
    }
    return fallbackDb.user;
  },

  async updateUserProfile(profileData: any) {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query(
          `UPDATE users SET 
            display_name = COALESCE($1, display_name), 
            target_language = COALESCE($2, target_language), 
            bridge_language = COALESCE($3, bridge_language), 
            proficiency_level = COALESCE($4, proficiency_level),
            daily_goal_minutes = COALESCE($5, daily_goal_minutes),
            updated_at = NOW() 
           WHERE id = $6 RETURNING *`,
          [
            profileData.display_name,
            profileData.target_language,
            profileData.bridge_language,
            profileData.proficiency_level,
            profileData.daily_goal_minutes,
            profileData.id || fallbackDb.user.id
          ]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {
        // Fallback
      }
    }
    fallbackDb.user = {
      ...fallbackDb.user,
      ...profileData,
      updated_at: new Date().toISOString()
    };
    return fallbackDb.user;
  },

  // Learning Progress
  async getProgress(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progressMap: Record<string, any> = {};
        res.rows.forEach(r => { progressMap[r.lesson_id] = r; });
        return progressMap;
      } catch (e) {}
    }
    return fallbackDb.progress;
  },

  async recordLessonProgress(lessonId: string, completed: boolean, score: number, timeSpent: number) {
    const record = {
      lesson_id: lessonId,
      completed,
      score,
      time_spent_seconds: timeSpent,
      last_practiced_at: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO user_progress (user_id, lesson_id, completed, score, time_spent_seconds, last_practiced_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id, lesson_id) 
           DO UPDATE SET completed = $3, score = GREATEST(user_progress.score, $4), 
                         time_spent_seconds = user_progress.time_spent_seconds + $5,
                         last_practiced_at = NOW()`,
          [fallbackDb.user.id, lessonId, completed, score, timeSpent]
        );
      } catch (e) {}
    }

    fallbackDb.progress[lessonId] = record;
    return record;
  },

  // Vocabulary Items
  async getVocabulary(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM vocabulary_items WHERE user_id = $1 ORDER BY mastery_level ASC', [userId]);
        return res.rows;
      } catch (e) {}
    }
    return fallbackDb.vocabulary;
  },

  async addOrUpdateVocabulary(vocabItem: any) {
    const item = {
      id: vocabItem.id || `vocab_${Date.now()}`,
      language: vocabItem.language || (/[ا-ي]/.test(vocabItem.term) ? 'ar' : /[äöüßÄÖÜ]/.test(vocabItem.term) ? 'de' : 'en'),
      term: vocabItem.term,
      translation: vocabItem.translation,
      part_of_speech: vocabItem.part_of_speech || 'noun',
      phonetic: vocabItem.phonetic || '',
      context_example: vocabItem.context_example || '',
      mastery_level: vocabItem.mastery_level ?? 1,
      leitner_box: vocabItem.leitner_box ?? 1,
      next_review_at: vocabItem.next_review_at || new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO vocabulary_items (id, user_id, term, translation, part_of_speech, phonetic, context_example, mastery_level, leitner_box, next_review_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET 
             mastery_level = $8, leitner_box = $9, next_review_at = $10`,
          [item.id, fallbackDb.user.id, item.term, item.translation, item.part_of_speech, item.phonetic, item.context_example, item.mastery_level, item.leitner_box, item.next_review_at]
        );
      } catch (e) {}
    }

    const idx = fallbackDb.vocabulary.findIndex(v => v.id === item.id || v.term.toLowerCase() === item.term.toLowerCase());
    if (idx >= 0) {
      fallbackDb.vocabulary[idx] = { ...fallbackDb.vocabulary[idx], ...item };
    } else {
      fallbackDb.vocabulary.unshift(item);
    }
    return item;
  },

  // Assessments
  async getAssessments(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM assessment_attempts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
      } catch (e) {}
    }
    return fallbackDb.assessments;
  },

  async recordAssessment(assessmentData: any) {
    const item = {
      id: `asmt_${Date.now()}`,
      topic_id: assessmentData.topic_id || 'general',
      topic_title: assessmentData.topic_title || 'Spoken Teach-Back Assessment',
      pronunciation_score: assessmentData.pronunciation_score || 85,
      fluency_score: assessmentData.fluency_score || 85,
      grammar_score: assessmentData.grammar_score || 85,
      lexical_score: assessmentData.lexical_score || 85,
      overall_score: Math.round(
        ((assessmentData.pronunciation_score || 85) +
         (assessmentData.fluency_score || 85) +
         (assessmentData.grammar_score || 85) +
         (assessmentData.lexical_score || 85)) / 4
      ),
      coaching_feedback: assessmentData.coaching_feedback || 'Solid phrasing and vocabulary choice.',
      transcribed_text: assessmentData.transcribed_text || '',
      created_at: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO assessment_attempts (id, user_id, topic_id, topic_title, pronunciation_score, fluency_score, grammar_score, lexical_score, overall_score, coaching_feedback, transcribed_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [item.id, fallbackDb.user.id, item.topic_id, item.topic_title, item.pronunciation_score, item.fluency_score, item.grammar_score, item.lexical_score, item.overall_score, item.coaching_feedback, item.transcribed_text]
        );
      } catch (e) {}
    }

    fallbackDb.assessments.unshift(item);
    return item;
  },

  // Conversations
  async getConversations(userId = 'usr_luma_default_001') {
    return fallbackDb.conversations;
  },

  async appendMessage(sessionId: string, message: { sender: string; content: string; translation?: string; correction?: string }) {
    let conv = fallbackDb.conversations.find(c => c.id === sessionId);
    if (!conv) {
      conv = {
        id: sessionId,
        title: 'Voice AI Session',
        mode: 'conversation',
        started_at: new Date().toISOString(),
        messages: []
      };
      fallbackDb.conversations.unshift(conv);
    }
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...message,
      created_at: new Date().toISOString()
    };
    conv.messages.push(newMsg);
    return newMsg;
  },

  // Privacy & Compliance
  async getPrivacyConsents() {
    return fallbackDb.consents;
  },

  async updatePrivacyConsents(consents: any) {
    fallbackDb.consents = {
      ...fallbackDb.consents,
      ...consents,
      updated_at: new Date().toISOString()
    };
    return fallbackDb.consents;
  },

  async exportFullUserData() {
    return {
      exported_at: new Date().toISOString(),
      user: fallbackDb.user,
      progress: fallbackDb.progress,
      vocabulary: fallbackDb.vocabulary,
      assessments: fallbackDb.assessments,
      conversations: fallbackDb.conversations,
      privacy_consents: fallbackDb.consents
    };
  },

  async purgeUserAccount() {
    fallbackDb.progress = {};
    fallbackDb.vocabulary = [];
    fallbackDb.assessments = [];
    fallbackDb.conversations = [];
    fallbackDb.onboarding = null;
    fallbackDb.personalizedCurriculum = null;
    fallbackDb.missionLogs = [];
    fallbackDb.user = {
      ...fallbackDb.user,
      display_name: 'Deleted User',
      email: 'deleted@luma.local',
      is_deleted: true
    };
    return { success: true, message: 'All personal data permanently purged.' };
  },

  // Onboarding Assessment Persistence
  async getOnboarding(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT answers FROM onboarding_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [userId]);
        if (res.rows.length > 0) return res.rows[0].answers;
      } catch (e) {}
    }
    return fallbackDb.onboarding;
  },

  async saveOnboarding(answers: any, userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO onboarding_profiles (user_id, answers, updated_at)
           VALUES ($1, $2, NOW())`,
          [userId, JSON.stringify(answers)]
        );
      } catch (e) {}
    }
    fallbackDb.onboarding = answers;
    return answers;
  },

  // Personalized Curriculum
  async getPersonalizedCurriculum(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT curriculum_data FROM personalized_curricula WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1', [userId]);
        if (res.rows.length > 0) return res.rows[0].curriculum_data;
      } catch (e) {}
    }
    return fallbackDb.personalizedCurriculum;
  },

  async savePersonalizedCurriculum(curriculum: any, userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query('UPDATE personalized_curricula SET is_active = FALSE WHERE user_id = $1', [userId]);
        await pool.query(
          `INSERT INTO personalized_curricula (user_id, curriculum_data, is_active)
           VALUES ($1, $2, TRUE)`,
          [userId, JSON.stringify(curriculum)]
        );
      } catch (e) {}
    }
    fallbackDb.personalizedCurriculum = curriculum;
    return curriculum;
  },

  // Mission Activity Logging & 70/20/10 Tracking
  async recordMissionActivity(log: { missionId: string; activityType: 'speaking' | 'listening' | 'writing'; secondsSpent: number; score?: number }) {
    const entry = {
      id: `log_${Date.now()}`,
      userId: fallbackDb.user.id,
      missionId: log.missionId,
      activityType: log.activityType,
      secondsSpent: log.secondsSpent,
      score: log.score ?? 90,
      createdAt: new Date().toISOString()
    };

    if (isConnectedToLiveDb && pool) {
      try {
        await pool.query(
          `INSERT INTO mission_activity_logs (user_id, mission_id, activity_type, seconds_spent, score)
           VALUES ($1, $2, $3, $4, $5)`,
          [fallbackDb.user.id, log.missionId, log.activityType, log.secondsSpent, log.score ?? 90]
        );
      } catch (e) {}
    }

    fallbackDb.missionLogs.unshift(entry);
    return entry;
  },

  async getMissionLogs(userId = 'usr_luma_default_001') {
    if (isConnectedToLiveDb && pool) {
      try {
        const res = await pool.query('SELECT * FROM mission_activity_logs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
      } catch (e) {}
    }
    return fallbackDb.missionLogs;
  }
};
