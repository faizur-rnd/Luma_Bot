import React, { useState } from 'react';
import { Dialog, Button, Input, StatusPill } from './ui';
import { apiClient, UserProfile } from '../services/apiClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout?: () => void;
}

const LANGUAGES_SPOKEN = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' }
];

const LANGUAGES_TO_LEARN = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'en', name: 'English' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  theme,
  setTheme,
  onUpdateProfile,
  onLogout
}) => {
  const [activeSection, setActiveSection] = useState<'settings' | 'privacy'>('settings');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [spoken, setSpoken] = useState(profile?.bridge_language || 'en');
  const [learning, setLearning] = useState(profile?.target_language || 'es');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      await onUpdateProfile({
        display_name: displayName,
        bridge_language: spoken,
        target_language: learning
      });
      setMsg({ text: 'Settings updated successfully.', ok: true });
    } catch {
      setMsg({ text: 'Failed to save changes. Please try again.', ok: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await apiClient.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luma-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ text: 'Data export downloaded.', ok: true });
    } catch {
      setMsg({ text: 'Failed to export data.', ok: false });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={activeSection === 'settings' ? 'Settings & Preferences' : 'Privacy & Data'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Navigation tabs between Settings and Privacy */}
        <div className="flex border-b border-[var(--border)] gap-2 pb-2">
          <button
            type="button"
            onClick={() => { setActiveSection('settings'); setMsg(null); }}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeSection === 'settings'
                ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => { setActiveSection('privacy'); setMsg(null); }}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeSection === 'privacy'
                ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Privacy & Data
          </button>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl text-sm ${
              msg.ok ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30' : 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30'
            }`}
            role="status"
          >
            {msg.text}
          </div>
        )}

        {activeSection === 'settings' ? (
          <div className="space-y-4">
            <Input
              id="settings-display-name"
              label="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Learner name"
            />

            <div>
              <label htmlFor="settings-spoken" className="text-sm font-semibold text-[var(--text)] block mb-1">
                Language you speak
              </label>
              <select
                id="settings-spoken"
                value={spoken}
                onChange={(e) => setSpoken(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {LANGUAGES_SPOKEN.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="settings-learning" className="text-sm font-semibold text-[var(--text)] block mb-1">
                Language you want to learn
              </label>
              <select
                id="settings-learning"
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {LANGUAGES_TO_LEARN.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Theme switcher */}
            <div>
              <label className="text-sm font-semibold text-[var(--text)] block mb-2" id="theme-label">
                Appearance
              </label>
              <div className="flex gap-2" role="radiogroup" aria-labelledby="theme-label">
                <Button
                  variant={theme === 'dark' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  Dark theme
                </Button>
                <Button
                  variant={theme === 'light' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  Light theme
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                isLoading={isSaving}
                onClick={handleSave}
              >
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-2">
              <h4 className="text-sm font-bold text-[var(--text)]">Export your data</h4>
              <p className="text-xs text-[var(--muted)]">
                Download a full JSON archive of your practice history, speech logs, vocabulary, and profile data.
              </p>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isExporting}
                onClick={handleExportData}
              >
                Download data export
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--surface-2)] space-y-2">
              <h4 className="text-sm font-bold text-[var(--danger)]">Sign out</h4>
              <p className="text-xs text-[var(--muted)]">
                End your active session on this device.
              </p>
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
                >
                  Log out
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
