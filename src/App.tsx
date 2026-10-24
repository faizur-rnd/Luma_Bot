import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DailyMissionHub } from './components/DailyMissionHub.tsx';
import { VoiceSessionView } from './components/VoiceSessionView.tsx';
import { CurriculumView } from './components/CurriculumView.tsx';
import { TeachBackAssessmentView } from './components/TeachBackAssessmentView.tsx';
import { VocabularyVaultView } from './components/VocabularyVaultView.tsx';
import { DatabaseAdminView } from './components/DatabaseAdminView.tsx';
import { OnboardingWizard } from './components/OnboardingWizard.tsx';
import { apiClient, UserProfile } from './services/apiClient.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('missions');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<any | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isLive: boolean; provider: string }>({
    isLive: false,
    provider: 'Local Cache Fallback'
  });

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

  // Load profile, database health, onboarding, and personalized curriculum
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Check cached profile first so user's selected language is immediately preserved
    let cachedProf: UserProfile | null = null;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luma_cached_profile');
      if (saved) {
        try { cachedProf = JSON.parse(saved); } catch {}
      }
    }
    if (cachedProf) setProfile(cachedProf);

    try {
      const [prof, health, onboardData, currData] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getDbHealth(),
        apiClient.getOnboarding().catch(() => null),
        apiClient.getPersonalizedCurriculum().catch(() => null)
      ]);
      const effectiveProf = cachedProf ? { ...prof, ...cachedProf } : prof;
      setProfile(effectiveProf);
      setDbStatus({
        isLive: health.database.isLive,
        provider: health.database.provider
      });
      setOnboardingAnswers(onboardData);
      setCurriculum(currData);

      // If learner has never taken onboarding, open onboarding wizard
      if (!onboardData) {
        setShowOnboarding(true);
      }
    } catch (e) {
      console.warn('Initial data load completed in offline mode:', e);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    // 1. Immediately optimistically update profile state so UI updates instantaneously!
    setProfile(prev => {
      const next = prev ? { ...prev, ...updates } : {
        id: 'usr_luma_default_001',
        email: 'learner@luma.ai',
        display_name: 'LUMA Learner',
        target_language: updates.target_language || 'en',
        bridge_language: updates.bridge_language || 'ta',
        proficiency_level: 'B1',
        daily_goal_minutes: 30,
        streak_count: 5,
        ...updates
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('luma_cached_profile', JSON.stringify(next));
      }
      return next;
    });

    try {
      const updated = await apiClient.updateProfile(updates);
      setProfile(prev => ({ ...(prev || {}), ...updated, ...updates }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('luma_cached_profile', JSON.stringify({ ...updated, ...updates }));
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const [voiceInitialLessonId, setVoiceInitialLessonId] = useState<string | undefined>(undefined);

  const handleStartVoiceWithScenario = (lessonId: string) => {
    setVoiceInitialLessonId(lessonId);
    setActiveTab('voice');
  };

  const handleCompleteOnboarding = async (newCurriculum: any) => {
    setCurriculum(newCurriculum);
    setShowOnboarding(false);
    setActiveTab('missions');
    try {
      const updatedProf = await apiClient.getProfile();
      setProfile(prev => ({ ...(prev || {}), ...updatedProf }));
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
        onUpdateProfile={handleUpdateProfile}
        dbStatus={dbStatus}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-16">
        {showOnboarding ? (
          <OnboardingWizard
            theme={theme}
            existingAnswers={onboardingAnswers}
            onComplete={handleCompleteOnboarding}
            onCancel={() => setShowOnboarding(false)}
          />
        ) : (
          <>
            {activeTab === 'missions' && (
              <DailyMissionHub
                theme={theme}
                curriculum={curriculum}
                profile={profile}
                onRetakeOnboarding={() => setShowOnboarding(true)}
                onSwitchToVoiceTutor={() => setActiveTab('voice')}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceSessionView
                profile={profile}
                theme={theme}
                initialLessonId={voiceInitialLessonId}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenOnboarding={() => setShowOnboarding(true)}
                onToggleTheme={() => handleSetTheme(theme === 'dark' ? 'light' : 'dark')}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {activeTab === 'curriculum' && (
              <CurriculumView
                profile={profile}
                theme={theme}
                onStartVoiceWithScenario={handleStartVoiceWithScenario}
              />
            )}

            {activeTab === 'assessment' && (
              <TeachBackAssessmentView profile={profile} theme={theme} />
            )}

            {activeTab === 'vocabulary' && (
              <VocabularyVaultView profile={profile} theme={theme} />
            )}

            {activeTab === 'database' && (
              <DatabaseAdminView
                profile={profile}
                theme={theme}
                onRefreshProfile={loadInitialData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 text-center text-xs transition-colors duration-200"
        style={{
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
          color: theme === 'dark' ? '#64748B' : '#94A3B8'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight bg-gradient-aurora bg-clip-text text-transparent">
              LUMA
            </span>
            <span>— Find your voice. Think in a new language.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>70/20/10 AI Curriculum</span>
            <span>•</span>
            <span>Neon PostgreSQL Engine</span>
            <span>•</span>
            <span>Supernova Orb 3D</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
