# LUMA — Neon Serverless PostgreSQL Architecture & Operations Guide

**Database Platform:** Neon Serverless PostgreSQL  
**Integration Library:** `@neondatabase/serverless`  
**Target Environment:** Server-side backend API (Express / Node.js)

---

## 1. Security & Credentials Isolation

- **Privileged Credentials Rule:** `DATABASE_URL` is kept strictly on the backend. Client code (browser/mobile) communicates with Neon exclusively via authenticated API endpoints (`/api/*`).
- **Connection Format:**
  `postgresql://[user]:[password]@[endpoint].us-east-2.aws.neon.tech/[dbname]?sslmode=require`
- **TLS Configuration:** SSL mode `require` is enforced for all queries.

---

## 2. Database Schema Definition

```sql
-- Core users & profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  target_language VARCHAR(10) DEFAULT 'en',
  bridge_language VARCHAR(10) DEFAULT 'ta', -- ta (Tamil), hi (Hindi), ar (Arabic), es (Spanish), fr (French)
  proficiency_level VARCHAR(20) DEFAULT 'B1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User learning progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Vocabulary Vault with Spaced Repetition (SR)
CREATE TABLE IF NOT EXISTS vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  term VARCHAR(255) NOT NULL,
  translation VARCHAR(255) NOT NULL,
  part_of_speech VARCHAR(50),
  context_example TEXT,
  mastery_level INTEGER DEFAULT 1, -- 1 to 5
  leitner_box INTEGER DEFAULT 1,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teach-Back Assessments & Authoritative Scoring
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Conversation Sessions & Messages
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Interactive Practice',
  mode VARCHAR(50) DEFAULT 'free_conversation',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL, -- 'user' or 'luma'
  content TEXT NOT NULL,
  translation TEXT,
  audio_url TEXT,
  correction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent, Privacy & Data Compliance
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  store_transcripts BOOLEAN DEFAULT TRUE,
  store_audio_samples BOOLEAN DEFAULT FALSE,
  analytics_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Resilient Fallback Strategy

When `DATABASE_URL` is unconfigured or Neon is temporarily unreachable:
1. The server catches connection failures gracefully and sets `neon_status = 'disconnected_fallback'`.
2. Learning progress, vocabulary, and assessment attempts are maintained in-memory and synced to the client's LocalStorage.
3. The Database Console panel displays the real-time status and gives the user one-click instructions and status verification.
4. When `DATABASE_URL` is supplied in `.env` or the Secrets panel, the migration endpoint executes DDL idempotently.
