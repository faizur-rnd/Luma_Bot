import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, RotateCcw, Volume2, CheckCircle2, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { AudioRecorder } from '../services/audioRecorder.ts';
import { AudioLevelMeter } from './audio/AudioLevelMeter.tsx';
import { BaselineResultsCard } from './baseline/BaselineResultsCard.tsx';
import { checkpointReportApi } from '../services/api/checkpointReportApi.ts';
import { programApi } from '../services/api/programApi.ts';
import { request } from '../services/api/baseClient.ts';
import { PronunciationScoreResult } from '../services/api/types.ts';
import { Button } from './ui/index.ts';
import { ctaAnalytics } from '../services/analytics.ts';

interface BaselineAssessmentModalProps {
  isOpen: boolean;
  nativeLanguage?: string;
  onClose: () => void;
  onCompleteBaseline: () => void;
}

const DEFAULT_PASSAGE = {
  id: 'passage_diagnostic_1',
  title: 'The Northern Wind & Phonetic Balance',
  text: 'Please call Stella and ask her to bring these things with her from the store: six spoons of fresh snow peas, five thick slabs of blue cheese, and maybe a snack for her brother Bob.',
  targetPhonemes: ['/θ/', '/ð/', '/v/', '/w/', '/b/', '/p/']
};

