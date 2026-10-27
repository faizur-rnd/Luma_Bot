import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { VoiceOrb, VoiceSessionState } from './VoiceOrb.tsx';
import { ConversationTranscript, MessageEntry } from './voice/ConversationTranscript.tsx';
import { VoiceControls } from './voice/VoiceControls.tsx';
import { LessonSelectorDrawer } from './voice/LessonSelectorDrawer.tsx';
import { VoiceGenderToggle, VoiceGender } from './voice/VoiceGenderToggle.tsx';
import { StellarBurst } from './animations/StellarBurst.tsx';
import { SpeechController } from '../services/speechController.ts';
import { apiClient, UserProfile, CurriculumModule, CurriculumLesson } from '../services/apiClient.ts';

interface VoiceSessionViewProps {
  profile: UserProfile | null;
  initialLessonId?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenOnboarding?: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const VoiceSessionView: React.FC<VoiceSessionViewProps> = ({ profile, initialLessonId }) => {
  const [orbState, setOrbState] = useState<VoiceSessionState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSlowerSpeech, setIsSlowerSpeech] = useState(false);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [showLessonDrawer, setShowLessonDrawer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => (localStorage.getItem('luma_ice_voice_gender') as VoiceGender) || 'female');
  const [showCelebration, setShowCelebration] = useState(false);

  const speechControllerRef = useRef<SpeechController | null>(null);
  const targetLang = profile?.targetLanguage || 'en';
  const bridgeLang = profile?.bridgeLanguage || 'ta';

  useEffect(() => {
    apiClient.getCurriculum(targetLang).then((mods) => {
      setModules(mods);
      if (mods.length > 0 && !selectedLesson) {
        const found = initialLessonId ? mods.flatMap(m => m.lessons || []).find(l => l.id === initialLessonId) : null;
        setSelectedLesson(found || mods[0].lessons?.[0] || null);
      }
    }).catch(() => {});
  }, [targetLang, initialLessonId]);

  useEffect(() => {
    const controller = new SpeechController({
      onStateChange: (newState) => {
        setOrbState(newState);
        if (newState === 'listening') setIsListening(true);
        if (newState === 'idle' || newState === 'offline_error') setIsListening(false);
      },
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setCurrentTranscript('');
          submitUserMessage(text);
        } else {
          setCurrentTranscript(text);
        }
      },
      onAudioLevel: (lvl) => setAudioLevel(lvl),
      onError: (msg) => {
        console.warn('Speech controller error:', msg);
        setOrbState('offline_error');
        setErrorMessage("Microphone offline. Tap to retry.");
      }
    }, targetLang);

    controller.setVoiceGender(voiceGender);
    speechControllerRef.current = controller;

