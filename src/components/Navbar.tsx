import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Award, 
  Home, 
  Sun, 
  Moon, 
  Flame, 
  Settings 
} from 'lucide-react';
import { UserProfile } from '../services/apiClient.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  profile: UserProfile | null;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  profile,
  onOpenSettings
}) => {
  const learnerTabs = [
    { id: 'home', label: 'Home', icon: Home, panelId: 'panel-home' },
    { id: 'talk', label: 'Talk', icon: Sparkles, panelId: 'panel-talk' },
    { id: 'learn', label: 'Learn', icon: BookOpen, panelId: 'panel-learn' },
    { id: 'progress', label: 'Progress', icon: Award, panelId: 'panel-progress' }
  ];

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-200"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(8, 11, 20, 0.90)' : 'rgba(248, 250, 252, 0.92)',
        borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
      }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg p-1"
          aria-label="LUMA Home"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center p-[2px] shadow-sm">
            <div className="w-full h-full rounded-[10px] bg-[#080B14] flex items-center justify-center">
              <span className="font-extrabold text-sm tracking-wider text-white">
                L
              </span>
            </div>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              LUMA
            </span>
            <span className="sr-only">Language Tutor</span>
          </div>
        </button>

        {/* 4 Primary Learner Tabs with real tablist semantics */}
        <nav
          className="hidden md:flex items-center gap-1.5 p-1 rounded-xl border"
          role="tablist"
          aria-label="Main Navigation"
          style={{
            backgroundColor: theme === 'dark' ? '#0D1220' : '#F1F5F9',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          {learnerTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={item.panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Daily Streak Indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none"
            style={{
              borderColor: 'rgba(251, 146, 60, 0.4)',
              backgroundColor: 'rgba(251, 146, 60, 0.1)',
              color: '#FB923C'
            }}
            title="Daily Practice Streak"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>{profile?.streak_count || 1} day streak</span>
          </div>

          {/* Theme Toggle Button (44px min touch target) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer hover:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
              color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-orange-400" />
            ) : (
              <Moon className="w-4 h-4 text-violet-600" />
            )}
          </button>

          {/* Settings & Profile Button (44px min touch target) */}
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer hover:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
              color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
            }}
            aria-label="Open settings and profile"
            title="Settings & Privacy"
          >
            <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <nav
        className="md:hidden flex items-center justify-around border-t py-1 px-1"
        role="tablist"
        aria-label="Mobile Navigation"
        style={{
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
          backgroundColor: theme === 'dark' ? '#080B14' : '#FFFFFF'
        }}
      >
        {learnerTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={item.panelId}
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-violet-500 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
