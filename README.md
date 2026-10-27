# LUMA — Articulation & Accent Training Platform

LUMA is a personalized speaking coach that helps learners improve articulation, pronunciation clarity, rhythm, stress, fluency, and speaking confidence through a structured 12-week program.

LUMA is **NOT** a generic language tutor or vocabulary flashcard app. It is a specialized, phonetics-grounded speech training platform designed specifically for native speakers working to master a target language's sounds, consonant clusters, stress patterns, and prosodic rhythm.

---

## Program Vision & Language Roadmap

### Initial Supported Languages (Wave 1)
- **Target Language:** English (`en`) — General American (`en-US`) and Indian English (`en-IN`) accents.
- **Learner Native Languages (L1):**
  - **Tamil (`ta`):** Comprehensive L1 acoustic-phonetic confusion maps (retroflex vs. alveolar, aspirated vs. unaspirated stops, /f/ vs. /p/, consonant cluster epenthesis) and targeted contrast drills.
  - **Arabic (`ar`):** Comprehensive L1 phonological confusion maps (/p/ vs. /b/, /v/ vs. /f/, short vs. long vowel duration, consonant clusters, syllable timing vs. stress timing) and targeted drills.
- **Wave 1 Scope:** English reference content, acoustic pronunciation assessment, Tamil and Arabic interface localization, and Day-0 to Week-12 structured progression.

### Future Roadmap (Wave 2)
- Target-language training in Tamil and Arabic.
- Expanded native language coverage (Hindi, Spanish, German, French).
- Complete localized target drill libraries and right-to-left layout hardening.

---

## Core 12-Week Learner Journey

1. **Authentication & Granular Consent:** Register with Argon2id credentials and grant unbundled, revocable privacy consents for audio retention, transcript retention, and analytics.
2. **Onboarding & Tech Verification:** Native language, target accent, real-world speaking goal (interviews, presentations, client calls), daily duration (10–60 minutes), and microphone hardware calibration.
3. **Day-0 Baseline Assessment:**
   - Read fixed diagnostic passage aloud with model reference comparison.
   - 60-second spontaneous speaking sample.
   - Provider-based acoustic pronunciation assessment.
   - Top candidate sounds identified with plain-language explanations.
4. **Structured Daily Practice (15m default):**
   - **Warm-up (2m):** Respiration, vocal tract relaxation, and articulatory flexibility.
   - **Sound Drills (5m):** Minimal pairs, consonant clusters, word and sentence stress.
   - **Shadowing (4m):** Model speech repetition with rhythm alignment.
   - **Guided Conversation (3m):** Scenario-based speaking with real-time feedback.
   - **Reflection (1m):** Daily review and next session preview.
5. **Checkpoints & Retests:** Weekly mini-retests and full milestone assessments at Weeks 4, 8, and 12.
6. **Final Report & Secure Sharing:** Before/after diagnostic comparison, audio replay (when retained under consent), PDF report export, and expiring, revocable read-only share links.
7. **Privacy & Data Sovereignity:** Full personal data export and immediate cryptographic purge of recordings and account data.

---

## Honest Pronunciation & Measurement Disclosures

LUMA adheres strictly to transparent, honest measurement reporting:
- **`measured`:** An authentic, supported speech assessment measurement from a verified acoustic provider (e.g. Azure Speech Pronunciation Assessment).
- **`estimated`:** Transparently labeled approximation using validated speech recognition alignment and coaching heuristics. Never represented as a laboratory acoustic score.
- **`unavailable`:** Metric cannot be objectively verified; clearly marked as unavailable with no fabricated numerical scores.

---

## Technical Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS v4 token-based design system, Vite 8.
- **Backend:** Node.js / Express 4 full-stack server (`server.ts`).
- **Database:** Neon Serverless PostgreSQL with versioned additive migration runner (`src/server/migrations/`).
- **Audio Capture:** In-browser 16 kHz mono 16-bit PCM WAV recording pipeline with live level metering and 90-second duration caps.
- **Object Storage:** Private S3 / Cloudflare R2 / MinIO compatible storage for encrypted audio clips with short-lived signed URLs.
- **Pronunciation Assessment:** Multi-provider scoring engine (`Azure`, `Estimated`, `Unavailable`) with acoustic phoneme alignment and in-memory hash caching.
- **Visual Coaching Orb:** Three.js WebGL canvas isolated bounding box with automatic CSS fallback for low-power and reduced-motion environments.

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
PORT=3000
NODE_ENV=development

# Neon Serverless PostgreSQL
DATABASE_URL="postgresql://user:password@ep-project.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Session & Security
SESSION_SECRET="your-secure-random-secret-key-at-least-32-chars"

# Optional Cloud Integrations
GEMINI_API_KEY=""
AZURE_SPEECH_KEY=""
AZURE_SPEECH_REGION=""
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
```

### 3. Verification & Testing
```bash
# Type check and linting (must pass with 0 errors)
npm run lint

# Automated test suite
npm test

# Production bundle build
npm run build
```

---

## Health & Probes
- `GET /healthz` — Service process liveness.
- `GET /readyz` — Database connectivity and provider readiness.
