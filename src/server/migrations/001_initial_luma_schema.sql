-- Migration 001: Initial LUMA Speaking Coach Schema
-- Target: Neon PostgreSQL / Cloud SQL / PostgreSQL 15+

-- 1. Schema Migrations Tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  checksum VARCHAR(64)
);

-- 2. Core Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  target_language VARCHAR(10) DEFAULT 'en',
  bridge_language VARCHAR(10) DEFAULT 'ta',
  proficiency_level VARCHAR(20) DEFAULT 'B1',
  daily_goal_minutes INTEGER DEFAULT 15,
  streak_count INTEGER DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires_at TIMESTAMPTZ,
  native_language VARCHAR(10) DEFAULT 'ta',
  target_accent VARCHAR(20) DEFAULT 'en-US',
  goal VARCHAR(50) DEFAULT 'conversation',
  program_start_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add additive profile columns if users table pre-existed
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language VARCHAR(10) DEFAULT 'ta';
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_accent VARCHAR(20) DEFAULT 'en-US';
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal VARCHAR(50) DEFAULT 'conversation';
ALTER TABLE users ADD COLUMN IF NOT EXISTS program_start_date TIMESTAMPTZ DEFAULT NOW();

-- 3. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_secret VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 4. Privacy Consents (Unbundled & Revocable)
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  store_transcripts BOOLEAN DEFAULT TRUE,
  store_audio_samples BOOLEAN DEFAULT FALSE,
  analytics_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audio Recordings
CREATE TABLE IF NOT EXISTS audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('baseline', 'drill', 'conversation', 'retest')),
  storage_key VARCHAR(512) NOT NULL,
  duration_ms INTEGER NOT NULL,
  sample_rate INTEGER DEFAULT 16000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Articulation Drills Catalog
CREATE TABLE IF NOT EXISTS drills (
  id VARCHAR(100) PRIMARY KEY,
  language VARCHAR(10) NOT NULL,
  l1 VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  level VARCHAR(20) DEFAULT 'beginner',
  review_status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pronunciation Attempts (Acoustic and Alignment Evaluations)
CREATE TABLE IF NOT EXISTS pronunciation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES audio_recordings(id) ON DELETE SET NULL,
  drill_id VARCHAR(100),
  reference_text TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL,
  accuracy REAL,
  fluency REAL,
  prosody REAL,
  completeness REAL,
  overall REAL,
  phonemes JSONB,
  words JSONB,
  measurement_status VARCHAR(20) NOT NULL CHECK (measurement_status IN ('measured', 'estimated', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 12-Week Program Enrollments
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL DEFAULT 1,
  plan JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

-- 9. Checkpoints (Baseline, Weekly Mini-Retest, Weeks 4, 8, 12 Retests)
CREATE TABLE IF NOT EXISTS checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('baseline', 'weekly', 'retest')),
  attempt_id UUID REFERENCES pronunciation_attempts(id) ON DELETE SET NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Phoneme Mastery Tracker (Spaced Repetition & Weak Phoneme Focus)
CREATE TABLE IF NOT EXISTS phoneme_mastery (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  phoneme VARCHAR(20) NOT NULL,
  mastery REAL NOT NULL DEFAULT 0.0,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, language, phoneme)
);

-- 11. Shared Reports (Expiring, Revocable Read-Only Sharing)
CREATE TABLE IF NOT EXISTS shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  report_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Supporting Tables for Conversational Practice & Mission Logs
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Conversational Practice',
  mode VARCHAR(50) DEFAULT 'free_conversation',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  translation TEXT,
  correction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mission_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id VARCHAR(100) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  seconds_spent INTEGER NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personalized_curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_data JSONB NOT NULL,
  version VARCHAR(20) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'en',
  term VARCHAR(255) NOT NULL,
  translation VARCHAR(255) NOT NULL,
  part_of_speech VARCHAR(50),
  context_example TEXT,
  phonetic VARCHAR(100),
  mastery_level INTEGER DEFAULT 1,
  leitner_box INTEGER DEFAULT 1,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(100) NOT NULL,
  topic_title VARCHAR(255) NOT NULL,
  pronunciation_score INTEGER CHECK (pronunciation_score BETWEEN 0 AND 100),
  fluency_score INTEGER CHECK (fluency_score BETWEEN 0 AND 100),
  grammar_score INTEGER CHECK (grammar_score BETWEEN 0 AND 100),
  lexical_score INTEGER CHECK (lexical_score BETWEEN 0 AND 100),
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  coaching_feedback TEXT,
  transcribed_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & query isolation
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_deleted ON audio_recordings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_drills_lang_l1 ON drills(language, l1);
CREATE INDEX IF NOT EXISTS idx_drills_category ON drills(category);
CREATE INDEX IF NOT EXISTS idx_pronunciation_attempts_user ON pronunciation_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_attempts_recording ON pronunciation_attempts(recording_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user ON program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_user ON checkpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_phoneme_mastery_review ON phoneme_mastery(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports(token_hash);
CREATE INDEX IF NOT EXISTS idx_shared_reports_user ON shared_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_curricula_user ON personalized_curricula(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_logs_user ON mission_activity_logs(user_id);
