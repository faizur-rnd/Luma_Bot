# LUMA — Find Your Voice. Think in a New Language.

LUMA is an AI-powered conversational language tutor featuring real-time speech interaction, a signature 3D Voice Orb, structured CEFR curriculum, spoken Teach-Back assessments, and Neon Serverless PostgreSQL persistence.

---

## Key Features

- **Multicolor Aurora Design System:** Authentic visual identity supporting fully responsive Light and Dark themes, Aurora brand tokens, and signature spectrum gradients.
- **Signature 3D Voice Orb:** Built with Three.js featuring 1,920 dynamic particles, delicate wireframe connections, organic wave deformation, and Web Audio API live microphone reactivity.
- **Dynamic Voice Session States:** Integrated across 8 genuine states: `idle`, `listening`, `transcribing`, `thinking`, `speaking`, `interrupted`, `reconnecting`, and `offline_error`.
- **Multilingual Bridge Learning:** English target language with instant bridge support for Tamil (தமிழ்), Hindi (हिन्दी), Arabic (العربية), Spanish (Español), and French (Français).
- **CEFR Guided Curriculum:** Progressive modules from Foundational A1 to Executive C1 with scenario simulations.
- **Authoritative Teach-Back Assessment:** Spoken oral examination engine evaluating Pronunciation (0-100), Fluency (0-100), Grammar (0-100), and Lexical Resource (0-100).
- **Spaced Repetition Vocabulary Vault:** Leitner 5-box algorithm for active vocabulary retention and audio playback.
- **Neon Serverless PostgreSQL:** Backend database integration (`@neondatabase/serverless`) with connection pooling, automated schema migrations, health checks, and a resilient zero-crash fallback cache.
- **Privacy & Compliance:** Complete JSON user data export and GDPR-compliant account wipeout.

---

## Getting Started

### 1. Installation & Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### 2. Environment Variables

Create `.env` using `.env.example`:

```bash
# Gemini AI API Key (automatically injected in AI Studio)
GEMINI_API_KEY="YOUR_KEY"

# Neon Serverless PostgreSQL Connection String
DATABASE_URL="postgresql://user:password@ep-project-id.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

*Note:* When `DATABASE_URL` is omitted, LUMA automatically operates in resilient LocalStore Fallback mode with zero crashes.

### 3. Build & Production

```bash
npm run build
npm start
```

---

## Architectural Documentation

Full system specifications and audits are available in `docs/`:
- `docs/luma-requirements-analysis.md`
- `docs/luma-audit.md`
- `docs/luma-implementation-plan.md`
- `docs/luma-acceptance-matrix.md`
- `docs/neon-database.md`
- `docs/luma-cleanup-log.md`
- `docs/luma-release-report.md`
