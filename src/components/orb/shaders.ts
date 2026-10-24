// WebGL GLSL Shaders for VoiceOrb Three.js Simulation

export const glassVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const glassFragmentShader = `
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
    
    // Razor sharp outer edge rim glow
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

    // Transparent glass core
    vec3 glassBase = vec3(0.005, 0.01, 0.025) * fresnel;
    vec3 finalColor = glassBase + rimGlow + vec3(1.0, 1.0, 1.0) * specTop + vec3(0.5, 0.75, 1.0) * specHalo + vec3(0.2, 0.5, 0.9) * specBottom;

    // Edge alpha with high transparency in center
    float alpha = clamp(edgeRim * 0.95 + softRim * 0.35 + specTop * 0.9 + 0.05, 0.0, 0.98);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const haloVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const haloFragmentShader = `
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
`;

export const coreVertexShader = `
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
`;

export const coreFragmentShader = `
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

    // Gradient factors
    float magentaFactor = clamp((-posNorm.x * 0.6 + posNorm.y * 0.7 + 0.5), 0.0, 1.0);
    float amberFactor = clamp((posNorm.x * 0.7 - posNorm.y * 0.8 + 0.3), 0.0, 1.0);
    float cyanFactor = clamp((posNorm.y * 0.4 + posNorm.z * 0.8 + 0.2), 0.0, 1.0);

    vec3 colMagenta = vec3(0.85, 0.15, 0.95); // Neon Magenta
    vec3 colViolet  = vec3(0.58, 0.20, 0.92); // Cosmic Violet
    vec3 colAmber   = vec3(0.96, 0.62, 0.08); // Golden Amber
    vec3 colCyan    = vec3(0.12, 0.80, 0.98); // Soft Cyan

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
`;

export const tendrilVertexShader = `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const tendrilFragmentShader = `
  uniform vec3 uCoreColor;
  uniform vec3 uEdgeColor;
  uniform float uIntensity;
  uniform float uAudio;
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    float distCenter = abs(vUv.y - 0.5) * 2.0;
    float taper = sin(vUv.x * 3.14159);
    taper = pow(max(0.0, taper), 0.7);

    vec3 coreWhite = vec3(1.0, 1.0, 1.0);
    vec3 col = mix(coreWhite, uCoreColor, smoothstep(0.0, 0.35, distCenter));
    col = mix(col, uEdgeColor, smoothstep(0.35, 1.0, distCenter));

    float alpha = pow(1.0 - distCenter, 1.4) * taper * 0.95 * uIntensity;
    alpha *= (1.0 + uAudio * 0.4);

    gl_FragColor = vec4(col * (1.3 + uAudio * 0.5), alpha);
  }
`;
