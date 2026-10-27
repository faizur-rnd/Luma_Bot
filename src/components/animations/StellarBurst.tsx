import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface StellarBurstProps {
  active: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

export const StellarBurst: React.FC<StellarBurstProps> = ({
  active,
  onComplete,
  title = 'Radiant Progress!',
  subtitle = 'Great articulation rhythm'
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!visible) return null;

  // Particle positions
  const particles = [
    { x: -70, y: -70, c: '#38BDF8', delay: '0ms' },
    { x: 70, y: -70, c: '#818CF8', delay: '50ms' },
    { x: -80, y: 30, c: '#A855F7', delay: '100ms' },
    { x: 80, y: 30, c: '#22D3EE', delay: '150ms' },
    { x: 0, y: -90, c: '#F472B6', delay: '200ms' },
    { x: -40, y: 70, c: '#38BDF8', delay: '250ms' },
    { x: 40, y: 70, c: '#A855F7', delay: '300ms' },
    { x: 0, y: 90, c: '#FBBF24', delay: '350ms' }
  ];

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
      aria-live="assertive"
    >
      {/* Expanding Cosmic Bloom Ring */}
      <div className="absolute w-48 h-48 rounded-full border-2 border-cyan-400/80 animate-ping opacity-60" />
      <div className="absolute w-64 h-64 rounded-full border border-purple-500/70 animate-ping opacity-40 delay-150" />
      
      {/* Central Radiance Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-600/30 to-indigo-500/20 blur-3xl animate-pulse" />

      {/* Floating Starlight Particles */}
      {particles.map((p, idx) => (
        <span
          key={idx}
          className="absolute w-3 h-3 rounded-full shadow-lg animate-bounce"
          style={{
            backgroundColor: p.c,
            transform: `translate(${p.x}px, ${p.y}px) scale(1.2)`,
            animationDuration: '1.2s',
            animationDelay: p.delay,
            boxShadow: `0 0 12px ${p.c}`
          }}
        />
      ))}

      {/* Celebration Banner Card */}
      <div className="relative px-6 py-4 rounded-2xl bg-[var(--surface)]/95 border border-[var(--border)] shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <h4 className="text-base font-bold text-[var(--text)] tracking-tight">{title}</h4>
          <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
