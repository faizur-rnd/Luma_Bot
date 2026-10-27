import React from 'react';
import { VoiceSessionState } from './types.ts';

interface FallbackOrbProps {
  state: VoiceSessionState;
  audioLevel?: number;
  reducedMotion?: boolean;
  className?: string;
}

export const FallbackOrb: React.FC<FallbackOrbProps> = ({
  state,
  audioLevel = 0,
  reducedMotion = false,
  className = ''
}) => {
  const pulseScale = reducedMotion ? 1 : 1 + Math.min(0.25, audioLevel * 0.3);

  // ChatGPT iridescent color palette
  const stateGradients: Record<VoiceSessionState, { outer: string; inner: string; glow: string }> = {
    idle: {
      outer: 'from-sky-400 via-blue-600 to-purple-600',
      inner: 'from-white via-sky-300 to-indigo-500',
      glow: 'rgba(56, 189, 248, 0.45)'
    },
    listening: {
      outer: 'from-cyan-300 via-sky-500 to-indigo-600',
      inner: 'from-white via-cyan-200 to-blue-500',
      glow: 'rgba(34, 211, 238, 0.65)'
    },
    transcribing: {
      outer: 'from-sky-400 via-indigo-500 to-violet-600',
      inner: 'from-white via-sky-200 to-purple-500',
      glow: 'rgba(99, 102, 241, 0.6)'
    },
    thinking: {
      outer: 'from-indigo-400 via-purple-600 to-fuchsia-600',
      inner: 'from-white via-purple-300 to-indigo-700',
      glow: 'rgba(168, 85, 247, 0.65)'
    },
    speaking: {
      outer: 'from-cyan-400 via-blue-600 to-purple-600',
      inner: 'from-white via-sky-200 to-blue-600',
      glow: 'rgba(56, 189, 248, 0.75)'
    },
    interrupted: {
      outer: 'from-amber-400 via-orange-500 to-rose-600',
      inner: 'from-white via-amber-200 to-red-500',
      glow: 'rgba(251, 146, 60, 0.6)'
    },
    offline_error: {
      outer: 'from-orange-400 via-red-500 to-rose-700',
      inner: 'from-white via-orange-200 to-red-600',
      glow: 'rgba(239, 68, 68, 0.5)'
    }
  };

  const currentTheme = stateGradients[state] || stateGradients.idle;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      {/* Volumetric outer glow */}
      <div
        className={`absolute inset-4 rounded-full bg-gradient-to-tr ${currentTheme.outer} opacity-50 blur-2xl transition-all duration-300`}
        style={{
          transform: `scale(${pulseScale * 1.15})`,
          boxShadow: `0 0 60px ${currentTheme.glow}`
        }}
      />

      {/* Fluid organic morphing body */}
      <div
        className={`relative w-3/4 h-3/4 rounded-full bg-gradient-to-tr ${currentTheme.outer} shadow-2xl transition-transform duration-200 flex items-center justify-center overflow-hidden`}
        style={{
          transform: `scale(${pulseScale})`,
          borderRadius: reducedMotion ? '50%' : '56% 44% 52% 48% / 48% 54% 46% 52%'
        }}
      >
        {/* Iridescent liquid interior reflection */}
        <div
          className={`w-4/5 h-4/5 rounded-full bg-gradient-to-br ${currentTheme.inner} opacity-85 blur-sm flex items-center justify-center`}
        >
          {/* Radiant white hot center core */}
          <div className="w-1/2 h-1/2 rounded-full bg-white/90 blur-[2px] shadow-[0_0_24px_rgba(255,255,255,0.9)]" />
        </div>
      </div>
    </div>
  );
};
