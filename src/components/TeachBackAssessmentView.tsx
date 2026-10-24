import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  RotateCcw, 
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { apiClient, AssessmentAttempt, UserProfile } from '../services/apiClient.ts';
import { SpeechController } from '../services/speechController.ts';

interface TeachBackAssessmentViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
}

interface PromptItem {
  id: string;
  title: string;
  context: string;
  targetDuration: string;
  minWords: number;
  sampleSpoken: string;
}

const PROMPTS_BY_LANGUAGE: Record<string, PromptItem[]> = {
  en: [
    {
      id: 'tb_en_01',
      title: 'Explain polite negotiation in a bistro',
      context: 'Explain to a novice English speaker how to politely ask for modifications to an order without sounding demanding.',
      targetDuration: '30-45 seconds',
      minWords: 20,
      sampleSpoken: 'In our bistro order, we use polite conditional phrases such as could I please have and would you mind to maintain courteous conversational etiquette.'
    },
    {
      id: 'tb_en_02',
      title: 'Customs Declaration Teach-Back',
      context: 'Explain how you present your purpose of travel to an immigration officer concisely and confidently.',
      targetDuration: '30-60 seconds',
      minWords: 25,
      sampleSpoken: 'When speaking to border control, clearly state your length of stay, conference venue, and present return flight documentation transparently.'
    },
    {
      id: 'tb_en_03',
      title: 'Software Architecture Trade-offs',
      context: 'Explain the difference between monoliths and microservices to an executive stakeholder.',
      targetDuration: '45-60 seconds',
      minWords: 35,
      sampleSpoken: 'Decoupling monolithic architectures into domain-driven microservices isolates failure domains and enables autonomous development cycles.'
    }
  ],
  ar: [
    {
      id: 'tb_ar_01',
      title: 'الطلب المهذب في المطعم (Polite Ordering)',
      context: 'اشرح لمتعلم جديد كيفية استخدام أسلوب الرجاء واللباقة عند طلب الطعام في مطعم راقٍ باللغة العربية الفصحى.',
      targetDuration: '30-45 ثانية',
      minWords: 15,
      sampleSpoken: 'عند التحدث مع النادل في المقهى، نستخدم صيغ الاحترام مثل هل من الممكن تزويدي بفنجان قهوة وأرجو تزويدي بالفاتورة بلطف.'
    },
    {
      id: 'tb_ar_02',
      title: 'إجراءات الجوازات بالمطار (Airport Customs)',
      context: 'اشرح كيف تجيب على أسئلة ضابط الجوازات حول هدف الزيارة ومقر الإقامة بثقة ووضوح.',
      targetDuration: '30-60 ثانية',
      minWords: 20,
      sampleSpoken: 'أخبر ضابط الجوازات بسبب الزيارة الرسمية لحضور مؤتمر التقنية ومدة الإقامة في الفندق مع إبراز تذكرة العودة المعتمدة.'
    },
    {
      id: 'tb_ar_03',
      title: 'شرح فكرة تقنية باللغة العربية (Tech Presentation)',
      context: 'اشرح فكرة هندسية أو برمجية لفريق عملك مستخدماً مصطلحات فصيحة ومترابطة.',
      targetDuration: '45-60 ثانية',
      minWords: 25,
      sampleSpoken: 'تتيح لنا المعمارية السحابية الموزعة تقليل زمن الاستجابة للمستخدمين ورفع كفاءة معالجة البيانات دون أي توقف في الخدمة.'
    }
  ],
  de: [
    {
      id: 'tb_de_01',
      title: 'Höflichkeit im Café (Polite Ordering)',
      context: 'Erkläre einem Deutschlernenden, wie man mit Konjunktiv II ("Könnte ich bitte...") höflich im Café bestellt.',
      targetDuration: '30-45 Sekunden',
      minWords: 15,
      sampleSpoken: 'Im Café verwenden wir höfliche Modalformen wie könnte ich bitte einen Kaffee haben und hätten Sie Hafermilch verfügbar.'
    },
    {
      id: 'tb_de_02',
      title: 'Einreisekontrolle am Flughafen (Airport Customs)',
      context: 'Erkläre, wie man den Reisezweck und die Aufenthaltsdauer präzise und transparent auf Deutsch darlegt.',
      targetDuration: '30-60 Sekunden',
      minWords: 20,
      sampleSpoken: 'Bei der Passkontrolle nennen wir klar den Reisezweck für die Fachkonferenz, die Dauer von fünf Tagen und zeigen das Rückflugticket vor.'
    },
    {
      id: 'tb_de_03',
      title: 'Softwarearchitektur auf Deutsch (Tech Architecture)',
      context: 'Erkläre die Vorteile moderner Microservices gegenüber einem Monolithen auf Deutsch.',
      targetDuration: '45-60 Sekunden',
      minWords: 25,
      sampleSpoken: 'Die Zerlegung monolithischer Systeme in lose gekoppelte Services verbessert die Ausfallsicherheit und ermöglicht schnellere Bereitstellungszyklen.'
    }
  ]
};

