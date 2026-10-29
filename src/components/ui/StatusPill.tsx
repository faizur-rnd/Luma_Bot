import React from 'react';

export type MeasurementStatusType = 'measured' | 'estimated' | 'unavailable' | 'not_measured_yet';

export interface StatusPillProps {
  label?: string;
  status?: MeasurementStatusType;
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  status,
  variant,
  className = ''
}) => {
  // Map explicit status chips if provided
  let displayLabel = label;
  let computedVariant: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' = variant || 'neutral';

  if (status) {
    switch (status) {
      case 'measured':
        displayLabel = label || 'Measured';
        computedVariant = 'success';
        break;
      case 'estimated':
        displayLabel = label || 'Estimated';
        computedVariant = 'warning';
        break;
      case 'unavailable':
        displayLabel = label || 'Not available';
        computedVariant = 'neutral';
        break;
      case 'not_measured_yet':
        displayLabel = label || 'Not measured yet';
        computedVariant = 'info';
        break;
    }
  }

  const variantClasses = {
    neutral: 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]',
    accent: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30',
    success: 'bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success)]/30',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning)]/30',
    danger: 'bg-[var(--danger-subtle)] text-[var(--danger)] border-[var(--danger)]/30',
    info: 'bg-[var(--info-subtle)] text-[var(--info)] border-[var(--info)]/30'
  }[computedVariant];

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-medium tracking-normal select-none ${variantClasses} ${className}`}
    >
      {displayLabel}
    </span>
  );
};
