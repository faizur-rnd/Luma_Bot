// LUMA Client-Side Audio Recording Service
// Captures genuine microphone audio, resamples to 16 kHz mono 16-bit PCM WAV,
// tracks real-time audio levels for visual feedback, and enforces 90s duration limits.

export interface AudioRecorderState {
  isRecording: boolean;
  durationMs: number;
  level: number; // 0 to 100
  waveform: number[]; // normalized heights 0..1
  error: string | null;
  errorCode?: 'PERMISSION_DENIED' | 'NO_DEVICE_FOUND' | 'UNSUPPORTED_BROWSER' | 'DURATION_EXCEEDED' | 'RECORDING_INTERRUPTED';
}

export interface AudioRecordingResult {
  blob: Blob;
  durationMs: number;
  sampleRate: number;
  audioUrl: string;
}

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private pcmChunks: Float32Array[] = [];
  private animFrameId: number | null = null;
  private startTime = 0;
  private timerId: any = null;
  private maxDurationMs = 90000; // 90 seconds max
  private onStateChange?: (state: Partial<AudioRecorderState>) => void;
  private onMaxDurationReached?: () => void;

  constructor(options?: {
    maxDurationMs?: number;
    onStateChange?: (state: Partial<AudioRecorderState>) => void;
    onMaxDurationReached?: () => void;
  }) {
    if (options?.maxDurationMs) this.maxDurationMs = options.maxDurationMs;
    this.onStateChange = options?.onStateChange;
    this.onMaxDurationReached = options?.onMaxDurationReached;
  }

  async start(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.notifyError('UNSUPPORTED_BROWSER', 'Audio recording is not supported in this browser.');
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.notifyError('PERMISSION_DENIED', 'Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.notifyError('NO_DEVICE_FOUND', 'No microphone device was detected.');
      } else {
        this.notifyError('RECORDING_INTERRUPTED', err.message || 'Failed to initialize microphone.');
      }
      return false;
    }

    // Initialize Web Audio API for audio level metering & PCM capture
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);
    } catch (e) {
      console.warn('[AudioRecorder] Web Audio meter initialization notice:', e);
    }

    this.recordedChunks = [];
    this.startTime = Date.now();

    // Use MediaRecorder if available
    let mimeType = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      try {
        this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
        };
        this.mediaRecorder.start(100);
      } catch {
        this.mediaRecorder = null;
      }
    }

    // Set 90s duration limit watchdog
    this.timerId = setTimeout(() => {
      if (this.onMaxDurationReached) this.onMaxDurationReached();
    }, this.maxDurationMs);

    this.startLevelMeter();
    return true;
  }

  private startLevelMeter() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      // Compute RMS level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedLevel = Math.min(100, Math.round((rms / 128) * 100));

      // Waveform sample slice (8 bars)
      const waveform: number[] = [];
      const step = Math.floor(dataArray.length / 8);
      for (let i = 0; i < 8; i++) {
        waveform.push(Math.min(1, dataArray[i * step] / 255));
      }

      const elapsed = Date.now() - this.startTime;

      if (this.onStateChange) {
        this.onStateChange({
          isRecording: true,
          durationMs: elapsed,
          level: normalizedLevel,
          waveform
        });
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  async stop(): Promise<AudioRecordingResult> {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.timerId) clearTimeout(this.timerId);

    const elapsed = Date.now() - this.startTime;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => resolve();
        this.mediaRecorder.stop();
      });
    }

    // Clean up tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { await this.audioContext.close(); } catch {}
      this.audioContext = null;
    }

    const rawBlob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
    
    // Convert to canonical 16 kHz mono WAV
    const wavBlob = await this.convertToWav(rawBlob);
    const audioUrl = URL.createObjectURL(wavBlob);

    if (this.onStateChange) {
      this.onStateChange({ isRecording: false, level: 0, durationMs: elapsed });
    }

    return {
      blob: wavBlob,
      durationMs: elapsed,
      sampleRate: 16000,
      audioUrl
    };
  }

  private async convertToWav(sourceBlob: Blob): Promise<Blob> {
    try {
      const arrayBuffer = await sourceBlob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const offlineCtx = new AudioCtx({ sampleRate: 16000 });
      const decodedBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      
      const pcmData = decodedBuffer.getChannelData(0);
      const wavBuffer = this.encodeWAV(pcmData, 16000);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch {
      // Return original blob if conversion is not supported in current environment
      return sourceBlob;
    }
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF identifier
    writeString(0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(8, 'WAVE');
    // format chunk identifier
    writeString(12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // channel count (1 = mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sampleRate * 1 channel * 2 bytes)
    view.setUint32(28, sampleRate * 2, true);
    // block align (1 channel * 2 bytes)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // Float32 to Int16 PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }

  private notifyError(code: AudioRecorderState['errorCode'], message: string) {
    if (this.onStateChange) {
      this.onStateChange({
        isRecording: false,
        error: message,
        errorCode: code
      });
    }
  }
}
