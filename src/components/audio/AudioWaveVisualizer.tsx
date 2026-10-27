import React from 'react';

interface AudioWaveVisualizerProps {
  isActive: boolean;
  audioLevel?: number;
  className?: string;
  barCount?: number;
  colorScheme?: 'cyan' | 'purple' | 'emerald';
}

export const AudioWaveVisualizer: React.FC<AudioWaveVisualizerProps> = ({
  isActive,
  audioLevel = 0,
  className = '',
  barCount = 5,
  colorScheme = 'cyan'
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  const colors = {
    cyan: 'from-cyan-400 to-blue-500',
    purple: 'from-purple-400 to-indigo-500',
    emerald: 'from-emerald-400 to-teal-500'
  }[colorScheme];

  return (
    <div
      className={`inline-flex items-center gap-1 h-6 px-2 ${className}`}
      aria-hidden="true"
    >
      {bars.map((i) => {
        // Individual bar height based on sine wave pattern + audio level
        const offset = Math.sin((i / (barCount - 1)) * Math.PI);
        const dynamicScale = isActive
          ? Math.max(0.2, Math.min(1.0, 0.25 + audioLevel * 1.5 * offset + Math.sin(Date.now() / 200 + i) * 0.15))
          : 0.15;

        return (
          <span
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t ${colors} transition-all duration-75`}
            style={{
              height: '100%',
              transform: `scaleY(${dynamicScale})`,
              transformOrigin: 'center'
            }}
          />
        );
      })}
    </div>
  );
};
