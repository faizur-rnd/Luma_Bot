import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label 
            htmlFor={generatedId} 
            className="text-[14px] font-semibold text-[var(--text)] tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={generatedId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${generatedId}-error` : helperText ? `${generatedId}-helper` : undefined}
          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-[12px] bg-[var(--surface-2)] text-[var(--text)] border ${
            error ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border)] focus:border-[var(--accent)]'
          } placeholder-[var(--muted)] text-[16px] leading-[1.5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className}`}
          {...props}
        />
        {error && (
          <p id={`${generatedId}-error`} className="text-[14px] font-medium text-[var(--danger)] mt-0.5">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${generatedId}-helper`} className="text-[14px] text-[var(--muted)] mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
