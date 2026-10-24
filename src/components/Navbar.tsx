import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Award, 
  Layers, 
  Database, 
  Sun, 
  Moon, 
  Flame, 
  Globe2, 
  ShieldCheck,
  Target,
  Compass
} from 'lucide-react';
import { UserProfile } from '../services/apiClient.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  profile: UserProfile | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  dbStatus: { isLive: boolean; provider: string };
  onOpenOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  profile,
  onUpdateProfile,
  dbStatus,
  onOpenOnboarding
}) => {
  const targetLanguages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'de', label: 'Deutsch (German)' }
  ];

  const bridgeLanguages = [
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'ar', label: 'العربية (Arabic)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'de', label: 'Deutsch (German)' }
  ];

  const navItems = [
    { id: 'missions', label: 'Daily Mission (70/20/10)', icon: Target },
    { id: 'voice', label: 'Voice AI', icon: Sparkles },
    { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { id: 'assessment', label: 'Teach-Back', icon: Award },
    { id: 'vocabulary', label: 'Vocab Vault', icon: Layers },
    { id: 'database', label: 'Neon DB', icon: Database }
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-200"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(8, 11, 20, 0.85)' : 'rgba(248, 250, 252, 0.88)',
        borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('voice')}>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-aurora flex items-center justify-center p-[2px] shadow-lg shadow-[#8B5CF6]/20">
            <div className="w-full h-full rounded-[10px] bg-[#080B14] flex items-center justify-center">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-aurora bg-clip-text text-transparent">
                L
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-aurora bg-clip-text text-transparent">
                LUMA
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE]">
                Aurora 2.0
              </span>
            </div>
            <p className="text-[10px] hidden sm:block font-medium tracking-wide text-[#64748B] dark:text-[#94A3B8]">
              Find your voice. Think in a new language.
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl border"
          style={{
            backgroundColor: theme === 'dark' ? '#0D1220' : '#F1F5F9',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-cosmic text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'database' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.isLive ? 'bg-[#34D399]' : 'bg-[#FB923C]'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Target Language Selector */}
          <div className="relative flex items-center">
            <select
              value={profile?.target_language || 'en'}
              onChange={(e) => onUpdateProfile({ target_language: e.target.value })}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg border appearance-none cursor-pointer focus:outline-none transition-colors"
              style={{
                backgroundColor: theme === 'dark' ? '#064E3B' : '#ECFDF5',
                borderColor: '#10B981',
                color: theme === 'dark' ? '#6EE7B7' : '#065F46'
              }}
              title="Target Language: The language you are learning with LUMA"
            >
              {targetLanguages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-[#111827] text-white">
                  Target: {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bridge Language Selector */}
          <div className="relative flex items-center">
            <Globe2 className="w-3.5 h-3.5 absolute left-2.5 text-[#8B5CF6] pointer-events-none" />
            <select
              value={profile?.bridge_language || 'ta'}
              onChange={(e) => onUpdateProfile({ bridge_language: e.target.value })}
              className="pl-7 pr-3 py-1.5 text-xs font-medium rounded-lg border appearance-none cursor-pointer focus:outline-none transition-colors"
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
                color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
              }}
              title="Bridge Language: Your native language for explanations"
            >
              {bridgeLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  Bridge: {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Onboarding Wizard Trigger */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 text-xs font-semibold cursor-pointer transition-colors"
              title="Retake or adjust the 10-Question Onboarding Assessment"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>10-Q Plan</span>
            </button>
          )}

          {/* Daily Streak Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#FB923C]/30 bg-[#FB923C]/10 text-[#FB923C] text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-[#FB923C]" />
            <span>{profile?.streak_count || 5}d</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border transition-colors cursor-pointer hover:border-[#8B5CF6]"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
              color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FB923C]" />
            ) : (
              <Moon className="w-4 h-4 text-[#6D28D9]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t py-2 px-1"
        style={{
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
          backgroundColor: theme === 'dark' ? '#080B14' : '#FFFFFF'
        }}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium ${
                isActive ? 'text-[#8B5CF6]' : 'text-[#64748B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
