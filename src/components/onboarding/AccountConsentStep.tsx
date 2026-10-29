import React from 'react';
import { UserPlus, ShieldCheck } from 'lucide-react';

interface AccountConsentStepProps {
  authMode: 'guest' | 'register' | 'login';
  email: string;
  password: string;
  storeAudioSamples: boolean;
  storeTranscripts: boolean;
  analyticsEnabled: boolean;
  onAuthModeChange: (mode: 'guest' | 'register' | 'login') => void;
  onEmailChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onStoreAudioChange: (val: boolean) => void;
  onStoreTranscriptsChange: (val: boolean) => void;
  onAnalyticsChange: (val: boolean) => void;
}

export const AccountConsentStep: React.FC<AccountConsentStepProps> = ({
  authMode,
  email,
  password,
  storeAudioSamples,
  storeTranscripts,
  analyticsEnabled,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onStoreAudioChange,
  onStoreTranscriptsChange,
  onAnalyticsChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--text)] font-bold text-sm">
          <UserPlus className="w-4 h-4 text-[var(--accent)]" />
          <span>Account & Recording Consent</span>
        </div>
        <div className="flex gap-1 text-xs">
          {(['register', 'login', 'guest'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onAuthModeChange(m)}
              className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                authMode === m
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {m === 'register' ? 'Create Account' : m === 'login' ? 'Sign In' : 'Guest'}
            </button>
          ))}
        </div>
      </div>

      {authMode !== 'guest' && (
        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1" htmlFor="onb-email">
              Email Address
            </label>
            <input
              id="onb-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="learner@example.com"
              className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1" htmlFor="onb-password">
              Password {authMode === 'register' && '(10+ chars, upper, lower, number, symbol)'}
            </label>
            <input
              id="onb-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
            />
          </div>
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
          <span>Unbundled Privacy & Audio Consents</span>
        </div>
        <label className="flex items-start gap-2.5 text-xs text-[var(--text)] cursor-pointer">
          <input
            type="checkbox"
            checked={storeAudioSamples}
            onChange={(e) => onStoreAudioChange(e.target.checked)}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span>
            <strong>Store Audio Samples:</strong> Retain baseline and drill audio so you can replay recordings and compare progress.
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-xs text-[var(--text)] cursor-pointer">
          <input
            type="checkbox"
            checked={storeTranscripts}
            onChange={(e) => onStoreTranscriptsChange(e.target.checked)}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span>
            <strong>Store Practice Transcripts:</strong> Save conversation transcripts for grammar and vocabulary review.
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-xs text-[var(--text)] cursor-pointer">
          <input
            type="checkbox"
            checked={analyticsEnabled}
            onChange={(e) => onAnalyticsChange(e.target.checked)}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span>
            <strong>Product Funnel Analytics:</strong> Share pseudonymized step completion metrics (never raw audio or PII).
          </span>
        </label>
      </div>
    </div>
  );
};
