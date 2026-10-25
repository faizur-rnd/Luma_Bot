import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items?: TabItem[];
  tabs?: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Navigation tabs',
  className = ''
}) => {
  const tabList = items || tabs || [];
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabList.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabList.length) % tabList.length;
      e.preventDefault();
    } else if (e.key === 'Home') {
      nextIndex = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      nextIndex = tabList.length - 1;
      e.preventDefault();
    }

    if (nextIndex !== index) {
      onChange(tabList[nextIndex].id);
      const nextEl = document.getElementById(`tab-${tabList[nextIndex].id}`);
      nextEl?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 p-1 rounded-[16px] bg-[var(--surface-2)] border border-[var(--border)] ${className}`}
    >
      {tabList.map((item, index) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-[12px] text-[14px] sm:text-[16px] font-semibold transition-all duration-150 inline-flex items-center justify-center gap-2 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/50'
            }`}
          >
            {item.icon && <span className="inline-flex shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="text-[14px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] font-medium">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
