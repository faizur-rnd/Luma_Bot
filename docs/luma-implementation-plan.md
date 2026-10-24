# LUMA — Detailed Implementation Plan

**Goal:** Transform the LUMA application into a production-grade, multi-platform language learning ecosystem powered by Aurora design tokens, Three.js voice orb Particle Orb, Neon Serverless PostgreSQL, and real-time AI speech processing.

---

## Phase Execution Roadmap

### Step 1: Design Tokens & CSS Architecture
- Define root CSS variables for Light Mode and Dark Mode.
- Define gradients: Aurora Spectrum, Cosmic Pulse, Ocean Intelligence, Sunrise Energy, Mint Aurora.
- Implement theme toggle provider with system preference detection and LocalStorage persistence.

### Step 2: Three.js voice orb Particle Orb (`VoiceOrb.tsx`)
- Particle point cloud using dynamic geometry attributes (1,800+ particles).
- Organic mathematical wave displacement with per-vertex noise simulation.
- Multi-spectral coloring using gradient interpolation between Cyan (`#22D3EE`), Violet (`#8B5CF6`), Magenta (`#D946EF`), and Coral (`#FB7185`).
- State-driven animation speeds and particle expansions for `idle`, `listening`, `transcribing`, `thinking`, `speaking`, `interrupted`, `reconnecting`, `offline_error`.
- Web Audio API AnalyserNode integration to make the orb react to actual microphone input and speech synthesis.
- Reduced-motion toggle support and graceful Canvas2D fallback.

### Step 3: Neon Serverless PostgreSQL Data Layer (`server/db.ts` & `server/migrations.sql`)
- Database connection pool using `@neondatabase/serverless`.
- Full DDL schema for:
  - `users`, `profiles`, `languages`
  - `curriculum_lessons`, `user_progress`
  - `vocabulary_items`, `assessment_attempts`
  - `conversation_sessions`, `messages`
  - `privacy_consents`, `audit_logs`
- Connection health check route `/api/health/db`.
- Automatic fallback store for offline / unconfigured database environments.

### Step 4: AI Voice & Speech Learning Service (`src/services/speech.ts` & `src/services/ai.ts`)
- Target language: English.
- Bridge languages: Tamil (தமிழ்), Hindi (हिन्दी), Arabic (العربية), Spanish (Español), French (Français).
- Speech Recognition with fallback to text input.
- Text-to-Speech synthesis with adjustable pitch, rate, and voice accents.
- Server-side Gemini API conversational tutor endpoint with real-time feedback, grammar hints, and bridge-language explanations.

### Step 5: Core Learning Journeys & Modules
1. **Voice AI Conversation:** Real-time conversation with Voice Orb visualization, instant grammar coaching, pronunciation guidance, and bridge language translations.
2. **Curriculum Roadmap:** Progression through Beginner (A1), Elementary (A2), Intermediate (B1), Upper-Intermediate (B2), and Advanced (C1).
3. **Real-World Missions:** High-stakes roleplay challenges (e.g., Airport Customs, Coffee Order, Software Architecture Job Interview, Medical Consultation).
4. **Teach-Back Assessment:** Authoritative scoring across Pronunciation, Fluency, Grammar, and Lexical Resource with detailed feedback.
5. **Vocabulary Vault:** Spaced repetition flashcards with Leitner box algorithm and audio pronunciation.
6. **Neon DB Console:** Live connection status, migration runner, latency monitor, and table inspector.
7. **Privacy & Settings:** Data export, account deletion, transcript toggle, and theme controls.

### Step 6: Testing, Verification & Release Review
- Run typecheck and compilation tests.
- Verify color contrast and WCAG compliance.
- Complete release documentation: `docs/neon-database.md`, `docs/luma-acceptance-matrix.md`, `docs/luma-cleanup-log.md`, `docs/luma-release-report.md`.
