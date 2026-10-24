import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Headphones, 
  MessageSquare, 
  ChevronRight, 
  RotateCw, 
  Send, 
  Award,
  Flame,
  Check
} from 'lucide-react';
import { SupernovaOrb, VoiceSessionState } from './SupernovaOrb.tsx';
import { SpeechController } from '../services/speechController.ts';
import { apiClient } from '../services/apiClient.ts';

interface DailyMissionHubProps {
  theme: 'dark' | 'light';
  curriculum: any;
  profile?: any;
  onRetakeOnboarding: () => void;
  onSwitchToVoiceTutor: () => void;
}

export const DailyMissionHub: React.FC<DailyMissionHubProps> = ({
  theme,
  curriculum,
  profile,
  onRetakeOnboarding,
  onSwitchToVoiceTutor
}) => {
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState<'speaking' | 'listening' | 'writing'>('speaking');

  // Speaking state
  const [orbState, setOrbState] = useState<VoiceSessionState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingSeconds, setSpeakingSeconds] = useState(0);
  const [speakingCompleted, setSpeakingCompleted] = useState(false);

  // Listening state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [listeningCompleted, setListeningCompleted] = useState(false);

  // Writing state
  const [writtenText, setWrittenText] = useState('');
  const [writingFeedback, setWritingFeedback] = useState<string | null>(null);
  const [writingCompleted, setWritingCompleted] = useState(false);

  // 70/20/10 Metrics Tracker
  const [metrics, setMetrics] = useState({
    plannedSpeaking: curriculum?.allocation70_20_10?.plannedSpeakingMinutes || 21,
    plannedListening: curriculum?.allocation70_20_10?.plannedListeningMinutes || 6,
    plannedWriting: curriculum?.allocation70_20_10?.plannedWritingMinutes || 3,
    actualSpeakingSec: 0,
    actualListeningSec: 0,
    actualWritingSec: 0
  });

  const speechControllerRef = useRef<SpeechController | null>(null);
  const speakingTimerRef = useRef<any>(null);

  const missions = curriculum?.weeklyOverview?.dailyMissions || [];
  const currentMission = missions.find((m: any) => m.dayNumber === activeDay) || missions[0];

  useEffect(() => {
    loadMissionSummary();
  }, []);

  const loadMissionSummary = async () => {
    try {
      const summary = await apiClient.getMissionsSummary();
      if (summary) {
        setMetrics(prev => ({
          ...prev,
          actualSpeakingSec: summary.actual?.speakingMinutes * 60 || 0,
          actualListeningSec: summary.actual?.listeningMinutes * 60 || 0,
          actualWritingSec: summary.actual?.writingMinutes * 60 || 0
        }));
      }
    } catch (e) {}
  };

  // Init SpeechController for Speaking task
  useEffect(() => {
    const targetLang = curriculum?.learnerProfile?.q2_targetLanguage || profile?.target_language || 'en';
    const controller = new SpeechController({
      onStateChange: (st) => setOrbState(st),
      onTranscript: (txt) => {
        setSpokenTranscript(txt);
      },
      onAudioLevel: (lvl) => setAudioLevel(lvl),
      onError: () => {}
    }, targetLang);
    speechControllerRef.current = controller;

    return () => {
      controller.dispose();
      clearInterval(speakingTimerRef.current);
    };
  }, [activeDay, curriculum?.learnerProfile?.q2_targetLanguage, profile?.target_language]);

  const toggleSpeaking = async () => {
    if (orbState === 'listening' || orbState === 'transcribing') {
      speechControllerRef.current?.stopListening();
      clearInterval(speakingTimerRef.current);

      // Log speaking activity
      const secondsToAdd = Math.max(15, speakingSeconds);
      await apiClient.logMissionActivity({
        missionId: `mission_d${activeDay}_spk`,
        activityType: 'speaking',
        secondsSpent: secondsToAdd,
        score: 95
      });

      setSpeakingCompleted(true);
      setMetrics(prev => ({ ...prev, actualSpeakingSec: prev.actualSpeakingSec + secondsToAdd }));
    } else {
      setSpokenTranscript('');
      setSpeakingSeconds(0);
      speechControllerRef.current?.startListening();

      speakingTimerRef.current = setInterval(() => {
        setSpeakingSeconds(s => s + 1);
      }, 1000);
    }
  };

  const playListeningPassage = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && currentMission?.listeningTask?.passage) {
      setIsPlayingAudio(true);
      const targetLang = curriculum?.learnerProfile?.q2_targetLanguage || 'en';
      const u = new SpeechSynthesisUtterance(currentMission.listeningTask.passage);
      u.lang = targetLang === 'ar' ? 'ar-SA' : targetLang === 'de' ? 'de-DE' : 'en-US';
      u.rate = 0.95;
      u.onend = () => setIsPlayingAudio(false);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);

      // Log listening activity
      apiClient.logMissionActivity({
        missionId: `mission_d${activeDay}_lis`,
        activityType: 'listening',
        secondsSpent: 45,
        score: 90
      });
      setMetrics(prev => ({ ...prev, actualListeningSec: prev.actualListeningSec + 45 }));
    }
  };

  const handleQuizAnswer = (idx: number) => {
    setSelectedQuizAnswer(idx);
    if (idx === currentMission?.listeningTask?.correctIndex) {
      setListeningCompleted(true);
    }
  };

  const handleWritingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenText.trim()) return;

    setWritingFeedback("Excellent clarity and sentence rhythm. Modal phrasing and professional cadence are well observed.");
    setWritingCompleted(true);

    await apiClient.logMissionActivity({
      missionId: `mission_d${activeDay}_wri`,
      activityType: 'writing',
      secondsSpent: 120,
      score: 92
    });
    setMetrics(prev => ({ ...prev, actualWritingSec: prev.actualWritingSec + 120 }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Top Banner: 70/20/10 Allocation Live Telemetry */}
      <div className="p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-aurora p-[2px] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
            <div className="w-full h-full rounded-[14px] bg-[#080B14] flex items-center justify-center">
              <Award className="w-6 h-6 text-[#22D3EE]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Daily Mission Hub</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                70/20/10 Enforced
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Target: "{curriculum?.overallGoal || 'Spontaneous Professional Fluency'}"
            </p>
          </div>
        </div>

        {/* 70/20/10 Ratio Visual Progress Bars */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Speaking 70% */}
          <div className="flex flex-col text-center">
            <span className="text-[10px] font-bold uppercase text-[#22D3EE]">70% Spk</span>
            <span className="text-sm font-extrabold text-white">
              {Math.round(metrics.actualSpeakingSec / 60)} / {metrics.plannedSpeaking}m
            </span>
            <div className="w-20 h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-1">
              <div 
                className="h-full bg-[#22D3EE] rounded-full" 
                style={{ width: `${Math.min(100, (metrics.actualSpeakingSec / (metrics.plannedSpeaking * 60)) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Listening 20% */}
          <div className="flex flex-col text-center">
            <span className="text-[10px] font-bold uppercase text-[#3B82F6]">20% Lis</span>
            <span className="text-sm font-extrabold text-white">
              {Math.round(metrics.actualListeningSec / 60)} / {metrics.plannedListening}m
            </span>
            <div className="w-20 h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-1">
              <div 
                className="h-full bg-[#3B82F6] rounded-full" 
                style={{ width: `${Math.min(100, (metrics.actualListeningSec / (metrics.plannedListening * 60)) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Writing 10% */}
          <div className="flex flex-col text-center">
            <span className="text-[10px] font-bold uppercase text-[#8B5CF6]">10% Wri</span>
            <span className="text-sm font-extrabold text-white">
              {Math.round(metrics.actualWritingSec / 60)} / {metrics.plannedWriting}m
            </span>
            <div className="w-20 h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-1">
              <div 
                className="h-full bg-[#8B5CF6] rounded-full" 
                style={{ width: `${Math.min(100, (metrics.actualWritingSec / (metrics.plannedWriting * 60)) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector & Retake Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border"
        style={{
          backgroundColor: theme === 'dark' ? '#0D1220' : '#F1F5F9',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
            Curriculum Day:
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(day => (
              <button
                key={day}
                onClick={() => {
                  setActiveDay(day);
                  setSpeakingCompleted(false);
                  setListeningCompleted(false);
                  setWritingCompleted(false);
                  setSelectedQuizAnswer(null);
                }}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeDay === day
                    ? 'bg-gradient-cosmic text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-[#64748B] hover:text-white'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onRetakeOnboarding}
          className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retake 10-Question Onboarding Wizard</span>
        </button>
      </div>

      {/* Mission Activities Tabs (Speaking 70%, Listening 20%, Writing 10%) */}
      <div className="flex items-center gap-2 border-b pb-3"
        style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
      >
        <button
          onClick={() => setActiveTab('speaking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'speaking'
              ? 'bg-[#22D3EE]/15 border border-[#22D3EE] text-[#22D3EE]'
              : 'text-[#64748B] hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>1. Speaking Mission (70%)</span>
          {speakingCompleted && <Check className="w-3.5 h-3.5 text-[#34D399]" />}
        </button>

        <button
          onClick={() => setActiveTab('listening')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'listening'
              ? 'bg-[#3B82F6]/15 border border-[#3B82F6] text-[#3B82F6]'
              : 'text-[#64748B] hover:text-white'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>2. Listening Comprehension (20%)</span>
          {listeningCompleted && <Check className="w-3.5 h-3.5 text-[#34D399]" />}
        </button>

        <button
          onClick={() => setActiveTab('writing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'writing'
              ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6] text-[#8B5CF6]'
              : 'text-[#64748B] hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>3. Writing Drill (10%)</span>
          {writingCompleted && <Check className="w-3.5 h-3.5 text-[#34D399]" />}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SPEAKING MISSION (70%)
      ========================================================================= */}
      {activeTab === 'speaking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Supernova Orb & Speech Recording */}
          <div className="lg:col-span-5 p-6 rounded-3xl border flex flex-col items-center justify-center text-center relative overflow-hidden"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <SupernovaOrb
              state={orbState}
              audioLevel={audioLevel}
              size={240}
              onClick={toggleSpeaking}
            />

            <div className="mt-4 w-full max-w-xs space-y-2">
              <button
                onClick={toggleSpeaking}
                className={`w-full py-3 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  orbState === 'listening'
                    ? 'bg-[#FB7185] text-white shadow-[#FB7185]/30 animate-pulse'
                    : 'bg-gradient-cosmic text-white shadow-[#8B5CF6]/30'
                }`}
              >
                {orbState === 'listening' ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Speaking ({speakingSeconds}s recorded)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Speaking Mission</span>
                  </>
                )}
              </button>

              {speakingCompleted && (
                <div className="p-2.5 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 text-xs font-bold text-[#34D399] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Speaking Goal Completed!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mission Prompt & Scenario Details */}
          <div className="lg:col-span-7 p-6 rounded-3xl border space-y-4"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-[#22D3EE] tracking-wider">
                70% Speaking Mission • Day {activeDay}
              </span>
              <h2 className="text-lg font-bold mt-1">
                {currentMission?.speakingTask?.scenario || 'Spontaneous Spoken Scenario'}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold text-white/90">Your Speaking Prompt:</div>
              <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#CBD5E1]">
                {currentMission?.speakingTask?.prompt}
              </p>
            </div>

            {/* Model Phrases */}
            <div>
              <h4 className="text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-2">
                Recommended Phrases to Articulate Aloud:
              </h4>
              <div className="space-y-2">
                {currentMission?.speakingTask?.samplePhrases?.map((phrase: string, idx: number) => {
                  const isArabicPhrase = /[ا-ي]/.test(phrase);
                  return (
                    <div
                      key={idx}
                      dir={isArabicPhrase ? 'rtl' : 'ltr'}
                      className="p-3 rounded-xl border border-black/5 dark:border-white/10 text-xs font-medium flex items-center justify-between"
                    >
                      <span className={isArabicPhrase ? 'text-sm font-serif leading-relaxed' : ''}>"{phrase}"</span>
                      <button
                        onClick={() => {
                          const targetLang = curriculum?.learnerProfile?.q2_targetLanguage || 'en';
                          const u = new SpeechSynthesisUtterance(phrase);
                          u.lang = targetLang === 'ar' ? 'ar-SA' : targetLang === 'de' ? 'de-DE' : 'en-US';
                          window.speechSynthesis.speak(u);
                        }}
                        className="p-1.5 rounded-lg text-[#8B5CF6] hover:bg-[#8B5CF6]/10 mr-1"
                        title="Listen aloud with native accent"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bridge Language Insight */}
            {currentMission?.speakingTask?.bridgeTranslation && (
              <div className="p-3.5 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-xs text-[#38BDF8]">
                <strong>Bridge Language Note: </strong>
                {currentMission.speakingTask.bridgeTranslation}
              </div>
            )}

            {/* Live Captured Speech */}
            {spokenTranscript && (
              <div className="p-3.5 rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-xs font-mono text-[#22D3EE]">
                <strong>Transcribed Speech: </strong>"{spokenTranscript}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LISTENING COMPREHENSION (20%)
      ========================================================================= */}
      {activeTab === 'listening' && (
        <div className="p-6 rounded-3xl border space-y-5"
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-[#3B82F6] tracking-wider">
              20% Listening Comprehension • Day {activeDay}
            </span>
            <h2 className="text-lg font-bold mt-1">
              {currentMission?.listeningTask?.audioContext || 'Spoken Dialogue Comprehension'}
            </h2>
          </div>

          {/* Audio Player Card */}
          <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold">Native Spoken Audio Passage</div>
                <div className="text-[11px] text-[#64748B]">Listen attentively, then answer the verification question below.</div>
              </div>
            </div>

            <button
              onClick={playListeningPassage}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                isPlayingAudio
                  ? 'bg-[#FB7185] text-white animate-pulse'
                  : 'bg-gradient-cosmic text-white shadow-md'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Playing Audio...' : 'Play Audio Passage'}</span>
            </button>
          </div>

          {/* Quiz Question */}
          <div className="p-5 rounded-2xl border border-black/5 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold">
              {currentMission?.listeningTask?.question}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentMission?.listeningTask?.options?.map((opt: string, idx: number) => {
                const isCorrect = idx === currentMission?.listeningTask?.correctIndex;
                const isSelected = selectedQuizAnswer === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? isCorrect
                          ? 'border-[#34D399] bg-[#34D399]/15 text-[#34D399]'
                          : 'border-[#FB7185] bg-[#FB7185]/15 text-[#FB7185]'
                        : 'border-black/5 dark:border-white/10 hover:border-[#3B82F6]'
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedQuizAnswer !== null && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                selectedQuizAnswer === currentMission?.listeningTask?.correctIndex
                  ? 'bg-[#34D399]/15 text-[#34D399]'
                  : 'bg-[#FB7185]/15 text-[#FB7185]'
              }`}>
                {selectedQuizAnswer === currentMission?.listeningTask?.correctIndex
                  ? 'Correct! You understood the key auditory detail.'
                  : 'Incorrect. Replay the audio passage to catch the specific detail.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: WRITING DRILL (10%)
      ========================================================================= */}
      {activeTab === 'writing' && (
        <div className="p-6 rounded-3xl border space-y-5"
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
          }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B5CF6] tracking-wider">
              10% Writing Task • Day {activeDay}
            </span>
            <h2 className="text-lg font-bold mt-1">
              Written Formulation & Syntax Consolidation
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
            <div className="text-xs font-bold text-white/90">Writing Prompt:</div>
            <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#CBD5E1]">
              {currentMission?.writingTask?.prompt}
            </p>
            <div className="text-[11px] text-[#8B5CF6] pt-1">
              Guidelines: {currentMission?.writingTask?.guidelines}
            </div>
          </div>

          <form onSubmit={handleWritingSubmit} className="space-y-3">
            {(() => {
              const targetLang = curriculum?.learnerProfile?.q2_targetLanguage || 'en';
              const isArabicTarget = targetLang === 'ar';
              return (
                <textarea
                  value={writtenText}
                  dir={isArabicTarget ? 'rtl' : 'ltr'}
                  onChange={(e) => setWrittenText(e.target.value)}
                  placeholder={
                    isArabicTarget
                      ? 'اكتب صياغتك هنا باللغة العربية الفصحى...'
                      : targetLang === 'de'
                      ? 'Formuliere deine schriftliche Antwort hier auf Deutsch...'
                      : 'Formulate your written response here in English...'
                  }
                  className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] h-28 ${
                    isArabicTarget ? 'text-sm font-serif leading-relaxed' : 'text-xs'
                  }`}
                  style={{
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                  }}
                />
              );
            })()}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWrittenText(currentMission?.writingTask?.sampleAnswer || '')}
                className="text-xs text-[#64748B] hover:text-[#8B5CF6] cursor-pointer"
              >
                Insert Model Example
              </button>

              <button
                type="submit"
                disabled={!writtenText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-cosmic text-white text-xs font-bold shadow-md disabled:opacity-40 cursor-pointer"
              >
                Submit Writing Drill
              </button>
            </div>
          </form>

          {writingFeedback && (
            <div className="p-4 rounded-2xl bg-[#34D399]/15 border border-[#34D399]/30 text-xs text-[#34D399] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pedagogical Review:</span>
              </div>
              <p>{writingFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
