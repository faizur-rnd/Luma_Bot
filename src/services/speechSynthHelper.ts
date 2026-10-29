// Helper utilities for LUMA SpeechController:
// Voice selection, orb audio chimes, and resilient server/reference audio fallback.
import { apiClient } from './apiClient.ts';
import { request } from './api/baseClient.ts';

const MALE_VOICE_KEYWORDS = [
  'maged', 'tariq', 'naayf', 'hamza', 'salim', 'kareem', 'ziad', 'omar', 'bilal', 'shakir',
  'jorge', 'diego', 'carlos', 'enrique', 'alvaro', 'miguel', 'manuel', 'pablo', 'mateo', 'antonio',
  'stefan', 'hans', 'markus', 'daniel', 'florian', 'martin', 'jan', 'lukas',
  'david', 'guy', 'alex', 'fred', 'george', 'oliver', 'rishi', 'james', 'thomas',
  'male', 'es-es', 'es-mx', 'ar-sa', 'de-de'
];

const FEMALE_VOICE_KEYWORDS = [
  'laila', 'salma', 'zariyah', 'zeina', 'mouna',
  'monica', 'paulina', 'lucia', 'sofia', 'elena', 'carmen',
  'hedda', 'katja', 'anna', 'marlene',
  'samantha', 'victoria', 'zira', 'jenny', 'karen', 'moira', 'susan',
  'female'
];

export function selectPreferredSynthesisVoice(
  voices: SpeechSynthesisVoice[],
  targetLanguage: string,
  voiceGender: 'male' | 'female'
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const prefix =
    targetLanguage === 'ar' ? 'ar' :
    targetLanguage === 'es' ? 'es' :
    targetLanguage === 'de' ? 'de' : 'en';
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const preferredKeywords = voiceGender === 'male' ? MALE_VOICE_KEYWORDS : FEMALE_VOICE_KEYWORDS;

  let matched = langVoices.find((v) => {
    const nameLower = v.name.toLowerCase();
    return preferredKeywords.some((kw) => nameLower.includes(kw));
  });

  if (!matched && langVoices.length > 0) {
    matched =
      langVoices.find(
        (v) => v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium')
      ) || langVoices[0];
  }

  if (!matched) {
    matched =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          preferredKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      ) || voices[0];
  }

  return matched || null;
}

export function playSynthesizedOrbChime(
  type: 'tap' | 'listen' | 'speak' = 'tap',
  volume = 1.0,
  existingContext?: AudioContext | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = existingContext && existingContext.state !== 'closed' ? existingContext : new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    const freq = type === 'listen' ? 659.25 : type === 'speak' ? 880 : 523.25;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    if (type === 'listen') {
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    } else if (type === 'speak') {
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28 * volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
}

export async function fetchReferenceOrNeuralAudioUrl(
  text: string,
  language: string,
  gender: 'male' | 'female'
): Promise<string | null> {
  try {
    const ttsRes = await apiClient.generateTTSAudio({ text, language, gender });
    if (ttsRes && ttsRes.audioBase64) {
      const mime = ttsRes.mimeType || 'audio/wav';
      return `data:${mime};base64,${ttsRes.audioBase64}`;
    }
  } catch {}

  try {
    const res = await request('/api/speech/reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 480),
        language,
        accent: language === 'ar' ? 'ar-SA' : 'en-US',
        voiceGender: gender
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioUrl) return data.audioUrl;
    }
  } catch {}

  return null;
}

export async function transcribeRecordedAudioBlob(
  blob: Blob,
  language: string
): Promise<string | null> {
  try {
    const res = await request(`/api/speech/transcribe?language=${encodeURIComponent(language)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      body: blob
    });
    if (res.ok) {
      const data = await res.json();
      if (data.transcript && typeof data.transcript === 'string' && data.transcript.trim()) {
        return data.transcript.trim();
      }
    }
  } catch {}
  return null;
}
