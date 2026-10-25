import * as THREE from 'three';
import { VoiceSessionState } from './types.ts';
import {
  glassVertexShader,
  glassFragmentShader,
  haloVertexShader,
  haloFragmentShader,
  coreVertexShader,
  coreFragmentShader,
  tendrilVertexShader,
  tendrilFragmentShader
} from './shaders.ts';

export class ThreeOrbScene {
  private mount: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Mesh & Materials
  private glassMesh: THREE.Mesh;
  private glassMat: THREE.ShaderMaterial;
  private haloMesh: THREE.Mesh;
  private haloMat: THREE.ShaderMaterial;
  private coreMesh: THREE.Mesh;
  private coreMat: THREE.ShaderMaterial;
  private tendrilsMesh: THREE.Points;
  private tendrilsMat: THREE.ShaderMaterial;

  private state: VoiceSessionState = 'idle';
  private audioLevel = 0;
  private reducedMotion = false;

  private stateParams = {
    speed: 1.0,
    orbitSpeed: 0.8,
    tendrilAmplitude: 1.0,
    nebulaIntensity: 1.0,
    tendrilBrightness: 1.0,
    rimColor: new THREE.Color('#6C7BFF'),
    targetRimColor: new THREE.Color('#6C7BFF'),
    cyanWeight: 1.0,
    magentaWeight: 1.0,
    amberWeight: 1.0
  };

  constructor(mount: HTMLElement, reducedMotion = false) {
    this.mount = mount;
    this.reducedMotion = reducedMotion;

    const width = mount.clientWidth || 280;
    const height = mount.clientHeight || 280;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.z = 3.2;

    // Transparent canvas to match background tokens without dark patches
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.mount.appendChild(this.renderer.domElement);

    // 1. Core Nebula Sphere
    const coreGeo = new THREE.SphereGeometry(0.72, 32, 32);
    this.coreMat = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioReact: { value: 0 },
        uIntensity: { value: 1.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.scene.add(this.coreMesh);

    // 2. Tendrils / Ribbons Particles (lower particle count on mobile screens)
    const particleCount = width < 480 ? 400 : 1000;
    const posArray = new Float32Array(particleCount * 3);
    const radiusArray = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 0.5 + Math.random() * 0.45;
      posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      posArray[i * 3 + 2] = r * Math.cos(phi);
      radiusArray[i] = r;
    }
    const tendrilGeo = new THREE.BufferGeometry();
    tendrilGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    tendrilGeo.setAttribute('aRadius', new THREE.BufferAttribute(radiusArray, 1));

    this.tendrilsMat = new THREE.ShaderMaterial({
      vertexShader: tendrilVertexShader,
      fragmentShader: tendrilFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 1.0 },
        uBrightness: { value: 1.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.tendrilsMesh = new THREE.Points(tendrilGeo, this.tendrilsMat);
    this.scene.add(this.tendrilsMesh);

    // 3. Halo
    const haloGeo = new THREE.SphereGeometry(0.96, 32, 32);
    this.haloMat = new THREE.ShaderMaterial({
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uHaloColor: { value: this.stateParams.rimColor }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    });
    this.haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
    this.scene.add(this.haloMesh);

    // 4. Glass Shell
    const glassGeo = new THREE.SphereGeometry(1.0, 48, 48);
    this.glassMat = new THREE.ShaderMaterial({
      vertexShader: glassVertexShader,
      fragmentShader: glassFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRimColor: { value: this.stateParams.rimColor }
      },
      transparent: true,
      depthWrite: false
    });
    this.glassMesh = new THREE.Mesh(glassGeo, this.glassMat);
    this.scene.add(this.glassMesh);

    this.startLoop();
  }

  public updateState(state: VoiceSessionState, audioLevel = 0) {
    this.state = state;
    this.audioLevel = audioLevel;
    const p = this.stateParams;

    switch (state) {
      case 'listening':
        p.speed = 1.6;
        p.orbitSpeed = 1.4;
        p.tendrilAmplitude = 1.3;
        p.nebulaIntensity = 1.3;
        p.tendrilBrightness = 1.4;
        p.targetRimColor.set('#06B6D4'); // cyan
        break;
      case 'transcribing':
        p.speed = 1.8;
        p.orbitSpeed = 1.5;
        p.tendrilAmplitude = 1.2;
        p.nebulaIntensity = 1.2;
        p.targetRimColor.set('#38BDF8');
        break;
      case 'thinking':
        p.speed = 2.2;
        p.orbitSpeed = 2.0;
        p.tendrilAmplitude = 1.1;
        p.nebulaIntensity = 1.4;
        p.tendrilBrightness = 1.2;
        p.targetRimColor.set('#8B5CF6'); // violet
        break;
      case 'speaking':
        p.speed = 1.7;
        p.orbitSpeed = 1.3;
        p.tendrilAmplitude = 1.3;
        p.nebulaIntensity = 1.35;
        p.tendrilBrightness = 1.3;
        p.targetRimColor.set('#EC4899'); // pink
        break;
      case 'offline_error':
        p.speed = 0.5;
        p.orbitSpeed = 0.4;
        p.tendrilAmplitude = 0.5;
        p.nebulaIntensity = 0.7;
        p.targetRimColor.set('#EF4444');
        break;
      case 'idle':
      default:
        p.speed = 1.0;
        p.orbitSpeed = 0.8;
        p.tendrilAmplitude = 1.0;
        p.nebulaIntensity = 1.0;
        p.tendrilBrightness = 1.0;
        p.targetRimColor.set('#6C7BFF');
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

      const delta = this.clock.getDelta();
      const speed = this.reducedMotion ? 0.2 : this.stateParams.speed;
      t += delta * speed;

      // Smooth color transitions
      this.stateParams.rimColor.lerp(this.stateParams.targetRimColor, 0.08);

      // Uniform updates
      this.coreMat.uniforms.uTime.value = t;
      this.coreMat.uniforms.uAudioReact.value = this.audioLevel;
      this.coreMat.uniforms.uIntensity.value = this.stateParams.nebulaIntensity;

      this.tendrilsMat.uniforms.uTime.value = t;
      this.tendrilsMat.uniforms.uAmplitude.value = this.stateParams.tendrilAmplitude + this.audioLevel * 0.4;
      this.tendrilsMat.uniforms.uBrightness.value = this.stateParams.tendrilBrightness;

      this.haloMat.uniforms.uTime.value = t;
      this.haloMat.uniforms.uHaloColor.value = this.stateParams.rimColor;

      this.glassMat.uniforms.uTime.value = t;
      this.glassMat.uniforms.uRimColor.value = this.stateParams.rimColor;

      // Gentle rotation
      const rotSpeed = delta * (this.reducedMotion ? 0.1 : this.stateParams.orbitSpeed * 0.4);
      this.glassMesh.rotation.y += rotSpeed;
      this.tendrilsMesh.rotation.y -= rotSpeed * 0.8;
      this.coreMesh.rotation.y += rotSpeed * 0.5;

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Dispose geometries & materials
    this.glassMesh?.geometry?.dispose();
    this.glassMat?.dispose();
    this.haloMesh?.geometry?.dispose();
    this.haloMat?.dispose();
    this.coreMesh?.geometry?.dispose();
    this.coreMat?.dispose();
    this.tendrilsMesh?.geometry?.dispose();
    this.tendrilsMat?.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