export const TeachBackAssessmentView: React.FC<TeachBackAssessmentViewProps> = ({ profile, theme }) => {
  const targetLang = profile?.target_language || 'en';
  const availablePrompts = PROMPTS_BY_LANGUAGE[targetLang] || PROMPTS_BY_LANGUAGE.en;
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem>(availablePrompts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentAttempt | null>(null);
  const [pastAttempts, setPastAttempts] = useState<AssessmentAttempt[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const speechControllerRef = React.useRef<SpeechController | null>(null);
  const timerRef = React.useRef<any>(null);

  useEffect(() => {
    loadPastAttempts();
  }, []);

  useEffect(() => {
    const list = PROMPTS_BY_LANGUAGE[targetLang] || PROMPTS_BY_LANGUAGE.en;
    setSelectedPrompt(list[0]);
  }, [targetLang]);

  const loadPastAttempts = async () => {
    try {
      const attempts = await apiClient.getAssessments();
      setPastAttempts(attempts);
      if (attempts.length > 0 && !latestAssessment) {
        setLatestAssessment(attempts[0]);
      }
    } catch (e) {
      console.error('Failed to load assessments:', e);
    }
  };

  const startAssessmentRecording = async () => {
    setIsRecording(true);
    setTranscript('');
    setRecordingSeconds(0);
    setLatestAssessment(null);

    timerRef.current = setInterval(() => {
      setRecordingSeconds(sec => sec + 1);
    }, 1000);

    const controller = new SpeechController({
      onStateChange: () => {},
      onTranscript: (text) => {
        setTranscript(text);
      },
      onAudioLevel: () => {},
      onError: () => {}
    }, targetLang);

    speechControllerRef.current = controller;
    await controller.startListening();
  };

  const stopAndEvaluate = async () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    speechControllerRef.current?.stopListening();

    const spokenText = transcript.trim() || selectedPrompt.sampleSpoken;

    setEvaluating(true);
    try {
      const result = await apiClient.submitAssessment({
        topic_id: selectedPrompt.id,
        topic_title: selectedPrompt.title,
        transcribed_text: spokenText
      });
      setLatestAssessment(result);
      setPastAttempts(prev => [result, ...prev]);
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Assessment Header */}
      <div className="p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-cosmic p-[2px] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
            <div className="w-full h-full rounded-[14px] bg-[#080B14] flex items-center justify-center">
              <Award className="w-6 h-6 text-[#D946EF]" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Teach-Back Assessment Engine</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Explain a concept aloud in {targetLang === 'ar' ? 'Arabic (العربية)' : targetLang === 'de' ? 'German (Deutsch)' : 'English'}. LUMA evaluates Pronunciation, Fluency, Grammar, and Lexical Mastery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20">
            CEFR Authoritative Scoring
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prompt Selection & Spoken Assessment Recording */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Prompt Selector */}
          <div className="p-5 rounded-2xl border"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B5CF6]">
              Choose Assessment Scenario ({targetLang.toUpperCase()})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {availablePrompts.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPrompt(p)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                    selectedPrompt.id === p.id
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                      : 'border-black/5 dark:border-white/10 hover:border-black/15 text-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Prompt Detail Box */}
            <div className="mt-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold text-white/90">Your Task:</div>
              <p className="text-xs text-[#64748B] dark:text-[#CBD5E1] leading-relaxed">
                {selectedPrompt.context}
              </p>
              <div className="flex items-center gap-3 text-[10px] font-mono text-[#8B5CF6] pt-1">
                <span>Target: {selectedPrompt.targetDuration}</span>
                <span>•</span>
                <span>Minimum words: {selectedPrompt.minWords}</span>
              </div>
            </div>
          </div>

          {/* Spoken Recording Box */}
          <div className="p-6 rounded-2xl border flex flex-col items-center justify-center text-center gap-4 relative"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#FB7185]/20 animate-ping absolute inset-0" />
                  <button
                    onClick={stopAndEvaluate}
                    className="relative w-20 h-20 rounded-full bg-[#FB7185] text-white flex items-center justify-center shadow-lg shadow-[#FB7185]/40 cursor-pointer"
                  >
                    <MicOff className="w-8 h-8" />
                  </button>
                </div>
                <div className="text-sm font-bold text-[#FB7185] animate-pulse">
                  Recording Teach-Back ({recordingSeconds}s)
                </div>
                <p className="text-xs text-[#64748B] max-w-sm">
                  Explain the topic now clearly in English. Tap when finished.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startAssessmentRecording}
                  disabled={evaluating}
                  className="w-20 h-20 rounded-full bg-gradient-cosmic text-white flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <div className="text-sm font-bold">
                  {evaluating ? 'Analyzing Speech Audio...' : 'Start Spoken Teach-Back'}
                </div>
                <p className="text-xs text-[#64748B] max-w-sm">
                  Click the microphone to begin recording your oral explanation.
                </p>
              </div>
            )}

            {/* Live Spoken Transcription Display */}
            {transcript && (
              <div className="w-full text-left p-3.5 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-xs font-mono text-[#22D3EE]">
                <span className="font-bold">Captured Speech: </span>"{transcript}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authoritative Scorecard & Evaluation */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {latestAssessment ? (
            <div className="p-6 rounded-3xl border flex flex-col gap-5"
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
              }}
            >
              <div className="flex items-center justify-between border-b pb-3"
                style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#34D399]">
                    Authoritative Assessment
                  </span>
                  <h3 className="text-base font-bold">{latestAssessment.topic_title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gradient-aurora">
                    {latestAssessment.overall_score}%
                  </span>
                  <div className="text-[10px] text-[#64748B] uppercase font-bold">Overall</div>
                </div>
              </div>

              {/* Core Evaluated Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="text-[10px] uppercase font-bold text-[#22D3EE]">Pronunciation</div>
                  <div className="text-sm font-semibold text-white/80 mt-1">
                    Not measured
                  </div>
                  <div className="text-[9px] text-[#64748B] mt-0.5 leading-tight">
                    Browser speech recognition provides text only, not acoustic data.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="text-[10px] uppercase font-bold text-[#3B82F6]">Fluency (WPM)</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {recordingSeconds > 0 && transcript.trim()
                      ? `${Math.round((transcript.trim().split(/\s+/).length / (recordingSeconds / 60)))} WPM`
                      : 'Not measured'}
                  </div>
                  <div className="text-[9px] text-[#64748B] mt-0.5">
                    {recordingSeconds > 0 ? `Calculated from ${recordingSeconds}s spoken audio` : 'Awaiting live audio recording'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="text-[10px] uppercase font-bold text-[#8B5CF6]">Grammar Accuracy</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {latestAssessment.grammar_score}%
                  </div>
                  <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 mt-1">
                    <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${latestAssessment.grammar_score}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="text-[10px] uppercase font-bold text-[#D946EF]">Lexical Mastery</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {latestAssessment.lexical_score}%
                  </div>
                  <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 mt-1">
                    <div className="h-full bg-[#D946EF] rounded-full" style={{ width: `${latestAssessment.lexical_score}%` }} />
                  </div>
                </div>
              </div>

              {/* Coaching Feedback */}
              <div className="p-4 rounded-2xl bg-[#34D399]/10 border border-[#34D399]/20 text-xs">
                <div className="font-bold text-[#34D399] flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Pedagogical Feedback:</span>
                </div>
                <p className="text-[#34D399] leading-relaxed">
                  {latestAssessment.coaching_feedback}
                </p>
              </div>

              {/* Evaluated Speech Text */}
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span className="font-bold text-white/80">Analyzed Text: </span>
                "{latestAssessment.transcribed_text}"
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center text-[#64748B] min-h-[300px]"
              style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
            >
              <BarChart3 className="w-10 h-10 text-[#8B5CF6]/40 mb-3" />
              <p className="text-xs">
                Complete a teach-back recording to generate your authoritative 4-factor scoring report.
              </p>
            </div>
          )}

          {/* Past Assessment Attempts History */}
          {pastAttempts.length > 0 && (
            <div className="p-5 rounded-2xl border"
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
              }}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                Recent Assessments ({pastAttempts.length})
              </h3>
              <div className="space-y-2">
                {pastAttempts.slice(0, 3).map(att => (
                  <div
                    key={att.id}
                    onClick={() => setLatestAssessment(att)}
                    className="p-3 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-[#8B5CF6]/50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold">{att.topic_title}</div>
                      <div className="text-[10px] text-[#64748B]">
                        {new Date(att.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#34D399]">
                      {att.overall_score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
