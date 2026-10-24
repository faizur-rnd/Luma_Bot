import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  glassVertexShader,
  glassFragmentShader,
  haloVertexShader,
  haloFragmentShader,
  coreVertexShader,
  coreFragmentShader,
  tendrilVertexShader,
  tendrilFragmentShader
} from './orb/shaders.ts';

export type VoiceSessionState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'offline_error';

interface VoiceOrbProps {
  state: VoiceSessionState;
  audioLevel?: number; // 0.0 to 1.0 from microphone or synthesis analyzer
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
  const [webglSupported, setWebglSupported] = useState(true);

  // References for Three.js cleanup & resize
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Animation parameters ref
  const stateParamsRef = useRef({
    speed: 1.0,
    orbitSpeed: 0.8,
    tendrilAmplitude: 1.0,
    nebulaIntensity: 1.0,
    tendrilBrightness: 1.0,
    rimColor: new THREE.Color('#2563EB'),
    targetRimColor: new THREE.Color('#2563EB'),
    magentaWeight: 1.0,
    amberWeight: 1.0,
    cyanWeight: 1.0
  });

  // Update target animation parameters based on voice session state
  useEffect(() => {
    const p = stateParamsRef.current;
    switch (state) {
      case 'listening':
        p.speed = 1.6;
        p.orbitSpeed = 1.4;
        p.tendrilAmplitude = 1.35;
        p.nebulaIntensity = 1.25;
        p.tendrilBrightness = 1.4;
        p.targetRimColor.set('#06B6D4');
        p.cyanWeight = 1.5;
        p.magentaWeight = 1.0;
        p.amberWeight = 1.1;
        break;
      case 'transcribing':
        p.speed = 1.8;
        p.orbitSpeed = 1.6;
        p.tendrilAmplitude = 1.2;
        p.nebulaIntensity = 1.3;
        p.tendrilBrightness = 1.3;
        p.targetRimColor.set('#38BDF8');
        p.cyanWeight = 1.4;
        p.magentaWeight = 1.1;
        p.amberWeight = 1.0;
        break;
      case 'thinking':
        p.speed = 2.2;
        p.orbitSpeed = 2.0;
        p.tendrilAmplitude = 1.1;
        p.nebulaIntensity = 1.4;
        p.tendrilBrightness = 1.2;
        p.targetRimColor.set('#9333EA');
        p.cyanWeight = 1.2;
        p.magentaWeight = 1.6;
        p.amberWeight = 1.2;
        break;
      case 'speaking':
        p.speed = 1.7;
        p.orbitSpeed = 1.3;
        p.tendrilAmplitude = 1.5;
        p.nebulaIntensity = 1.45;
        p.tendrilBrightness = 1.5;
        p.targetRimColor.set('#3B82F6');
        p.cyanWeight = 1.3;
        p.magentaWeight = 1.4;
        p.amberWeight = 1.3;
        break;
      case 'interrupted':
        p.speed = 2.5;
        p.orbitSpeed = 1.8;
        p.tendrilAmplitude = 1.6;
        p.nebulaIntensity = 1.5;
        p.tendrilBrightness = 1.6;
        p.targetRimColor.set('#EF4444');
        p.cyanWeight = 0.8;
        p.magentaWeight = 1.8;
        p.amberWeight = 1.6;
        break;
      case 'offline_error':
        p.speed = 0.2;
        p.orbitSpeed = 0.2;
        p.tendrilAmplitude = 0.4;
        p.nebulaIntensity = 0.5;
        p.tendrilBrightness = 0.4;
        p.targetRimColor.set('#64748B');
        p.cyanWeight = 0.3;
        p.magentaWeight = 0.3;
        p.amberWeight = 0.3;
        break;
      case 'idle':
      default:
        p.speed = 1.0;
        p.orbitSpeed = 0.8;
        p.tendrilAmplitude = 1.0;
        p.nebulaIntensity = 1.0;
        p.tendrilBrightness = 1.0;
        p.targetRimColor.set('#2563EB');
        p.cyanWeight = 1.0;
        p.magentaWeight = 1.0;
        p.amberWeight = 1.0;
        break;
    }
  }, [state]);

