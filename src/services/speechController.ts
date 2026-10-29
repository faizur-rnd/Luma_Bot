// LUMA Real-Time Speech Recognition, Audio Recording Fallback & Synthesis Controller
import { AudioRecorder } from './audioRecorder.ts';
import {
  selectPreferredSynthesisVoice,
  playSynthesizedOrbChime,
  fetchReferenceOrNeuralAudioUrl,
  transcribeRecordedAudioBlob
} from './speechSynthHelper.ts';

export interface SpeechControllerCallbacks {
  onStateChange: (state: 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'interrupted' | 'offline_error') => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioLevel: (level: number) => void;
  onError: (errorMsg: string) => void;
}

export class SpeechController {
  private recognition: any = null;
  private fallbackRecorder: AudioRecorder | null = null;
  private isUsingFallbackRecorder = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private callbacks: SpeechControllerCallbacks;
  private isListeningActive = false;
  private synthesisVoice: SpeechSynthesisVoice | null = null;
  private targetLanguage = 'en';
  private voiceGender: 'male' | 'female' = 'male';
  private volume = 1.0;
  private slowerSpeech = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingActive = false;
  private lastSpokeEndTime = 0;

  constructor(callbacks: SpeechControllerCallbacks, initialTargetLanguage = 'en') {
    this.callbacks = callbacks;
    this.targetLanguage = initialTargetLanguage;
    if (typeof window !== 'undefined') {
      const savedGender = localStorage.getItem('luma_ice_voice_gender');
      if (savedGender === 'female' || savedGender === 'male') this.voiceGender = savedGender;
      const savedVol = localStorage.getItem('luma_ice_voice_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) this.volume = parsed;
      }
    }
    this.initSpeechRecognition();
    this.initVoices();
  }

  private resolveLangTag(lang: string): string {
    return lang === 'ar' ? 'ar-SA' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US';
  }

  setTargetLanguage(lang: string) {
    this.targetLanguage = lang;
    if (this.recognition) this.recognition.lang = this.resolveLangTag(lang);
    this.initVoices();
  }

  setVoiceGender(gender: 'male' | 'female') {
    this.voiceGender = gender;
    if (typeof window !== 'undefined') localStorage.setItem('luma_ice_voice_gender', gender);
    this.initVoices();
  }
  getVoiceGender(): 'male' | 'female' { return this.voiceGender; }

