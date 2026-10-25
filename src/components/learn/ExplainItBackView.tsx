import React, { useState } from 'react';
import { Card, Button, Input, StatusPill, ErrorState } from '../ui';
import { apiClient, AssessmentAttempt, UserProfile } from '../../services/apiClient';

interface ExplainItBackViewProps {
  profile: UserProfile | null;
}

interface TopicOption {
  id: string;
  title: string;
  prompt: string;
  hint: string;
}

const TOPICS: TopicOption[] = [
  {
    id: 'cafe-order',
    title: 'Ordering at a cafe',
    prompt: 'Explain in your target language how to politely order a coffee with milk and ask for the bill.',
    hint: 'Use polite phrases and explain why politeness matters in daily conversation.'
  },
  {
    id: 'directions',
    title: 'Asking for directions',
    prompt: 'Explain how to ask someone for directions to the nearest train station and thank them.',
    hint: 'Mention key orientation words like left, right, straight ahead.'
  },
  {
    id: 'intro',
    title: 'Introducing your background',
    prompt: 'Explain how you introduce your hometown, your work or hobbies, and what you enjoy doing.',
    hint: 'Focus on clear sentence structure and natural phrasing.'
  }
];

export const ExplainItBackView: React.FC<ExplainItBackViewProps> = ({ profile }) => {
  const [selectedTopic, setSelectedTopic] = useState<TopicOption>(TOPICS[0]);
  const [learnerSpeech, setLearnerSpeech] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const targetLang = profile?.target_language || 'es';

  const handleTextChange = (text: string) => {
    if (!startTime && text.trim().length > 0) {
      setStartTime(Date.now());
    }
    setLearnerSpeech(text);
  };

  const handleSubmit = async () => {
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
        target_language: targetLang,
        learner_speech: learnerSpeech,
        duration_seconds: durationSeconds,
        fluency_wpm: fluencyWpm
      });
      setResult(res.assessment);
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[var(--text)]">Explain it back</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Teach a concept back to test your true understanding. The server evaluates your vocabulary, coherence, and grammar.
        </p>
      </div>

      {/* Topic Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--text)] block" id="topic-label">
          Choose a practice topic
        </label>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="topic-label">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              role="radio"
              aria-checked={selectedTopic.id === topic.id}
              onClick={() => { setSelectedTopic(topic); setResult(null); }}
              className={`p-3 text-left rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[56px] ${
                selectedTopic.id === topic.id
                  ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]'
              }`}
            >
              {topic.title}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Card */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <StatusPill label="Prompt" variant="accent" />
          <span className="text-xs text-[var(--muted)]">Target language: {targetLang.toUpperCase()}</span>
        </div>
        <p className="text-base font-medium text-[var(--text)]">{selectedTopic.prompt}</p>
        <p className="text-xs text-[var(--muted)] italic">Tip: {selectedTopic.hint}</p>
      </Card>

      {/* Error state */}
      {errorMessage && (
        <ErrorState
          title="Submission notice"
          message={errorMessage}
          onRetry={() => handleSubmit()}
        />
      )}

      {/* Assessment Result */}
      {result ? (
        <Card className="space-y-5 border-[var(--accent)]/40 bg-[var(--surface-2)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text)]">Server Evaluation</h3>
            <span className="text-2xl font-black text-[var(--accent)]">
              {result.overall_score}/100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Accuracy</span>
              <span className="text-lg font-bold text-[var(--text)]">{result.accuracy_score ?? 'N/A'}%</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Completion</span>
              <span className="text-lg font-bold text-[var(--text)]">{result.completion_score ?? 'N/A'}%</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Fluency</span>
              <span className="text-sm font-semibold text-[var(--muted)] mt-1 block">
                {result.fluency_score !== null && result.fluency_score !== undefined ? `${result.fluency_score} WPM` : 'Not measured yet'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Pronunciation</span>
              <span className="text-sm font-semibold text-[var(--muted)] mt-1 block">
                Not measured yet
              </span>
            </div>
          </div>

          {result.feedback_tips && result.feedback_tips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[var(--text)]">Feedback & Recommendations</h4>
              <ul className="space-y-1.5 list-disc list-inside text-sm text-[var(--muted)]">
                {result.feedback_tips.map((tip: string, idx: number) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="secondary" fullWidth onClick={handleReset}>
            Practice another topic
          </Button>
        </Card>
      ) : (
        /* Input & Submission */
        <div className="space-y-4">
          <div>
            <label htmlFor="learner-speech-input" className="text-sm font-semibold text-[var(--text)] block mb-1.5">
              Your explanation
            </label>
            <textarea
              id="learner-speech-input"
              rows={4}
              placeholder="Explain the concept in your target language..."
              value={learnerSpeech}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] placeholder-[var(--muted)] text-base focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors min-h-[120px]"
            />
            <div className="flex justify-between items-center text-xs text-[var(--muted)] mt-1 px-1">
              <span>{learnerSpeech.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>Minimum 4 words required</span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting || learnerSpeech.trim().length === 0}
            onClick={handleSubmit}
          >
            Submit for evaluation
          </Button>
        </div>
      )}
    </div>
  );
};