  // Main Three.js setup with ResizeObserver
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    // Determine initial dimensions from container
    const initialWidth = container.clientWidth || 240;
    const initialHeight = container.clientHeight || 240;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 1, 1000);
    camera.position.set(0, 0, 240);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0.0); // Transparent background to eliminate black patches in light mode
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const SPHERE_RADIUS = 76;

    // 1. Crystal Glass Sphere
    const glassGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 48, 48);
    const glassMat = new THREE.ShaderMaterial({
      uniforms: {
        uRimColor: { value: new THREE.Color('#2563EB') },
        uTime: { value: 0.0 }
      },
      vertexShader: glassVertexShader,
      fragmentShader: glassFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.renderOrder = 10;
    scene.add(glassMesh);

    // Subtle outer atmospheric sapphire halo
    const haloGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 1.05, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#1D4ED8') }
      },
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 2. Interior Plasma Nebula
    const plasmaGroup = new THREE.Group();
    scene.add(plasmaGroup);

    const coreGeo = new THREE.SphereGeometry(50, 40, 40);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uAudio: { value: 0.0 },
        uMagentaWeight: { value: 1.0 },
        uAmberWeight: { value: 1.0 },
        uCyanWeight: { value: 1.0 }
      },
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    plasmaGroup.add(coreMesh);

    // 3. Swirling 3D Cyan / Turquoise Looping Tendril Filaments
    const NUM_TENDRIL_POINTS = 140;
    const TENDRIL_WIDTH_SEGS = 4;

    const createTendrilGeometry = () => {
      const vertCount = (NUM_TENDRIL_POINTS + 1) * (TENDRIL_WIDTH_SEGS + 1);
      const positions = new Float32Array(vertCount * 3);
      const uvs = new Float32Array(vertCount * 2);
      const indices: number[] = [];

      let ptr = 0;
      for (let i = 0; i <= NUM_TENDRIL_POINTS; i++) {
        const u = i / NUM_TENDRIL_POINTS;
        for (let j = 0; j <= TENDRIL_WIDTH_SEGS; j++) {
          const v = j / TENDRIL_WIDTH_SEGS;
          uvs[ptr * 2] = u;
          uvs[ptr * 2 + 1] = v;
          ptr++;
        }
      }

      for (let i = 0; i < NUM_TENDRIL_POINTS; i++) {
        for (let j = 0; j < TENDRIL_WIDTH_SEGS; j++) {
          const row1 = i * (TENDRIL_WIDTH_SEGS + 1);
          const row2 = (i + 1) * (TENDRIL_WIDTH_SEGS + 1);
          indices.push(row1 + j, row1 + j + 1, row2 + j);
          indices.push(row1 + j + 1, row2 + j + 1, row2 + j);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      return geo;
    };

    const tendrilGeo1 = createTendrilGeometry();
    const tendrilGeo2 = createTendrilGeometry();
    const tendrilGeo3 = createTendrilGeometry();

    const createTendrilMaterial = (coreColorHex: string, edgeColorHex: string) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uCoreColor: { value: new THREE.Color(coreColorHex) },
          uEdgeColor: { value: new THREE.Color(edgeColorHex) },
          uIntensity: { value: 1.0 },
          uAudio: { value: 0.0 }
        },
        vertexShader: tendrilVertexShader,
        fragmentShader: tendrilFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
    };

    const tendrilMat1 = createTendrilMaterial('#E0F2FE', '#06B6D4');
    const tendrilMat2 = createTendrilMaterial('#A5F3FC', '#38BDF8');
    const tendrilMat3 = createTendrilMaterial('#FFFFFF', '#22D3EE');

    const tendrilMesh1 = new THREE.Mesh(tendrilGeo1, tendrilMat1);
    const tendrilMesh2 = new THREE.Mesh(tendrilGeo2, tendrilMat2);
    const tendrilMesh3 = new THREE.Mesh(tendrilGeo3, tendrilMat3);
    scene.add(tendrilMesh1);
    scene.add(tendrilMesh2);
    scene.add(tendrilMesh3);

    // Stardust Micro-Sparkles
    const PARTICLE_COUNT = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleOriginals: { r: number; theta: number; phi: number; speed: number }[] = [];

    const colPalette = [
      new THREE.Color('#38BDF8'),
      new THREE.Color('#E0F2FE'),
      new THREE.Color('#D946EF'),
      new THREE.Color('#FBBF24')
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 15 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particleOriginals.push({
        r: radius,
        theta,
        phi,
        speed: (0.4 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1)
      });

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const c = colPalette[Math.floor(Math.random() * colPalette.length)];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ResizeObserver for dynamic responsive scaling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    let smoothedAudio = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const p = stateParamsRef.current;

      // Handle reduced motion
      const timeScale = reducedMotion ? 0.2 : p.speed;
      smoothedAudio += (audioLevel - smoothedAudio) * 0.15;

      p.rimColor.lerp(p.targetRimColor, 0.06);
      glassMat.uniforms.uRimColor.value.copy(p.rimColor);
      glassMat.uniforms.uTime.value = elapsed * timeScale;
      haloMat.uniforms.uColor.value.copy(p.rimColor);

      coreMat.uniforms.uTime.value = elapsed * timeScale;
      coreMat.uniforms.uAudio.value = smoothedAudio;
      coreMat.uniforms.uMagentaWeight.value = p.magentaWeight;
      coreMat.uniforms.uAmberWeight.value = p.amberWeight;
      coreMat.uniforms.uCyanWeight.value = p.cyanWeight;

      plasmaGroup.rotation.y = elapsed * 0.25 * timeScale;
      plasmaGroup.rotation.x = Math.sin(elapsed * 0.18 * timeScale) * 0.2;

      // Update Ribbon Geometry 1
      const posAttr1 = tendrilGeo1.attributes.position as THREE.BufferAttribute;
      const posArr1 = posAttr1.array as Float32Array;
      const t1 = elapsed * 0.45 * timeScale;

      for (let i = 0; i <= NUM_TENDRIL_POINTS; i++) {
        const u = i / NUM_TENDRIL_POINTS;
        const angle = u * Math.PI * 2.2 + t1;
        const r = 52 + Math.sin(u * 8.0 + t1 * 2.0) * 8.0 * p.tendrilAmplitude;
        const cx = Math.cos(angle) * r;
        const cy = Math.sin(angle * 1.5) * (42.0 + smoothedAudio * 12.0);
        const cz = Math.sin(angle) * (r * 0.85);

        for (let j = 0; j <= TENDRIL_WIDTH_SEGS; j++) {
          const v = j / TENDRIL_WIDTH_SEGS - 0.5;
          const idx = (i * (TENDRIL_WIDTH_SEGS + 1) + j) * 3;
          posArr1[idx] = cx;
          posArr1[idx + 1] = cy + v * 5.0;
          posArr1[idx + 2] = cz + v * 3.0;
        }
      }
      posAttr1.needsUpdate = true;

      // Update Ribbon Geometry 2
      const posAttr2 = tendrilGeo2.attributes.position as THREE.BufferAttribute;
      const posArr2 = posAttr2.array as Float32Array;
      const t2 = -elapsed * 0.35 * timeScale + 1.5;

      for (let i = 0; i <= NUM_TENDRIL_POINTS; i++) {
        const u = i / NUM_TENDRIL_POINTS;
        const angle = u * Math.PI * 2.0 + t2;
        const r = 48 + Math.cos(u * 6.0 + t2) * 6.0 * p.tendrilAmplitude;
        const cx = Math.sin(angle * 1.2) * (r * 0.9);
        const cy = Math.cos(angle) * r;
        const cz = Math.sin(angle) * 38.0;

        for (let j = 0; j <= TENDRIL_WIDTH_SEGS; j++) {
          const v = j / TENDRIL_WIDTH_SEGS - 0.5;
          const idx = (i * (TENDRIL_WIDTH_SEGS + 1) + j) * 3;
          posArr2[idx] = cx + v * 4.0;
          posArr2[idx + 1] = cy;
          posArr2[idx + 2] = cz + v * 4.0;
        }
      }
      posAttr2.needsUpdate = true;

      // Update Ribbon Geometry 3
      const posAttr3 = tendrilGeo3.attributes.position as THREE.BufferAttribute;
      const posArr3 = posAttr3.array as Float32Array;
      const t3 = elapsed * 0.6 * timeScale + 3.0;

      for (let i = 0; i <= NUM_TENDRIL_POINTS; i++) {
        const u = i / NUM_TENDRIL_POINTS;
        const angle = u * Math.PI * 2.8 + t3;
        const r = 36 + Math.sin(u * 5.0 + t3) * 5.0;
        const cx = Math.cos(angle) * r;
        const cy = Math.sin(angle) * r * 0.7;
        const cz = Math.sin(u * Math.PI * 2.0 + t3) * 35.0;

        for (let j = 0; j <= TENDRIL_WIDTH_SEGS; j++) {
          const v = j / TENDRIL_WIDTH_SEGS - 0.5;
          const idx = (i * (TENDRIL_WIDTH_SEGS + 1) + j) * 3;
          posArr3[idx] = cx;
          posArr3[idx + 1] = cy + v * 3.5;
          posArr3[idx + 2] = cz + v * 2.5;
        }
      }
      posAttr3.needsUpdate = true;

      tendrilMat1.uniforms.uAudio.value = smoothedAudio;
      tendrilMat2.uniforms.uAudio.value = smoothedAudio;
      tendrilMat3.uniforms.uAudio.value = smoothedAudio;

      // Update Stardust particles
      const partPosAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const partArr = partPosAttr.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const orig = particleOriginals[i];
        orig.theta += orig.speed * delta * timeScale * 0.4;
        partArr[i * 3] = orig.r * Math.sin(orig.phi) * Math.cos(orig.theta);
        partArr[i * 3 + 1] = orig.r * Math.sin(orig.phi) * Math.sin(orig.theta);
        partArr[i * 3 + 2] = orig.r * Math.cos(orig.phi);
      }
      partPosAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      tendrilGeo1.dispose();
      tendrilGeo2.dispose();
      tendrilGeo3.dispose();
      tendrilMat1.dispose();
      tendrilMat2.dispose();
      tendrilMat3.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      container.innerHTML = '';
    };
  }, [reducedMotion]);

  const stateLabels: Record<VoiceSessionState, string> = {
    idle: 'Tap to talk',
    listening: 'Listening...',
    transcribing: 'Processing speech...',
    thinking: 'LUMA is thinking...',
    speaking: 'Speaking...',
    interrupted: 'Interrupted',
    offline_error: 'Tutor unavailable'
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center p-3 cursor-pointer select-none ${className}`}
      style={{
        isolation: 'isolate',
        overflow: 'clip'
      }}
      onClick={onClick}
      role="region"
      aria-label={`Voice Orb: Status is ${stateLabels[state]}`}
    >
      {/* Reserved aspect-ratio container with fluid clamp sizing */}
      <div
        className="relative w-full max-w-[340px] aspect-square flex items-center justify-center"
        style={{
          width: 'clamp(180px, 42vw, 320px)',
          height: 'clamp(180px, 42vw, 320px)'
        }}
      >
        {/* Soft background radial ambient glow that respects light and dark modes without black patches */}
        <div
          className="absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-500 opacity-60 dark:opacity-40"
          style={{
            background:
              state === 'listening'
                ? 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)'
                : state === 'thinking'
                ? 'radial-gradient(circle, rgba(147,51,234,0.45) 0%, rgba(217,70,239,0.15) 50%, transparent 75%)'
                : state === 'speaking'
                ? 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(34,211,238,0.15) 50%, transparent 75%)'
                : state === 'offline_error'
                ? 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(139,92,246,0.15) 50%, transparent 75%)'
          }}
        />

        {/* WebGL Three.js Mount or Accessible Non-WebGL Fallback */}
        {webglSupported ? (
          <div
            ref={mountRef}
            className="w-full h-full relative z-10 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          />
        ) : (
          <div
            className="w-4/5 h-4/5 rounded-full flex flex-col items-center justify-center p-4 border border-violet-500/40 bg-gradient-to-tr from-violet-900/60 via-indigo-900/40 to-cyan-900/60 text-center shadow-lg"
            role="img"
            aria-label="Interactive 2D Voice Orb graphic"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center animate-pulse">
              <span className="text-xl font-bold text-cyan-300">LUMA</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 font-medium">Interactive Voice Orb</p>
          </div>
        )}
      </div>

      {/* Screen reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {stateLabels[state]}
      </div>
    </div>
  );
};
