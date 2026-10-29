import React, { useEffect, useRef, useState } from 'react';
import { VoiceSessionState } from './orb/types.ts';
import { FallbackOrb } from './orb/FallbackOrb.tsx';

export type { VoiceSessionState };

export interface VoiceOrbProps {
  state: VoiceSessionState;
  audioLevel?: number;
  reducedMotion?: boolean;
  className?: string;
  onClick?: () => void;
}

function detectLowPowerOrReducedMotion(explicitReducedMotion: boolean): boolean {
  if (explicitReducedMotion) return true;
  if (typeof window === 'undefined') return true;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      return true;
    }
  } catch {}
  return false;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state = 'idle',
  audioLevel = 0,
  reducedMotion = false,
  className = '',
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneInstanceRef = useRef<any>(null);
  const [useFallback, setUseFallback] = useState(() => detectLowPowerOrReducedMotion(reducedMotion));

  const statusLabels: Record<VoiceSessionState, string> = {
    idle: 'Start Speaking — Tap or press Enter to talk',
    listening: 'Listening — Tap or press Enter to stop recording',
    transcribing: 'Processing your speech',
    thinking: 'Coach is preparing feedback',
    speaking: 'Coach speaking — Tap or press Enter to interrupt',
    interrupted: 'Interrupted — Tap to resume speaking',
    offline_error: 'Microphone notice — Tap to retry speaking'
  };

  useEffect(() => {
    if (detectLowPowerOrReducedMotion(reducedMotion)) {
      setUseFallback(true);
      return;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setUseFallback(true);
      return;
    }

    let isMounted = true;

    import('./orb/ThreeOrbScene.ts')
      .then(({ ThreeOrbScene }) => {
        if (!isMounted || !mountRef.current) return;
        try {
          const scene = new ThreeOrbScene(mountRef.current, reducedMotion);
          sceneInstanceRef.current = scene;
          scene.updateState(state, audioLevel);
        } catch {
          setUseFallback(true);
        }
      })
      .catch(() => {
        if (isMounted) setUseFallback(true);
      });

    return () => {
      isMounted = false;
      if (sceneInstanceRef.current) {
        sceneInstanceRef.current.dispose();
        sceneInstanceRef.current = null;
      }
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.updateState(state, audioLevel);
    }
  }, [state, audioLevel]);

  useEffect(() => {
    if (!mountRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (sceneInstanceRef.current && width > 0 && height > 0) {
          sceneInstanceRef.current.resize(width, height);
        }
      }
    });

    ro.observe(mountRef.current);
    return () => ro.disconnect();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-pressed={state === 'listening'}
      aria-label={`LUMA Voice Orb: ${statusLabels[state] || 'Ready'}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`relative flex items-center justify-center p-3 select-none cursor-pointer rounded-full transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className}`}
      style={{
        isolation: 'isolate',
        overflow: 'clip',
        aspectRatio: '1 / 1',
        maxHeight: '320px',
        maxWidth: '320px',
        width: '100%',
        height: '100%'
      }}
    >
      {useFallback ? (
        <FallbackOrb state={state} audioLevel={audioLevel} reducedMotion={reducedMotion} />
      ) : (
        <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
      )}
    </div>
  );
};
