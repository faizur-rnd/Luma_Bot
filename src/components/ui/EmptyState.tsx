import React from 'react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className = ''
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[24px] bg-[var(--surface)] border border-[var(--border)] max-w-[600px] mx-auto ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-[16px] bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-[20px] font-bold text-[var(--text)] mb-2 leading-[1.3]">
        {title}
      </h3>
      <p className="text-[14px] sm:text-[16px] text-[var(--muted)] leading-[1.5] max-w-[420px] mb-6">
        {description}
      </p>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
