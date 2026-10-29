import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, Square, Play, RotateCcw, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { programApi } from '../../services/api/programApi.ts';
import { CurrentProgramSessionResponse, ProgramStep, PronunciationScoreResult } from '../../services/api/types.ts';
import { request } from '../../services/api/baseClient.ts';
import { AudioRecorder } from '../../services/audioRecorder.ts';
import { Button } from '../ui/Button.tsx';
import { ctaAnalytics } from '../../services/analytics.ts';

interface DailySessionStageBarProps {
  targetLang: string;
  onSpeakModelText: (text: string) => void;
  onSendStagePrompt: (prompt: string) => void;
  onNavigateProgress?: () => void;
}

const STAGE_PROMPTS: Record<string, { label: string; phrase: string; instruction: string }> = {
  warmup: { label: '1. Warm-up', phrase: 'Breathe smoothly and release jaw tension: "Three thoughtful thinkers thanked them."', instruction: 'Stage 1/5 Warm-up: Relax your jaw and tongue, listen to the model audio, then record or speak.' },
  drills: { label: '2. Sound Drill', phrase: 'Think — This — Path — Breathe — Vine — Wine', instruction: 'Stage 2/5 Sound Drill: Focus on crisp consonant placement and vowel length.' },
  shadowing: { label: '3. Shadowing', phrase: 'Could you walk me through the updated project timeline for this quarter?', instruction: 'Stage 3/5 Shadowing: Match the rhythm, primary stress, and intonation contour of the model.' },
  spontaneous: { label: '4. Guided Conversation', phrase: 'In our team meeting today, I would like to highlight three key milestones we achieved.', instruction: 'Stage 4/5 Guided Conversation: Practice natural workplace cadence with the AI coach.' },
  reflection: { label: '5. Reflection & Summary', phrase: 'Today I focused on dental fricatives and steady sentence rhythm without rushing.', instruction: 'Stage 5/5 Reflection & Summary: Review your articulation takeaways and complete today’s session.' }
};

const FALLBACK_STEPS: ProgramStep[] = [
  { stepNumber: 1, type: 'warmup', title: '1. Warm-up', durationMinutes: 2, instructions: '', payload: {} },
  { stepNumber: 2, type: 'drills', title: '2. Sound Drill', durationMinutes: 4, instructions: '', payload: {} },
  { stepNumber: 3, type: 'shadowing', title: '3. Shadowing', durationMinutes: 4, instructions: '', payload: {} },
  { stepNumber: 4, type: 'spontaneous', title: '4. Guided Conversation', durationMinutes: 3, instructions: '', payload: {} },
  { stepNumber: 5, type: 'reflection', title: '5. Reflection & Summary', durationMinutes: 2, instructions: '', payload: {} }
];