  setSlowerSpeech(slower: boolean) {
    this.slowerSpeech = slower;
    if (this.currentAudio) {
      const baseRate = this.voiceGender === 'male' ? 0.92 : 1.0;
      this.currentAudio.playbackRate = slower ? baseRate * 0.8 : baseRate;
    }
  }
  getSlowerSpeech(): boolean { return this.slowerSpeech; }

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1.0, vol));
    this.volume = clamped;
    if (this.currentAudio) this.currentAudio.volume = clamped;
    if (typeof window !== 'undefined') localStorage.setItem('luma_ice_voice_volume', clamped.toString());
  }
  getVolume(): number { return this.volume; }

  playOrbChime(type: 'tap' | 'listen' | 'speak' = 'tap') { playSynthesizedOrbChime(type, this.volume, this.audioContext); }

  public initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => { this.synthesisVoice = selectPreferredSynthesisVoice(window.speechSynthesis.getVoices(), this.targetLanguage, this.voiceGender); };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.resolveLangTag(this.targetLanguage);
      this.recognition.onstart = () => this.callbacks.onStateChange('listening');
      this.recognition.onresult = (event: any) => {
        if (this.isSpeakingActive || Date.now() - this.lastSpokeEndTime < 750) return;
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (interim) { this.callbacks.onStateChange('transcribing'); this.callbacks.onTranscript(interim, false); }
        if (final) this.callbacks.onTranscript(final, true);
      };
      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        this.stopAudioAnalysis();
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.callbacks.onError('Microphone access is blocked in this browser view. Use Type or select a prompt chip below.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          this.callbacks.onError(`Speech recognition notice (${event.error}). Try Type or Retry.`);
        }
        this.callbacks.onStateChange('idle');
      };
      this.recognition.onend = () => {
        if (!this.isUsingFallbackRecorder) {
          this.isListeningActive = false;
          this.stopAudioAnalysis();
          this.callbacks.onStateChange('idle');
        }
      };
    } catch {}
  }

  async startListening(langOverride?: string): Promise<boolean> {
    if (langOverride) this.setTargetLanguage(langOverride);
    this.stopSpeaking();
    this.playOrbChime('listen');
    if (this.recognition) {
      try {
        this.isUsingFallbackRecorder = false;
        this.callbacks.onStateChange('listening');
        await this.startAudioAnalysis();
        this.isListeningActive = true;
        this.recognition.start();
        return true;
      } catch { this.stopAudioAnalysis(); }
    }
    this.fallbackRecorder = new AudioRecorder({
      maxDurationMs: 30000,
      onStateChange: (state) => { if (typeof state.level === 'number') this.callbacks.onAudioLevel(Math.min(1, state.level / 100)); }
    });
    const started = await this.fallbackRecorder.start();
    if (started) {
      this.isUsingFallbackRecorder = true;
      this.isListeningActive = true;
      this.callbacks.onStateChange('listening');
      return true;
    }
    this.isListeningActive = false;
    this.callbacks.onError('Microphone access unavailable in this browser frame. Use Type or tap a prompt chip below to converse.');
    this.callbacks.onStateChange('idle');
    return false;
  }

  async stopListening() {
    if (this.isUsingFallbackRecorder && this.fallbackRecorder) {
      const rec = this.fallbackRecorder;
      this.fallbackRecorder = null;
      this.isUsingFallbackRecorder = false;
      this.isListeningActive = false;
      this.callbacks.onStateChange('transcribing');
      try {
        const result = await rec.stop();
        const transcript = await transcribeRecordedAudioBlob(result.blob, this.targetLanguage);
        if (transcript) this.callbacks.onTranscript(transcript, true);
        else this.callbacks.onError('Audio recorded! Live speech-to-text is unavailable in this environment—please select a prompt or type below.');
      } catch {
        this.callbacks.onError('Recording stopped. Use Type or select a prompt chip below.');
      }
      this.callbacks.onAudioLevel(0);
      this.callbacks.onStateChange('idle');
      return;
    }
    if (this.recognition && this.isListeningActive) { try { this.recognition.stop(); } catch {} }
    this.isListeningActive = false;
    this.stopAudioAnalysis();
    this.callbacks.onStateChange('idle');
  }

  private async startAudioAnalysis() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const update = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        this.callbacks.onAudioLevel(Math.min(1.0, sum / dataArray.length / 128));
        this.animFrameId = requestAnimationFrame(update);
      };
      update();
    } catch { this.callbacks.onAudioLevel(0.3); }
  }

  private stopAudioAnalysis() {
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (this.mediaStream) { this.mediaStream.getTracks().forEach((t) => t.stop()); this.mediaStream = null; }
    if (this.audioContext && this.audioContext.state !== 'closed') { this.audioContext.close().catch(() => {}); this.audioContext = null; }
    this.analyser = null;
    this.callbacks.onAudioLevel(0);
  }

  speak(text: string, onEnd?: () => void, langOverride?: string) {
    this.stopSpeaking();
    const targetLang = langOverride || this.targetLanguage;
    const hasVoices = typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0;
    if (!hasVoices) { this.speakWithServerAudio(text, targetLang, onEnd); return; }
    this.speakWithBrowser(text, onEnd, targetLang);
  }

  private async speakWithServerAudio(text: string, lang: string, onEnd?: () => void) {
    this.isSpeakingActive = true;
    this.callbacks.onStateChange('speaking');
    const url = await fetchReferenceOrNeuralAudioUrl(text, lang, this.voiceGender);
    if (!url || typeof Audio === 'undefined') { this.simulateVisualSpeechPulse(text, onEnd); return; }
    try {
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.volume = this.volume;
      const baseRate = this.voiceGender === 'male' ? 0.92 : 1.0;
      audio.playbackRate = this.slowerSpeech ? baseRate * 0.8 : baseRate;
      let t = 0;
      const timer = setInterval(() => { t += 0.2; this.callbacks.onAudioLevel(0.4 + 0.45 * Math.sin(t * 3.5)); }, 50);
      const cleanup = () => { clearInterval(timer); this.currentAudio = null; this.isSpeakingActive = false; this.lastSpokeEndTime = Date.now(); this.callbacks.onAudioLevel(0); this.callbacks.onStateChange('idle'); onEnd?.(); };
      audio.onended = cleanup;
      audio.onerror = cleanup;
      await audio.play();
    } catch { this.simulateVisualSpeechPulse(text, onEnd); }
  }

  private simulateVisualSpeechPulse(text: string, onEnd?: () => void) {
    let t = 0;
    const durationMs = Math.min(3500, Math.max(1200, text.length * 45));
    const timer = setInterval(() => { t += 0.2; this.callbacks.onAudioLevel(0.35 + 0.4 * Math.sin(t * 3.5)); }, 50);
    setTimeout(() => { clearInterval(timer); this.isSpeakingActive = false; this.lastSpokeEndTime = Date.now(); this.callbacks.onAudioLevel(0); this.callbacks.onStateChange('idle'); onEnd?.(); }, durationMs);
  }

  private speakWithBrowser(text: string, onEnd?: () => void, targetLang = 'en') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { this.simulateVisualSpeechPulse(text, onEnd); return; }
    this.isSpeakingActive = true;
    if (!this.synthesisVoice) this.initVoices();
    try { window.speechSynthesis.cancel(); } catch {}
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;
        utterance.lang = this.resolveLangTag(targetLang);
        if (this.synthesisVoice) utterance.voice = this.synthesisVoice;
        utterance.volume = this.volume;
        const baseRate = this.voiceGender === 'male' ? 0.92 : 0.98;
        utterance.pitch = this.voiceGender === 'male' ? 0.78 : 1.1;
        utterance.rate = this.slowerSpeech ? Number((baseRate * 0.8).toFixed(2)) : baseRate;
        this.callbacks.onStateChange('speaking');
        let t = 0;
        const pulseTimer = setInterval(() => { t += 0.2; this.callbacks.onAudioLevel(0.35 + 0.45 * Math.sin(t * 3.5)); }, 50);
        const safetyTimeout = setTimeout(() => cleanup(), Math.max(3500, text.length * 90));
        const cleanup = () => { clearTimeout(safetyTimeout); clearInterval(pulseTimer); this.currentUtterance = null; this.isSpeakingActive = false; this.lastSpokeEndTime = Date.now(); this.callbacks.onAudioLevel(0); this.callbacks.onStateChange('idle'); onEnd?.(); };
        utterance.onend = cleanup;
        utterance.onerror = cleanup;
        window.speechSynthesis.speak(utterance);
      } catch { this.simulateVisualSpeechPulse(text, onEnd); }
    }, 25);
  }

  stopSpeaking() {
    this.isSpeakingActive = false;
    this.lastSpokeEndTime = Date.now();
    if (this.currentAudio) { try { this.currentAudio.pause(); this.currentAudio.src = ''; } catch {} this.currentAudio = null; }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch {} }
    this.currentUtterance = null;
    this.callbacks.onAudioLevel(0);
    this.callbacks.onStateChange('idle');
  }
  dispose() { this.stopListening(); this.stopSpeaking(); this.stopAudioAnalysis(); }
}
