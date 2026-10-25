# LUMA — Spoken Language Tutor

LUMA is an AI-powered conversational language tutor featuring real-time speech interaction, a responsive isolated 3D Voice Orb, structured practice modules, active recall flashcards, and conceptual explain-back evaluation.

---

## Key Features

- **Token-Based Design System:** Accessible light and dark themes with WCAG 2.2 AA contrast verified (> 4.5:1 across all text pairs).
- **Isolated 3D Voice Orb:** Three.js WebGL canvas isolated with `isolation: isolate; overflow: clip;`, zero black patches in light mode, ResizeObserver container tracking, and a lightweight animated CSS fallback for low-power devices.
- **Plain Language Experience:** Clean, jargon-free navigation ("Today's practice", "Explain it back", "My words", "Language you speak", "Language you want to learn", "Beginner / Intermediate / Advanced").
- **Server-Side Assessment Scoring:** Deterministic validation against empty or repetitive speech combined with structured AI evaluation. Pronunciation and unmeasured metrics are honestly reported as "Not measured yet".
- **Multi-Tenant Security:** Argon2id password hashing, strict CSRF token validation on mutating requests, exact origin allowlist, rate limiting on authentication routes, and multi-tenant data isolation.
- **Transparent Database Persistence:** Neon Serverless PostgreSQL persistence. Catch-and-fallbacks are prohibited in production (`NODE_ENV=production`), ensuring clear error reporting.

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
# Required in production: Port and Node environment
PORT=3000
NODE_ENV=development

# Gemini API Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Neon Serverless PostgreSQL Database Connection
DATABASE_URL="postgresql://user:password@ep-project-id.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Session Secret (32+ character random string)
SESSION_SECRET="replace-with-a-secure-random-secret-key-at-least-32-chars"
```

### 3. Verification & Testing

```bash
# Run lint and TypeScript typechecks
npm run lint

# Run automated system & HTTP test suite (44 tests)
npm test

# Build production client bundle
npm run build
```

### 4. Health Check Endpoints

- `GET /healthz` - Process liveness check
- `GET /readyz` - Application and database readiness check
