import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type VoiceSessionState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'reconnecting'
  | 'offline_error';

interface SupernovaOrbProps {
  state: VoiceSessionState;
  audioLevel?: number; // 0.0 to 1.0 from microphone or synthesis analyzer
  reducedMotion?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const SupernovaOrb: React.FC<SupernovaOrbProps> = ({
  state = 'idle',
  audioLevel = 0,
  reducedMotion = false,
  size = 320,
  className = '',
  onClick
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // References for Three.js cleanup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mutable state for smooth animation transitions matching Image 2
  const stateParamsRef = useRef({
    speed: 1.0,
    orbitSpeed: 0.8,
    tendrilAmplitude: 1.0,
    nebulaIntensity: 1.0,
    tendrilBrightness: 1.0,
    rimColor: new THREE.Color('#2563EB'), // Royal Sapphire Blue rim
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
        p.targetRimColor.set('#06B6D4'); // Bright Electric Cyan
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
        p.targetRimColor.set('#38BDF8'); // Electric Blue
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
        p.targetRimColor.set('#9333EA'); // Deep Cosmic Violet
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
        p.targetRimColor.set('#3B82F6'); // Luminous Royal Blue
        p.cyanWeight = 1.3;
        p.magentaWeight = 1.4;
        p.amberWeight = 1.3;
        break;
      case 'interrupted':
        p.speed = 2.5;
        p.orbitSpeed = 2.2;
        p.tendrilAmplitude = 1.6;
        p.nebulaIntensity = 1.3;
        p.tendrilBrightness = 1.5;
        p.targetRimColor.set('#F43F5E'); // Rose alert
        p.cyanWeight = 1.1;
        p.magentaWeight = 1.5;
        p.amberWeight = 1.3;
        break;
      case 'reconnecting':
        p.speed = 0.9;
        p.orbitSpeed = 0.7;
        p.tendrilAmplitude = 0.9;
        p.nebulaIntensity = 0.85;
        p.tendrilBrightness = 0.9;
        p.targetRimColor.set('#F59E0B'); // Amber
        p.cyanWeight = 0.8;
        p.magentaWeight = 0.8;
        p.amberWeight = 1.5;
        break;
      case 'offline_error':
        p.speed = 0.5;
        p.orbitSpeed = 0.4;
        p.tendrilAmplitude = 0.6;
        p.nebulaIntensity = 0.6;
        p.tendrilBrightness = 0.7;
        p.targetRimColor.set('#EF4444'); // Crimson
        p.cyanWeight = 0.5;
        p.magentaWeight = 0.7;
        p.amberWeight = 0.6;
        break;
      case 'idle':
      default:
        p.speed = 1.0;
        p.orbitSpeed = 0.8;
        p.tendrilAmplitude = 1.0;
        p.nebulaIntensity = 1.0;
        p.tendrilBrightness = 1.0;
        p.targetRimColor.set('#2563EB'); // Royal Sapphire Blue
        p.cyanWeight = 1.0;
        p.magentaWeight = 1.0;
        p.amberWeight = 1.0;
        break;
    }
  }, [state]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect WebGL capability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = size;
    const height = size;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const SPHERE_RADIUS = 76;

    // =========================================================================
    // 1. Image 2: Crystal Glass Sphere with Sapphire Blue Rim & Soft Outer Halo
    // =========================================================================
    const glassGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64);

    const glassMat = new THREE.ShaderMaterial({
      uniforms: {
        uRimColor: { value: new THREE.Color('#2563EB') },
        uTime: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uRimColor;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewPosition);

          // Deep Fresnel rim with glowing sapphire blue edge
          float NdotV = max(0.0, dot(N, V));
          float fresnel = 1.0 - NdotV;
          
          // Razor sharp outer edge rim glow (matches Image 2 thin royal blue perimeter)
          float edgeRim = pow(fresnel, 4.2);
          float softRim = pow(fresnel, 2.2) * 0.45;

          // Sapphire / electric blue rim blend
          vec3 rimGlow = mix(uRimColor, vec3(0.38, 0.65, 1.0), edgeRim * 0.7) * (edgeRim * 1.9 + softRim * 0.6);

          // Specular highlight near top-right of sphere
          vec3 lightDirTop = normalize(vec3(0.28, 0.88, 0.45));
          vec3 H = normalize(lightDirTop + V);
          float specAngle = max(0.0, dot(N, H));
          float specTop = pow(specAngle, 54.0) * 0.95;
          float specHalo = pow(specAngle, 12.0) * 0.16;

          // Secondary subtle blue rim reflection at lower contour
          vec3 lightDirBottom = normalize(vec3(-0.35, -0.75, 0.5));
          float specBottom = pow(max(0.0, dot(N, normalize(lightDirBottom + V))), 36.0) * 0.25;

          // Pure dark transparent glass core allowing interior plasma & tendrils to shine
          vec3 glassBase = vec3(0.005, 0.01, 0.025) * fresnel;

          vec3 finalColor = glassBase + rimGlow + vec3(1.0, 1.0, 1.0) * specTop + vec3(0.5, 0.75, 1.0) * specHalo + vec3(0.2, 0.5, 0.9) * specBottom;

          // Edge alpha with high transparency in center
          float alpha = clamp(edgeRim * 0.95 + softRim * 0.35 + specTop * 0.9 + 0.05, 0.0, 0.98);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide
    });

    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.renderOrder = 10; // Render glass shell over interior plasma
    scene.add(glassMesh);

    // Subtle outer atmospheric sapphire halo hugging perimeter
    const haloGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 1.06, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#1D4ED8') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewPosition);
          float fresnel = 1.0 - max(0.0, dot(N, V));
          float halo = pow(fresnel, 5.0) * 0.6;
          gl_FragColor = vec4(uColor * 1.3, halo);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // =========================================================================
    // 2. Interior Plasma Nebula (Matches Image 2 Magenta/Violet + Amber undertone)
    // =========================================================================
    // A volumetric core group with layered multi-chromatic glowing plasma clouds
    const plasmaGroup = new THREE.Group();
    scene.add(plasmaGroup);

    // Plasma core shader geometry
    const coreGeo = new THREE.SphereGeometry(50, 48, 48);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uAudio: { value: 0.0 },
        uMagentaWeight: { value: 1.0 },
        uAmberWeight: { value: 1.0 },
        uCyanWeight: { value: 1.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uAudio;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        // Procedural 3D noise for organic plasma displacement
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;

          // Organic fluid displacement
          float n = noise(position * 0.05 + vec3(uTime * 0.4, -uTime * 0.3, uTime * 0.2));
          float displacement = (n - 0.5) * (14.0 + uAudio * 18.0);
          vec3 displacedPos = position + normal * displacement;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uAudio;
        uniform float uMagentaWeight;
        uniform float uAmberWeight;
        uniform float uCyanWeight;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Normalize coordinates inside sphere (-1.0 to 1.0)
          vec3 posNorm = vPosition / 50.0;

          // In Image 2:
          // - Upper / center / left is rich luminous Magenta / Violet nebula
          // - Lower / right quadrant is warm golden Amber / Honey glow
          // - Tendril junctions glow with soft cyan / turquoise highlights

          // Gradient factors
          float magentaFactor = clamp((-posNorm.x * 0.6 + posNorm.y * 0.7 + 0.5), 0.0, 1.0);
          float amberFactor = clamp((posNorm.x * 0.7 - posNorm.y * 0.8 + 0.3), 0.0, 1.0);
          float cyanFactor = clamp((posNorm.y * 0.4 + posNorm.z * 0.8 + 0.2), 0.0, 1.0);

          vec3 colMagenta = vec3(0.85, 0.15, 0.95); // #D946EF Neon Magenta
          vec3 colViolet  = vec3(0.58, 0.20, 0.92); // #9333EA Cosmic Violet
          vec3 colAmber   = vec3(0.96, 0.62, 0.08); // #F59E0B Golden Amber
          vec3 colCyan    = vec3(0.12, 0.80, 0.98); // #38BDF8 Soft Cyan
          vec3 colWhite   = vec3(1.0, 1.0, 1.0);

          // Mix base nebula colors
          vec3 nebula = mix(colViolet, colMagenta, magentaFactor) * uMagentaWeight;
          nebula = mix(nebula, colAmber, amberFactor * 0.85 * uAmberWeight);
          nebula += colCyan * (cyanFactor * 0.4 * uCyanWeight);

          // Fresnel falloff for internal volumetric softness
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float centerBloom = 1.0 - length(posNorm) * 0.5;

          // Audio intensity pulse
          float intensity = (0.75 + uAudio * 0.65) * (1.0 + fresnel * 0.8);
          vec3 finalColor = nebula * intensity;

          // Luminous translucent alpha
          float alpha = clamp(0.42 * centerBloom + fresnel * 0.45 + uAudio * 0.25, 0.0, 0.88);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    plasmaGroup.add(coreMesh);

    // =========================================================================
    // 3. Image 2: Swirling 3D Cyan / Turquoise Looping Tendril Filaments
    // =========================================================================
    // In Image 2, smooth flowing energy ribbons loop through and wrap the nebula
    // in 3D: an arching upper loop, a plunging forward loop, and swirling tendrils.

    const NUM_TENDRIL_POINTS = 160;
    const TENDRIL_WIDTH_SEGS = 6;

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

    // Tendril 1: Main arching cyan / electric blue loop over the purple nebula
    const tendrilGeo1 = createTendrilGeometry();
    // Tendril 2: Counter-swirling turquoise tendril looping down through amber glow
    const tendrilGeo2 = createTendrilGeometry();
    // Tendril 3: Fine inner looping ribbon wrapping through center
    const tendrilGeo3 = createTendrilGeometry();

    const createTendrilMaterial = (coreColorHex: string, edgeColorHex: string) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uCoreColor: { value: new THREE.Color(coreColorHex) },
          uEdgeColor: { value: new THREE.Color(edgeColorHex) },
          uIntensity: { value: 1.0 },
          uAudio: { value: 0.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPos;
          void main() {
            vUv = uv;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uCoreColor;
          uniform vec3 uEdgeColor;
          uniform float uIntensity;
          uniform float uAudio;
          varying vec2 vUv;
          varying vec3 vPos;

          void main() {
            // Distance from centerline across ribbon width (vUv.y: 0 to 1, center is 0.5)
            float distCenter = abs(vUv.y - 0.5) * 2.0;

            // Smooth taper at start and end of path
            float taper = sin(vUv.x * 3.14159);
            taper = pow(max(0.0, taper), 0.7);

            // Radiant neon ribbon gradient: brilliant hot white-cyan core to turquoise/blue halo
            vec3 coreWhite = vec3(1.0, 1.0, 1.0);
            vec3 col = mix(coreWhite, uCoreColor, smoothstep(0.0, 0.35, distCenter));
            col = mix(col, uEdgeColor, smoothstep(0.35, 1.0, distCenter));

            // Soft bloom falloff
            float alpha = pow(1.0 - distCenter, 1.4) * taper * 0.95 * uIntensity;
            alpha *= (1.0 + uAudio * 0.4);

            gl_FragColor = vec4(col * (1.3 + uAudio * 0.5), alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
    };

    // Electric Cyan & Turquoise Ribbons (Image 2 signature filaments)
    const tendrilMat1 = createTendrilMaterial('#E0F2FE', '#06B6D4'); // Bright Ice Cyan to Vibrant Cyan
    const tendrilMat2 = createTendrilMaterial('#A5F3FC', '#38BDF8'); // Sky Turquoise to Electric Blue
    const tendrilMat3 = createTendrilMaterial('#FFFFFF', '#22D3EE'); // White hot filament to Cyan

    const tendrilMesh1 = new THREE.Mesh(tendrilGeo1, tendrilMat1);
    const tendrilMesh2 = new THREE.Mesh(tendrilGeo2, tendrilMat2);
    const tendrilMesh3 = new THREE.Mesh(tendrilGeo3, tendrilMat3);
    scene.add(tendrilMesh1);
    scene.add(tendrilMesh2);
    scene.add(tendrilMesh3);

    // Centerline crisp laser threads (ultra-fine glowing spines matching Image 2 thin light trails)
    const spineGeo1 = new THREE.BufferGeometry();
    const spineGeo2 = new THREE.BufferGeometry();
    const spinePos1 = new Float32Array(NUM_TENDRIL_POINTS * 3);
    const spinePos2 = new Float32Array(NUM_TENDRIL_POINTS * 3);
    spineGeo1.setAttribute('position', new THREE.BufferAttribute(spinePos1, 3));
    spineGeo2.setAttribute('position', new THREE.BufferAttribute(spinePos2, 3));

    const spineMat1 = new THREE.LineBasicMaterial({
      color: new THREE.Color('#E0F2FE'),
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const spineMat2 = new THREE.LineBasicMaterial({
      color: new THREE.Color('#38BDF8'),
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const spineLine1 = new THREE.Line(spineGeo1, spineMat1);
    const spineLine2 = new THREE.Line(spineGeo2, spineMat2);
    scene.add(spineLine1);
    scene.add(spineLine2);

    // =========================================================================
    // 4. Stardust Micro-Sparkles (Floating within the nebula volume)
    // =========================================================================
    const PARTICLE_COUNT = 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleOriginals: { r: number; theta: number; phi: number; speed: number }[] = [];

    const colPalette = [
      new THREE.Color('#38BDF8'), // Cyan
      new THREE.Color('#E0F2FE'), // Ice White
      new THREE.Color('#D946EF'), // Magenta
      new THREE.Color('#FBBF24')  // Amber
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 15 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colPalette[Math.floor(Math.random() * colPalette.length)];
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;

      particleOriginals.push({
        r: radius,
        theta,
        phi,
        speed: 0.3 + Math.random() * 0.7
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // =========================================================================
    // 5. 3D Spline Path Calculations (Loops that match Image 2)
    // =========================================================================
    const evaluateTendrilPath1 = (t: number, timeVal: number, amp: number) => {
      // 3D curving orbital loop curving over upper nebula then sweeping downward
      const angle = t * Math.PI * 2;
      const x = (Math.cos(angle) * 44 + Math.sin(angle * 2 + timeVal * 0.8) * 8) * amp;
      const y = (Math.sin(angle) * 36 + Math.cos(angle * 3 - timeVal * 0.6) * 12) * amp;
      const z = (Math.sin(angle * 2) * 26 + Math.sin(timeVal + angle) * 8) * amp;
      return { x, y, z };
    };

    const evaluateTendrilPath2 = (t: number, timeVal: number, amp: number) => {
      // Lower loop curving through amber zone and wrapping around the front
      const angle = t * Math.PI * 2 + 1.2;
      const x = (Math.sin(angle) * 42 + Math.cos(angle * 2 - timeVal * 0.7) * 9) * amp;
      const y = (-Math.cos(angle) * 38 + Math.sin(angle * 2 + timeVal * 0.9) * 10) * amp;
      const z = (Math.cos(angle * 2) * 28 + Math.cos(timeVal * 0.8 + angle) * 7) * amp;
      return { x, y, z };
    };

    const evaluateTendrilPath3 = (t: number, timeVal: number, amp: number) => {
      // Tight inner serpentine filament weaving through core
      const angle = t * Math.PI * 2 * 1.5;
      const x = (Math.cos(angle + timeVal * 0.4) * 32) * amp;
      const y = (Math.sin(angle * 2 - timeVal * 0.5) * 28) * amp;
      const z = (Math.sin(angle * 3 + timeVal * 0.3) * 22) * amp;
      return { x, y, z };
    };

    // Helper to generate ribbon geometry around a 3D path with ribbon twist
    const updateRibbonBuffer = (
      geo: THREE.BufferGeometry,
      pathFn: (t: number, timeVal: number, amp: number) => { x: number; y: number; z: number },
      timeVal: number,
      amp: number,
      widthBase: number
    ) => {
      const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;

      for (let i = 0; i <= NUM_TENDRIL_POINTS; i++) {
        const t = i / NUM_TENDRIL_POINTS;
        const pCurrent = pathFn(t, timeVal, amp);
        const pNext = pathFn(Math.min(1.0, t + 0.01), timeVal, amp);

        // Approximate tangent
        const tx = pNext.x - pCurrent.x;
        const ty = pNext.y - pCurrent.y;
        const tz = pNext.z - pCurrent.z;
        const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1.0;

        // Normal perpendicular in 3D
        const nx = -ty / tLen;
        const ny = tx / tLen;
        const nz = 0.4 * Math.sin(t * 6.28 + timeVal);

        const envelope = Math.sin(t * Math.PI); // Taper at endpoints
        const currentWidth = widthBase * envelope * (1.0 + Math.sin(t * 8.0 + timeVal) * 0.25);

        for (let j = 0; j <= TENDRIL_WIDTH_SEGS; j++) {
          const v = (j / TENDRIL_WIDTH_SEGS) - 0.5; // -0.5 to +0.5
          const vertIdx = (i * (TENDRIL_WIDTH_SEGS + 1) + j) * 3;

          pos[vertIdx] = pCurrent.x + nx * v * currentWidth;
          pos[vertIdx + 1] = pCurrent.y + ny * v * currentWidth;
          pos[vertIdx + 2] = pCurrent.z + nz * v * currentWidth;
        }
      }
      geo.attributes.position.needsUpdate = true;
    };

    // =========================================================================
    // Animation Loop
    // =========================================================================
    let clock = new THREE.Clock();
    let animTime = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const p = stateParamsRef.current;
      const motionMult = reducedMotion ? 0.25 : 1.0;

      // Color lerp toward active voice state rim color
      p.rimColor.lerp(p.targetRimColor, 0.08);
      glassMat.uniforms.uRimColor.value.copy(p.rimColor);
      glassMat.uniforms.uTime.value = animTime;

      animTime += delta * p.speed * motionMult;

      const dynamicAmp = p.tendrilAmplitude * (0.95 + audioLevel * 0.35);

      // 1. Update Core Plasma uniforms
      coreMat.uniforms.uTime.value = animTime;
      coreMat.uniforms.uAudio.value = audioLevel;
      coreMat.uniforms.uMagentaWeight.value = p.magentaWeight;
      coreMat.uniforms.uAmberWeight.value = p.amberWeight;
      coreMat.uniforms.uCyanWeight.value = p.cyanWeight;

      // Rotate plasma core subtly for dimensional depth
      plasmaGroup.rotation.y = animTime * 0.2 * p.orbitSpeed;
      plasmaGroup.rotation.z = Math.sin(animTime * 0.15) * 0.1;

      // 2. Update Ribbons matching Image 2
      updateRibbonBuffer(tendrilGeo1, evaluateTendrilPath1, animTime * 1.2, dynamicAmp, 7.5);
      updateRibbonBuffer(tendrilGeo2, evaluateTendrilPath2, animTime * 1.0, dynamicAmp, 6.8);
      updateRibbonBuffer(tendrilGeo3, evaluateTendrilPath3, animTime * 1.5, dynamicAmp, 5.0);

      // Tendril material uniforms
      tendrilMat1.uniforms.uIntensity.value = p.tendrilBrightness;
      tendrilMat1.uniforms.uAudio.value = audioLevel;
      tendrilMat2.uniforms.uIntensity.value = p.tendrilBrightness;
      tendrilMat2.uniforms.uAudio.value = audioLevel;
      tendrilMat3.uniforms.uIntensity.value = p.tendrilBrightness;
      tendrilMat3.uniforms.uAudio.value = audioLevel;

      // 3. Update spine lines
      for (let i = 0; i < NUM_TENDRIL_POINTS; i++) {
        const t = i / NUM_TENDRIL_POINTS;
        const p1 = evaluateTendrilPath1(t, animTime * 1.2, dynamicAmp);
        const p2 = evaluateTendrilPath2(t, animTime * 1.0, dynamicAmp);

        spinePos1[i * 3] = p1.x;
        spinePos1[i * 3 + 1] = p1.y;
        spinePos1[i * 3 + 2] = p1.z;

        spinePos2[i * 3] = p2.x;
        spinePos2[i * 3 + 1] = p2.y;
        spinePos2[i * 3 + 2] = p2.z;
      }
      spineGeo1.attributes.position.needsUpdate = true;
      spineGeo2.attributes.position.needsUpdate = true;

      // 4. Update Stardust particles
      const posArray = (particleGeo.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const orig = particleOriginals[i];
        orig.theta += delta * orig.speed * 0.4 * motionMult;
        orig.phi += Math.sin(animTime * 0.5 + i) * 0.005;

        posArray[i * 3] = orig.r * Math.sin(orig.phi) * Math.cos(orig.theta);
        posArray[i * 3 + 1] = orig.r * Math.sin(orig.phi) * Math.sin(orig.theta);
        posArray[i * 3 + 2] = orig.r * Math.cos(orig.phi);
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
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
      spineGeo1.dispose();
      spineGeo2.dispose();
      spineMat1.dispose();
      spineMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container) container.innerHTML = '';
    };
  }, [size, reducedMotion]);

  // Status Indicator Label & Color
  const getStatusBadge = () => {
    switch (state) {
      case 'listening':
        return { label: 'Listening...', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/30' };
      case 'transcribing':
        return { label: 'Transcribing speech...', color: 'text-[#38BDF8]', bg: 'bg-[#38BDF8]/10', border: 'border-[#38BDF8]/30' };
      case 'thinking':
        return { label: 'Processing...', color: 'text-[#9333EA]', bg: 'bg-[#9333EA]/10', border: 'border-[#9333EA]/30' };
      case 'speaking':
        return { label: 'Speaking...', color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/30' };
      case 'interrupted':
        return { label: 'Interrupted', color: 'text-[#FB7185]', bg: 'bg-[#FB7185]/10', border: 'border-[#FB7185]/30' };
      case 'reconnecting':
        return { label: 'Reconnecting...', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30' };
      case 'offline_error':
        return { label: 'Tap orb to speak', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30' };
      case 'idle':
      default:
        return { label: 'Tap orb to speak', color: 'text-[#94A3B8]', bg: 'bg-white/5', border: 'border-white/10' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Deep black backdrop container for cinematic contrast & generous negative space */}
      <div className="relative flex items-center justify-center rounded-full p-4 bg-black">
        {/* Subtle, soft ambient bloom matching sapphire blue and cyan neon */}
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-700 blur-3xl opacity-35"
          style={{
            width: size * 0.95,
            height: size * 0.95,
            background:
              state === 'listening'
                ? 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(37,99,235,0.15) 50%, transparent 75%)'
                : state === 'speaking'
                ? 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(217,70,239,0.2) 50%, transparent 75%)'
                : state === 'thinking'
                ? 'radial-gradient(circle, rgba(147,51,234,0.35) 0%, rgba(59,130,246,0.15) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(6,182,212,0.1) 50%, transparent 75%)'
          }}
        />

        {/* 3D Three.js Container or 2D Fallback */}
        {webglSupported ? (
          <div
            ref={mountRef}
            onClick={onClick}
            className="relative cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
            role="button"
            tabIndex={0}
            aria-label={`Interactive Energy Orb. Current state: ${state}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }}
            style={{ width: size, height: size }}
          />
        ) : (
          /* Graceful Canvas 2D Mode Fallback */
          <div
            onClick={onClick}
            className="relative cursor-pointer flex items-center justify-center rounded-full border border-blue-600/30 bg-black p-4 transition-transform hover:scale-105"
            style={{ width: size, height: size }}
            role="button"
            tabIndex={0}
            aria-label="Energy Orb (2D Fallback)"
          >
            <div className="w-full h-full rounded-full border border-blue-500/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-blue-500 to-cyan-400 animate-pulse mb-3 opacity-70" />
              <span className="text-xs text-white/70">Energy Orb</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time State Badge */}
      <div
        className={`mt-4 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-2 border transition-all duration-300 ${badge.bg} ${badge.border} ${badge.color}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening' || state === 'speaking' ? 'animate-ping' : ''
          }`}
          style={{
            backgroundColor:
              state === 'listening'
                ? '#06B6D4'
                : state === 'speaking'
                ? '#3B82F6'
                : state === 'thinking'
                ? '#9333EA'
                : '#94A3B8'
          }}
        />
        {badge.label}
      </div>
    </div>
  );
};
