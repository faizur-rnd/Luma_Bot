import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button.tsx';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something didn't load",
  message = "Can't reach the tutor. Try again.",
  onRetry,
  className = ''
}) => {
  return (
    <div 
      role="alert"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-[24px] bg-[var(--surface)] border border-[var(--danger)]/30 max-w-[540px] mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-[16px] bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center mb-4 shrink-0">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-[20px] font-bold text-[var(--text)] mb-2 leading-[1.3]">
        {title}
      </h3>
      <p className="text-[14px] sm:text-[16px] text-[var(--muted)] leading-[1.5] max-w-[400px] mb-6">
        {message}
      </p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};
