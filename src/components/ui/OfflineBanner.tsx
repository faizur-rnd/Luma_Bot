import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-[var(--warning)] text-[#0B1020] px-4 py-2.5 text-center text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Check your internet connection to practice with LUMA.</span>
    </div>
  );
};
