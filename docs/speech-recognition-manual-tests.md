# Speech Recognition & Reference Audio Manual Verification Guide

**Date:** 2026-10-27  
**Scope:** English (`en-US`, `en-IN`), Tamil (`ta-IN`), Arabic (`ar-SA`, `ar-EG`).

---

## 1. Supported Language & Accent Mappings

| Target / L1 | Language Code | Selected Locale | Acoustic ASR Provider | Reference Model Voice | Dialect Details |
|---|---|---|---|---|---|
| **English (US)** | `en` | `en-US` | Azure / Browser STT | `en-US-JennyNeural` | General American English |
| **English (India)** | `en` | `en-IN` | Azure / Browser STT | `en-IN-NeerjaNeural` | Indian English accent |
| **Tamil** | `ta` | `ta-IN` | Browser STT / Server ASR | `ta-IN-PallaviNeural` | Tamil (India, Standard) |
| **Arabic (Saudi)** | `ar` | `ar-SA` | Browser STT / Server ASR | `ar-SA-ZariyahNeural` | Modern Standard Arabic |
| **Arabic (Egypt)** | `ar` | `ar-EG` | Browser STT / Server ASR | `ar-EG-SalmaNeural` | Egyptian Arabic dialect |

---

## 2. Sample Phrases & Expected Behavior

### English (`en-US` / `en-IN`)
- **Phrase 1 (Fricative Contrast):** *"Think about that rhythm and breathe naturally."*
  - **Expected Phonemes:** `/θ/` in *think*, `/ð/` in *that*, *rhythm*, *breathe*.
  - **Expected Model Audio:** Crisp dental fricative articulation model generated and cached under `ref_audio/en/en-US/male_*.wav`.
- **Phrase 2 (Consonant Cluster):** *"Strict structures sprout strong strategies."*
  - **Expected Articulation Target:** 3-consonant clusters `/str/`, `/spr/` without epenthetic vowels (`*istrict*` or `*es-truct*`).

### Tamil (`ta-IN`)
- **Phrase 1:** *"வணக்கம், உங்கள் பயிற்சி தொடங்க தயாராக உள்ளதா?"*
  - **Expected Behavior:** Browser Web Speech API or Server ASR captures Tamil Unicode text without Latin transliteration artifacts.
  - **Model Audio:** Synthesized with authentic Tamil cadence.

### Arabic (`ar-SA`)
- **Phrase 1:** *"مرحبًا بك، لنبدأ تدريب النطق ومخارج الحروف اليوم."*
  - **Expected Behavior:** Right-to-left transcript rendered cleanly with correct Arabic diacritics and ligatures.
  - **Phonetic Focus:** Pharyngeal and uvular stops (`/q/`, `/ħ/`, `/ʕ/`).

---

## 3. Reference Audio Caching & Latency Verification
1. First request for a phrase: server synthesizes model audio and writes to private storage (~200–500ms).
2. Second request for identical phrase: cache hit from object storage (< 15ms), zero redundant provider API cost.
3. User personal speech is NEVER cached under reference model keys.
