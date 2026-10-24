import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Sparkles, 
  Send, 
  RefreshCw, 
  Lightbulb, 
  CheckCircle2, 
  Compass, 
  SlidersHorizontal,
  BookOpen,
  Target,
  Award,
  ShieldAlert,
  Play,
  Check,
  ChevronDown,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import { SupernovaOrb, VoiceSessionState } from './SupernovaOrb.tsx';
import { SpeechController } from '../services/speechController.ts';
import { apiClient, UserProfile, CurriculumModule, CurriculumLesson } from '../services/apiClient.ts';

export type CurriculumPracticeMode = 
  | 'roleplay' 
  | 'vocab_drill' 
  | 'grammar_practice' 
  | 'teach_back' 
  | 'ask_question';

interface VoiceSessionViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  initialLessonId?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenOnboarding?: () => void;
  onToggleTheme?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

interface MessageEntry {
  id: string;
  sender: 'user' | 'luma';
  text: string;
  translation?: string;
  correction?: string;
  pronunciationTip?: string;
  isCurriculumRedirect?: boolean;
  teachbackScore?: {
    pronunciation: number;
    fluency: number;
    grammar: number;
    lexical: number;
    overall: number;
    feedback: string;
  };
  suggestedAction?: {
    label: string;
    actionType: string;
  };
  timestamp: string;
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
  const targetLang = profile?.target_language || 'en';

