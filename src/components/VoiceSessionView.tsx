import React, { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { VoiceOrb, VoiceSessionState } from './VoiceOrb.tsx';
import { ConversationTranscript, MessageEntry } from './voice/ConversationTranscript.tsx';
import { VoiceControls } from './voice/VoiceControls.tsx';
import { LessonSelectorDrawer } from './voice/LessonSelectorDrawer.tsx';
import { SpeechController } from '../services/speechController.ts';
import { apiClient, UserProfile, CurriculumModule, CurriculumLesson } from '../services/apiClient.ts';
import { Button } from './ui/Button.tsx';

interface VoiceSessionViewProps {
  profile: UserProfile | null;
  initialLessonId?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenOnboarding?: () => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const VoiceSessionView: React.FC<VoiceSessionViewProps> = ({
  profile,
  initialLessonId
}) => {
  const [orbState, setOrbState] = useState<VoiceSessionState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSlowerSpeech, setIsSlowerSpeech] = useState<boolean>(false);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [showLessonDrawer, setShowLessonDrawer] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const speechControllerRef = useRef<SpeechController | null>(null);
  const targetLang = profile?.targetLanguage || 'en';
  const bridgeLang = profile?.bridgeLanguage || 'ta';

  // Load modules
  useEffect(() => {
    apiClient.getCurriculum(targetLang)
      .then((mods) => {
        setModules(mods);
        if (mods.length > 0 && !selectedLesson) {
          if (initialLessonId) {
            for (const m of mods) {
              const match = m.lessons?.find((l) => l.id === initialLessonId);
              if (match) {
                setSelectedLesson(match);
                return;
              }
            }
          }
          if (mods[0].lessons?.length > 0) {
            setSelectedLesson(mods[0].lessons[0]);
          }
        }
      })
      .catch(() => {});
  }, [targetLang, initialLessonId]);

  // Initialize SpeechController
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
        setErrorMessage("Can't reach the microphone. Try again.");
      }
    }, targetLang);

    speechControllerRef.current = controller;

    return () => {
      controller.stopListening();
      controller.stopSpeaking();
    };
  }, [targetLang]);

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
      const started = await speechControllerRef.current.startListening(targetLang);
      if (started) {
        setIsListening(true);
        setOrbState('listening');
      }
    }
  };

  const submitUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const userEntry: MessageEntry = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userEntry]);
    setTextInput('');
    setCurrentTranscript('');
    setOrbState('thinking');
    setErrorMessage(null);

    try {
      const response = await apiClient.chatWithTutor({
        message: text.trim(),
        targetLanguage: targetLang,
        bridgeLanguage: bridgeLang,
        scenario: selectedLesson?.scenario || selectedLesson?.title || 'Everyday conversational practice',
        mode: 'conversation'
      });

      if (!response || !response.reply) {
        throw new Error('Tutor unavailable, try again');
      }

      const lumaEntry: MessageEntry = {
        id: `lum_${Date.now()}`,
        sender: 'luma',
        text: response.reply,
        translation: response.translation,
        correction: response.correction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, lumaEntry]);
      setOrbState('speaking');

      if (speechControllerRef.current) {
        speechControllerRef.current.speak(response.reply, () => {
          setOrbState('idle');
        }, targetLang);
      } else {
        setOrbState('idle');
      }
    } catch (e: any) {
      console.error('Chat tutor error:', e);
      setOrbState('offline_error');
      setErrorMessage("Can't reach the tutor. Try again.");
    }
  };

  const handleRepeatLastReply = () => {
    const lastLumaMsg = [...messages].reverse().find((m) => m.sender === 'luma');
    if (lastLumaMsg && speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(lastLumaMsg.text, () => {
        setOrbState('idle');
      }, targetLang);
    }
  };

  const handleToggleSlower = () => {
    setIsSlowerSpeech((prev) => !prev);
    // When slower speech is toggled, volume/rate adjusts
  };

  const handleSpeakText = (text: string) => {
    if (speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(text, () => {
        setOrbState('idle');
      }, targetLang);
    }
  };

  // Plain status text for real events only
  const statusWords: Record<VoiceSessionState, string> = {
    idle: 'Tap to talk',
    listening: 'Listening',
    transcribing: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    interrupted: 'Interrupted',
    offline_error: 'Tutor unavailable'
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] max-w-[960px] mx-auto w-full px-4 sm:px-6">
      {/* Scenario Bar */}
      <div className="py-2.5 px-4 my-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-[14px] shrink-0 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="font-semibold text-[var(--text)] truncate">
            {selectedLesson ? selectedLesson.title : 'Everyday Conversation'}
          </span>
        </div>
        <button
          onClick={() => setShowLessonDrawer(true)}
          className="text-[var(--accent)] hover:opacity-80 font-semibold cursor-pointer shrink-0 ml-2"
        >
          Change scenario
        </button>
      </div>

      {/* Main Layout: Desktop 2-column, Mobile vertical with shrinking orb */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-4 pb-2">
        {/* Left Column (Desktop 5/12, Mobile top) */}
        <div className={`flex flex-col items-center justify-center shrink-0 lg:w-5/12 transition-all duration-300 ${
          hasMessages ? 'h-[140px] sm:h-[180px] lg:h-full' : 'h-[240px] sm:h-[300px] lg:h-full'
        }`}>
          {/* Status Line */}
          <div 
            aria-live="polite" 
            className="text-[14px] font-semibold text-[var(--muted)] mb-2"
          >
            {errorMessage ? (
              <span className="text-[var(--danger)]">{errorMessage}</span>
            ) : (
              <span>{statusWords[orbState]}</span>
            )}
          </div>

          {/* Reserved Orb Box (isolated, no clipping overflow, strict padding) */}
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
            <VoiceOrb
              state={orbState}
              audioLevel={audioLevel}
              onClick={handleToggleMic}
            />
          </div>
        </div>

        {/* Right Column: Conversation history in scrolling region */}
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface-2)] border border-[var(--border)] rounded-[20px] overflow-hidden lg:w-7/12 shadow-[var(--shadow-sm)]">
          <ConversationTranscript
            messages={messages}
            currentTranscript={currentTranscript}
            onSpeakText={handleSpeakText}
          />

          {/* Docked bottom voice controls */}
          <VoiceControls
            orbState={orbState}
            isListening={isListening}
            isSlowerSpeech={isSlowerSpeech}
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
