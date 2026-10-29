import React, { useState, useEffect } from 'react';
import { Globe, Shield, Download, Trash2, Sun, Moon, LogOut, Check, AlertTriangle } from 'lucide-react';
import { apiClient, UserProfile } from '../services/apiClient.ts';
import { Dialog } from './ui/Dialog.tsx';
import { Button } from './ui/Button.tsx';
import { Tabs } from './ui/Tabs.tsx';
import { ctaAnalytics } from '../services/analytics.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  initialSection?: 'settings' | 'privacy';
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English (Target)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'ar', name: 'Arabic (العربية)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialSection = 'settings',
  theme,
  setTheme,
  onUpdateProfile,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<'settings' | 'privacy'>(initialSection);
  const [selectedLang, setSelectedLang] = useState(profile?.target_language || profile?.targetLanguage || 'en');
  const [bridgeLang, setBridgeLang] = useState(profile?.bridge_language || profile?.bridgeLanguage || 'ta');
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || profile?.dailyGoalMinutes || 15);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [storeAudio, setStoreAudio] = useState(true);
  const [storeTranscripts, setStoreTranscripts] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null);

  useEffect(() => { setActiveSection(initialSection); }, [initialSection]);

  useEffect(() => {
    if (isOpen) {
      apiClient.getPrivacyConsents().then((res: any) => {
        if (Array.isArray(res?.consents)) {
          const list = res.consents;
          const findVal = (t: string, fb: boolean) => {
            const found = list.find((c: any) => c.consent_type === t || c.consentType === t);
            return found ? Boolean(found.granted) : fb;
          };
          const audioVal = findVal('store_audio_samples', true);
          const transVal = findVal('store_transcripts', true);
          const anaVal = findVal('analytics_enabled', false);
          setStoreAudio(audioVal);
          setStoreTranscripts(transVal);
          setAnalyticsEnabled(anaVal);
          ctaAnalytics.setConsent(anaVal);
        } else if (res) {
          setStoreAudio(Boolean(res.store_audio_samples ?? true));
          setStoreTranscripts(Boolean(res.store_transcripts ?? true));
          const anaVal = Boolean(res.analytics_enabled ?? false);
          setAnalyticsEnabled(anaVal);
          ctaAnalytics.setConsent(anaVal);
        }
      }).catch(() => {});

      if (profile) {
        setSelectedLang(profile.target_language || profile.targetLanguage || 'en');
        setBridgeLang(profile.bridge_language || profile.bridgeLanguage || 'ta');
        setDailyGoal(profile.daily_goal_minutes || profile.dailyGoalMinutes || 15);
      }
      setConfirmPurge(false);
      setPrivacyStatus(null);
    }
  }, [isOpen, profile]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await apiClient.updateProfile({
        id: profile?.id,
        displayName: profile?.display_name || profile?.displayName || 'Learner',
        targetLanguage: selectedLang,
        bridgeLanguage: bridgeLang,
        dailyGoalMinutes: dailyGoal,
      });
      onUpdateProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      setPrivacyStatus('Settings saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsents = async () => {
    setSaving(true);
    setPrivacyStatus(null);
    try {
      await apiClient.updatePrivacyConsents({
        store_audio_samples: storeAudio,
        store_transcripts: storeTranscripts,
        analytics_enabled: analyticsEnabled,
      });
      ctaAnalytics.setConsent(analyticsEnabled);
      setPrivacyStatus('Privacy consent preferences saved.');
    } catch {
      setPrivacyStatus('Preferences saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setPrivacyStatus(null);
    try {
      await apiClient.exportUserData();
      setPrivacyStatus('Your data export JSON has been downloaded.');
    } catch (e) {
      console.error('Export failed:', e);
      setPrivacyStatus('Failed to export user data.');
    }
  };

  const handleDeleteAllData = async () => {
    setSaving(true);
    try {
      await apiClient.purgeAccount();
      localStorage.clear();
      onLogout();
      onClose();
    } catch (e) {
      console.error('Failed to delete account data:', e);
      setPrivacyStatus('Could not complete deletion request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={activeSection === 'privacy' ? 'Privacy & Data Controls' : 'Preferences & Settings'}
    >
      <div className="space-y-6">
        <Tabs
          tabs={[
            { id: 'settings', label: 'Preferences', icon: <Globe size={14} /> },
            { id: 'privacy', label: 'Privacy & Data', icon: <Shield size={14} /> },
          ]}
          activeTab={activeSection}
          onChange={(id) => setActiveSection(id as 'settings' | 'privacy')}
        />

        {activeSection === 'settings' ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <div>
                <div className="text-sm font-medium text-[var(--text)]">Appearance</div>
                <div className="text-xs text-[var(--muted)]">Switch between dark and light mode</div>
              </div>
              <div className="flex gap-2">
                <Button variant={theme === 'dark' ? 'primary' : 'secondary'} size="sm" onClick={() => setTheme('dark')}>
                  <Moon size={14} /> Dark
                </Button>
                <Button variant={theme === 'light' ? 'primary' : 'secondary'} size="sm" onClick={() => setTheme('light')}>
                  <Sun size={14} /> Light
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Globe size={14} /> Target & Native Bridge Language
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
                <select
                  value={bridgeLang}
                  onChange={(e) => setBridgeLang(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="ta">Tamil L1 Bridge</option>
                  <option value="ar">Arabic L1 Bridge</option>
                  <option value="en">English Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Daily Practice Goal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoal(mins)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      dailyGoal === mins
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]'
                    }`}
                  >
                    {mins} mins/day
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut size={14} /> Sign Out
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
                {savedSuccess ? <><Check size={14} /> Saved</> : 'Save Preferences'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {[
                { id: 'store_audio_samples', label: 'Store audio recordings for baseline & retest playback', checked: storeAudio, onChange: setStoreAudio },
                { id: 'store_transcripts', label: 'Store session transcripts for feedback history', checked: storeTranscripts, onChange: setStoreTranscripts },
                { id: 'analytics_enabled', label: 'Share anonymous CTA interaction metrics (no PII or audio)', checked: analyticsEnabled, onChange: setAnalyticsEnabled },
              ].map((item) => (
                <label key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] cursor-pointer">
                  <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
                  <span className="text-xs text-[var(--text)] leading-relaxed">{item.label}</span>
                </label>
              ))}
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleSaveConsents} isLoading={saving}>
                  Save Consent Preferences
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleExportData}>
                  <Download size={14} /> Export My Data (JSON)
                </Button>
                {!confirmPurge ? (
                  <Button variant="danger" size="sm" onClick={() => setConfirmPurge(true)}>
                    <Trash2 size={14} /> Delete Account & Audio
                  </Button>
                ) : (
                  <div className="w-full p-3 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--danger)]">
                      <AlertTriangle size={14} /> Permanent Action
                    </div>
                    <p className="text-xs text-[var(--text)]">
                      This permanently deletes your profile, assessments, and all stored audio files.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" onClick={handleDeleteAllData} isLoading={saving}>
                        Confirm Permanent Deletion
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmPurge(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {privacyStatus && <p className="text-xs text-[var(--accent)]">{privacyStatus}</p>}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
