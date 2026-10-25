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
  // Orb colors (cyan, violet, pink) used strictly inside the orb
  const pulseScale = reducedMotion ? 1 : 1 + Math.min(0.2, audioLevel * 0.25);

  const stateColors = {
    idle: 'from-[#6C7BFF] via-[#8B5CF6] to-[#06B6D4]',
    listening: 'from-[#06B6D4] via-[#3B82F6] to-[#6C7BFF]',
    transcribing: 'from-[#38BDF8] via-[#818CF8] to-[#C084FC]',
    thinking: 'from-[#A855F7] via-[#EC4899] to-[#6366F1]',
    speaking: 'from-[#6366F1] via-[#06B6D4] to-[#EC4899]',
    interrupted: 'from-[#F59E0B] via-[#EF4444] to-[#8B5CF6]',
    offline_error: 'from-[#EF4444] via-[#B91C1C] to-[#7F1D1D]'
  }[state] || 'from-[#6C7BFF] via-[#8B5CF6] to-[#06B6D4]';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* Outer ambient blur */}
      <div
        className={`absolute inset-4 rounded-full bg-gradient-to-tr ${stateColors} opacity-40 blur-xl transition-all duration-300`}
        style={{
          transform: `scale(${pulseScale * 1.1})`
        }}
      />
      {/* Main spherical body */}
      <div
        className={`relative w-3/4 h-3/4 rounded-full bg-gradient-to-tr ${stateColors} shadow-lg transition-transform duration-200 border border-white/20 flex items-center justify-center`}
        style={{
          transform: `scale(${pulseScale})`
        }}
      >
        {/* Inner glow core */}
        <div className="w-1/2 h-1/2 rounded-full bg-white/20 blur-sm" />
      </div>
    </div>
  );
};
