import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';
import { apiClient, AssessmentAttempt, UserProfile } from '../../services/apiClient.ts';
import { TOPICS, TopicOption } from './explainTopics.ts';
import { ExplainResultCard } from './ExplainResultCard.tsx';

interface ExplainItBackViewProps {
  profile: UserProfile | null;
}

export const ExplainItBackView: React.FC<ExplainItBackViewProps> = ({ profile }) => {
  const targetLang = profile?.targetLanguage || profile?.target_language || 'ar';
  const isArabicTarget = targetLang === 'ar';

  const defaultTopic = TOPICS.find((t) => t.language === targetLang) || TOPICS[0];
  const [selectedTopic, setSelectedTopic] = useState<TopicOption>(defaultTopic);
  const [learnerSpeech, setLearnerSpeech] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const matched = TOPICS.find((t) => t.language === targetLang);
    if (matched) setSelectedTopic(matched);
  }, [targetLang]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleToggleRecord = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsRecording(false);
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type your explanation below.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = isArabicTarget ? 'ar-SA' : 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        if (!startTime) setStartTime(Date.now());
      };

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        setLearnerSpeech(fullTranscript.trim());
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setErrorMessage('Could not access microphone: ' + (err?.message || 'Permission denied'));
      setIsRecording(false);
    }
  };

  const handleTextChange = (text: string) => {
    if (!startTime && text.trim().length > 0) {
      setStartTime(Date.now());
    }
    if (errorMessage) setErrorMessage(null);
    setLearnerSpeech(text);
  };

  const handleSubmit = async () => {
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
    }

    if (!learnerSpeech.trim() || learnerSpeech.trim().split(/\s+/).length < 4) {
      setErrorMessage('Please share a complete explanation of at least 4 words.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const durationSeconds = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : undefined;
    const words = learnerSpeech.trim().split(/\s+/).length;
    const fluencyWpm = durationSeconds && durationSeconds > 0 ? Math.round((words / durationSeconds) * 60) : undefined;

    try {
      const res = await apiClient.submitAssessment({
        topic: selectedTopic.title,
        topic_title: selectedTopic.title,
        target_language: targetLang,
        learner_speech: learnerSpeech,
        transcribed_text: learnerSpeech,
        duration_seconds: durationSeconds,
        user_voice_duration: durationSeconds,
        fluency_wpm: fluencyWpm
      });
      setResult(res.assessment || res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit your explanation. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLearnerSpeech('');
    setStartTime(null);
    setErrorMessage(null);
  };

  const isArabicTopic = /[\u0600-\u06FF]/.test(selectedTopic.prompt);

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2">
      <div>
        <h2 className="text-xl font-bold text-[var(--text)]">Explain it back (Feynman Technique)</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Deep mastery happens when you teach a concept back. The AI tutor evaluates your grammar, vocabulary precision, and coherence.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block" id="topic-label">
          Choose a practice concept
        </label>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="topic-label">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              role="radio"
              aria-checked={selectedTopic.id === topic.id}
              onClick={() => { setSelectedTopic(topic); setResult(null); setErrorMessage(null); }}
              className={`p-3 text-left rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[56px] ${
                selectedTopic.id === topic.id
                  ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] font-semibold shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]'
              }`}
            >
              <span className={topic.language === 'ar' ? 'font-arabic' : ''}>{topic.title}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="space-y-3 bg-[var(--surface)] border-[var(--border)]">
        <div className="flex items-center justify-between">
          <StatusPill label="Scenario Challenge" variant="accent" />
          <span className="text-xs text-[var(--muted)] font-medium">Target: {selectedTopic.language.toUpperCase()}</span>
        </div>
        <p className={`text-base font-semibold text-[var(--text)] ${isArabicTopic ? 'font-arabic text-lg leading-[1.7]' : ''}`} dir={isArabicTopic ? 'rtl' : 'ltr'}>
          {selectedTopic.prompt}
        </p>
        <p className="text-xs text-[var(--muted)] italic">
          💡 Coaching Hint: {selectedTopic.hint}
        </p>
      </Card>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--warning)]/40 bg-[var(--surface-2)] p-4 text-[var(--text)] flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-[var(--text)]">Notice</p>
            <p className="text-[var(--muted)] text-sm mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {result ? (
        <ExplainResultCard result={result} onReset={handleReset} />
      ) : (
        <Card className="space-y-4 bg-[var(--surface)] border-[var(--border)]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--text)]">Your Explanation</label>
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-[var(--danger)] text-white animate-pulse'
                  : 'bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] border border-[var(--border)]'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Listening (Tap to stop)' : 'Speak aloud'}</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={learnerSpeech}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={isArabicTarget 
              ? 'اشرح هنا بأسلوبك باللغة العربية أو الإنجليزية... يمكنك الضغط على زر الميكروفون للتحدث مباشرة.'
              : 'Explain the concept here in your own words... or tap "Speak aloud" to dictate.'}
            className="w-full p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] leading-[1.6]"
            dir={/[\u0600-\u06FF]/.test(learnerSpeech) ? 'rtl' : 'ltr'}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[var(--muted)]">
              {learnerSpeech.trim().split(/\s+/).filter(Boolean).length} words spoken/typed
            </span>
            <Button
              variant="primary"
              disabled={isSubmitting || learnerSpeech.trim().split(/\s+/).filter(Boolean).length < 4}
              onClick={handleSubmit}
            >
              <Send className="w-4 h-4 mr-2" />
              <span>{isSubmitting ? 'Evaluating with AI...' : 'Submit Explanation'}</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
