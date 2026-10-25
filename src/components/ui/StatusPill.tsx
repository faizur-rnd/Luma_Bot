import React from 'react';

export interface StatusPillProps {
  label: string;
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = 'neutral',
  className = ''
}) => {
  const variantClasses = {
    neutral: 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]',
    accent: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
    success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
  }[variant];

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[14px] font-semibold leading-[1.3] select-none ${variantClasses} ${className}`}
    >
      {label}
    </span>
  );
};
