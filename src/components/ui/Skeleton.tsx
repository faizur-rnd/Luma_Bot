import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  rounded = 'md',
  className = '',
  style,
  ...props
}) => {
  const roundedClass = {
    sm: 'rounded-[12px]',
    md: 'rounded-[16px]',
    lg: 'rounded-[24px]',
    full: 'rounded-full'
  }[rounded];

  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[var(--surface-2)] border border-[var(--border)]/50 ${roundedClass} ${className}`}
      style={{ width: w, height: h, ...style }}
      {...props}
    />
  );
};
