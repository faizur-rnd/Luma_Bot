// Privacy-Conscious CTA Funnel Analytics Service
// Only records pseudonymized funnel events when analytics_enabled consent is granted.
// Strictly forbids raw audio, transcripts, email addresses, or PII in event payloads.

export type CtaAnalyticsEventName =
  | 'registration_started'
  | 'registration_completed'
  | 'onboarding_completed'
  | 'baseline_started'
  | 'baseline_completed'
  | 'daily_session_started'
  | 'daily_session_completed'
  | 'recording_failed'
  | 'weekly_checkpoint_completed'
  | 'final_report_viewed';

export interface CtaAnalyticsEvent {
  event: CtaAnalyticsEventName;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = 'luma_cta_funnel_events';
const CONSENT_KEY = 'luma_analytics_consent';
const FORBIDDEN_KEYS = ['email', 'password', 'audio', 'transcript', 'blob', 'name', 'token'];

function sanitizeMetadata(
  meta?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> | undefined {
  if (!meta) return undefined;
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta)) {
    const lower = k.toLowerCase();
    if (FORBIDDEN_KEYS.some((forbidden) => lower.includes(forbidden))) {
      continue;
    }
    if (typeof v === 'string' && v.includes('@')) {
      continue;
    }
    clean[k] = v;
  }
  return clean;
}

export const ctaAnalytics = {
  setConsent(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONSENT_KEY, enabled ? 'true' : 'false');
      if (!enabled) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  },

  hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(CONSENT_KEY) === 'true';
    } catch {
      return false;
    }
  },

  track(
    event: CtaAnalyticsEventName,
    metadata?: Record<string, string | number | boolean>
  ): boolean {
    if (!this.hasConsent()) {
      return false;
    }
    if (typeof window === 'undefined') return false;
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const list: CtaAnalyticsEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
      const entry: CtaAnalyticsEvent = {
        event,
        timestamp: new Date().toISOString(),
        metadata: sanitizeMetadata(metadata)
      };
      const next = [...list.slice(-99), entry];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  },

  getEvents(): CtaAnalyticsEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearEvents(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
};
