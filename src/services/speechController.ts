// LUMA Real-Time Speech Recognition & Synthesis Controller
// Supports Multilingual Target Languages: English (en-US), Arabic (ar-SA), and German (de-DE)
import { apiClient } from './apiClient.ts';

export interface SpeechControllerCallbacks {
  onStateChange: (state: 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'interrupted' | 'offline_error') => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioLevel: (level: number) => void;
  onError: (errorMsg: string) => void;
}

export class SpeechController {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private callbacks: SpeechControllerCallbacks;
  private isListeningActive = false;
  private synthesisVoice: SpeechSynthesisVoice | null = null;
  private targetLanguage: string = 'en';
  private voiceGender: 'male' | 'female' = 'male';
  private volume: number = 1.0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingActive = false;
  private lastSpokeEndTime = 0;

  constructor(callbacks: SpeechControllerCallbacks, initialTargetLanguage: string = 'en') {
    this.callbacks = callbacks;
    this.targetLanguage = initialTargetLanguage;
    if (typeof window !== 'undefined') {
      const savedGender = localStorage.getItem('luma_ice_voice_gender');
      if (savedGender === 'female' || savedGender === 'male') {
        this.voiceGender = savedGender;
      }
      const savedVol = localStorage.getItem('luma_ice_voice_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    }
    this.initSpeechRecognition();
    this.initVoices();
  }

  setTargetLanguage(lang: string) {
    this.targetLanguage = lang;
    if (this.recognition) {
      if (lang === 'ar') this.recognition.lang = 'ar-SA';
      else if (lang === 'es') this.recognition.lang = 'es-ES';
      else if (lang === 'de') this.recognition.lang = 'de-DE';
      else this.recognition.lang = 'en-US';
    }
    this.initVoices();
  }

  setVoiceGender(gender: 'male' | 'female') {
    this.voiceGender = gender;
    if (typeof window !== 'undefined') {
      localStorage.setItem('luma_ice_voice_gender', gender);
    }
    this.initVoices();
  }

  getVoiceGender(): 'male' | 'female' {
    return this.voiceGender;
  }

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1.0, vol));
    this.volume = clamped;
    if (this.currentAudio) {
      this.currentAudio.volume = clamped;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('luma_ice_voice_volume', clamped.toString());
    }
  }

  getVolume(): number {
    return this.volume;
  }

  playOrbChime(type: 'tap' | 'listen' | 'speak' = 'tap') {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = this.audioContext || new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      const freq = type === 'listen' ? 659.25 : type === 'speak' ? 880 : 523.25;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      if (type === 'listen') {
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      } else if (type === 'speak') {
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);
      }

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        const prefix = this.targetLanguage === 'ar' ? 'ar' : this.targetLanguage === 'es' ? 'es' : this.targetLanguage === 'de' ? 'de' : 'en';
        const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));

        const maleNames = [
          'maged', 'tariq', 'naayf', 'hamza', 'salim', 'kareem', 'ziad', 'omar', 'bilal', 'shakir',
          'jorge', 'diego', 'carlos', 'enrique', 'alvaro', 'miguel', 'manuel', 'pablo', 'mateo', 'antonio',
          'stefan', 'hans', 'markus', 'daniel', 'florian', 'martin', 'jan', 'lukas',
          'david', 'guy', 'alex', 'fred', 'george', 'daniel', 'oliver', 'rishi', 'james', 'thomas',
          'male', 'es-es', 'es-mx', 'ar-sa', 'de-de'
        ];
        const femaleNames = [
          'laila', 'salma', 'zariyah', 'zeina', 'mouna',
          'monica', 'paulina', 'lucia', 'sofia', 'elena', 'carmen',
          'hedda', 'katja', 'anna', 'marlene',
          'samantha', 'victoria', 'zira', 'jenny', 'karen', 'moira', 'susan',
          'female'
        ];

        const preferredKeywords = this.voiceGender === 'male' ? maleNames : femaleNames;

        // 1. Try finding a voice matching language and target gender
        let matched = langVoices.find(v => {
          const nameLower = v.name.toLowerCase();
          return preferredKeywords.some(kw => nameLower.includes(kw));
        });

        // 2. If no direct gender match in target language, find any high-quality natural voice for that language
        if (!matched && langVoices.length > 0) {
          matched = langVoices.find(v => 
            v.name.includes('Natural') || 
            v.name.includes('Google') || 
            v.name.includes('Premium')
          ) || langVoices[0];
        }

        // 3. Resilient fallback: If no voice exists on this machine for this language (e.g. Arabic on a minimal Linux OS),
        // fallback to best available voice so speech audio is ALWAYS audible rather than muted!
        if (!matched) {
          matched = voices.find(v => v.lang.startsWith('en') && preferredKeywords.some(kw => v.name.toLowerCase().includes(kw))) || voices[0];
        }

        this.synthesisVoice = matched || null;
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not natively available in this browser environment.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.targetLanguage === 'ar' ? 'ar-SA' : this.targetLanguage === 'es' ? 'es-ES' : this.targetLanguage === 'de' ? 'de-DE' : 'en-US';

      this.recognition.onstart = () => {
        this.callbacks.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        // Prevent simultaneous overlap: Ignore microphone audio if LUMA is speaking
        // or within the 750ms echo suppression window after speech ends
        if (this.isSpeakingActive || (Date.now() - this.lastSpokeEndTime < 750)) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          this.callbacks.onStateChange('transcribing');
          this.callbacks.onTranscript(interim, false);
        }
        if (final) {
          this.callbacks.onTranscript(final, true);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        this.stopAudioAnalysis();
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.callbacks.onError('Microphone permission is blocked in this browser frame. You can type or click prompt chips below.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          this.callbacks.onError(`Microphone notice: ${event.error}`);
        }
        this.callbacks.onStateChange('idle');
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        this.stopAudioAnalysis();
        this.callbacks.onStateChange('idle');
      };
    } catch (e: any) {
      console.warn('Failed to initialize speech recognition:', e);
    }
  }

  async startListening(langOverride?: string): Promise<boolean> {
    if (langOverride) {
      this.setTargetLanguage(langOverride);
    }
    if (!this.recognition) {
      this.callbacks.onError('Microphone speech recognition is not supported in this browser. Please use text input below.');
      this.callbacks.onStateChange('idle');
      return false;
    }

    try {
      this.stopSpeaking();
      this.playOrbChime('listen');
      this.callbacks.onStateChange('listening');

      // Setup audio analysis for Voice Orb reactivity
      await this.startAudioAnalysis();

      this.isListeningActive = true;
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      this.stopAudioAnalysis();
      this.callbacks.onStateChange('idle');
      console.warn('Speech recognition start notice:', err.message);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
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

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, avg / 128); // 0.0 to 1.0

        this.callbacks.onAudioLevel(normalized);
        this.animFrameId = requestAnimationFrame(update);
      };

      update();
    } catch {
      // Audio stream analysis not available, fallback to mock volume level
      this.callbacks.onAudioLevel(0.3);
    }
  }

  private stopAudioAnalysis() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.callbacks.onAudioLevel(0);
  }

  async playCloudTTS(
    text: string,
    lang: string,
    gender: 'male' | 'female',
    onEnd?: () => void,
    onFallback?: () => void
  ) {
    this.stopSpeaking();
    this.stopListening();
    this.isSpeakingActive = true;
    this.callbacks.onStateChange('speaking');

    try {
      const audioSrc = apiClient.getTtsAudioUrl(text, lang, gender);
      if (!audioSrc) {
        this.speakWithBrowser(text, onEnd, lang);
        return;
      }
      const audio = new Audio(audioSrc);
      this.currentAudio = audio;
      audio.volume = this.volume;

      // Authentic pitch adjustment for male vs female vocal timbre
      if (gender === 'male') {
        (audio as any).preservesPitch = false;
        (audio as any).mozPreservesPitch = false;
        (audio as any).webkitPreservesPitch = false;
        audio.playbackRate = 0.85; // Drops pitch by ~2.8 semitones into deep male range
      } else {
        (audio as any).preservesPitch = true;
        audio.playbackRate = 1.0;
      }

      let speechPulseTimer: any = null;
      const startSpeechPulse = () => {
        let t = 0;
        speechPulseTimer = setInterval(() => {
          t += 0.2;
          const wave = 0.4 + 0.45 * Math.sin(t * 3.5);
          this.callbacks.onAudioLevel(wave);
        }, 50);
      };

      const cleanup = () => {
        if (speechPulseTimer) clearInterval(speechPulseTimer);
        this.currentAudio = null;
        this.isSpeakingActive = false;
        this.lastSpokeEndTime = Date.now();
        this.callbacks.onAudioLevel(0);
        this.callbacks.onStateChange('idle');
        onEnd?.();
      };

      audio.onplay = () => {
        startSpeechPulse();
      };

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = (e) => {
        console.warn('Native TTS audio streaming notice, invoking fallback:', e);
        cleanup();
        if (onFallback) onFallback();
        else onEnd?.();
      };

      await audio.play();
    } catch (err) {
      console.warn('TTS streaming failed, falling back:', err);
      this.isSpeakingActive = false;
      if (onFallback) onFallback();
      else {
        this.callbacks.onStateChange('idle');
        onEnd?.();
      }
    }
  }

  speak(text: string, onEnd?: () => void, langOverride?: string) {
    this.stopSpeaking();
    this.stopListening(); // Immediately mute microphone before any speech begins!
    const targetLang = langOverride || this.targetLanguage;
    const isArabic = targetLang === 'ar' || /[\u0600-\u06FF]/.test(text);

    // If browser already has a high-quality Arabic voice installed
    const hasBrowserArabic = typeof window !== 'undefined' && 'speechSynthesis' in window &&
      window.speechSynthesis.getVoices().some(v => v.lang.toLowerCase().startsWith('ar'));

    // For Arabic, if no browser Arabic voice is installed, stream via /api/tts with male pitch transformation
    if (isArabic && !hasBrowserArabic) {
      this.playCloudTTS(text, 'ar', this.voiceGender, onEnd, () => {
        this.speakWithBrowser(text, onEnd, langOverride);
      });
      return;
    }

    // For all supported target languages (Arabic, Spanish, German, English), synthesize with browser
    this.speakWithBrowser(text, onEnd, langOverride);
  }

  private speakWithBrowser(text: string, onEnd?: () => void, langOverride?: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    this.stopListening();
    this.isSpeakingActive = true;

    if (!this.synthesisVoice) {
      this.initVoices();
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch {}

    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        const targetLang = langOverride || this.targetLanguage;
        if (targetLang === 'ar') utterance.lang = 'ar-SA';
        else if (targetLang === 'es') utterance.lang = 'es-ES';
        else if (targetLang === 'de') utterance.lang = 'de-DE';
        else utterance.lang = 'en-US';

        if (this.synthesisVoice) {
          utterance.voice = this.synthesisVoice;
        }

        utterance.volume = this.volume;
        if (this.voiceGender === 'male') {
          utterance.pitch = 0.72; // Rich, unmistakably masculine pitch
          utterance.rate = 0.90;
        } else {
          utterance.pitch = 1.12; // Bright, clear female pitch
          utterance.rate = 0.98;
        }

        this.callbacks.onStateChange('speaking');

        let speechPulseTimer: any = null;
        const startSpeechPulse = () => {
          let t = 0;
          speechPulseTimer = setInterval(() => {
            t += 0.2;
            const wave = 0.35 + 0.45 * Math.sin(t * 3.5);
            this.callbacks.onAudioLevel(wave);
          }, 50);
        };

        const cleanup = () => {
          if (speechPulseTimer) clearInterval(speechPulseTimer);
          this.currentUtterance = null;
          this.isSpeakingActive = false;
          this.lastSpokeEndTime = Date.now();
          this.callbacks.onAudioLevel(0);
          this.callbacks.onStateChange('idle');
          onEnd?.();
        };

        utterance.onstart = () => {
          startSpeechPulse();
        };

        utterance.onend = () => {
          cleanup();
        };

        utterance.onerror = (e) => {
          console.warn('Browser speech synthesis notice:', e);
          cleanup();
          // Fallback to cloud TTS if browser speech failed
          this.playCloudTTS(text, targetLang, this.voiceGender, onEnd);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Browser speech synthesis error, using cloud TTS fallback:', err);
        this.isSpeakingActive = false;
        this.lastSpokeEndTime = Date.now();
        this.callbacks.onStateChange('idle');
        const targetLang = langOverride || this.targetLanguage;
        this.playCloudTTS(text, targetLang, this.voiceGender, onEnd);
      }
    }, 25);
  }

  previewVoice(gender?: 'male' | 'female', onEnd?: () => void) {
    if (gender) {
      this.setVoiceGender(gender);
    }
    this.playOrbChime('speak');

    const targetLang = this.targetLanguage;
    let previewText = "Hello! I am LUMA's male voice. Ready to guide your conversational fluency.";
    if (this.voiceGender === 'female') {
      if (targetLang === 'ar') {
        previewText = "أَهْلًا وَسَهْلًا بِكَ! أَنَا لُومَا، مُعَلِّمَتُكَ الذَّكِيَّةُ لِلُّغَةِ العَرَبِيَّةِ الفُصْحَى.";
      } else if (targetLang === 'es') {
        previewText = "¡Hola! Soy la voz femenina de LUMA. Estoy lista para ayudarte a hablar español con confianza y fluidez.";
      } else if (targetLang === 'de') {
        previewText = "Hallo! Ich bin LUMA. Lass uns gemeinsam deine Aussprache und Sprachgewandtheit trainieren.";
      } else {
        previewText = "Hello! I am LUMA. Let's practice speaking and build your confidence.";
      }
    } else {
      if (targetLang === 'ar') {
        previewText = "مَرْحَبًا بِكَ! أَنَا صَوْتُ لُومَا الذَّكِيّ، جَاهِزٌ لِمُسَاعَدَتِكَ فِي التَّحَدُّثِ بِالعَرَبِيَّةِ الفُصْحَى.";
      } else if (targetLang === 'es') {
        previewText = "¡Hola! Soy la voz masculina de LUMA. Vamos a entrenar tu pronunciación y fluidez conversacional en español.";
      } else if (targetLang === 'de') {
        previewText = "Hallo! Ich bin die männliche Stimme von LUMA. Lass uns gemeinsam Deutsch üben.";
      } else {
        previewText = "Hello! I am LUMA's male voice. Ready to accelerate your spoken fluency.";
      }
    }
    this.speak(previewText, onEnd, targetLang);
  }

  stopSpeaking() {
    this.isSpeakingActive = false;
    this.lastSpokeEndTime = Date.now();
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.currentUtterance = null;
    this.callbacks.onAudioLevel(0);
    this.callbacks.onStateChange('idle');
  }

  dispose() {
    this.stopListening();
    this.stopSpeaking();
    this.stopAudioAnalysis();
  }
}
