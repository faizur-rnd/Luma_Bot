import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../services/apiClient';
import { Sparkles, Flame, Settings, ShieldCheck, Sun, Moon, LogOut } from 'lucide-react';

interface NavbarProps {
  profile: UserProfile | null;
  onOpenSettings: (section?: 'settings' | 'privacy') => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  onNavigateHome: () => void;
  onLanguageChange?: (lang: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenSettings,
  theme,
  setTheme,
  onNavigateHome,
  onLanguageChange
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const streak = profile?.streak_count || 1;
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Learner';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl px-4 sm:px-6"
      role="banner"
    >
      <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 rounded-lg p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] group cursor-pointer"
          aria-label="LUMA home"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--accent-contrast)] font-bold text-sm shadow-xs group-hover:bg-[var(--accent-hover)] transition-colors">
            L
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[var(--text)] leading-none">
              LUMA
            </span>
            <span className="text-[10px] font-semibold text-[var(--accent)] tracking-wider uppercase mt-0.5">
              Speaking Coach
            </span>
          </div>
        </button>

        {/* Right side items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Target Language Selector */}
          <div className="relative">
            <select
              value={profile?.target_language || profile?.targetLanguage || 'en'}
              onChange={(e) => onLanguageChange?.(e.target.value)}
              className="appearance-none bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-md px-3 py-1.5 pr-6 text-xs font-medium hover:border-[var(--accent)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Target language"
            >
              <option value="en">English (Target)</option>
              <option value="ta">Tamil (L1 Bridge)</option>
              <option value="ar">Arabic (L1 Bridge)</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">▼</span>
          </div>

          {/* Streak Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--gold-subtle)] text-xs font-semibold text-[var(--warning)]"
            title={`${streak} consecutive practice days`}
          >
            <Flame className="w-3.5 h-3.5 text-[var(--warning)]" />
            <span className="font-mono tabular-nums">{streak}d</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)] flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--gold)]" /> : <Moon className="w-4 h-4 text-[var(--accent)]" />}
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-md border border-[var(--border)] bg-[var(--peach)] text-[var(--text)] font-bold text-xs flex items-center justify-center hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all cursor-pointer"
              aria-expanded={menuOpen}
              aria-label="Learner profile menu"
            >
              {initial}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{displayName}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">{profile?.email || 'Guest'}</p>
                </div>

                <button
                  onClick={() => { setMenuOpen(false); onOpenSettings('settings'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-[var(--muted)]" />
                  <span>Coach Settings & Voices</span>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenSettings('privacy'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--muted)]" />
                  <span>Privacy Consents</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
