import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'surface-2';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'surface', 
    padding = 'md', 
    as: Component = 'div', 
    className = '', 
    children, 
    ...props 
  }, ref) => {
    const bgClass = variant === 'surface' ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]';
    const paddingClass = {
      none: '',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    }[padding];

    return (
      <Component
        ref={ref}
        className={`border border-[var(--border)] rounded-[16px] text-[var(--text)] shadow-[var(--shadow-sm)] transition-colors duration-150 ${bgClass} ${paddingClass} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