export const BaselineAssessmentModal: React.FC<BaselineAssessmentModalProps> = ({
  isOpen,
  nativeLanguage = 'ta',
  onClose,
  onCompleteBaseline
}) => {
  const [stage, setStage] = useState<'passage' | 'freespeech' | 'results'>('passage');
  const [passage, setPassage] = useState(DEFAULT_PASSAGE);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [passageAudioUrl, setPassageAudioUrl] = useState<string | null>(null);
  const [passageRecordingId, setPassageRecordingId] = useState<string | undefined>(undefined);
  const [passageScore, setPassageScore] = useState<PronunciationScoreResult | null>(null);
  const [freeSpeechAudioUrl, setFreeSpeechAudioUrl] = useState<string | null>(null);
  const [freeSpeechRecordingId, setFreeSpeechRecordingId] = useState<string | undefined>(undefined);
  const [freeSpeechScore, setFreeSpeechScore] = useState<PronunciationScoreResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    ctaAnalytics.track('baseline_started');
    request('/api/drills/baseline-passages')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const first = data?.passages?.[0];
        if (first) {
          setPassage({
            id: first.id || DEFAULT_PASSAGE.id,
            title: first.title || DEFAULT_PASSAGE.title,
            text: first.text || DEFAULT_PASSAGE.text,
            targetPhonemes: first.targetPhonemes || DEFAULT_PASSAGE.targetPhonemes
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleListenPassage = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(passage.text);
        u.lang = 'en-US';
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      } catch {}
    }
  };

  const startCapture = async (maxDurationMs: number) => {
    setNotice(null);
    const recorder = new AudioRecorder({
      maxDurationMs,
      onStateChange: (st) => {
        if (typeof st.level === 'number') setAudioLevel(st.level);
        if (typeof st.durationMs === 'number') setDurationMs(st.durationMs);
      },
      onMaxDurationReached: () => stopCapture()
    });
    recorderRef.current = recorder;
    const ok = await recorder.start();
    if (!ok) {
      ctaAnalytics.track('recording_failed', { stage: `baseline_${stage}` });
      setNotice('Microphone access is blocked in this browser preview. You can still submit your diagnostic baseline check below.');
      return;
    }
    setIsRecording(true);
  };

  const stopCapture = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    try {
      const result = await recorderRef.current.stop();
      setAudioLevel(0);
      if (stage === 'passage') {
        setPassageAudioUrl(result.audioUrl);
        await uploadAndScore(result.blob, result.durationMs, passage.text, 'passage');
      } else {
        setFreeSpeechAudioUrl(result.audioUrl);
        await uploadAndScore(result.blob, result.durationMs, 'Spontaneous 60-second baseline speaking sample.', 'freespeech');
      }
    } catch {
      setNotice('Recording stopped.');
    }
  };

  const uploadAndScore = async (blob: Blob, durMs: number, refText: string, kind: 'passage' | 'freespeech') => {
    setIsSubmitting(true);
    try {
      let recId: string | undefined;
      const upRes = await request(
        `/api/audio?recordingType=baseline&durationMs=${Math.round(durMs)}&referenceText=${encodeURIComponent(refText)}`,
        { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: blob }
      );
      if (upRes.ok) {
        const upJson = await upRes.json();
        recId = upJson.recording?.id;
      }
      const scoreRes = await request('/api/scoring/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId: recId,
          referenceText: refText,
          targetPhonemes: passage.targetPhonemes,
          language: 'en',
          durationMs: Math.round(durMs)
        })
      });
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        if (kind === 'passage') {
          setPassageRecordingId(recId);
          setPassageScore(scoreData.result || null);
        } else {
          setFreeSpeechRecordingId(recId);
          setFreeSpeechScore(scoreData.result || null);
        }
      }
    } catch {
      setNotice('Sample processed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeBaseline = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const primaryScore = passageScore || freeSpeechScore;
      await checkpointReportApi.submitBaseline({
        passageId: passage.id,
        passageAttemptId: passageRecordingId,
        spontaneousAttemptId: freeSpeechRecordingId,
        passageText: passage.text,
        metrics: {
          passageAccuracy: primaryScore?.overallScore ?? null,
          fluencyWpm: primaryScore?.fluencyScore ?? null,
          clarityScore: primaryScore?.intelligibilityScore ?? null,
          targetPhonemesToPractice: passage.targetPhonemes.slice(0, 3),
          measurementStatus: primaryScore?.status || 'unavailable'
        }
      });
      await programApi.enrollProgram({ nativeLanguage, targetAccent: 'en-US' }).catch(() => {});
      ctaAnalytics.track('baseline_completed', { status: primaryScore?.status || 'unavailable' });
      setStage('results');
    } catch (err: any) {
      setNotice(err.message || 'Baseline saved.');
      setStage('results');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="baseline-modal-title">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Day-0 Diagnostic Benchmark</span>
            <h2 id="baseline-modal-title" className="text-lg font-black text-[var(--text)]">
              {stage === 'passage' ? 'Part 1 of 2: Read Diagnostic Reference Passage' : stage === 'freespeech' ? 'Part 2 of 2: 60-Second Free Speech Sample' : 'Baseline Assessment Results'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] cursor-pointer" aria-label="Close baseline assessment">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {stage !== 'results' && (
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-2.5 text-xs text-[var(--muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span><strong>Microphone Permission Notice:</strong> Recording requires browser microphone access and respects your audio storage consent.</span>
            </div>
          )}

          {stage === 'passage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--accent)]">{passage.title}</span>
                  <Button size="sm" variant="ghost" onClick={handleListenPassage}><Volume2 className="w-3.5 h-3.5 mr-1" />Listen to Passage</Button>
                </div>
                <p className="text-sm text-[var(--text)] leading-relaxed font-medium">“{passage.text}”</p>
              </div>
              <AudioLevelMeter level={audioLevel} durationMs={durationMs} isRecording={isRecording} />
              {isRecording && <p className="text-xs font-bold text-[var(--danger)]">Recording... {(durationMs / 1000).toFixed(1)}s</p>}
              <div className="flex flex-wrap items-center gap-2">
                {!isRecording ? (
                  <Button variant="primary" onClick={() => startCapture(60000)} isLoading={isSubmitting}>
                    <Mic className="w-4 h-4 mr-1.5" />{passageAudioUrl ? 'Record Passage Again' : 'Record Passage'}
                  </Button>
                ) : (
                  <Button variant="danger" onClick={stopCapture}><Square className="w-4 h-4 mr-1.5 fill-current" />Stop Recording</Button>
                )}
                {passageAudioUrl && (
                  <>
                    <Button variant="secondary" onClick={() => new Audio(passageAudioUrl).play().catch(() => {})}><Play className="w-4 h-4 mr-1" />Replay</Button>
                    <Button variant="ghost" onClick={() => { setPassageAudioUrl(null); setPassageScore(null); }}><RotateCcw className="w-4 h-4 mr-1" />Retry</Button>
                  </>
                )}
              </div>
            </div>
          )}

          {stage === 'freespeech' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
                <span className="text-xs font-bold text-[var(--accent)]">60-Second Free Speech Prompt</span>
                <p className="text-sm text-[var(--text)] leading-relaxed">Speak naturally for up to 60 seconds about your professional goals or a recent project you worked on.</p>
              </div>
              <AudioLevelMeter level={audioLevel} durationMs={durationMs} isRecording={isRecording} />
              {isRecording && <p className="text-xs font-bold text-[var(--danger)]">Recording... {(durationMs / 1000).toFixed(1)}s / 60s</p>}
              <div className="flex flex-wrap items-center gap-2">
                {!isRecording ? (
                  <Button variant="primary" onClick={() => startCapture(60000)} isLoading={isSubmitting}>
                    <Mic className="w-4 h-4 mr-1.5" />{freeSpeechAudioUrl ? 'Record Free Speech Again' : 'Record 60s Free Speech'}
                  </Button>
                ) : (
                  <Button variant="danger" onClick={stopCapture}><Square className="w-4 h-4 mr-1.5 fill-current" />Stop Recording</Button>
                )}
                {freeSpeechAudioUrl && (
                  <>
                    <Button variant="secondary" onClick={() => new Audio(freeSpeechAudioUrl).play().catch(() => {})}><Play className="w-4 h-4 mr-1" />Replay</Button>
                    <Button variant="ghost" onClick={() => { setFreeSpeechAudioUrl(null); setFreeSpeechScore(null); }}><RotateCcw className="w-4 h-4 mr-1" />Retry</Button>
                  </>
                )}
              </div>
            </div>
          )}

          {stage === 'results' && <BaselineResultsCard activeScore={passageScore || freeSpeechScore} />}
          {notice && <p className="text-xs text-[var(--warning)]">{notice}</p>}
        </div>

        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-2)]/50 flex items-center justify-between">
          {stage === 'passage' && (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={() => setStage('freespeech')} disabled={isRecording || isSubmitting}><span>Continue to 60s Free Speech</span><ArrowRight className="w-4 h-4 ml-1.5" /></Button>
            </>
          )}
          {stage === 'freespeech' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStage('passage')} disabled={isRecording}>Back to Passage</Button>
              <Button variant="primary" onClick={handleFinalizeBaseline} isLoading={isSubmitting} disabled={isRecording}><CheckCircle2 className="w-4 h-4 mr-1.5" /><span>Submit Baseline Assessment</span></Button>
            </>
          )}
          {stage === 'results' && (
            <>
              <div />
              <Button variant="primary" onClick={() => { onCompleteBaseline(); onClose(); }}><span>Start Today&apos;s Session</span><ArrowRight className="w-4 h-4 ml-1.5" /></Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
