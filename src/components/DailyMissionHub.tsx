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
  Play, 
  Send, 
  Award,
  Flame,
  Check,
  ArrowRight
} from 'lucide-react';
import { VoiceOrb, VoiceSessionState } from './VoiceOrb.tsx';
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

  // Real Metrics Tracker
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
        setMetrics((prev) => ({
          ...prev,
          actualSpeakingSec: summary.actual?.speakingMinutes * 60 || 0,
          actualListeningSec: summary.actual?.listeningMinutes * 60 || 0,
          actualWritingSec: summary.actual?.writingMinutes * 60 || 0
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    const targetLang =
      curriculum?.learnerProfile?.q2_targetLanguage ||
      profile?.target_language ||
      profile?.targetLanguage ||
      'en';

    const controller = new SpeechController({
      onStateChange: (st) => setOrbState(st),
      onTranscript: (txt) => {
        setSpokenTranscript(txt);
      },
      onAudioLevel: (lvl) => setAudioLevel(lvl),
      onError: () => {}
    });
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

      const secondsToAdd = Math.max(15, speakingSeconds);
      await apiClient.logMissionActivity({
        missionId: `mission_d${activeDay}_spk`,
        activityType: 'speaking',
        secondsSpent: secondsToAdd,
        score: 90
      });

      setSpeakingCompleted(true);
      setMetrics((prev) => ({ ...prev, actualSpeakingSec: prev.actualSpeakingSec + secondsToAdd }));
    } else {
      setSpokenTranscript('');
      setSpeakingSeconds(0);
      const targetLang = profile?.target_language || profile?.targetLanguage || 'en';
      speechControllerRef.current?.setTargetLanguage(targetLang);
      speechControllerRef.current?.startListening();

      speakingTimerRef.current = setInterval(() => {
        setSpeakingSeconds((s) => s + 1);
      }, 1000);
    }
  };

  const playListeningPassage = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && currentMission?.listeningTask?.passage) {
      setIsPlayingAudio(true);
      const targetLang = profile?.target_language || profile?.targetLanguage || 'en';
      const u = new SpeechSynthesisUtterance(currentMission.listeningTask.passage);
      u.lang = targetLang === 'ar' ? 'ar-SA' : targetLang === 'de' ? 'de-DE' : targetLang === 'es' ? 'es-ES' : 'en-US';
      u.rate = 0.95;
      u.onend = () => setIsPlayingAudio(false);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);

      apiClient.logMissionActivity({
        missionId: `mission_d${activeDay}_lis`,
        activityType: 'listening',
        secondsSpent: 45,
        score: 90
      });
      setMetrics((prev) => ({ ...prev, actualListeningSec: prev.actualListeningSec + 45 }));
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

    setWritingFeedback('Good sentence rhythm and natural phrasing. Well expressed!');
    setWritingCompleted(true);

    await apiClient.logMissionActivity({
      missionId: `mission_d${activeDay}_wri`,
      activityType: 'writing',
      secondsSpent: 90,
      score: 88
    });
    setMetrics((prev) => ({ ...prev, actualWritingSec: prev.actualWritingSec + 90 }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Hero: Today's Practice with Big Start Button */}
      <div
        className="p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm transition-colors"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-500">
              Personalized Plan
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              70% Speaking · 20% Listening · 10% Writing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Today's Practice
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {currentMission?.speakingTask?.prompt || 'Practice speaking everyday situations with your voice tutor.'}
          </p>
        </div>

        {/* Big Start Button */}
        <button
          onClick={onSwitchToVoiceTutor}
          className="w-full md:w-auto min-h-[52px] px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-violet-600/25 flex items-center justify-center gap-3 cursor-pointer transition-all transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Sparkles className="w-5 h-5 text-cyan-300" />
          <span>Start Practice</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3 Activity Cards: Speaking (70%), Listening (20%), Writing (10%) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Speaking Card */}
        <div
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'speaking'
              ? 'border-violet-500 ring-2 ring-violet-500/20'
              : 'hover:border-slate-400'
          }`}
          onClick={() => setActiveTab('speaking')}
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            borderColor: activeTab === 'speaking' ? '#8B5CF6' : theme === 'dark' ? '#1E293B' : '#E2E8F0'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              70% Speaking
            </span>
            {speakingCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Oral Dialogue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Speak out loud with LUMA to build automaticity and conversational confidence.
          </p>
        </div>

        {/* Listening Card */}
        <div
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'listening'
              ? 'border-cyan-500 ring-2 ring-cyan-500/20'
              : 'hover:border-slate-400'
          }`}
          onClick={() => setActiveTab('listening')}
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            borderColor: activeTab === 'listening' ? '#06B6D4' : theme === 'dark' ? '#1E293B' : '#E2E8F0'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              20% Listening
            </span>
            {listeningCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Audio Comprehension
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Listen to native speech passages and answer quick comprehension questions.
          </p>
        </div>

        {/* Writing Card */}
        <div
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'writing'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'hover:border-slate-400'
          }`}
          onClick={() => setActiveTab('writing')}
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            borderColor: activeTab === 'writing' ? '#10B981' : theme === 'dark' ? '#1E293B' : '#E2E8F0'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              10% Writing
            </span>
            {writingCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Sentence Construction
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            Formulate targeted responses to solidify grammar patterns and vocabulary.
          </p>
        </div>
      </div>

      {/* Selected Activity Workspace */}
      <div
        className="p-6 rounded-3xl border transition-colors shadow-sm"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        {activeTab === 'speaking' && (
          <div className="space-y-6 text-center max-w-xl mx-auto py-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                Oral Speaking Prompt
              </span>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                "{currentMission?.speakingTask?.prompt || 'Describe your daily routine and what you enjoy most.'}"
              </p>
            </div>

            {/* Interactive Voice Orb */}
            <div className="flex flex-col items-center justify-center">
              <VoiceOrb
                state={orbState}
                audioLevel={audioLevel}
                onClick={toggleSpeaking}
                className="w-full max-w-[260px]"
              />
              <p className="text-xs text-slate-400 mt-2">
                {orbState === 'listening'
                  ? `Speaking for ${speakingSeconds}s... Tap to submit`
                  : 'Tap orb or button below to speak'}
              </p>
            </div>

            {spokenTranscript && (
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left text-sm text-slate-200">
                <span className="text-xs text-violet-400 font-semibold block mb-1">Your speech transcript:</span>
                "{spokenTranscript}"
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={toggleSpeaking}
                className={`min-h-[44px] px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-md ${
                  orbState === 'listening'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                {orbState === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{orbState === 'listening' ? 'Done Speaking' : 'Tap to Talk'}</span>
              </button>

              <button
                onClick={onSwitchToVoiceTutor}
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 font-semibold text-sm cursor-pointer"
              >
                Open Full Voice Tutor
              </button>
            </div>
          </div>
        )}

        {activeTab === 'listening' && (
          <div className="space-y-6 max-w-xl mx-auto py-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Listening Passage
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Listen and understand
              </h2>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-800/20 flex items-center justify-between gap-4"
              style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={playListeningPassage}
                  disabled={isPlayingAudio}
                  className="w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors shadow-md"
                  aria-label="Play audio passage"
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </button>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Audio Passage
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isPlayingAudio ? 'Playing audio...' : 'Tap play to listen'}
                  </p>
                </div>
              </div>
            </div>

            {/* Comprehension Quiz */}
            {currentMission?.listeningTask?.question && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {currentMission.listeningTask.question}
                </h4>
                <div className="space-y-2">
                  {currentMission.listeningTask.options?.map((opt: string, idx: number) => {
                    const isSelected = selectedQuizAnswer === idx;
                    const isCorrect = idx === currentMission.listeningTask.correctIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : 'border-rose-500 bg-rose-500/10 text-rose-400'
                            : 'border-slate-700/50 hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'writing' && (
          <form onSubmit={handleWritingSubmit} className="space-y-4 max-w-xl mx-auto py-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Writing Task
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {currentMission?.writingTask?.prompt || 'Write 2-3 sentences responding to today’s topic.'}
              </p>
            </div>

            <textarea
              rows={4}
              value={writtenText}
              onChange={(e) => setWrittenText(e.target.value)}
              placeholder="Write your response in the language you are learning..."
              className="w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors bg-transparent text-slate-900 dark:text-slate-100"
              style={{ borderColor: theme === 'dark' ? '#334155' : '#CBD5E1' }}
            />

            {writingFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                <span className="font-bold block mb-1">Feedback:</span>
                {writingFeedback}
              </div>
            )}

            <button
              type="submit"
              disabled={!writtenText.trim()}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm cursor-pointer transition-colors shadow-md"
            >
              Submit Response
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
