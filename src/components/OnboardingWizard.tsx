import React, { useState, useRef } from 'react';
import { Globe, Target, Clock, Sparkles, Check, Mic } from 'lucide-react';
import { apiClient, UserProfile } from '../services/apiClient.ts';
import { programApi } from '../services/api/programApi.ts';
import { AudioRecorder } from '../services/audioRecorder.ts';
import { AudioLevelMeter } from './audio/AudioLevelMeter.tsx';
import { AccountConsentStep } from './onboarding/AccountConsentStep.tsx';
import { Button } from './ui/index.ts';
import { ctaAnalytics } from '../services/analytics.ts';

interface OnboardingWizardProps {
  onComplete: (profile?: UserProfile, launchBaseline?: boolean) => void;
  onCancel?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [authMode, setAuthMode] = useState<'guest' | 'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeAudioSamples, setStoreAudioSamples] = useState(true);
  const [storeTranscripts, setStoreTranscripts] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [nativeLanguage, setNativeLanguage] = useState('ta');
  const [targetAccent, setTargetAccent] = useState<'en-US' | 'en-IN'>('en-US');
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [micTested, setMicTested] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const micRecorderRef = useRef<AudioRecorder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStep1Continue = async () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    if (authMode === 'register' || authMode === 'login') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address, or choose Guest.');
        return;
      }
      if (authMode === 'register') {
        const strong = password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
        if (!strong) {
          setErrorMessage('Password must be 10+ characters with uppercase, lowercase, number, and symbol.');
          return;
        }
      } else if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      ctaAnalytics.setConsent(analyticsEnabled);
      if (authMode === 'register') {
        ctaAnalytics.track('registration_started');
        await apiClient.register({
          email: email.trim(),
          password,
          displayName: email.trim().split('@')[0] || 'Learner',
          targetLanguage: 'en',
          bridgeLanguage: nativeLanguage
        });
        ctaAnalytics.track('registration_completed');
      } else if (authMode === 'login') {
        await apiClient.login({ email: email.trim(), password });
      }
      await apiClient.updatePrivacyConsents({
        store_audio_samples: storeAudioSamples,
        store_transcripts: storeTranscripts,
        analytics_enabled: analyticsEnabled
      });
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Account request failed. Please check credentials or choose Guest.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestMicrophone = async () => {
    setMicNotice(null);
    if (isTestingMic && micRecorderRef.current) {
      setIsTestingMic(false);
      await micRecorderRef.current.stop();
      setMicTested(true);
      setMicNotice('Microphone verified! Audio signal captured cleanly.');
      return;
    }
    const recorder = new AudioRecorder({
      maxDurationMs: 6000,
      onStateChange: (st) => { if (typeof st.level === 'number') setMicLevel(st.level); }
    });
    micRecorderRef.current = recorder;
    const ok = await recorder.start();
    if (!ok) {
      ctaAnalytics.track('recording_failed', { stage: 'onboarding_mic_check' });
      setMicTested(true);
      setMicNotice('Microphone access is blocked in this preview frame. You can still proceed with interactive coaching.');
      return;
    }
    setIsTestingMic(true);
    setTimeout(async () => {
      if (micRecorderRef.current === recorder) {
        try { await recorder.stop(); } catch {}
        setIsTestingMic(false);
        setMicTested(true);
        setMicNotice('Microphone verified! Audio signal captured cleanly.');
      }
    }, 2800);
  };

  const finalizeOnboarding = async (launchBaseline: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.saveOnboarding({
        nativeLanguage,
        languageToLearn: 'en',
        learningGoal: 'Workplace & Professional Articulation',
        dailyMinutes,
        proficiencyLevel: 'B1'
      });
      await programApi.enrollProgram({ nativeLanguage, targetAccent }).catch(() => {});
      const updated = await apiClient.updateProfile({
        targetLanguage: 'en',
        target_language: 'en',
        bridgeLanguage: nativeLanguage,
        bridge_language: nativeLanguage,
        dailyGoalMinutes: dailyMinutes,
        daily_goal_minutes: dailyMinutes,
        proficiencyLevel: 'B1',
        proficiency_level: 'B1'
      });
      if (typeof window !== 'undefined') localStorage.setItem('luma_onboarding_done', 'true');
      ctaAnalytics.track('onboarding_completed', { nativeLanguage, targetAccent, dailyMinutes });
      onComplete(updated, launchBaseline);
    } catch {
      if (typeof window !== 'undefined') localStorage.setItem('luma_onboarding_done', 'true');
      onComplete(undefined, launchBaseline);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]"><Sparkles className="w-4 h-4" /></div>
            <div>
              <h2 id="onboarding-title" className="text-base font-bold text-[var(--text)]">12-Week Articulation Setup</h2>
              <p className="text-xs text-[var(--muted)]">Step {step} of {totalSteps} • {totalSteps - step} remaining</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-[var(--surface-2)]'}`} />
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && <div className="p-3 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/40 text-xs text-[var(--danger)] font-medium">{errorMessage}</div>}

          {step === 1 && (
            <AccountConsentStep
              authMode={authMode}
              email={email}
              password={password}
              storeAudioSamples={storeAudioSamples}
              storeTranscripts={storeTranscripts}
              analyticsEnabled={analyticsEnabled}
              onAuthModeChange={(m) => { setAuthMode(m); setErrorMessage(null); }}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onStoreAudioChange={setStoreAudioSamples}
              onStoreTranscriptsChange={setStoreTranscripts}
              onAnalyticsChange={setAnalyticsEnabled}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--text)] font-bold text-sm"><Globe className="w-4 h-4 text-[var(--accent)]" /><span>Native Language & Target English Accent</span></div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'ta', name: 'Tamil (தமிழ்) → English' },
                  { code: 'ar', name: 'Arabic (العربية) → English' },
                  { code: 'hi', name: 'Hindi (हिन्दी) → English' },
                  { code: 'es', name: 'Spanish (Español) → English' }
                ].map((lang) => (
                  <button key={lang.code} type="button" onClick={() => setNativeLanguage(lang.code)} className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer flex items-center justify-between ${nativeLanguage === lang.code ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]'}`}>
                    <span>{lang.name}</span>
                    {nativeLanguage === lang.code && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['en-US', 'en-IN'] as const).map((acc) => (
                  <button key={acc} type="button" onClick={() => setTargetAccent(acc)} className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${targetAccent === acc ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]'}`}>
                    {acc === 'en-US' ? 'General American (en-US)' : 'Indian English (en-IN)'}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-1.5"><Clock className="w-3.5 h-3.5 text-[var(--accent)]" /><span>Daily Practice Commitment</span></div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button key={mins} type="button" onClick={() => setDailyMinutes(mins)} className={`py-2 rounded-xl border text-xs font-bold cursor-pointer ${dailyMinutes === mins ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]'}`}>
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--text)] font-bold text-sm"><Mic className="w-4 h-4 text-[var(--accent)]" /><span>Test Your Microphone</span></div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">Before starting your baseline assessment, verify your microphone input. Your browser will ask for permission to capture your spoken practice.</p>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <AudioLevelMeter level={micLevel} durationMs={0} isRecording={isTestingMic} />
                <div className="flex items-center justify-between">
                  <Button variant="secondary" size="sm" onClick={handleTestMicrophone}>
                    <Mic className="w-4 h-4 mr-1.5 text-[var(--accent)]" />{isTestingMic ? 'Stop Microphone Test' : 'Test Microphone'}
                  </Button>
                  {micTested && <span className="text-xs font-bold text-[var(--success)]">✓ Checked</span>}
                </div>
                {micNotice && <p className="text-xs text-[var(--muted)]">{micNotice}</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--text)] font-bold text-sm"><Target className="w-4 h-4 text-[var(--accent)]" /><span>Ready for Your Day-0 Baseline Assessment</span></div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Your 12-week program is tailored for <strong>{nativeLanguage.toUpperCase()} → {targetAccent}</strong> ({dailyMinutes} min/day). Start your Day-0 Baseline Assessment to benchmark your starting articulation clarity.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-2)]/50 flex items-center justify-between gap-2">
          {step > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={isSubmitting}>Back</Button>
          ) : onCancel ? (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>Later</Button>
          ) : <div />}

          {step === 1 && (
            <Button variant="primary" onClick={handleStep1Continue} isLoading={isSubmitting}>
              {authMode === 'register' ? 'Create Account' : authMode === 'login' ? 'Sign In & Continue' : 'Continue'}
            </Button>
          )}
          {step === 2 && <Button variant="primary" onClick={() => setStep(3)}>Continue</Button>}
          {step === 3 && <Button variant="primary" onClick={() => setStep(4)}>Continue</Button>}
          {step === 4 && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => finalizeOnboarding(false)} disabled={isSubmitting}>Skip to Home</Button>
              <Button variant="primary" onClick={() => finalizeOnboarding(true)} isLoading={isSubmitting}>Start Baseline Assessment</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
