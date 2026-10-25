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
  const [useFallback, setUseFallback] = useState(reducedMotion);

  // Status mapping for accessibility announcement
  const statusLabels: Record<VoiceSessionState, string> = {
    idle: 'Tap to talk',
    listening: 'Listening',
    transcribing: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    interrupted: 'Interrupted',
    offline_error: 'Tutor unavailable'
  };

  useEffect(() => {
    if (reducedMotion) {
      setUseFallback(true);
      return;
    }

    // Check WebGL availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setUseFallback(true);
      return;
    }

    let isMounted = true;

    // Dynamically lazy-load Three.js scene
    import('./orb/ThreeOrbScene.ts')
      .then(({ ThreeOrbScene }) => {
        if (!isMounted || !mountRef.current) return;
        try {
          const scene = new ThreeOrbScene(mountRef.current, reducedMotion);
          sceneInstanceRef.current = scene;
          scene.updateState(state, audioLevel);
        } catch (err) {
          console.warn('Three.js initialization failed, using FallbackOrb:', err);
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

  // Update scene state when props change
  useEffect(() => {
    if (sceneInstanceRef.current) {
      sceneInstanceRef.current.updateState(state, audioLevel);
    }
  }, [state, audioLevel]);

  // ResizeObserver for dynamic container tracking
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

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`LUMA Voice Orb: ${statusLabels[state] || 'Ready'}`}
      onClick={onClick}
      className={`relative flex items-center justify-center p-3 select-none cursor-pointer transition-transform active:scale-[0.98] ${className}`}
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
