import * as THREE from 'three';
import { VoiceSessionState } from './types.ts';
import {
  chatgptOrbVertexShader,
  chatgptOrbFragmentShader,
  chatgptGlowVertexShader,
  chatgptGlowFragmentShader
} from './shaders.ts';

export class ThreeOrbScene {
  private mount: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Mesh & Materials
  private orbMesh: THREE.Mesh;
  private orbMat: THREE.ShaderMaterial;
  private glowMesh: THREE.Mesh;
  private glowMat: THREE.ShaderMaterial;

  private state: VoiceSessionState = 'idle';
  private targetAudioLevel = 0;
  private currentAudioLevel = 0;
  private reducedMotion = false;

  // ChatGPT State Animation Settings
  private stateParams = {
    speed: 0.9,
    distortion: 0.45,
    frequency: 1.2,
    intensity: 1.05,
    targetCyan: new THREE.Color('#38bdf8'),
    targetBlue: new THREE.Color('#2563eb'),
    targetViolet: new THREE.Color('#a855f7'),
    targetCore: new THREE.Color('#ffffff'),
    targetGlow: new THREE.Color('#38bdf8'),
    rotationSpeed: 0.4
  };

  constructor(mount: HTMLElement, reducedMotion = false) {
    this.mount = mount;
    this.reducedMotion = reducedMotion;

    const width = mount.clientWidth || 280;
    const height = mount.clientHeight || 280;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.z = 2.8;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.mount.appendChild(this.renderer.domElement);

    // 1. Organic Fluid Orb Mesh
    const orbGeo = new THREE.IcosahedronGeometry(0.88, 48);
    this.orbMat = new THREE.ShaderMaterial({
      vertexShader: chatgptOrbVertexShader,
      fragmentShader: chatgptOrbFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudio: { value: 0 },
        uDistortion: { value: 0.45 },
        uFrequency: { value: 1.2 },
        uIntensity: { value: 1.05 },
        uColorCyan: { value: new THREE.Color('#38bdf8') },
        uColorBlue: { value: new THREE.Color('#2563eb') },
        uColorViolet: { value: new THREE.Color('#a855f7') },
        uColorCore: { value: new THREE.Color('#ffffff') }
      },
      transparent: true,
      depthWrite: false
    });
    this.orbMesh = new THREE.Mesh(orbGeo, this.orbMat);
    this.scene.add(this.orbMesh);