    return () => {
      controller.stopListening();
      controller.stopSpeaking();
    };
  }, [targetLang]);

  const handleGenderChange = (newGender: VoiceGender) => {
    setVoiceGender(newGender);
    if (speechControllerRef.current) {
      speechControllerRef.current.setVoiceGender(newGender);
      speechControllerRef.current.speak(
        newGender === 'female' ? "Switched to female speaking coach." : "Switched to male speaking coach.",
        () => setOrbState('idle'),
        targetLang
      );
    }
  };

  const handleToggleMic = async () => {
    if (!speechControllerRef.current) return;
    if (isListening) {
      speechControllerRef.current.stopListening();
      setIsListening(false);
      setOrbState('idle');
      if (currentTranscript.trim()) {
        submitUserMessage(currentTranscript.trim());
        setCurrentTranscript('');
      }
    } else {
      setErrorMessage(null);
      const ok = await speechControllerRef.current.startListening();
      if (!ok) {
        setOrbState('offline_error');
        setErrorMessage("Microphone blocked or not accessible.");
      }
    }
  };

  const submitUserMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: MessageEntry = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');
    setOrbState('thinking');

    try {
      const response = await apiClient.sendChatMessage({
        message: text.trim(),
        targetLanguage: targetLang,
        bridgeLanguage: bridgeLang,
        lessonContext: selectedLesson ? {
          title: selectedLesson.title,
          objective: selectedLesson.objective,
          samplePhrases: selectedLesson.samplePhrases
        } : undefined
      });

      const lumaEntry: MessageEntry = {
        id: `lum_${Date.now()}`,
        sender: 'luma',
        text: response.reply,
        translation: response.translation,
        correction: response.correction,
        phonemeCue: response.pronunciationTip,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => {
        const next = [...prev, lumaEntry];
        if (next.filter(m => m.sender === 'user').length % 3 === 0) {
          setShowCelebration(true);
        }
        return next;
      });
      setOrbState('speaking');

      if (speechControllerRef.current) {
        speechControllerRef.current.speak(response.reply, () => setOrbState('idle'), targetLang);
      } else {
        setOrbState('idle');
      }
    } catch (e: any) {
      const fallbackReply = targetLang === 'ar'
        ? `أَهْلًا بِكَ! سَمِعْتُكَ تَقُولُ: «${text.trim()}». دَعْنَا نُوَاصِلُ التَّدْرِيبَ عَلَى النُّطْقِ الصَّحِيحِ.`
        : `I heard you clearly: "${text.trim()}". Excellent cadence! Let's continue practicing.`;

      const fallbackEntry: MessageEntry = {
        id: `lum_${Date.now()}`, sender: 'luma', text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackEntry]);
      setOrbState('speaking');
      speechControllerRef.current?.speak(fallbackReply, () => setOrbState('idle'), targetLang);
    }
  };

  const handleRepeatLastReply = () => {
    const last = [...messages].reverse().find((m) => m.sender === 'luma');
    if (last && speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(last.text, () => setOrbState('idle'), targetLang);
    }
  };

  const handleToggleSlower = () => {
    setIsSlowerSpeech((prev) => !prev);
  };

  const handleSpeakText = (text: string) => {
    if (speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(text, () => setOrbState('idle'), targetLang);
    }
  };

  const statusWords: Record<VoiceSessionState, string> = {
    idle: 'Tap to speak', listening: 'Listening...', transcribing: 'Processing...',
    thinking: 'Formulating guidance...', speaking: 'Speaking...',
    interrupted: 'Interrupted', offline_error: 'Microphone unavailable'
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] max-w-[1020px] mx-auto w-full px-3 sm:px-6">
      {/* Celebration Stellar Bloom overlay */}
      <StellarBurst
        active={showCelebration}
        onComplete={() => setShowCelebration(false)}
        title="Fluency Momentum!"
        subtitle="3 dialogue turns articulated cleanly"
      />

      {/* Top Scenario & Voice Switch Bar */}
      <div className="py-2.5 px-4 my-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs sm:text-sm shrink-0 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-bold text-[var(--text)] truncate">
            {selectedLesson ? selectedLesson.title : 'Articulation & Rhythm Workshop'}
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          <VoiceGenderToggle gender={voiceGender} onToggle={handleGenderChange} compact={false} />
          <button
            onClick={() => setShowLessonDrawer(true)}
            className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
          >
            Change Drill
          </button>
        </div>
      </div>

      {/* Main Responsive Grid: Orb on Left, Interactive Chat on Right */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3.5 pb-2">
        {/* Left Column: Liquid Orb Presence */}
        <div className={`flex flex-col items-center justify-center shrink-0 lg:w-5/12 transition-all duration-300 ${
          hasMessages ? 'h-[130px] sm:h-[170px] lg:h-full' : 'h-[230px] sm:h-[290px] lg:h-full'
        }`}>
          <div aria-live="polite" className="text-xs font-semibold text-[var(--muted)] mb-1.5 flex items-center gap-1.5">
            {errorMessage ? (
              <span className="text-[var(--danger)]">{errorMessage}</span>
            ) : (
              <span>{statusWords[orbState]}</span>
            )}
          </div>

          <div 
            className="relative flex items-center justify-center p-2 rounded-full"
            style={{
              isolation: 'isolate',
              overflow: 'clip',
              height: hasMessages ? 'clamp(96px, 18dvh, 200px)' : 'clamp(180px, 32dvh, 320px)',
              maxHeight: '320px',
              aspectRatio: '1 / 1'
            }}
          >
            <VoiceOrb state={orbState} audioLevel={audioLevel} onClick={handleToggleMic} />
          </div>
        </div>

        {/* Right Column: Interactive Speaking Coach Console */}
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl overflow-hidden lg:w-7/12 shadow-xl">
          <ConversationTranscript
            messages={messages}
            currentTranscript={currentTranscript}
            targetLang={targetLang}
            voiceGender={voiceGender}
            onVoiceGenderChange={handleGenderChange}
            isAudioActive={isListening || orbState === 'speaking'}
            audioLevel={audioLevel}
            onSpeakText={handleSpeakText}
            onSelectPrompt={(prompt) => submitUserMessage(prompt)}
          />

          <VoiceControls
            orbState={orbState}
            isListening={isListening}
            isSlowerSpeech={isSlowerSpeech}
            audioLevel={audioLevel}
            textInput={textInput}
            onToggleMic={handleToggleMic}
            onRepeatLastReply={handleRepeatLastReply}
            onToggleSlowerSpeech={handleToggleSlower}
            onTextInputChange={setTextInput}
            onSendTextMessage={() => submitUserMessage(textInput)}
          />
        </div>
      </div>

      <LessonSelectorDrawer
        isOpen={showLessonDrawer}
        modules={modules}
        selectedLesson={selectedLesson}
        onSelectLesson={(_, lesson) => setSelectedLesson(lesson)}
        onClose={() => setShowLessonDrawer(false)}
      />
    </div>
  );
};