  // Curriculum State
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CurriculumModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);
  const [practiceMode, setPracticeMode] = useState<CurriculumPracticeMode>('roleplay');
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  // Target Exam info according to target language
  const targetExamName = targetLang === 'ar' 
    ? 'ALPT & CIMA Arabic Exam' 
    : targetLang === 'es'
    ? 'DELE & SIELE Spanish Exam'
    : targetLang === 'de' 
    ? 'Goethe-Zertifikat / TestDaF' 
    : 'IELTS & TOEFL Fluency';

  // Load Curriculum for current target language
  useEffect(() => {
    let isMounted = true;
    const fetchCurriculum = async () => {
      try {
        const data = await apiClient.getCurriculum(targetLang);
        if (!isMounted) return;
        setModules(data);

        // Pick initial lesson or default to first lesson
        if (data && data.length > 0) {
          let chosenMod = data[0];
          let chosenLes = chosenMod.lessons?.[0] || null;

          if (initialLessonId) {
            for (const mod of data) {
              const found = mod.lessons?.find(l => l.id === initialLessonId);
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
      } catch (err) {
        console.warn('Could not load curriculum modules:', err);
      }
    };

    fetchCurriculum();
    return () => { isMounted = false; };
  }, [targetLang, initialLessonId]);

  // Accessibility & QA
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showStateTester, setShowStateTester] = useState(false);

  // Voice Gender & Volume
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luma_ice_voice_gender');
      if (saved === 'female' || saved === 'male') return saved;
    }
    return 'male';
  });

  const handleVoiceChange = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    if (typeof window !== 'undefined') {
      localStorage.setItem('luma_ice_voice_gender', gender);
    }
    speechControllerRef.current?.setVoiceGender(gender);
  };

  const handlePreviewVoice = () => {
    speechControllerRef.current?.previewVoice(voiceGender);
  };

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luma_ice_voice_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    }
    return 1.0;
  });

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1.0, newVol));
    setVolume(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('luma_ice_voice_volume', clamped.toString());
    }
    speechControllerRef.current?.setVolume(clamped);
    if (clamped > 0) {
      speechControllerRef.current?.playOrbChime('tap');
    }
  };

  // Build welcome seed based on active lesson and practice mode
  const getInitialMessageForLesson = (lesson: CurriculumLesson | null, mode: CurriculumPracticeMode): MessageEntry => {
    const lessonTitle = lesson?.title || (targetLang === 'ar' ? 'التعارف والتحية' : 'Introductions & Greetings');
    const objective = lesson?.objective || (targetLang === 'ar' ? 'التحدث بطلاقة ولباقة' : 'Master everyday phrases');

    if (targetLang === 'ar') {
      if (mode === 'vocab_drill') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `مرحباً بك! نبدأ الآن تدريب المفردات والنطق الصوتي لدرس: "${lessonTitle}". سأعرض عليك مفردات وتراكيب هذا الدرس لنطقها وتوظيفها في جمل واضحة. هل أنت مستعد للبدء؟`,
          translation: "அரபு சொற்களஞ்சியப் பயிற்சிக்கு தயாரா? முதல் சொல்லை பயிற்சி செய்வோம்.",
          pronunciationTip: "ركز على إخراج الحركات الإعرابية ومخارج الحروف بدقة.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (mode === 'grammar_practice') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `أهلاً بك في جلسة التراكيب النحوية لدرس: "${lessonTitle}". هدفنا: ${objective}. سأطلب منك تركيب جمل فصيحة وسأصحح لك القواعد وأسلوب الصياغة فوراً.`,
          translation: "இலக்கணப் பயிற்சி: சரியான இலக்கண அமைப்போடு வாக்கியங்களை அமைப்போம்.",
          pronunciationTip: "انتبه لترتيب الكلمات في الجملة الفعلية (فعل + فاعل + مفعول).",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (mode === 'teach_back') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `مرحباً بك في اختبار الشرح الشفهي (Teach-Back) لدرس: "${lessonTitle}". المطلوب منك الآن هو التحدث باللغة العربية الفصحى لمدة دقيقة لشرح هذا الموقف بأسلوبك. اضغط على الميكروفون وتحدث بثقة!`,
          translation: "வாய்மொழி தேர்வு: பாடத்தின் தலைப்பை உங்களது சொந்த அரபு வார்த்தைகளில் விவரியுங்கள்.",
          pronunciationTip: "تحدث بثقة وإيقاع مسترسل دون توقف طويل.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (mode === 'ask_question') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `أنا هنا للإجابة عن أي استفسار يخص درس: "${lessonTitle}" أو متطلبات اختبار الكفاءة (${targetExamName}). اسألني عن معاني الكلمات أو القواعد أو أسرار النطق الفصيح.`,
          translation: "இந்த பாடம் அல்லது தேர்வு பற்றிய எந்த கேள்வியையும் நீங்கள் கேட்கலாம்.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      // default: roleplay
      return {
        id: `msg_seed_${Date.now()}`,
        sender: 'luma',
        text: `أهلاً وسهلاً بك في المحاكاة الشفهية التفاعلية لدرس: "${lessonTitle}". سأتقمص معك هذا الموقف الواقعي (${objective}). تفضل بالبدء وقل عبارتك الأولى!`,
        translation: profile?.bridge_language === 'ta'
          ? "அரபு மொழி பாட உரையாடலைத் தொடங்க உருண்டையைத் தட்டி பேசவும்."
          : "Welcome! Tap the orb or mic to practice this interactive curriculum lesson.",
        pronunciationTip: "ركز على مخارج الحروف الفصيحة ونبرة الصوت الواثقة.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    if (targetLang === 'es') {
      if (mode === 'vocab_drill') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `¡Hola! Iniciamos la práctica de vocabulario y pronunciación para la lección: "${lessonTitle}". Revisaremos términos clave y estructuras útiles para que hables con soltura. ¿Listo para empezar?`,
          translation: profile?.bridge_language === 'ta'
            ? "ஸ்பானிஷ் சொற்களஞ்சியப் பயிற்சிக்கு தயாரா? முதல் சொல்லைப் பயிற்சி செய்வோம்."
            : "Ready for Spanish vocabulary drill? Let's practice the first key phrase.",
          pronunciationTip: "Articula con claridad las vocales abiertas y la vibración de la r.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (mode === 'grammar_practice') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `Te doy la bienvenida a la sesión de gramática de la lección: "${lessonTitle}". Objetivo: ${objective}. Practicaremos estructuras, concordancia y tiempos verbales. ¡Dime tu primera frase!`,
          translation: "இலக்கணப் பயிற்சி: சரியான வாக்கிய அமைப்போடு பேசுவோம்.",
          pronunciationTip: "Cuida la concordancia de género y número en los adjetivos.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (mode === 'teach_back') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `Bienvenido a la evaluación oral Teach-Back para "${lessonTitle}". Explica esta situación en español con tus propias palabras durante un minuto. Evaluaré tu fluidez, pronunciación y gramática. ¡Habla con confianza!`,
          translation: "வாய்மொழி தேர்வு: உங்கள் சொந்த ஸ்பானிஷ் வார்த்தைகளில் இந்த பாடத்தை விளக்குங்கள்.",
          pronunciationTip: "Mantén un ritmo relajado y articula con naturalidad.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (mode === 'ask_question') {
        return {
          id: `msg_seed_${Date.now()}`,
          sender: 'luma',
          text: `Estoy a tu disposición para resolver cualquier duda sobre la lección: "${lessonTitle}" o sobre el examen de certificación (${targetExamName}). Pregúntame sobre vocabulario, reglas o modismos.`,
          translation: "இந்த பாடம் அல்லது தேர்வு பற்றிய எந்த கேள்வியையும் நீங்கள் கேட்கலாம்.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      // default: roleplay
      return {
        id: `msg_seed_${Date.now()}`,
        sender: 'luma',
        text: `¡Bienvenido a la simulación interactiva de la lección: "${lessonTitle}"! Asumiré el papel en esta situación (${objective}). Toca el orbe o micrófono y di tu primera frase.`,
        translation: profile?.bridge_language === 'ta'
          ? "ஸ்பானிஷ் பாட உரையாடலைத் தொடங்க உருண்டையைத் தட்டவும்."
          : "Tap the orb or mic to practice this interactive Spanish lesson.",
        pronunciationTip: "Mantén una entonación natural y habla con seguridad.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    if (targetLang === 'de') {
      return {
        id: `msg_seed_${Date.now()}`,
        sender: 'luma',
        text: `Willkommen zum interaktiven Sprachtraining für die Lektion "${lessonTitle}"! Modus: ${mode}. Lass uns genau dieses Lektionsziel (${objective}) trainieren. Tippe auf den Orb und sprich!`,
        translation: "ஜெர்மன் மொழி பாடப் பயிற்சியைத் தொடங்க உருண்டையைத் தட்டவும்.",
        pronunciationTip: "Achte auf die korrekte Satzmelodie und Wortstellung.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // English
    if (mode === 'teach_back') {
      return {
        id: `msg_seed_${Date.now()}`,
        sender: 'luma',
        text: `Welcome to your Spoken Teach-Back assessment for "${lessonTitle}". Explain this scenario in your own words for 1-2 minutes. I will evaluate your Fluency, Pronunciation, Grammar, and Vocabulary. Ready when you are!`,
        translation: "வாய்மொழி தேர்வு: இந்த பாடத்தின் தலைப்பை உங்கள் சொந்த வார்த்தைகளில் விளக்குங்கள்.",
        pronunciationTip: "Keep a relaxed cadence and articulate clearly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    return {
      id: `msg_seed_${Date.now()}`,
      sender: 'luma',
      text: `Welcome to your interactive curriculum session for "${lessonTitle}". We are focusing on: ${objective}. Tap the orb or speak whenever you're ready!`,
      translation: profile?.bridge_language === 'ta'
        ? "பாட பயிற்சியைத் தொடங்க உருண்டையைத் தட்டவும்."
        : "Tap the orb to start practicing your active curriculum lesson.",
      pronunciationTip: "Keep a steady cadence and stress primary keywords.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const [messages, setMessages] = useState<MessageEntry[]>([getInitialMessageForLesson(selectedLesson, practiceMode)]);

  // Contextual chips for the current lesson and mode
  const getContextualChips = (lesson: CurriculumLesson | null, mode: CurriculumPracticeMode): string[] => {
    if (lesson?.samplePhrases && lesson.samplePhrases.length > 0) {
      if (mode === 'teach_back') {
        if (targetLang === 'ar') {
          return [
            "أود أن أقدم شرحاً شفهياً شاملاً لهذا الموضوع.",
            "النقطة الأولى التي أود توضيحها هي...",
            "وخلاصة هذا الموقف تتلخص في..."
          ];
        }
        if (targetLang === 'es') {
          return [
            "Me gustaría demostrar mi comprensión oral de este tema.",
            "El objetivo principal en esta situación es...",
            "En conclusión, el enfoque más adecuado consiste en..."
          ];
        }
        return [
          "I would like to demonstrate my spoken understanding of this topic.",
          "The main objective in this scenario is...",
          "In conclusion, the most effective approach is..."
        ];
      }
      if (mode === 'vocab_drill') {
        if (targetLang === 'ar') {
          return [
            "كيف أنطق هذه الكلمة بأعلى درجات الفصاحة؟",
            "هل يمكنك إعطائي جملة أخرى تستخدم هذه المفردة؟",
            "اختبرني في الكلمة التالية من الدرس."
          ];
        }
        if (targetLang === 'es') {
          return [
            "¿Cómo se pronuncia esta palabra de forma natural?",
            "¿Podrías darme una oración de ejemplo con este término?",
            "Ponme a prueba con la siguiente frase del tema."
          ];
        }
        return [
          "How is this word pronounced naturally?",
          "Can you test me on another lesson phrase?",
          "Could you give me an example sentence?"
        ];
      }
      return lesson.samplePhrases.slice(0, 3);
    }

    if (targetLang === 'ar') {
      return [
        "السلام عليكم، تشرفت بلقائك كثيراً.",
        "كيف أصيغ هذا الطلب بأعلى درجات اللباقة؟",
        "هل يمكنك تصحيح نطقي وإعطائي ملاحظات؟"
      ];
    }
    if (targetLang === 'es') {
      return [
        "¡Hola! Mucho gusto en conectar contigo hoy.",
        "¿Podrías explicarme la regla de cortesía en esta situación?",
        "Hagamos un ejercicio práctico de conversación."
      ];
    }
    return [
      "Hello, I am pleased to connect with you today.",
      "Could you explain the key grammar rule here?",
      "Can we do a quick spoken drill?"
    ];
  };

  const [recommendedChips, setRecommendedChips] = useState<string[]>(
    getContextualChips(selectedLesson, practiceMode)
  );

  // Sync session when lesson, mode, or target language changes
  useEffect(() => {
    setMessages([getInitialMessageForLesson(selectedLesson, practiceMode)]);
    setRecommendedChips(getContextualChips(selectedLesson, practiceMode));
    setLessonCompleted(false);
    setLastScore(null);
  }, [selectedLesson?.id, practiceMode, targetLang]);

  const speechControllerRef = useRef<SpeechController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize SpeechController
  useEffect(() => {
    const controller = new SpeechController({
      onStateChange: (state) => {
        setOrbState(state);
      },
      onTranscript: (text, isFinal) => {
        setCurrentTranscript(text);
        if (isFinal && text.trim().length > 1) {
          handleUserUtterance(text);
        }
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onError: (errMsg) => {
        console.warn('Speech controller notice:', errMsg);
      }
    }, targetLang);

    controller.setVoiceGender(voiceGender);
    controller.setVolume(volume);
    speechControllerRef.current = controller;

    return () => {
      controller.dispose();
    };
  }, [targetLang, profile?.bridge_language, selectedLesson?.id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const toggleListening = () => {
    speechControllerRef.current?.playOrbChime('tap');
    if (orbState === 'speaking') {
      // Interrupt: Stop LUMA from speaking immediately when the user taps
      speechControllerRef.current?.stopSpeaking();
      return;
    }
    if (orbState === 'listening' || orbState === 'transcribing') {
      speechControllerRef.current?.stopListening();
    } else {
      speechControllerRef.current?.stopSpeaking();
      speechControllerRef.current?.startListening();
    }
  };

  const handleUserUtterance = async (userText: string) => {
    if (!userText.trim()) return;

    // Halt any playing audio and close microphone during network processing
    speechControllerRef.current?.stopSpeaking();
    speechControllerRef.current?.stopListening();

    const userMsg: MessageEntry = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setCurrentTranscript('');
    setTextInput('');
    setOrbState('thinking');

    try {
      const history = messages.slice(-4).map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.text
      }));

      const res = await apiClient.sendChatMessage({
        message: userText,
        history,
        targetLanguage: profile?.target_language || 'en',
        bridgeLanguage: profile?.bridge_language || 'ta',
        proficiencyLevel: profile?.proficiency_level || 'B1',
        scenarioContext: selectedLesson?.scenario || selectedLesson?.title || 'Curriculum Lesson',
        curriculumContext: {
          moduleId: selectedModule?.id,
          moduleTitle: selectedModule?.title,
          lessonId: selectedLesson?.id,
          lessonTitle: selectedLesson?.title,
          objective: selectedLesson?.objective,
          samplePhrases: selectedLesson?.samplePhrases,
          mode: practiceMode,
          targetExam: targetExamName
        }
      });

      const lumaMsg: MessageEntry = {
        id: `luma_${Date.now()}`,
        sender: 'luma',
        text: res.reply,
        translation: res.translation,
        correction: res.correction,
        pronunciationTip: res.pronunciationTip,
        isCurriculumRedirect: res.isCurriculumRedirect,
        teachbackScore: res.teachbackScore,
        suggestedAction: res.suggestedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, lumaMsg]);

      // If teachback completed with a score, update lesson state
      if (res.teachbackScore) {
        setLastScore(res.teachbackScore.overall);
        setLessonCompleted(true);
        if (selectedLesson?.id) {
          apiClient.saveProgress(selectedLesson.id, true, res.teachbackScore.overall, 15);
        }
      }

      if (res.recommendedFollowUps && res.recommendedFollowUps.length > 0) {
        setRecommendedChips(res.recommendedFollowUps);
      }

      // Voice playback of reply with target language voice
      speechControllerRef.current?.speak(res.reply, undefined, profile?.target_language || 'en');
    } catch (err: any) {
      console.warn('AI speech processing error, using resilient curriculum response:', err);
      let fallbackText = `Let's keep practicing "${selectedLesson?.title || 'this lesson'}". Focus on: ${selectedLesson?.objective || 'conversational fluency'}. How would you phrase your next response?`;
      if (targetLang === 'ar') {
        fallbackText = `سمعتك جيداً! دعنا نواصل التدريب على درس "${selectedLesson?.title || 'اللغة العربية'}". هدفنا هو: ${selectedLesson?.objective || 'التحدث بطلاقة'}. كيف تعبر عن فكرتك التالية؟`;
      } else if (targetLang === 'es') {
        fallbackText = `¡Te escuché bien! Sigamos practicando la lección "${selectedLesson?.title || 'de español'}". Nuestro objetivo: ${selectedLesson?.objective || 'la fluidez conversacional'}. ¿Cómo responderías ahora?`;
      } else if (targetLang === 'de') {
        fallbackText = `Ich habe dich gut gehört! Lass uns mit der Lektion "${selectedLesson?.title || 'Deutsch'} fortfahren. Unser Ziel: ${selectedLesson?.objective || 'Sprechflüssigkeit'}. Wie lautet dein nächster Satz?`;
      }

      const lumaMsg: MessageEntry = {
        id: `luma_resilient_${Date.now()}`,
        sender: 'luma',
        text: fallbackText,
        translation: profile?.bridge_language === 'ta'
          ? "பாடம் தொடர்கிறது. உங்கள் அடுத்த பதிலை பேசவும்."
          : "Lesson active. Continue speaking or typing your response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, lumaMsg]);
      setOrbState('idle');
      speechControllerRef.current?.speak(fallbackText, undefined, targetLang);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleUserUtterance(textInput);
  };

  const speakTextAgain = (text: string) => {
    speechControllerRef.current?.speak(text, undefined, targetLang);
  };

  const testStates: VoiceSessionState[] = [
    'idle',
    'listening',
    'transcribing',
    'thinking',
    'speaking',
    'interrupted',
    'reconnecting',
    'offline_error'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* 1. Header: Curriculum Focus & Active Lesson Selector */}
      <div 
        className="p-4 rounded-3xl border flex flex-col gap-3 shadow-sm transition-all"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active Lesson Brand Pill */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-cosmic flex items-center justify-center text-white shadow-md shadow-[#8B5CF6]/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                  {selectedModule?.level || 'A1'} • {targetLang.toUpperCase()}
                </span>
                <span className="text-[11px] font-semibold text-[#06B6D4] flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>{targetExamName}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Anti-Diversion Active</span>
                </span>
              </div>
              <h1 className="text-base font-extrabold tracking-tight mt-0.5 flex items-center gap-2">
                <span>{selectedLesson?.title || 'Interactive Curriculum Lesson'}</span>
                {lessonCompleted && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Completed {lastScore ? `(${lastScore}%)` : ''}</span>
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Target Language & Lesson Switcher Controls */}
          <div className="flex items-center gap-2">
            {/* Direct Target Language Switcher in Voice Session */}
            <div className="relative flex items-center">
              <select
                value={targetLang}
                onChange={(e) => onUpdateProfile?.({ target_language: e.target.value })}
                className="px-3 py-2 text-xs font-bold rounded-xl border appearance-none cursor-pointer focus:outline-none transition-colors shadow-sm"
                style={{
                  backgroundColor: theme === 'dark' ? '#064E3B' : '#ECFDF5',
                  borderColor: '#10B981',
                  color: theme === 'dark' ? '#6EE7B7' : '#065F46'
                }}
                title="Target Language: The language you are practicing in this voice session"
              >
                <option value="en" className="bg-[#111827] text-white">Target: English</option>
                <option value="ar" className="bg-[#111827] text-white">Target: العربية (Arabic)</option>
                <option value="es" className="bg-[#111827] text-white">Target: Español (Spanish)</option>
                <option value="de" className="bg-[#111827] text-white">Target: Deutsch (German)</option>
              </select>
            </div>

            <button
              onClick={() => setShowLessonPicker(!showLessonPicker)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Change active curriculum lesson"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Change Lesson</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLessonPicker ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setShowStateTester(!showStateTester)}
              className="text-xs px-2.5 py-2 rounded-xl border border-white/10 text-[#94A3B8] hover:text-white flex items-center gap-1 cursor-pointer"
              title="QA test bar for all voice session states"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lesson Objective Bar */}
        {selectedLesson?.objective && (
          <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/5 flex items-start gap-2 text-xs">
            <Target className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-[#64748B] dark:text-[#94A3B8] uppercase text-[10px] mr-1.5">Learning Objective:</span>
              <span className="text-[#334155] dark:text-[#E2E8F0] font-medium">{selectedLesson.objective}</span>
            </div>
          </div>
        )}

        {/* Expandable Lesson Picker Drawer */}
        {showLessonPicker && (
          <div className="mt-2 p-3 rounded-2xl border border-[#8B5CF6]/20 bg-black/10 dark:bg-black/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94A3B8] uppercase">Select Curriculum Module & Lesson:</span>
              <button 
                onClick={() => setShowLessonPicker(false)}
                className="text-xs text-[#8B5CF6] hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {modules.map((mod) => (
                <div key={mod.id} className="p-2.5 rounded-xl border border-white/5 bg-black/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#8B5CF6]">{mod.level} • {mod.title}</span>
                    <span className="text-[10px] text-white/50">{mod.lessons.length} lessons</span>
                  </div>
                  <div className="space-y-1">
                    {mod.lessons.map((les) => (
                      <button
                        key={les.id}
                        onClick={() => {
                          setSelectedModule(mod);
                          setSelectedLesson(les);
                          setShowLessonPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          selectedLesson?.id === les.id
                            ? 'bg-gradient-cosmic text-white font-bold shadow-sm'
                            : 'hover:bg-white/5 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <span className="truncate mr-2">{les.title}</span>
                        <span className="text-[10px] opacity-70 font-mono">{les.durationMinutes}m</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Interactive Practice Mode Selector Tabs */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mr-1">
              Curriculum Mode:
            </span>
            {[
              { id: 'roleplay', label: '🎭 Scenario Roleplay', desc: 'Situational dialogue' },
              { id: 'vocab_drill', label: '📖 Vocab Drill', desc: 'Pronunciation & words' },
              { id: 'grammar_practice', label: '🧩 Grammar Drill', desc: 'Sentence formulation' },
              { id: 'teach_back', label: '🎙️ Oral Teach-Back', desc: 'Spoken oral exam' },
              { id: 'ask_question', label: '💡 Ask About Lesson', desc: 'Grammar & Exam Q&A' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPracticeMode(m.id as CurriculumPracticeMode)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  practiceMode === m.id
                    ? 'bg-gradient-cosmic text-white shadow-md shadow-[#8B5CF6]/20'
                    : 'bg-black/5 dark:bg-white/5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                }`}
                title={m.desc}
              >
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                reducedMotion
                  ? 'border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/10'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {reducedMotion ? 'Reduced Motion' : 'Fluid 3D Motion'}
            </button>
          </div>
        </div>
      </div>

      {/* State QA Simulator Bar if toggled */}
      {showStateTester && (
        <div className="p-3 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#8B5CF6]">QA State Simulator:</span>
          {testStates.map(st => (
            <button
              key={st}
              onClick={() => {
                speechControllerRef.current?.stopSpeaking();
                setOrbState(st);
              }}
              className={`text-[11px] px-2 py-0.5 rounded capitalize font-medium cursor-pointer border ${
                orbState === st
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                  : 'bg-black/10 dark:bg-white/10 text-white/80 border-transparent hover:border-white/20'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* Main Conversational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Energy Orb Floating Against Pure Black */}
        <div 
          className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl border relative overflow-hidden bg-black shadow-2xl"
          style={{
            borderColor: theme === 'dark' ? '#1E293B' : '#CBD5E1'
          }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-radial from-violet-900/20 via-cyan-950/10 to-transparent blur-3xl pointer-events-none" />

          {/* 3D Supernova Particle Orb */}
          <SupernovaOrb
            state={orbState}
            audioLevel={audioLevel}
            reducedMotion={reducedMotion}
            size={280}
            onClick={toggleListening}
          />

          {/* Micro-visualizer & Tap to Speak Controls */}
          <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs">
            <button
              onClick={toggleListening}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer shadow-lg ${
                orbState === 'listening' || orbState === 'transcribing'
                  ? 'bg-[#FB7185] text-white shadow-[#FB7185]/30 animate-pulse'
                  : 'bg-gradient-cosmic text-white shadow-[#8B5CF6]/30 hover:opacity-95'
              }`}
            >
              {orbState === 'listening' || orbState === 'transcribing' ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Stop Speaking (Processing)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Tap Orb or Mic to Speak</span>
                </>
              )}
            </button>

            {/* Audio Wave Volume Meter */}
            <div className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20">
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">MIC LEVEL</span>
              <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-aurora rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(4, Math.round(audioLevel * 100))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#8B5CF6]">
                {Math.round(audioLevel * 100)}%
              </span>
            </div>

            {/* Voice & Speaker Settings */}
            <div className="w-full mt-1 p-3.5 rounded-2xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-[#8B5CF6]">
                  <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>ICE Orb Voice & Output</span>
                </span>
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[11px] font-bold text-[#22D3EE] hover:bg-[#22D3EE]/25 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  title="Audition voice at current volume"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Test Audio</span>
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="p-2.5 rounded-xl bg-black/10 dark:bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Speaker Volume:</span>
                  <span className="font-mono text-[#34D399] font-bold">
                    {Math.round(volume * 100)}% {volume === 0 ? '(Muted)' : volume > 0.7 ? '🔊 Loud' : '🔉 Normal'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVolumeChange(volume === 0 ? 1.0 : 0)}
                    className="text-[#64748B] hover:text-white p-1 rounded transition-colors cursor-pointer"
                    title={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#8B5CF6]" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-[#8B5CF6] h-1.5 rounded-full cursor-pointer bg-black/20"
                    aria-label="Speaker Volume"
                  />
                  <button
                    type="button"
                    onClick={() => handleVolumeChange(1.0)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 hover:border-white/30 text-[#94A3B8] hover:text-white font-mono cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Male / Female Voice Selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-black/40 border border-white/5">
                <button
                  type="button"
                  onClick={() => handleVoiceChange('male')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    voiceGender === 'male'
                      ? 'bg-gradient-cosmic text-white shadow-sm'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <span>Male Voice</span>
                  <span className="text-[9px] px-1 rounded bg-white/20 uppercase font-mono font-bold">Ref</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVoiceChange('female')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    voiceGender === 'female'
                      ? 'bg-gradient-cosmic text-white shadow-sm'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <span>Female Voice</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Dialogue & Curriculum Coaching */}
        <div 
          className="lg:col-span-7 flex flex-col h-[580px] rounded-3xl border overflow-hidden"
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          {/* Dialogue Header with Active Mode Indicator */}
          <div 
            className="px-6 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <h2 className="text-sm font-bold tracking-tight">Active Lesson Dialogue</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] font-semibold border border-[#8B5CF6]/30 capitalize">
                {practiceMode.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={() => {
                setMessages([getInitialMessageForLesson(selectedLesson, practiceMode)]);
                setCurrentTranscript('');
              }}
              className="text-xs text-[#64748B] hover:text-[#8B5CF6] flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset conversation dialogue"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Dialogue Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Anti-Diversion Redirection Banner */}
                {msg.isCurriculumRedirect && (
                  <div className="mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>🎯 Focus Protected: Kept on Lesson Curriculum</span>
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-cosmic text-white shadow-md shadow-[#8B5CF6]/20'
                      : 'border shadow-sm'
                  }`}
                  style={{
                    backgroundColor:
                      msg.sender === 'user'
                        ? undefined
                        : theme === 'dark'
                        ? '#1E293B'
                        : '#F8FAFC',
                    borderColor:
                      msg.sender === 'user'
                        ? undefined
                        : theme === 'dark'
                        ? '#263044'
                        : '#E2E8F0',
                    color: msg.sender === 'user' ? '#FFFFFF' : theme === 'dark' ? '#F8FAFC' : '#0F172A'
                  }}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                      {msg.sender === 'user' ? 'You (Learner)' : 'LUMA (Curriculum Coach)'}
                    </span>
                    {msg.sender === 'luma' && (
                      <button
                        onClick={() => speakTextAgain(msg.text)}
                        className="text-[#8B5CF6] hover:text-[#D946EF] cursor-pointer"
                        title="Replay pronunciation aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {(() => {
                    const isAr = /[ا-ي]/.test(msg.text);
                    return (
                      <p
                        dir={isAr ? 'rtl' : 'ltr'}
                        className={isAr ? 'text-base font-serif leading-relaxed' : ''}
                      >
                        {msg.text}
                      </p>
                    );
                  })()}

                  {/* Teach-Back Spoken Assessment Scorecard */}
                  {msg.teachbackScore && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-black/30 border border-[#8B5CF6]/40 text-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#8B5CF6] flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-[#8B5CF6]" />
                          <span>Oral Assessment Verified</span>
                        </span>
                        <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {msg.teachbackScore.overall}% Overall
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <div className="text-gray-400">Pronunciation</div>
                          <div className="font-mono font-bold text-cyan-400">{msg.teachbackScore.pronunciation}%</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <div className="text-gray-400">Fluency</div>
                          <div className="font-mono font-bold text-violet-400">{msg.teachbackScore.fluency}%</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <div className="text-gray-400">Grammar</div>
                          <div className="font-mono font-bold text-pink-400">{msg.teachbackScore.grammar}%</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <div className="text-gray-400">Vocabulary</div>
                          <div className="font-mono font-bold text-amber-400">{msg.teachbackScore.lexical}%</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 italic">{msg.teachbackScore.feedback}</p>
                    </div>
                  )}

                  {/* Bridge Language Translation Box */}
                  {msg.translation && (
                    <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 text-xs text-[#38BDF8] flex items-start gap-1.5">
                      <span className="font-semibold text-[10px] uppercase px-1 py-0.2 rounded bg-[#38BDF8]/10">
                        {profile?.bridge_language?.toUpperCase() || 'TA'}
                      </span>
                      <p className="italic">{msg.translation}</p>
                    </div>
                  )}

                  {/* Contextual Grammar Correction */}
                  {msg.correction && (
                    <div className="mt-2 p-2 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs text-[#FB7185] flex items-start gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{msg.correction}</span>
                    </div>
                  )}

                  {/* Pronunciation / Intonation Coaching Tip */}
                  {msg.pronunciationTip && (
                    <div className="mt-1.5 text-[11px] text-[#34D399] flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                      <span>{msg.pronunciationTip}</span>
                    </div>
                  )}

                  {/* Suggested Action Navigation */}
                  {msg.suggestedAction && (
                    <button
                      onClick={() => {
                        const act = msg.suggestedAction?.actionType;
                        if (act === 'open_onboarding') onOpenOnboarding?.();
                        else if (act === 'open_missions') onNavigateTab?.('missions');
                        else if (act === 'open_curriculum') onNavigateTab?.('curriculum');
                        else if (act === 'open_vocabulary') onNavigateTab?.('vocabulary');
                        else if (act === 'open_assessment') onNavigateTab?.('assessment');
                        else if (act === 'open_database') onNavigateTab?.('database');
                        else if (act === 'toggle_theme') onToggleTheme?.();
                      }}
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-gradient-cosmic text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/30 hover:opacity-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{msg.suggestedAction.label}</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Live Real-Time Transcription Interim Banner */}
            {currentTranscript && (
              <div className="flex flex-col items-end animate-fadeIn">
                <div className="max-w-[85%] rounded-2xl p-3 text-xs bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] font-mono">
                  <span className="animate-pulse">Listening... </span>
                  "{currentTranscript}"
                </div>
              </div>
            )}
          </div>

          {/* Lesson Key Phrases & Suggested Spoken Chips */}
          <div 
            className="px-6 py-2.5 border-t flex flex-wrap items-center gap-1.5"
            style={{
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
              backgroundColor: theme === 'dark' ? '#0D1220' : '#F1F5F9'
            }}
          >
            <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
              Curriculum Prompts:
            </span>
            {recommendedChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleUserUtterance(chip)}
                className="text-xs px-2.5 py-1 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-colors cursor-pointer"
              >
                "{chip}"
              </button>
            ))}
          </div>

          {/* Text Input Fallback Bar */}
          <form onSubmit={handleTextSubmit} className="p-4 border-t flex items-center gap-2"
            style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Practice ${selectedLesson?.title || 'active lesson'} in ${targetLang === 'ar' ? 'Arabic' : targetLang === 'de' ? 'German' : 'English'}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
              style={{
                backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
                color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
              }}
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-gradient-cosmic text-white font-medium disabled:opacity-40 cursor-pointer shadow-md shadow-[#8B5CF6]/20 transition-opacity"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
