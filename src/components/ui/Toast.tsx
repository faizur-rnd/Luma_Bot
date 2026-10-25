import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'warning' | 'danger' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-[16px] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[var(--shadow-md)] transition-all animate-in slide-in-from-bottom-2 text-[14px] leading-[1.5]"
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0" />}
              {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0" />}
              {t.type === 'danger' && <AlertCircle className="w-5 h-5 text-[var(--danger)] shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-[var(--accent)] shrink-0" />}
              <span className="font-medium">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-[8px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
