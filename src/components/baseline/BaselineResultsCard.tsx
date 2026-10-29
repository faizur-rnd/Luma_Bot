import React from 'react';
import { PronunciationScoreResult, PronunciationPhonemeScore } from '../../services/api/types.ts';

interface BaselineResultsCardProps {
  activeScore: PronunciationScoreResult | null;
}

export const BaselineResultsCard: React.FC<BaselineResultsCardProps> = ({ activeScore }) => {
  const measuredPhonemes: PronunciationPhonemeScore[] =
    activeScore?.phonemes
      ?.filter((p: PronunciationPhonemeScore) => typeof p.score === 'number')
      .sort((a: PronunciationPhonemeScore, b: PronunciationPhonemeScore) => (a.score ?? 100) - (b.score ?? 100))
      .slice(0, 3) || [];

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--text)]">Assessment Status</span>
        <span
          className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
            activeScore?.status === 'measured'
              ? 'bg-[var(--success)]/15 text-[var(--success)]'
              : activeScore?.status === 'estimated'
              ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
              : 'bg-[var(--surface)] text-[var(--muted)]'
          }`}
        >
          {activeScore?.status === 'measured'
            ? 'Measured'
            : activeScore?.status === 'estimated'
            ? 'Estimated'
            : 'Not Available'}
        </span>
      </div>

      {activeScore && activeScore.overallScore !== null ? (
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] uppercase">Overall</div>
            <div className="text-lg font-black text-[var(--text)]">{activeScore.overallScore}%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] uppercase">Intelligibility</div>
            <div className="text-lg font-black text-[var(--text)]">
              {activeScore.intelligibilityScore !== null ? `${activeScore.intelligibilityScore}%` : 'Not Available'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] uppercase">Fluency</div>
            <div className="text-lg font-black text-[var(--text)]">
              {activeScore.fluencyScore !== null ? `${activeScore.fluencyScore}%` : 'Not Available'}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Acoustic phoneme scoring is <strong>Not Available</strong> for this sample (external acoustic provider not configured or no audio captured). Your Day-0 checkpoint is saved and your 12-week program is unlocked.
        </p>
      )}

      {measuredPhonemes.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-bold text-[var(--text)] mb-1">
            Top 3 Measured Improvement Areas:
          </div>
          <div className="flex flex-wrap gap-2">
            {measuredPhonemes.map((ph: PronunciationPhonemeScore, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
              >
                {ph.phoneme}: {ph.score}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
