import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'secondary', 
    size = 'md', 
    fullWidth = false, 
    loading = false, 
    isLoading = false,
    icon, 
    children, 
    className = '', 
    disabled, 
    ...props 
  }, ref) => {
    const isBusy = loading || isLoading;
    // Touch target is always at least 44px
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-[14px] sm:text-[16px] leading-[1.5] rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2';
    const minTouch = 'min-h-[44px] min-w-[44px]';

    const sizeStyles = {
      sm: 'px-4 py-2 text-[14px]',
      md: 'px-5 py-2.5 text-[16px]',
      lg: 'px-6 py-3 text-[16px]'
    }[size];

    const variantStyles = {
      primary: 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 shadow-sm active:scale-[0.99]',
      secondary: 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] active:scale-[0.99]',
      ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.99]',
      danger: 'bg-[var(--danger)] text-white hover:opacity-95 active:scale-[0.99]'
    }[variant];

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isBusy}
        className={`${baseStyles} ${minTouch} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
        {...props}
      >
        {isBusy ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true" />
        ) : icon ? (
          <span className="mr-2 inline-flex items-center shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