    // 2. Ambient Volumetric Glow Halo
    const glowGeo = new THREE.SphereGeometry(1.08, 32, 32);
    this.glowMat = new THREE.ShaderMaterial({
      vertexShader: chatgptGlowVertexShader,
      fragmentShader: chatgptGlowFragmentShader,
      uniforms: {
        uGlowColor: { value: new THREE.Color('#38bdf8') },
        uAudio: { value: 0 },
        uPulse: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
    this.glowMesh = new THREE.Mesh(glowGeo, this.glowMat);
    this.scene.add(this.glowMesh);

    this.startLoop();
  }

  public updateState(state: VoiceSessionState, audioLevel = 0) {
    this.state = state;
    this.targetAudioLevel = Math.max(0, Math.min(1, audioLevel));
    const p = this.stateParams;

    switch (state) {
      case 'listening':
        p.speed = 1.4;
        p.distortion = 0.65;
        p.frequency = 1.5;
        p.intensity = 1.2;
        p.rotationSpeed = 0.6;
        p.targetCyan.set('#22d3ee');
        p.targetBlue.set('#0284c7');
        p.targetViolet.set('#818cf8');
        p.targetGlow.set('#22d3ee');
        break;
      case 'transcribing':
        p.speed = 1.6;
        p.distortion = 0.75;
        p.frequency = 1.6;
        p.intensity = 1.15;
        p.rotationSpeed = 0.9;
        p.targetCyan.set('#38bdf8');
        p.targetBlue.set('#3b82f6');
        p.targetViolet.set('#a855f7');
        p.targetGlow.set('#38bdf8');
        break;
      case 'thinking':
        p.speed = 2.2;
        p.distortion = 0.85;
        p.frequency = 2.0;
        p.intensity = 1.3;
        p.rotationSpeed = 1.8;
        p.targetCyan.set('#818cf8');
        p.targetBlue.set('#6366f1');
        p.targetViolet.set('#c084fc');
        p.targetGlow.set('#a855f7');
        break;
      case 'speaking':
        p.speed = 1.8;
        p.distortion = 0.9;
        p.frequency = 1.8;
        p.intensity = 1.35;
        p.rotationSpeed = 0.8;
        p.targetCyan.set('#38bdf8');
        p.targetBlue.set('#2563eb');
        p.targetViolet.set('#a855f7');
        p.targetGlow.set('#38bdf8');
        break;
      case 'offline_error':
        p.speed = 0.6;
        p.distortion = 0.3;
        p.frequency = 1.0;
        p.intensity = 0.8;
        p.rotationSpeed = 0.2;
        p.targetCyan.set('#fb923c');
        p.targetBlue.set('#ea580c');
        p.targetViolet.set('#ef4444');
        p.targetGlow.set('#f97316');
        break;
      case 'idle':
      default:
        p.speed = 0.9;
        p.distortion = 0.45;
        p.frequency = 1.2;
        p.intensity = 1.05;
        p.rotationSpeed = 0.35;
        p.targetCyan.set('#38bdf8');
        p.targetBlue.set('#2563eb');
        p.targetViolet.set('#a855f7');
        p.targetGlow.set('#38bdf8');
        break;
    }
  }

  public resize(width: number, height: number) {
    if (!width || !height || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startLoop() {
    let t = 0;
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const speed = this.reducedMotion ? 0.2 : this.stateParams.speed;
      t += delta * speed;

      // Smooth audio damping
      this.currentAudioLevel += (this.targetAudioLevel - this.currentAudioLevel) * 0.15;

      // Smooth color transitions
      const u = this.orbMat.uniforms;
      u.uColorCyan.value.lerp(this.stateParams.targetCyan, 0.08);
      u.uColorBlue.value.lerp(this.stateParams.targetBlue, 0.08);
      u.uColorViolet.value.lerp(this.stateParams.targetViolet, 0.08);
      u.uColorCore.value.lerp(this.stateParams.targetCore, 0.08);
      this.glowMat.uniforms.uGlowColor.value.lerp(this.stateParams.targetGlow, 0.08);

      // Uniform updates
      u.uTime.value = t;
      u.uAudio.value = this.currentAudioLevel;
      u.uDistortion.value += (this.stateParams.distortion - u.uDistortion.value) * 0.08;
      u.uFrequency.value += (this.stateParams.frequency - u.uFrequency.value) * 0.08;
      u.uIntensity.value += (this.stateParams.intensity - u.uIntensity.value) * 0.08;

      this.glowMat.uniforms.uAudio.value = this.currentAudioLevel;
      this.glowMat.uniforms.uPulse.value = Math.sin(t * 1.5) * 0.5 + 0.5;

      // Organic continuous 3D rotation
      const rot = delta * (this.reducedMotion ? 0.05 : this.stateParams.rotationSpeed);
      this.orbMesh.rotation.y += rot;
      this.orbMesh.rotation.x += rot * 0.4;
      this.glowMesh.rotation.y += rot * 0.5;

      // Organic scaling with speech audio
      const audioScale = 1.0 + this.currentAudioLevel * 0.15 + Math.sin(t * 1.2) * 0.02;
      this.orbMesh.scale.set(audioScale, audioScale, audioScale);

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.orbMesh?.geometry?.dispose();
    this.orbMat?.dispose();
    this.glowMesh?.geometry?.dispose();
    this.glowMat?.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
