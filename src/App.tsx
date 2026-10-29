import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Home, Mic, BookOpen, BarChart3 } from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { DailyMissionHub } from './components/DailyMissionHub.tsx';
import { OnboardingWizard } from './components/OnboardingWizard.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { BaselineAssessmentModal } from './components/BaselineAssessmentModal.tsx';
import { OfflineBanner } from './components/ui/OfflineBanner.tsx';
import { Skeleton } from './components/ui/Skeleton.tsx';
import { apiClient, UserProfile } from './services/apiClient.ts';
import { ctaAnalytics } from './services/analytics.ts';

const VoiceSessionView = lazy(() =>
  import('./components/VoiceSessionView.tsx').then((m) => ({ default: m.VoiceSessionView }))
);
const LearnTabView = lazy(() =>
  import('./components/LearnTabView.tsx').then((m) => ({ default: m.LearnTabView }))
);
const ProgressTabView = lazy(() =>
  import('./components/ProgressTabView.tsx').then((m) => ({ default: m.ProgressTabView }))
);

type MainTab = 'home' | 'practice' | 'learn' | 'progress';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [learnSubTab, setLearnSubTab] = useState<'lessons' | 'words' | 'explain'>('lessons');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('luma_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'settings' | 'privacy'>('settings');
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('luma_theme', theme);
  }, [theme]);

  useEffect(() => {
    const initApp = async () => {
      setLoadingProfile(true);
      try {
        const userProfile = await apiClient.getProfile();
        setProfile(userProfile);

        const onboardedLocal = localStorage.getItem('luma_onboarding_done') === 'true';
        if (!userProfile.email && !onboardedLocal) {
          setShowOnboarding(true);
        }
      } catch {
        // Guest fallback
      } finally {
        setLoadingProfile(false);
      }
    };
    initApp();
  }, []);

  const handleStartPractice = (lessonId?: string) => {
    if (lessonId) setActiveLessonId(lessonId);
    setActiveTab('practice');
    ctaAnalytics.track('daily_session_started');
  };

  const handleNavigateTab = (tab: string) => {
    if (tab.startsWith('learn:')) {
      const sub = tab.split(':')[1] as 'lessons' | 'words' | 'explain';
      setLearnSubTab(sub);
      setActiveTab('learn');
      return;
    }
    if (tab === 'talk' || tab === 'practice') {
      setActiveTab('practice');
      return;
    }
    if (tab === 'learn') {
      setLearnSubTab('lessons');
      setActiveTab('learn');
      return;
    }
    if (tab === 'progress') {
      setActiveTab('progress');
      return;
    }
    setActiveTab('home');
  };

  const handleLogout = () => {
    apiClient.logout().catch(() => {});
    localStorage.removeItem('luma_onboarding_done');
    setProfile(null);
    setShowSettings(false);
    setShowOnboarding(true);
  };

  const navItems: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'practice', label: 'Practice', icon: <Mic className="w-4 h-4" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <OfflineBanner />

      <Navbar
        profile={profile}
        theme={theme}
        setTheme={setTheme}
        onNavigateHome={() => setActiveTab('home')}
        onOpenSettings={(sec = 'settings') => {
          setSettingsSection(sec);
          setShowSettings(true);
        }}
        onLanguageChange={(lang) => {
          apiClient
            .updateProfile({ targetLanguage: lang, target_language: lang })
            .then(setProfile)
            .catch(() => {});
        }}
      />

      {/* Primary Section Navigation Bar */}
      <nav
        aria-label="Primary sections"
        className="w-full border-b border-[var(--border)] bg-[var(--surface)]/75 backdrop-blur-md px-4"
      >
        <div className="max-w-[960px] mx-auto flex items-center gap-2 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {loadingProfile ? (
          <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Skeleton className="h-44 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-4">
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            {activeTab === 'home' && (
              <DailyMissionHub
                profile={profile}
                onStartPractice={handleStartPractice}
                onNavigateTab={handleNavigateTab}
                onRetakeOnboarding={() => setShowOnboarding(true)}
                onOpenBaseline={() => setShowBaselineModal(true)}
              />
            )}

            {activeTab === 'practice' && (
              <VoiceSessionView
                profile={profile}
                initialLessonId={activeLessonId}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {activeTab === 'learn' && (
              <LearnTabView
                profile={profile}
                initialTab={learnSubTab}
                onStartPractice={(lessonId) => handleStartPractice(lessonId)}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTabView
                profile={profile}
                onOpenBaseline={() => setShowBaselineModal(true)}
              />
            )}
          </Suspense>
        )}
      </main>

      <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)]/50 py-4 px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[var(--text)]">Luma</span>
            <span>•</span>
            <span>12-Week Articulation & Fluency Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSettingsSection('privacy');
                setShowSettings(true);
              }}
              className="hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Privacy & Data
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsSection('settings');
                setShowSettings(true);
              }}
              className="hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Preferences
            </button>
          </div>
        </div>
      </footer>

      {showOnboarding && (
        <OnboardingWizard
          onComplete={(updatedProfile, launchBaseline) => {
            if (updatedProfile) setProfile(updatedProfile);
            setShowOnboarding(false);
            if (launchBaseline) setShowBaselineModal(true);
          }}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      <BaselineAssessmentModal
        isOpen={showBaselineModal}
        nativeLanguage={profile?.bridgeLanguage || profile?.bridge_language || 'ta'}
        onClose={() => setShowBaselineModal(false)}
        onCompleteBaseline={() => {
          setShowBaselineModal(false);
          setActiveTab('practice');
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        initialSection={settingsSection}
        theme={theme}
        setTheme={setTheme}
        onUpdateProfile={(updated) => setProfile(updated)}
        onLogout={handleLogout}
      />
    </div>
  );
}
