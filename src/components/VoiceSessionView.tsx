import React, { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { VoiceOrb, VoiceSessionState } from './VoiceOrb.tsx';
import { ConversationTranscript, MessageEntry } from './voice/ConversationTranscript.tsx';
import { VoiceControls } from './voice/VoiceControls.tsx';
import { LessonSelectorDrawer } from './voice/LessonSelectorDrawer.tsx';
import { VoiceGenderToggle, VoiceGender } from './voice/VoiceGenderToggle.tsx';
import { DailySessionStageBar } from './voice/DailySessionStageBar.tsx';
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

export const VoiceSessionView: React.FC<VoiceSessionViewProps> = ({
  profile,
  initialLessonId,
  onNavigateTab
}) => {
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
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(
    () => (localStorage.getItem('luma_ice_voice_gender') as VoiceGender) || 'female'
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const speechControllerRef = useRef<SpeechController | null>(null);
  const targetLang = profile?.targetLanguage || profile?.target_language || 'en';
  const bridgeLang = profile?.bridgeLanguage || profile?.bridge_language || 'ta';

  useEffect(() => {
    apiClient
      .getCurriculum(targetLang)
      .then((mods) => {
        setModules(mods);
        if (mods.length > 0 && !selectedLesson) {
          const found = initialLessonId
            ? mods.flatMap((m) => m.lessons || []).find((l) => l.id === initialLessonId)
            : null;
          setSelectedLesson(found || mods[0].lessons?.[0] || null);
        }
      })
      .catch(() => {});
  }, [targetLang, initialLessonId]);

  useEffect(() => {
    const controller = new SpeechController(
      {
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
          setErrorMessage(msg);
          setOrbState('idle');
        }
      },
      targetLang
    );

    controller.setVoiceGender(voiceGender);
    controller.setSlowerSpeech(isSlowerSpeech);
    speechControllerRef.current = controller;

    return () => {
      controller.dispose();
    };
  }, [targetLang]);

  const handleGenderChange = (newGender: VoiceGender) => {
    setVoiceGender(newGender);
    if (speechControllerRef.current) {
      speechControllerRef.current.setVoiceGender(newGender);
      speechControllerRef.current.speak(
        newGender === 'female' ? 'Switched to female speaking coach.' : 'Switched to male speaking coach.',
        () => setOrbState('idle'),
        targetLang
      );
    }
  };

  const handleStopSpeaking = () => {
    speechControllerRef.current?.stopSpeaking();
    setOrbState('idle');
  };

  const handleToggleMic = async () => {
    if (!speechControllerRef.current) return;
    if (orbState === 'speaking') speechControllerRef.current.stopSpeaking();
    if (isListening) {
      await speechControllerRef.current.stopListening();
      setIsListening(false);
      setOrbState('idle');
      if (currentTranscript.trim()) {
        const textToSubmit = currentTranscript.trim();
        setCurrentTranscript('');
        submitUserMessage(textToSubmit);
      }
    } else {
      setErrorMessage(null);
      const ok = await speechControllerRef.current.startListening();
      if (!ok) setIsListening(false);
    }
  };

  const submitUserMessage = async (text: string) => {
    if (!text.trim()) return;
    setErrorMessage(null);
    const cleanText = text.trim();
    const userMsg: MessageEntry = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const historyPayload = messages.slice(-8).map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      content: m.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');
    setOrbState('thinking');

    try {
      const response = await apiClient.sendChatMessage({
        message: cleanText,
        history: historyPayload,
        targetLanguage: targetLang,
        bridgeLanguage: bridgeLang,
        proficiencyLevel: profile?.proficiencyLevel || profile?.proficiency_level || 'B1',
        lessonContext: selectedLesson
          ? { title: selectedLesson.title, objective: selectedLesson.objective, samplePhrases: selectedLesson.samplePhrases }
          : undefined
      });

      const lumaEntry: MessageEntry = {
        id: `lum_${Date.now()}`,
        sender: 'luma',
        text: response.reply,
        translation: response.translation,
        correction: response.correction,
        phonemeCue: response.pronunciationTip,
        followUps: Array.isArray(response.recommendedFollowUps) ? response.recommendedFollowUps : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => {
        const next = [...prev, lumaEntry];
        if (next.filter((m) => m.sender === 'user').length % 3 === 0) setShowCelebration(true);
        return next;
      });
      setOrbState('speaking');
      speechControllerRef.current?.speak(response.reply, () => setOrbState('idle'), targetLang);
    } catch {
      const fallbackReply = `I heard your phrase: "${cleanText}". Keep your airflow steady on the stressed syllable—try repeating it once more or ask for a minimal pair drill.`;
      const fallbackEntry: MessageEntry = {
        id: `lum_${Date.now()}`,
        sender: 'luma',
        text: fallbackReply,
        followUps: ['Give me a minimal pair for this sound', 'Let’s practice workplace phrasing'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackEntry]);
      setOrbState('speaking');
      speechControllerRef.current?.speak(fallbackReply, () => setOrbState('idle'), targetLang);
    }
  };

  const handleRepeatLastReply = () => {
    const last = [...messages].reverse().find((m) => m.sender === 'luma');
    const phrase = last?.text || selectedLesson?.samplePhrases?.[0] || 'Welcome to LUMA speaking practice.';
    if (speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(phrase, () => setOrbState('idle'), targetLang);
    }
  };

  const handleToggleSlower = () => {
    setIsSlowerSpeech((prev) => {
      const next = !prev;
      speechControllerRef.current?.setSlowerSpeech(next);
      return next;
    });
  };

  const handleSpeakText = (text: string) => {
    if (speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(text, () => setOrbState('idle'), targetLang);
    }
  };

  const statusWords: Record<VoiceSessionState, string> = {
    idle: 'Ready — Tap Orb or Start Speaking',
    listening: 'Listening to your speech...',
    transcribing: 'Transcribing speech...',
    thinking: 'Formulating coaching feedback...',
    speaking: 'Coach speaking...',
    interrupted: 'Interrupted',
    offline_error: 'Microphone notice'
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] max-w-[1060px] mx-auto w-full px-3 sm:px-6">
      <StellarBurst active={showCelebration} onComplete={() => setShowCelebration(false)} title="Fluency Momentum!" subtitle="3 dialogue turns articulated cleanly" />

      <div className="py-2 px-4 mt-2 mb-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs sm:text-sm shrink-0 shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="font-bold text-[var(--text)] truncate">{selectedLesson ? selectedLesson.title : 'Articulation & Rhythm Workshop'}</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          <VoiceGenderToggle gender={voiceGender} onToggle={handleGenderChange} compact={false} />
          <button type="button" onClick={() => setShowLessonDrawer(true)} className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--accent)] font-bold text-xs cursor-pointer transition-colors">
            Change Topic
          </button>
        </div>
      </div>

      <DailySessionStageBar
        targetLang={targetLang}
        onSpeakModelText={handleSpeakText}
        onSendStagePrompt={(prompt) => submitUserMessage(prompt)}
        onNavigateProgress={onNavigateTab ? () => onNavigateTab('progress') : undefined}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3 pb-2">
        <div className={`flex flex-col items-center justify-center shrink-0 lg:w-5/12 transition-all duration-300 ${hasMessages ? 'h-[120px] sm:h-[155px] lg:h-full' : 'h-[190px] sm:h-[240px] lg:h-full'}`}>
          <div aria-live="polite" className="text-xs font-semibold text-[var(--muted)] mb-1 text-center px-2">
            {errorMessage ? <span className="text-[var(--warning)]">{errorMessage}</span> : <span>{statusWords[orbState]}</span>}
          </div>
          <div className="relative flex items-center justify-center p-2 rounded-full max-w-[200px] max-h-[200px] w-full h-full">
            <VoiceOrb state={orbState} audioLevel={audioLevel} onClick={handleToggleMic} className="w-full h-full" />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-md">
          <ConversationTranscript messages={messages} currentTranscript={currentTranscript} targetLang={targetLang} voiceGender={voiceGender} onVoiceGenderChange={handleGenderChange} isAudioActive={orbState === 'speaking' || isListening} audioLevel={audioLevel} onSpeakText={handleSpeakText} onSelectPrompt={(prompt) => submitUserMessage(prompt)} />
          <VoiceControls orbState={orbState} isListening={isListening} isSlowerSpeech={isSlowerSpeech} audioLevel={audioLevel} textInput={textInput} onToggleMic={handleToggleMic} onStopSpeaking={handleStopSpeaking} onRepeatLastReply={handleRepeatLastReply} onToggleSlowerSpeech={handleToggleSlower} onTextInputChange={setTextInput} onSendTextMessage={() => submitUserMessage(textInput)} />
        </div>
      </div>

      {showLessonDrawer && (
        <LessonSelectorDrawer isOpen={showLessonDrawer} modules={modules} selectedLesson={selectedLesson} onSelectLesson={(_mod, lesson) => { setSelectedLesson(lesson); setShowLessonDrawer(false); }} onClose={() => setShowLessonDrawer(false)} />
      )}
    </div>
  );
};
