import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DailyMissionHub } from './components/DailyMissionHub.tsx';
import { VoiceSessionView } from './components/VoiceSessionView.tsx';
import { LearnTabView } from './components/LearnTabView.tsx';
import { ProgressTabView } from './components/ProgressTabView.tsx';
import { DatabaseAdminView } from './components/DatabaseAdminView.tsx';
import { OnboardingWizard } from './components/OnboardingWizard.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { apiClient, UserProfile } from './services/apiClient.ts';

export default function App() {
  const [activeTab, setActiveTabState] = useState<string>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<any | null>(null);
  const [voiceInitialLessonId, setVoiceInitialLessonId] = useState<string | undefined>(undefined);

  // Synchronize activeTab with URL hash for browser history & deep linking
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (['home', 'talk', 'learn', 'progress', 'admin-db'].includes(hash)) {
        setActiveTabState(hash);
      } else if (hash === 'settings') {
        setShowSettings(true);
      } else {
        // default to home
        setActiveTabState('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('luma_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    applyThemeToDOM(initialTheme);
  }, []);

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('luma_theme', newTheme);
    applyThemeToDOM(newTheme);
  };

  const applyThemeToDOM = (t: 'dark' | 'light') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#080B14';
      document.body.style.color = '#F8FAFC';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#0F172A';
    }
  };

  // Load profile and personalized curriculum
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    let cachedProf: UserProfile | null = null;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luma_cached_profile');
      if (saved) {
        try {
          cachedProf = JSON.parse(saved);
        } catch {}
      }
    }
    if (cachedProf) setProfile(cachedProf);

    try {
      const [prof, onboardData, currData] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getOnboarding().catch(() => null),
        apiClient.getPersonalizedCurriculum().catch(() => null)
      ]);
      const effectiveProf = cachedProf ? { ...prof, ...cachedProf } : prof;
      setProfile(effectiveProf);
      setOnboardingAnswers(onboardData);
      setCurriculum(currData);

      if (!onboardData) {
        setShowOnboarding(true);
      }
    } catch (e) {
      console.warn('Initial data load completed in offline mode:', e);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) return null;
      const next: UserProfile = {
        ...prev,
        ...updates,
        displayName: updates.displayName || updates.display_name || prev.displayName,
        display_name: updates.displayName || updates.display_name || prev.displayName,
        targetLanguage: updates.targetLanguage || updates.target_language || prev.targetLanguage,
        target_language: updates.targetLanguage || updates.target_language || prev.targetLanguage,
        bridgeLanguage: updates.bridgeLanguage || updates.bridge_language || prev.bridgeLanguage,
        bridge_language: updates.bridgeLanguage || updates.bridge_language || prev.bridgeLanguage
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('luma_cached_profile', JSON.stringify(next));
      }
      return next;
    });

    try {
      const updated = await apiClient.updateProfile(updates);
      setProfile((prev) => ({ ...(prev || {}), ...updated, ...updates }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('luma_cached_profile', JSON.stringify({ ...updated, ...updates }));
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const handleStartVoiceWithScenario = (lessonId: string) => {
    setVoiceInitialLessonId(lessonId);
    setActiveTab('talk');
  };

  const handleCompleteOnboarding = async (newCurriculum: any) => {
    setCurriculum(newCurriculum);
    setShowOnboarding(false);
    setActiveTab('home');
    try {
      const updatedProf = await apiClient.getProfile();
      setProfile((prev) => ({ ...(prev || {}), ...updatedProf }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('luma_cached_profile', JSON.stringify(updatedProf));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={handleSetTheme}
        profile={profile}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-12" id="main-content">
        {showOnboarding ? (
          <OnboardingWizard
            theme={theme}
            existingAnswers={onboardingAnswers}
            onComplete={handleCompleteOnboarding}
            onCancel={() => setShowOnboarding(false)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <div id="panel-home" role="tabpanel" aria-labelledby="tab-home">
                <DailyMissionHub
                  theme={theme}
                  curriculum={curriculum}
                  profile={profile}
                  onRetakeOnboarding={() => setShowOnboarding(true)}
                  onSwitchToVoiceTutor={() => setActiveTab('talk')}
                />
              </div>
            )}

            {activeTab === 'talk' && (
              <div id="panel-talk" role="tabpanel" aria-labelledby="tab-talk">
                <VoiceSessionView
                  profile={profile}
                  theme={theme}
                  initialLessonId={voiceInitialLessonId}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenOnboarding={() => setShowOnboarding(true)}
                  onToggleTheme={() => handleSetTheme(theme === 'dark' ? 'light' : 'dark')}
                  onUpdateProfile={handleUpdateProfile}
                />
              </div>
            )}

            {activeTab === 'learn' && (
              <div id="panel-learn" role="tabpanel" aria-labelledby="tab-learn">
                <LearnTabView
                  profile={profile}
                  theme={theme}
                  onStartVoiceWithScenario={handleStartVoiceWithScenario}
                />
              </div>
            )}

            {activeTab === 'progress' && (
              <div id="panel-progress" role="tabpanel" aria-labelledby="tab-progress">
                <ProgressTabView profile={profile} theme={theme} />
              </div>
            )}

            {activeTab === 'admin-db' && (
              <div id="panel-admin-db" role="tabpanel" aria-label="Database Administration Console">
                <DatabaseAdminView
                  profile={profile}
                  theme={theme}
                  onRefreshProfile={loadInitialData}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Settings & Privacy Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        theme={theme}
        onUpdateProfile={handleUpdateProfile}
        onRetakeOnboarding={() => setShowOnboarding(true)}
      />

      {/* Footer */}
      <footer
        className="border-t py-6 text-center text-xs transition-colors duration-200 mt-auto"
        style={{
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
          color: theme === 'dark' ? '#64748B' : '#94A3B8'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-violet-400">
              LUMA
            </span>
            <span>— Find your voice. Think in a new language.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Personalized Practice</span>
            <span>•</span>
            <span>PostgreSQL & Gemini</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('admin-db')}
              className="hover:underline text-slate-500 hover:text-slate-400 cursor-pointer"
            >
              System Health
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
