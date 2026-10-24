import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Globe2, 
  User, 
  Lock, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { apiClient, UserProfile } from '../services/apiClient.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onRetakeOnboarding?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  theme,
  onUpdateProfile,
  onRetakeOnboarding
}) => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'privacy'>('preferences');
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const targetLanguages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'de', label: 'Deutsch (German)' }
  ];

  const bridgeLanguages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'de', label: 'Deutsch (German)' }
  ];

  const handleExportData = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const data = await apiClient.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luma-user-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Data export downloaded successfully.' });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e?.message || 'Failed to export data.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeAccount = async () => {
    setIsPurging(true);
    setStatusMessage(null);
    try {
      await apiClient.purgeUserData();
      setStatusMessage({ type: 'success', text: 'All account data permanently deleted. Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e?.message || 'Failed to delete account data.' });
      setIsPurging(false);
      setShowPurgeConfirm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#334155' : '#E2E8F0'
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-500" />
            <h2 id="settings-dialog-title" className="font-bold text-base text-slate-900 dark:text-slate-100">
              Settings & Privacy
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div
          className="flex border-b px-4 text-xs font-semibold"
          style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
        >
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-violet-500 text-violet-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Languages & Learning
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-violet-500 text-violet-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy & GDPR
          </button>
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div
            className={`m-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {activeTab === 'preferences' && (
            <>
              {/* Language to learn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Language to learn (Target Language)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  The language you want to speak and practice with your voice tutor.
                </p>
                <select
                  value={profile?.target_language || profile?.targetLanguage || 'en'}
                  onChange={(e) => onUpdateProfile({ target_language: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ borderColor: theme === 'dark' ? '#334155' : '#CBD5E1' }}
                >
                  {targetLanguages.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Your native language */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your language for explanations (Bridge Language)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Used when you need translations or explanations in your native tongue.
                </p>
                <select
                  value={profile?.bridge_language || profile?.bridgeLanguage || 'ta'}
                  onChange={(e) => onUpdateProfile({ bridge_language: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ borderColor: theme === 'dark' ? '#334155' : '#CBD5E1' }}
                >
                  {bridgeLanguages.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Retake Onboarding */}
              {onRetakeOnboarding && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onRetakeOnboarding();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Retake 10-Question Learning Plan Assessment
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border bg-slate-800/20 text-xs text-slate-400 space-y-1"
                style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              >
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Your Privacy & Data Rights
                </span>
                <p>
                  LUMA stores only your practice records, words, and learning goals. You can download or completely delete your data at any time.
                </p>
              </div>

              {/* Data Export */}
              <div className="flex items-center justify-between p-3 rounded-xl border"
                style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Export All My Data</h4>
                  <p className="text-[11px] text-slate-400">Download a full JSON archive of your profile, vocab, and missions.</p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-3 py-2 rounded-xl border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exporting...' : 'Download'}</span>
                </button>
              </div>

              {/* Data Purge */}
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-400">Permanently Delete Account & Data</h4>
                  <p className="text-[11px] text-slate-400">
                    Immediately purges all user records, sessions, vocabulary cards, and logs. This cannot be undone.
                  </p>
                </div>

                {!showPurgeConfirm ? (
                  <button
                    onClick={() => setShowPurgeConfirm(true)}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete My Account & Data</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/50 space-y-2">
                    <p className="text-xs text-rose-300 font-semibold">
                      Are you absolutely sure? All data will be permanently wiped.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePurgeAccount}
                        disabled={isPurging}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isPurging ? 'Deleting...' : 'Yes, Delete Everything'}
                      </button>
                      <button
                        onClick={() => setShowPurgeConfirm(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-xs cursor-pointer hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
