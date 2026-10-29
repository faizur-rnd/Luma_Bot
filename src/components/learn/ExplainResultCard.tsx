import React from 'react';
import { CheckCircle2, RotateCcw, Award, Info } from 'lucide-react';
import { AssessmentAttempt } from '../../services/apiClient.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';

interface ExplainResultCardProps {
  result: AssessmentAttempt;
  onReset: () => void;
}

export const ExplainResultCard: React.FC<ExplainResultCardProps> = ({ result, onReset }) => {
  const clarityVal = result.completion_score ?? result.overall_score;
  const hasClarity = clarityVal !== null && clarityVal !== undefined;
  const hasFluency = result.fluency_score !== null && result.fluency_score !== undefined;
  const hasPronunciation = result.pronunciation_score !== null && result.pronunciation_score !== undefined;

  return (
    <Card className="p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 border-[var(--accent)]/30 bg-gradient-to-br from-[var(--surface)] to-[var(--accent)]/5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--success)]/15 text-[var(--success)]">
            <Award size={28} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--success)]">Assessment Complete</span>
            <h3 className="text-2xl font-serif font-bold text-[var(--text)]">Feedback Report</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={hasPronunciation ? 'measured' : hasClarity ? 'estimated' : 'unavailable'} />
          {hasClarity && (
            <div className="text-right">
              <div className="text-3xl font-serif font-bold text-[var(--accent)]">{clarityVal}%</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Clarity Score</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="p-3 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)] text-center">
          <div className="text-xs text-[var(--muted)] mb-1">Clarity</div>
          <div className="text-lg font-bold text-[var(--text)]">
            {hasClarity ? `${clarityVal}%` : 'Not Available'}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)] text-center">
          <div className="text-xs text-[var(--muted)] mb-1">Fluency</div>
          <div className="text-lg font-bold text-[var(--text)]">
            {hasFluency ? `${result.fluency_score}%` : 'Not Available'}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)] text-center">
          <div className="text-xs text-[var(--muted)] mb-1">Pronunciation</div>
          <div className="text-lg font-bold text-[var(--text)]">
            {hasPronunciation ? `${result.pronunciation_score}%` : 'Not Available'}
          </div>
        </div>
      </div>

      {(!hasFluency || !hasPronunciation) && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg)]/70 border border-[var(--border)] text-xs text-[var(--muted)]">
          <Info size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
          <span>
            Acoustic pronunciation or fluency metrics were not measured for this turn. Only verified metrics from the active provider are displayed.
          </span>
        </div>
      )}

      <div className="p-5 rounded-2xl bg-[var(--bg)]/80 border border-[var(--border)] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          <CheckCircle2 size={14} /> AI Coach Feedback
        </div>
        <p className="text-sm text-[var(--text)] leading-relaxed">
          {result.coaching_feedback || 'Good effort! Try to structure your explanation with a clear opening definition, an example, and a conclusion.'}
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw size={16} /> Try Another Topic
        </Button>
      </div>
    </Card>
  );
};
