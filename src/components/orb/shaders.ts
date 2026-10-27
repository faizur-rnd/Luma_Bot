// WebGL GLSL Shaders for ChatGPT-style Fluid Organic Voice Orb
// Liquid iridescent morphing blob with dynamic audio reaction & chromatic radiance

export const chatgptOrbVertexShader = `
  uniform float uTime;
  uniform float uAudio;
  uniform float uDistortion;
  uniform float uFrequency;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  // Optimized Simplex-style 3D Noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Multi-octave organic fluid undulation
    vec3 noisePos = position * uFrequency + vec3(uTime * 0.45, uTime * 0.35, uTime * 0.25);
    float n1 = snoise(noisePos);
    float n2 = snoise(noisePos * 2.1 + vec3(-uTime * 0.3, uTime * 0.5, 0.0)) * 0.5;
    float rawNoise = n1 + n2;

    // Amplitude reacts organically to speech audio
    float audioAmp = 1.0 + uAudio * 1.8;
    float displacement = rawNoise * (uDistortion * 0.18) * audioAmp;
    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacement;
    vPosition = newPosition;
    
    vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const chatgptOrbFragmentShader = `
  uniform float uTime;
  uniform float uAudio;
  uniform vec3 uColorCyan;
  uniform vec3 uColorBlue;
  uniform vec3 uColorViolet;
  uniform vec3 uColorCore;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // Fresnel rim effect (characteristic of glowing fluid bubble)
    float NdotV = max(0.0, dot(N, V));
    float fresnel = pow(1.0 - NdotV, 2.8);
    float rimGlow = pow(1.0 - NdotV, 4.5);

    // Multi-gradient chromatic blending
    // Flowing coordinates based on position and time
    float colorFlow1 = sin(vPosition.y * 2.2 + vPosition.x * 1.5 + uTime * 0.8) * 0.5 + 0.5;
    float colorFlow2 = cos(vPosition.z * 2.5 - vPosition.y * 1.8 + uTime * 0.6) * 0.5 + 0.5;
    float colorFlow3 = sin(vDisplacement * 6.0 + uTime * 1.2) * 0.5 + 0.5;

    // Liquid palette mixing (Cyan -> Electric Blue -> Deep Violet)
    vec3 fluidColor = mix(uColorCyan, uColorBlue, colorFlow1);
    fluidColor = mix(fluidColor, uColorViolet, colorFlow2 * 0.85);

    // Dynamic wave ripples from audio
    float ripple = sin(vPosition.y * 6.0 - uTime * 3.0) * 0.5 + 0.5;
    fluidColor += uColorCyan * ripple * uAudio * 0.45;

    // Luminous radiant white core
    float coreBloom = pow(NdotV, 1.8);
    vec3 finalColor = mix(fluidColor, uColorCore, coreBloom * 0.65);

    // Specular highlight to convey soft silky surface
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.9));
    vec3 H = normalize(lightDir + V);
    float spec = pow(max(0.0, dot(N, H)), 32.0);
    finalColor += vec3(1.0, 1.0, 1.0) * spec * 0.7;

    // Iridescent rim glow
    finalColor += mix(uColorCyan, uColorViolet, fresnel) * (fresnel * 1.2 + rimGlow * 1.5);

    // Brightness boosted by audio state
    finalColor *= (uIntensity + uAudio * 0.35);

    // Soft feathered alpha at outer edges
    float alpha = clamp(0.85 + fresnel * 0.15 + uAudio * 0.1, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const chatgptGlowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const chatgptGlowFragmentShader = `
  uniform vec3 uGlowColor;
  uniform float uAudio;
  uniform float uPulse;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float viewDot = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
    float halo = pow(1.0 - abs(viewDot), 3.2);
    float intensity = halo * (0.4 + uAudio * 0.35 + uPulse * 0.15);
    gl_FragColor = vec4(uGlowColor * 1.4, intensity);
  }
`;
