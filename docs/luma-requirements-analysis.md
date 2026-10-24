# LUMA — Requirements Analysis & Acceptance Specification

**Document Version:** 1.0.0  
**Repository Inspected:** `https://github.com/Faizur2480/LinguaAI.git`  
**Inspected Date:** October 20, 2026  
**Status:** Complete Baseline & Acceptance Criteria

---

## 1. Repository Discovery & Access Verification

### 1.1 Remote Repository Connection
- **Repository URL:** `https://github.com/Faizur2480/LinguaAI.git`
- **Access Test:** Executed `GIT_TERMINAL_PROMPT=0 git ls-remote https://github.com/Faizur2480/LinguaAI.git`
- **Result:** `fatal: could not read Username for 'https://github.com': terminal prompts disabled`
- **Factual Evidence & Limitation:** The remote GitHub repository is either private or requires personal access token / SSH credentials not configured in this execution container. The current AI Studio environment provides a standalone Vite + React 19 + Express full-stack foundation.
- **Protocol Enforced:** We do not pretend to have inspected remote unaccessible files. All analysis is strictly grounded in genuine workspace files and user specifications.

---

## 2. Requirements Decomposition & Acceptance Matrix

| Req ID | Title | Priority | Target Status | Description & Acceptance Criteria | Verification Method |
|---|---|---|---|---|---|
| **REQ-01** | Brand & Aurora Design System | P1 | PASS | Implement LUMA multicolor Aurora design tokens, light & dark theme palettes, gradient tokens (Aurora Spectrum, Cosmic Pulse, Ocean Intelligence, Sunrise Energy, Mint Aurora), semantic colors, responsive typography, and persistent theme switcher. | Visual check, token verification in light & dark modes |
| **REQ-02** | Signature voice orb Particle Orb | P0 | PASS | Genuine 3D particle orb built with Three.js. Dense spherical particle cloud, wireframe connection lattice, organic wave deformation, Aurora color gradient illumination, smooth breathing rotation, and Web Audio API live reactivity. | Interactive state testing, WebGL canvas render check |
| **REQ-03** | Real-Time Voice Session States | P0 | PASS | Orb and UI dynamically react to genuine voice session states: `idle`, `listening`, `transcribing`, `thinking`, `speaking`, `interrupted`, `reconnecting`, `offline_error`. Real microphone input and Web Speech API / synthesis. | Voice state simulation and Web Audio analyzer |
| **REQ-04** | AI Voice & Conversational Learning | P0 | PASS | Intelligent conversation agent with English target language and bridge language support (Tamil, Hindi, Arabic, Spanish, French). Contextual grammar corrections, pronunciation tips, and conversational prompts. | Server-side Gemini API + fallback mock engine |
| **REQ-05** | Curriculum & Guided Speaking | P1 | PASS | Structured CEFR progression (Starter A1 to Mastery C1/C2), real-world conversation scenarios, and mission-based challenges. | Curriculum navigation, state persistence |
| **REQ-06** | Teach-Back Assessment & Scoring | P1 | PASS | Authoritative evaluation engine for student teach-back sessions: Pronunciation (0-100), Fluency (0-100), Grammar (0-100), Lexical Resource (0-100), and specific coaching tips. | Assessment completion and persistence test |
| **REQ-07** | Spaced Repetition Vocabulary Vault | P1 | PASS | Vocabulary bank with Leitner box intervals, mastery levels, example audio pronunciation, and active review mode. | Review session completion and progress updates |
| **REQ-08** | Neon Serverless PostgreSQL Backend | P0 | PASS | Backend integration supporting Neon PostgreSQL (`DATABASE_URL`), automated table schema migrations, connection pooling, health checks (`/api/health/db`), and resilient zero-crash fallback persistence when credentials are unconfigured. | API health endpoint, migration DDL validation |
| **REQ-09** | User Ownership & Data Isolation | P0 | PASS | Server-enforced user session management, preventing cross-user record leakage. Request validation and safe error handling. | Endpoint security test, authenticated headers |
| **REQ-10** | Privacy, Consent & GDPR Compliance | P1 | PASS | User-controlled audio recording retention settings, transcript toggle, full profile JSON data export, and complete account deletion with irreversible cascade. | Data export download and account purge flow |
| **REQ-11** | Responsive Cross-Platform Layout | P1 | PASS | Seamless experience across desktop, tablet, and mobile views with touch-optimized controls and viewport compliance. | Mobile responsive viewport testing |
| **REQ-12** | Accessibility & Reduced Motion | P2 | PASS | WCAG AA contrast compliance, visible focus indicators, aria labels, and respect for `prefers-reduced-motion`. | Color contrast audit and motion toggle test |

---

## 3. Risk Assessment & Mitigations

1. **Remote Repository Access:** Direct git push to remote GitHub is not available without user personal access token. All production-ready code is built and compiled directly within this working applet.
2. **Neon DB Connectivity:** If `DATABASE_URL` is not supplied by the user at runtime, the application must never crash; it must cleanly activate the resilient LocalStorage/In-Memory fallback with real-time status indicators in the Database Admin console.
3. **Microphone Permissions:** Browser permissions can be denied by the user. The UI must provide a clear fallback with keyboard text input and simulated audio frequency generators.
