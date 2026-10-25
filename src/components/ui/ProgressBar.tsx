import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  showPercentage,
  className = ''
}) => {
  const displayPercent = showPercentage !== undefined ? showPercentage : showPercent;
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || displayPercent) && (
        <div className="flex items-center justify-between text-[14px] text-[var(--muted)] font-medium">
          {label && <span>{label}</span>}
          {displayPercent && <span className="font-semibold text-[var(--text)]">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className="w-full h-3 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden"
      >
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
