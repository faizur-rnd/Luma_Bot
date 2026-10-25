import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../services/apiClient';

interface NavbarProps {
  profile: UserProfile | null;
  onOpenSettings: (section?: 'settings' | 'privacy') => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenSettings,
  theme,
  setTheme,
  onNavigateHome
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const streak = profile?.streak_count || 0;
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Learner';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-4 sm:px-6"
      role="banner"
    >
      <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 rounded-lg p-1 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          aria-label="LUMA home"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-[var(--accent-contrast)] font-black text-sm shadow-sm">
            L
          </div>
          <span className="text-lg font-black tracking-tight text-[var(--text)]">
            LUMA
          </span>
        </button>

        {/* Right side items: Streak badge & Profile menu */}
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold text-[var(--text)]"
            title={`${streak} consecutive practice days`}
          >
            <span aria-hidden="true">🔥</span>
            <span>{streak}</span>
          </div>

          {/* Profile Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] font-bold text-sm flex items-center justify-center hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all cursor-pointer"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Learner profile menu"
            >
              {initial}
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
                aria-label="Profile options"
              >
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <p className="text-sm font-bold text-[var(--text)] truncate">{displayName}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{profile?.email || 'Active learner'}</p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onOpenSettings('settings'); }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onOpenSettings('settings'); }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors"
                >
                  <span>🌐</span>
                  <span>Language preferences</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onOpenSettings('privacy'); }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors"
                >
                  <span>🛡️</span>
                  <span>Privacy & Data</span>
                </button>

                <div className="border-t border-[var(--border)] my-1 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                      setMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl text-left transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                      <span>Theme</span>
                    </span>
                    <span className="text-xs text-[var(--muted)] font-medium capitalize">{theme}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
