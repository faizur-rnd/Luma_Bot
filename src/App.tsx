import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { DailyMissionHub } from './components/DailyMissionHub';
import { OfflineBanner, Skeleton } from './components/ui';
import { apiClient, UserProfile } from './services/apiClient';

const VoiceSessionView = lazy(() => import('./components/VoiceSessionView').then(m => ({ default: m.VoiceSessionView })));
const LearnTabView = lazy(() => import('./components/LearnTabView').then(m => ({ default: m.LearnTabView })));
const ProgressTabView = lazy(() => import('./components/ProgressTabView').then(m => ({ default: m.ProgressTabView })));
const OnboardingWizard = lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));

type TabId = 'home' | 'talk' | 'learn' | 'progress';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'talk', label: 'Talk', icon: '🎙️' },
  { id: 'learn', label: 'Learn', icon: '📖' },
  { id: 'progress', label: 'Progress', icon: '📈' }
];

export default function App() {
  const [activeTab, setActiveTabState] = useState<TabId>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsSection, setSettingsSection] = useState<'settings' | 'privacy'>('settings');
  const [voiceInitialLessonId, setVoiceInitialLessonId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Router: sync tab with URL path (/home, /talk, /learn, /progress, /settings)
  const navigateTo = (tab: TabId) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '').split('/')[0] ||
                   window.location.hash.replace(/^#\/?/, '').split('/')[0];
      if (['home', 'talk', 'learn', 'progress'].includes(path)) {
        setActiveTabState(path as TabId);
      } else if (path === 'settings') {
        setShowSettings(true);
      } else {
        setActiveTabState('home');
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Theme setup: follow system if no preference, allow manual toggle
  useEffect(() => {
    const saved = localStorage.getItem('luma_theme') as 'dark' | 'light' | null;
    const initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(initial);
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    setTheme(t);
    localStorage.setItem('luma_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  // Initial data load
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiClient.getProfile(),
      apiClient.getPersonalizedCurriculum()
    ]).then(([profRes, currRes]) => {
      if (!active) return;
      if (profRes.status === 'fulfilled' && profRes.value) {
        setProfile(profRes.value);
      }
      if (currRes.status === 'fulfilled' && currRes.value) {
        setCurriculum(currRes.value);
      }
      setIsLoading(false);
    });

    return () => { active = false; };
  }, []);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await apiClient.updateProfile(updates);
      setProfile((prev) => ({ ...(prev || {}), ...updated, ...updates }));
    } catch {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleStartPracticeWithLesson = (lessonId?: string, topic?: string) => {
    setVoiceInitialLessonId(lessonId);
    navigateTo('talk');
  };

  const openSettingsModal = (section: 'settings' | 'privacy' = 'settings') => {
    setSettingsSection(section);
    setShowSettings(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      <OfflineBanner />

      {/* Top Bar */}
      <Navbar
        profile={profile}
        onOpenSettings={openSettingsModal}
        theme={theme}
        setTheme={applyTheme}
        onNavigateHome={() => navigateTo('home')}
      />

      <div className="flex-1 flex max-w-[1200px] w-full mx-auto">
        {/* Left Rail (Visible at >= 1024px) */}
        <aside
          className="hidden lg:flex flex-col w-60 border-r border-[var(--border)] py-6 px-4 space-y-1.5 shrink-0"
          aria-label="Desktop primary navigation"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateTo(tab.id)}
                className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-lg" aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-[960px] mx-auto w-full px-4 sm:px-6 py-6 pb-24 lg:pb-8" id="main-content">
          {showOnboarding ? (
            <Suspense fallback={<div className="space-y-4 pt-4"><Skeleton height={40} width={240} /><Skeleton height={180} /></div>}>
              <OnboardingWizard
                onComplete={() => {
                  setShowOnboarding(false);
                  navigateTo('home');
                }}
                onCancel={() => setShowOnboarding(false)}
              />
            </Suspense>
          ) : isLoading ? (
            <div className="space-y-6 pt-4">
              <Skeleton height={40} width={240} />
              <Skeleton height={200} />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton height={96} />
                <Skeleton height={96} />
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="space-y-4 pt-4"><Skeleton height={40} width={240} /><Skeleton height={180} /></div>}>
              {activeTab === 'home' && (
                <DailyMissionHub
                  curriculum={curriculum}
                  profile={profile}
                  onRetakeOnboarding={() => setShowOnboarding(true)}
                  onSwitchToVoiceTutor={() => navigateTo('talk')}
                />
              )}

              {activeTab === 'talk' && (
                <VoiceSessionView
                  profile={profile}
                  initialLessonId={voiceInitialLessonId}
                  onNavigateTab={(tab) => navigateTo(tab as TabId)}
                />
              )}

              {activeTab === 'learn' && (
                <LearnTabView
                  profile={profile}
                  onStartPractice={handleStartPracticeWithLesson}
                />
              )}

              {activeTab === 'progress' && (
                <ProgressTabView
                  profile={profile}
                />
              )}
            </Suspense>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Hidden at >= 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md flex items-center justify-around px-2"
        aria-label="Mobile navigation bar"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo(tab.id)}
              className={`min-h-[44px] min-w-[64px] flex flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
              <span className="text-[11px] leading-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings & Privacy Dialog */}
      <Suspense fallback={null}>
        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            profile={profile}
            theme={theme}
            setTheme={applyTheme}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </Suspense>
    </div>
  );
}
