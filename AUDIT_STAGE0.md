# LUMA Language Tutor - Stage 0 Baseline Audit

Date: 2026-10-24
Status: BASELINE ESTABLISHED

## 1. Baseline Verification Commands & Real Output
- `npm run lint` (`tsc --noEmit`): PASS (0 errors)
- `npm run build` (`vite build`): PASS (1673 modules transformed, built in 1.16s, bundle 1,202 kB minified)
- `npm run test` (`tsx src/test/runTests.ts`): PASS (11/11 tests passed in 0ms)
- `git status`: Initialized repository on master. Untracked working tree captured.

## 2. Findings: What Works, What is Broken, What is Fake

### What Works:
1. **Frontend Core**: React 19 + Tailwind v4 + Vite client builds and renders without compile-time errors.
2. **Server Architecture**: Express server mounting Vite middleware in dev or serving dist in production.
3. **Core Curriculum & AI**: Modular curriculum structure (English, Spanish, Arabic, Hindi, Tamil) and @google/genai integration with Gemini fallback.
4. **Speech & Audio**: Web Speech API speech controller with pitch shifting for male voices and fallback synthesis.

### What is Broken / Violations of Production Guardrails:
1. **voice orb Naming**: Orb is named `VoiceOrb` across 15+ files, types, CSS classes, comments, and documentation. Must be eradicated in Stage 1.
2. **Security & Auth**:
   - Hardcoded mock user ID (`usr_luma_default_001`).
   - No argon2id hashing, no session tokens, no CSRF tokens.
   - Missing zod input validation on multiple Express endpoints.
   - Missing rate limiting and strict Content-Security-Policy headers.
   - Administrative endpoint `/api/admin/migrate` and debug `/api/test/run` present without auth.
   - Missing `POST /api/privacy/purge` real deletion.
3. **Honesty & Metrics**:
   - STT is text-only browser SpeechRecognition; acoustic pronunciation scoring is scientifically impossible without raw audio analysis.
   - Missions and streaks can be inflated on client without server validation.
   - Lessons lack explicit "Draft, not yet reviewed" status.
4. **Layout & UX**:
   - Orb component overlaps conversation view on smaller screens; fixed pixel dimensions (280px) cause layout clipping.
   - Technical jargon in UI: "Bridge / Target Language", "Teach-Back 70/20/10", "Neon DB", "DDL".
   - Navigation includes raw database console for standard learners.
5. **Architectural Hygiene**:
   - Monolithic files: `VoiceSessionView.tsx` (1184 lines), `OnboardingWizard.tsx` (1104 lines), `VoiceOrb.tsx` (889 lines).
   - Package name is `react-example` instead of `luma`.

## 3. Plan for Execution
- Stage 1: Eradicate "voice orb" completely -> `VoiceOrb`.
- Stage 2: Security hardening (argon2id auth, sessions, CSRF, rate limits, CSP, zod schemas, purge).
- Stage 3: Honest assessment (LLM rubric + deterministic checks, remove fake pronunciation scores, streak validation).
- Stage 4: UI/UX revamp (4 learner tabs, clean responsive VoiceOrb with ResizeObserver, plain language, WCAG 2.2 AA).
- Stage 5: Code refactor & file decomposition.
- Stage 6 & 7: Test expansion, Dockerfile, CI, .env.example.
- Stage 8: Final validation & GO_LIVE_REPORT.md.
