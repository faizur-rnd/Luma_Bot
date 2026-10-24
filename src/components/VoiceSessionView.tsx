import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { VoiceOrb, VoiceSessionState } from './VoiceOrb.tsx';
import { VoiceControls } from './voice/VoiceControls.tsx';
import { ConversationTranscript, MessageEntry } from './voice/ConversationTranscript.tsx';
import { LessonSelectorDrawer } from './voice/LessonSelectorDrawer.tsx';
import { SpeechController } from '../services/speechController.ts';
import { apiClient, UserProfile, CurriculumModule, CurriculumLesson } from '../services/apiClient.ts';

interface VoiceSessionViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  initialLessonId?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenOnboarding?: () => void;
  onToggleTheme?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

export const VoiceSessionView: React.FC<VoiceSessionViewProps> = ({
  profile,
  theme,
  initialLessonId,
  onNavigateTab,
  onOpenOnboarding,
  onToggleTheme,
  onUpdateProfile
}) => {
  const [orbState, setOrbState] = useState<VoiceSessionState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Curriculum & Lesson State
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CurriculumModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [showLessonDrawer, setShowLessonDrawer] = useState(false);

  const speechControllerRef = useRef<SpeechController | null>(null);
  const targetLang = profile?.target_language || profile?.targetLanguage || 'en';
  const bridgeLang = profile?.bridge_language || profile?.bridgeLanguage || 'en';

  // Load curriculum modules for current target language
  useEffect(() => {
    let active = true;
    const fetchCurriculum = async () => {
      try {
        const data = await apiClient.getCurriculum(targetLang);
        if (!active) return;
        setModules(data || []);
        if (data && data.length > 0) {
          let chosenMod = data[0];
          let chosenLes = chosenMod.lessons?.[0] || null;

          if (initialLessonId) {
            for (const mod of data) {
              const found = mod.lessons?.find((l) => l.id === initialLessonId);
              if (found) {
                chosenMod = mod;
                chosenLes = found;
                break;
              }
            }
          }
          setSelectedModule(chosenMod);
          setSelectedLesson(chosenLes);
        }
      } catch (e) {
        console.warn('Could not load curriculum modules:', e);
      }
    };
    fetchCurriculum();
    return () => {
      active = false;
    };
  }, [targetLang, initialLessonId]);

  // Initial welcome greeting from tutor
  useEffect(() => {
    if (messages.length === 0) {
      const greeting =
        targetLang === 'ar'
          ? 'مرحباً! أنا لوما، معلمتك الذكية. كيف يمكنني مساعدتك اليوم؟'
          : targetLang === 'es'
          ? '¡Hola! Soy LUMA, tu tutora de idiomas. ¿De qué te gustaría hablar hoy?'
          : targetLang === 'de'
          ? 'Hallo! Ich bin LUMA, deine Sprachlehrerin. Worüber möchtest du heute sprechen?'
          : "Hello! I'm LUMA, your voice tutor. What would you like to practice today?";

      setMessages([
        {
          id: 'welcome_1',
          sender: 'luma',
          text: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [targetLang]);

  // Initialize Speech Controller
  useEffect(() => {
    const controller = new SpeechController({
      onStateChange: (newState) => {
        setOrbState(newState);
        setIsListening(newState === 'listening');
      },
      onTranscript: (txt) => {
        setCurrentTranscript(txt);
      },
      onAudioLevel: (lvl) => {
        setAudioLevel(lvl);
      },
      onError: (err) => {
        setErrorMessage(err);
        setOrbState('offline_error');
        setIsListening(false);
      }
    });

    speechControllerRef.current = controller;

    return () => {
      controller.stopListening();
    };
  }, []);

  const handleToggleMic = () => {
    setErrorMessage(null);
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
      const started = speechControllerRef.current.startListening(targetLang);
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

      // Speak reply if not muted
      if (!isMuted && speechControllerRef.current) {
        speechControllerRef.current.speak(response.reply, targetLang, () => {
          setOrbState('idle');
        });
      } else {
        setOrbState('idle');
      }
    } catch (e: any) {
      console.error('Chat tutor error:', e);
      setOrbState('offline_error');
      setErrorMessage(e?.message || 'Tutor unavailable, try again');
    }
  };

  const handleSendTextMessage = () => {
    if (textInput.trim()) {
      submitUserMessage(textInput);
    }
  };

  const handleSpeakText = (text: string) => {
    if (speechControllerRef.current) {
      setOrbState('speaking');
      speechControllerRef.current.speak(text, targetLang, () => {
        setOrbState('idle');
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] max-w-7xl mx-auto w-full px-3 sm:px-6">
      {/* Top Scenario Bar */}
      <div
        className="py-2.5 px-4 my-2 rounded-2xl border flex items-center justify-between text-xs transition-colors shrink-0"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {selectedLesson ? `Scenario: ${selectedLesson.title}` : 'Everyday Conversation'}
          </span>
          {selectedLesson?.level && (
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">
              {selectedLesson.level}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowLessonDrawer(true)}
          className="text-violet-500 hover:text-violet-400 font-semibold cursor-pointer shrink-0 ml-2"
        >
          Change scenario
        </button>
      </div>

      {/* Error / Offline Alert */}
      {errorMessage && (
        <div className="mb-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 12-Column Responsive Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden pb-2">
        {/* Left Column: Reserved Voice Orb Region (5 columns on desktop) */}
        <div
          className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border p-4 transition-colors relative"
          style={{
            backgroundColor: theme === 'dark' ? '#0D1220' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          <VoiceOrb
            state={orbState}
            audioLevel={audioLevel}
            onClick={handleToggleMic}
            className="w-full max-w-[340px]"
          />

          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
            {orbState === 'listening'
              ? 'Listening to you speak...'
              : orbState === 'thinking'
              ? 'LUMA is formulating a response...'
              : orbState === 'speaking'
              ? 'LUMA is speaking'
              : orbState === 'offline_error'
              ? 'Tutor unavailable, tap to retry'
              : 'Tap orb or mic button to talk'}
          </p>
        </div>

        {/* Right Column: Independent Scrollable Conversation & Bottom Controls (7 columns on desktop) */}
        <div
          className="lg:col-span-7 flex flex-col rounded-2xl border overflow-hidden transition-colors"
          style={{
            backgroundColor: theme === 'dark' ? '#0D1220' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          {/* Scrollable Conversation Transcript */}
          <ConversationTranscript
            messages={messages}
            currentTranscript={currentTranscript}
            theme={theme}
            onSpeakText={handleSpeakText}
          />

          {/* Bottom Docked Voice Controls */}
          <VoiceControls
            orbState={orbState}
            isListening={isListening}
            isMuted={isMuted}
            textInput={textInput}
            theme={theme}
            onToggleMic={handleToggleMic}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onTextInputChange={setTextInput}
            onSendTextMessage={handleSendTextMessage}
          />
        </div>
      </div>

      {/* Lesson Selector Drawer */}
      <LessonSelectorDrawer
        isOpen={showLessonDrawer}
        modules={modules}
        selectedLesson={selectedLesson}
        theme={theme}
        onSelectLesson={(mod, les) => {
          setSelectedModule(mod);
          setSelectedLesson(les);
          setShowLessonDrawer(false);
        }}
        onClose={() => setShowLessonDrawer(false)}
      />
    </div>
  );
};
