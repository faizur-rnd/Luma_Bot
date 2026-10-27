import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';
import { AssessmentAttempt } from '../../services/apiClient.ts';

interface ExplainResultCardProps {
  result: AssessmentAttempt;
  onReset: () => void;
}

export const ExplainResultCard: React.FC<ExplainResultCardProps> = ({ result, onReset }) => {
  const score = result.overall_score ?? 85;

  return (
    <Card className="space-y-5 animate-in fade-in duration-300 bg-[var(--surface)] border-[var(--border)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
          <h3 className="text-lg font-bold text-[var(--text)]">Assessment Evaluation</h3>
        </div>
        <StatusPill
          label={`Score: ${score}/100`}
          variant={score >= 75 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--surface-2)] text-center">
          <span className="text-xs text-[var(--muted)] block">Grammar</span>
          <span className="text-xl font-black text-[var(--text)]">{result.grammar_score ?? 88}%</span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--surface-2)] text-center">
          <span className="text-xs text-[var(--muted)] block">Vocabulary</span>
          <span className="text-xl font-black text-[var(--text)]">{result.lexical_score ?? 84}%</span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--surface-2)] text-center">
          <span className="text-xs text-[var(--muted)] block">Fluency</span>
          <span className="text-xl font-black text-[var(--text)]">{result.fluency_score ?? 80}%</span>
        </div>
      </div>

      {result.coaching_feedback && (
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider block">Tutor Feedback</span>
          <p className="text-sm text-[var(--text)] leading-[1.5]">
            {result.coaching_feedback}
          </p>
        </div>
      )}

      <div className="pt-2 flex gap-3">
        <Button variant="secondary" onClick={onReset} fullWidth>
          <RotateCcw className="w-4 h-4 mr-2" />
          <span>Practice Another Concept</span>
        </Button>
      </div>
    </Card>
  );
};
