import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';

export type VoiceGender = 'female' | 'male';

interface VoiceGenderToggleProps {
  gender: VoiceGender;
  onToggle: (newGender: VoiceGender) => void;
  className?: string;
  compact?: boolean;
}

export const VoiceGenderToggle: React.FC<VoiceGenderToggleProps> = ({
  gender,
  onToggle,
  className = '',
  compact = false
}) => {
  const isFemale = gender === 'female';

  const handleToggle = () => {
    const nextGender: VoiceGender = isFemale ? 'male' : 'female';
    onToggle(nextGender);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
          isFemale
            ? 'bg-purple-500/15 border-purple-400/40 text-purple-300 hover:bg-purple-500/25'
            : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25'
        } ${className}`}
        title={`Current voice: ${isFemale ? 'Female' : 'Male'} coach. Click to switch.`}
        aria-label={`Switch voice from ${gender} coach`}
      >
        <span className="text-[10px]">{isFemale ? '♀' : '♂'}</span>
        <span>{isFemale ? 'Female' : 'Male'}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] shadow-[var(--shadow-sm)] ${className}`}
      role="group"
      aria-label="Coach voice selection"
    >
      <button
        type="button"
        onClick={() => onToggle('female')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
          isFemale
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
            : 'text-[var(--muted)] hover:text-[var(--text)]'
        }`}
        aria-pressed={isFemale}
      >
        <span className="text-[12px]">♀</span>
        <span>Female Coach</span>
      </button>

      <button
        type="button"
        onClick={() => onToggle('male')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
          !isFemale
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
            : 'text-[var(--muted)] hover:text-[var(--text)]'
        }`}
        aria-pressed={!isFemale}
      >
        <span className="text-[12px]">♂</span>
        <span>Male Coach</span>
      </button>
    </div>
  );
};