export const DailySessionStageBar: React.FC<DailySessionStageBarProps> = ({
  targetLang,
  onSpeakModelText,
  onSendStagePrompt,
  onNavigateProgress
}) => {
  const [program, setProgram] = useState<CurrentProgramSessionResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedStepNums, setCompletedStepNums] = useState<Record<number, boolean>>({});
  const [isRecordingDrill, setIsRecordingDrill] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [scoringResult, setScoringResult] = useState<PronunciationScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [sessionCompletedSummary, setSessionCompletedSummary] = useState<{ weekNumber: number; dayNumber: number; nextWeek: number; nextDay: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    programApi.getCurrentProgram().then((res) => {
      setProgram(res);
      if (res.completedSteps) {
        const map: Record<number, boolean> = {};
        Object.keys(res.completedSteps).forEach((k) => {
          const num = parseInt(k.replace(/\D/g, ''), 10);
          if (!isNaN(num)) map[num] = true;
        });
        setCompletedStepNums(map);
      }
    }).catch(() => {});
  }, []);

  const steps: ProgramStep[] = program?.currentSession?.steps || FALLBACK_STEPS;
  const currentStep = steps[activeIndex] || steps[0];
  const stageMeta = STAGE_PROMPTS[currentStep.type] || STAGE_PROMPTS.warmup;
  const weekNumber = program?.weekNumber || 1;
  const dayNumber = program?.activeDay || 1;

  const handleStartDrillRecording = async () => {
    setStatusMessage(null);
    setScoringResult(null);
    const recorder = new AudioRecorder({ maxDurationMs: 45000 });
    recorderRef.current = recorder;
    const ok = await recorder.start();
    if (!ok) {
      ctaAnalytics.track('recording_failed', { stage: currentStep.type });
      setStatusMessage('Microphone unavailable in this frame. You can still practice with the coach or complete the step.');
      return;
    }
    setIsRecordingDrill(true);
  };

  const handleStopDrillRecording = async () => {
    if (!recorderRef.current) return;
    setIsRecordingDrill(false);
    try {
      const result = await recorderRef.current.stop();
      setRecordedAudioUrl(result.audioUrl);
      await evaluatePronunciationAttempt(result.blob, result.durationMs);
    } catch {
      setStatusMessage('Recording stopped.');
    }
  };

  const evaluatePronunciationAttempt = async (blob: Blob, durationMs: number) => {
    setIsScoring(true);
    try {
      let recordingId: string | undefined;
      const uploadRes = await request(
        `/api/audio?recordingType=drill&durationMs=${Math.round(durationMs)}&referenceText=${encodeURIComponent(stageMeta.phrase)}`,
        { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: blob }
      );
      if (uploadRes.ok) {
        const upData = await uploadRes.json();
        recordingId = upData.recording?.id;
      }

      const scoreRes = await request('/api/scoring/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId,
          referenceText: stageMeta.phrase,
          targetPhonemes: program?.focusPhonemes || ['/θ/', '/ð/'],
          language: targetLang,
          durationMs: Math.round(durationMs)
        })
      });
      if (scoreRes.ok) {
        const data = await scoreRes.json();
        setScoringResult(data.result || null);
      }
    } catch {
      setStatusMessage('Pronunciation check completed.');
    } finally {
      setIsScoring(false);
    }
  };

  const handleCompleteStep = async () => {
    if (isSubmittingStep) return;
    setIsSubmittingStep(true);
    setStatusMessage(null);
    try {
      await programApi.completeStep({
        weekNumber,
        dayNumber,
        stepNumber: currentStep.stepNumber,
        durationSeconds: currentStep.durationMinutes * 60
      });
    } catch {}
    setCompletedStepNums((prev) => ({ ...prev, [currentStep.stepNumber]: true }));
    setRecordedAudioUrl(null);
    setScoringResult(null);
    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
    setIsSubmittingStep(false);
  };

  const handleCompleteSession = async () => {
    if (isSubmittingStep) return;
    setIsSubmittingStep(true);
    try {
      await programApi.completeStep({ weekNumber, dayNumber, stepNumber: currentStep.stepNumber, durationSeconds: 120 });
      await programApi.completeSession({ weekNumber, dayNumber, reflectionNotes: 'Completed all 5 daily stages.' });
    } catch {}
    ctaAnalytics.track('daily_session_completed', { week: weekNumber, day: dayNumber });
    setSessionCompletedSummary({
      weekNumber,
      dayNumber,
      nextWeek: dayNumber >= 5 ? Math.min(12, weekNumber + 1) : weekNumber,
      nextDay: dayNumber >= 5 ? 1 : dayNumber + 1
    });
    setIsSubmittingStep(false);
  };

  if (sessionCompletedSummary) {
    return (
      <div className="mb-2 p-3.5 rounded-2xl border border-[var(--success)]/40 bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--success)] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Session Complete • Week {sessionCompletedSummary.weekNumber} Day {sessionCompletedSummary.dayNumber}</span>
          </div>
          <p className="text-xs text-[var(--text)] mt-1">
            All 5 daily stages completed! Up next: <strong>Week {sessionCompletedSummary.nextWeek}, Day {sessionCompletedSummary.nextDay}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onNavigateProgress && (
            <Button size="sm" variant="primary" onClick={onNavigateProgress}>View Progress & Checkpoints</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setSessionCompletedSummary(null)}>Continue Practice</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {steps.map((step, idx) => {
            const isCurrent = idx === activeIndex;
            const isDone = Boolean(completedStepNums[step.stepNumber]);
            const label = STAGE_PROMPTS[step.type]?.label || `${idx + 1}. ${step.title}`;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => { setActiveIndex(idx); setScoringResult(null); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[var(--accent)] text-white'
                    : isDone
                    ? 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[11px] font-semibold text-[var(--muted)] shrink-0">
          Week {weekNumber} · Day {dayNumber} ({activeIndex + 1}/5)
        </span>
      </div>

      <div className="pt-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[var(--muted)]">{stageMeta.instruction}</p>
          <p className="text-xs sm:text-sm font-bold text-[var(--text)] mt-0.5 truncate" title={stageMeta.phrase}>“{stageMeta.phrase}”</p>
          {statusMessage && <p className="text-[11px] text-[var(--warning)] mt-1">{statusMessage}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <Button size="sm" variant="secondary" onClick={() => onSpeakModelText(stageMeta.phrase)}>
            <Volume2 className="w-3.5 h-3.5 mr-1" />Listen Model
          </Button>
          {!isRecordingDrill ? (
            <Button size="sm" variant="secondary" onClick={handleStartDrillRecording} disabled={isScoring}>
              <Mic className="w-3.5 h-3.5 mr-1 text-[var(--accent)]" />{recordedAudioUrl ? 'Record Again' : 'Record Attempt'}
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={handleStopDrillRecording}>
              <Square className="w-3.5 h-3.5 mr-1 fill-current" />Stop
            </Button>
          )}
          {recordedAudioUrl && (
            <>
              <Button size="sm" variant="ghost" onClick={() => new Audio(recordedAudioUrl).play().catch(() => {})}><Play className="w-3.5 h-3.5 mr-1" />Replay</Button>
              <Button size="sm" variant="ghost" onClick={() => { setRecordedAudioUrl(null); setScoringResult(null); }}><RotateCcw className="w-3.5 h-3.5 mr-1" />Retry</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => onSendStagePrompt(stageMeta.phrase)}>Coach Me</Button>
          {activeIndex < steps.length - 1 ? (
            <Button size="sm" variant="primary" onClick={handleCompleteStep} isLoading={isSubmittingStep}>
              <span>Next Stage</span><ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={handleCompleteSession} isLoading={isSubmittingStep}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Complete Session
            </Button>
          )}
        </div>
      </div>

      {scoringResult && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
              scoringResult.status === 'measured' ? 'bg-[var(--success)]/15 text-[var(--success)]' : scoringResult.status === 'estimated' ? 'bg-[var(--warning)]/15 text-[var(--warning)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'
            }`}>
              {scoringResult.status === 'measured' ? 'Measured' : scoringResult.status === 'estimated' ? 'Estimated' : 'Not Available'}
            </span>
            <span className="text-[var(--text)] font-medium">
              {scoringResult.overallScore !== null ? `Overall Score: ${scoringResult.overallScore}%` : 'Acoustic phoneme score: Not Available'}
            </span>
            <span className="text-[var(--muted)] hidden sm:inline">• {scoringResult.disclosure}</span>
          </div>
        </div>
      )}
    </div>
  );
};
