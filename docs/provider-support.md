# Pronunciation Assessment & Speech Recognition Provider Capabilities

**Audit Date:** 2026-10-27  
**Official Source Grounding:** Microsoft Azure Cognitive Services Speech SDK Documentation & Pricing, Google Cloud Speech-to-Text / Gemini Multimodal Audio Docs.

---

## 1. Provider Capabilities Matrix by Language

| Language & Accent | Provider | Phoneme-Level Granularity | Reference-Text Mode | Prosody Scoring | Completeness & Fluency | Measurement Status in LUMA |
|---|---|---|---|---|---|---|
| **English (en-US)** | Azure Speech Pronunciation Assessment | **YES (IPA / SAPI)** | **YES** | **YES** | **YES** | `measured` (when credentials present) |
| **English (en-IN)** | Azure Speech Pronunciation Assessment | **YES (IPA / SAPI)** | **YES** | **YES** | **YES** | `measured` (when credentials present) |
| **Tamil (ta-IN)** | Azure Speech Pronunciation Assessment | **NO (Lexical ASR only)** | **Limited** | **NO** | **NO** | `estimated` (word alignment) or `unavailable` |
| **Arabic (ar-SA)** | Azure Speech Pronunciation Assessment | **Experimental (Modern Standard)** | **Partial** | **Limited** | **NO** | `estimated` or `unavailable` |
| **Fallback / Missing Keys**| Local / Unavailable Provider | **NO** | **NO** | **NO** | **NO** | `unavailable` (0 fabricated metrics) |

---

## 2. Key Provider Details & Constraints

### Azure Speech Pronunciation Assessment
- **Supported Phoneme Alphabets:** International Phonetic Alphabet (IPA) and SAPI. LUMA standardizes on **IPA**.
- **Metrics Produced:**
  - `AccuracyScore`: Phoneme and word-level fidelity against target model (0–100).
  - `FluencyScore`: Temporal rhythm, pause frequency, and speech continuity (0–100).
  - `ProsodyScore`: Intonation, pitch variation, stress, and natural emphasis (0–100).
  - `CompletenessScore`: Ratio of reference text words pronounced vs. omitted (0–100).
  - `PronScore (Overall)`: Weighted aggregate (typically `0.4*Accuracy + 0.2*Fluency + 0.2*Prosody + 0.2*Completeness`).
- **Known Limitations:**
  - Phoneme-level scoring is mature for English (`en-US`, `en-GB`, `en-IN`, `en-AU`).
  - Phoneme-level scoring for Tamil (`ta-IN`) is currently not available in Azure Pronunciation Assessment; Tamil is supported for general ASR transcription, but not acoustic phoneme scoring.
  - Arabic (`ar-SA`, `ar-EG`) has emerging phonetic support for Modern Standard Arabic, but dialectal variation (Gulf, Levantine, Egyptian) introduces unvalidated variance.
- **Pricing & Quota Reference (Checked 2026):**
  - Standard Azure Speech S0 tier: ~$1.00 per audio hour for standard speech-to-text + ~$0.30/hr for Pronunciation Assessment add-on.
  - Rate limits: 20 concurrent requests on default tier.

### LUMA Integrity Rules
1. **Never Fabricate Acoustic Phonemes:** If a provider does not support phoneme-level scoring for a language, LUMA returns `measurement_status: 'estimated'` or `'unavailable'` with `phonemes: []` and `accuracy: null`.
2. **Never Confuse Text Alignment with Acoustic Scoring:** String Levenshtein distance on ASR transcripts is NOT an acoustic phoneme score. LUMA strictly distinguishes estimated transcript alignment from genuine acoustic scoring.
3. **Graceful Credential Fallback:** In environments without `AZURE_SPEECH_KEY`, LUMA runs with the `UnavailableScoringProvider` or `EstimatedScoringProvider`, returning honest diagnostic statuses without application crashes.
