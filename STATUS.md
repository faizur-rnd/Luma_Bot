# LUMA System Status & Architecture

## 1. System Overview
LUMA is an AI-powered conversational language tutor providing situational spoken dialogue practice, structured curriculum modules, spaced-repetition vocabulary recall, and teach-back assessments.

- **Frontend:** React 19, TypeScript, Tailwind CSS v4 token-based design system, Vite 8.
- **Backend:** Node.js / Express 4 full-stack server (`server.ts`).
- **Database:** Neon Serverless PostgreSQL with strict multi-tenant schema and Argon2id password hashing. (Development non-production in-memory fallback is isolated, visibly labeled, and rejected in production).
- **AI Core:** Google Gemini 3.8 Flash via `@google/genai` TypeScript SDK.
- **Orb Animation:** Three.js WebGL canvas dynamic loaded strictly on the `/talk` route with isolated bounding layout and CSS fallback orb for reduced-motion / low-power devices.

---

## 2. Design System & WCAG 2.2 AA Contrast
The UI uses tokenized CSS variables with zero hardcoded hex values in component templates:
- **Tokens (Dark):** Background `#0B1020`, Surface `#121A30`, Surface-2 `#1A2442`, Border `#26325A`, Text `#EAF0FF`, Muted `#9AA8CC`, Accent `#6C7BFF`.
- **Tokens (Light):** Background `#F7F8FC`, Surface `#FFFFFF`, Surface-2 `#EEF1FA`, Border `#E2E8F0`, Text `#0F172A`, Muted `#475569`, Accent `#4F5BD5`.
- **Contrast Verification:**
  - Dark mode body text on background: 16.59:1 (WCAG AAA)
  - Dark mode muted text on background: 7.98:1 (WCAG AAA)
  - Light mode body text on background: 16.82:1 (WCAG AAA)
  - Light mode muted text on background: 7.14:1 (WCAG AAA)
  - Accent contrast on buttons: > 5.5:1 (WCAG AA)
- **Typography:** Self-hosted Inter font stack, body text 16px, minimum 14px anywhere, line-height 1.5. Touch targets minimum 44px × 44px. Single primary button per screen.

---

## 3. Honest Disclosures & Known Limits
1. **Pronunciation Scoring:** Browser Web Speech API returns text transcripts only; it does not supply raw acoustic audio streams for phoneme alignment. Pronunciation score is strictly reported as `"Not measured yet"`.
2. **Fluency Metric:** Fluency (words-per-minute) is computed only when real speech duration timestamps are captured. Without verified timestamps, it is reported as `"Not measured yet"`.
3. **Curriculum Status:** All curriculum lessons and scenarios are labeled `"Draft, not yet reviewed"` pending human teacher verification.
4. **Database Resilience:** In production (`NODE_ENV=production`), silent catch-and-fallback is blocked. All DB errors log diagnostics and return explicit error states to the client.

---

## 4. Test Commands
```bash
# Type check and linting (must pass with 0 errors)
npm run lint

# Automated test suite (System logic, Security, Password policies, HTTP API)
npm test

# Production bundle build and asset verification
npm run build
```

---

## 5. Deployment & Health Checks
- **HTTP Health Endpoints:**
  - `GET /healthz` - Process liveness check (200 OK).
  - `GET /readyz` - Dependency readiness check (database connectivity, Gemini configuration).
- **Containerization:** Non-root multi-stage Docker build targeting Node 22 Alpine.
- **Port:** Dev server and container run on port `3000`.
