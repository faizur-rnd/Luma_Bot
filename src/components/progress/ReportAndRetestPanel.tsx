import React, { useEffect, useState, useRef } from 'react';
import {
  Award,
  Calendar,
  Share2,
  Printer,
  Volume2,
  Square,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';
import { checkpointReportApi } from '../../services/api/checkpointReportApi.ts';
import { programApi } from '../../services/api/programApi.ts';
import { PhonemeMasteryItem, CurrentProgramSessionResponse } from '../../services/api/types.ts';
import { ctaAnalytics } from '../../services/analytics.ts';

interface ReportAndRetestPanelProps {
  onOpenBaseline?: () => void;
}

export const ReportAndRetestPanel: React.FC<ReportAndRetestPanelProps> = ({ onOpenBaseline }) => {
  const [program, setProgram] = useState<CurrentProgramSessionResponse | null>(null);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [phonemes, setPhonemes] = useState<PhonemeMasteryItem[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [submittingRetest, setSubmittingRetest] = useState(false);
  const [shareState, setShareState] = useState<{ url: string; tokenHash?: string } | null>(null);
  const [playingSlot, setPlayingSlot] = useState<'baseline' | 'latest' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadData = async () => {
    try {
      const [progRes, cpRes, phRes, repRes] = await Promise.all([
        programApi.getCurrentProgram().catch(() => null),
        checkpointReportApi.getCheckpoints().catch(() => ({ checkpoints: [] })),
        checkpointReportApi.getPhonemeMastery().catch(() => ({ phonemes: [] })),
        checkpointReportApi.getComparisonReport().catch(() => ({ report: null })),
      ]);
      setProgram(progRes);
      setCheckpoints(cpRes.checkpoints || []);
      setPhonemes(phRes.phonemes || []);
      setReport(repRes.report ?? repRes ?? null);
    } catch {}
  };

  useEffect(() => {
    loadData();
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const currentWeek = program?.weekNumber ?? 1;
  const hasBaseline = checkpoints.some(
    (c) => c.checkpoint_type === 'baseline' || c.type === 'baseline' || c.week_number === 0
  );
  const isMilestoneWeek = currentWeek === 4 || currentWeek === 8 || currentWeek === 12;

  const handleLogCheckpoint = async (type: 'weekly' | 'retest', weekNum: number) => {
    setSubmittingRetest(true);
    setStatusMessage(null);
    ctaAnalytics.track('weekly_checkpoint_completed', { week: weekNum, type });
    try {
      await checkpointReportApi.submitRetest({
        weekNumber: weekNum,
        type,
        metrics: {
          measurementStatus: 'estimated',
          overallScore: null,
          recordedAt: new Date().toISOString(),
        },
      });
      setStatusMessage(
        type === 'retest'
          ? `Week ${weekNum} milestone retest recorded.`
          : `Week ${weekNum} checkpoint logged.`
      );
      await loadData();
    } catch (e: any) {
      setStatusMessage(e?.message || 'Could not record checkpoint.');
    } finally {
      setSubmittingRetest(false);
    }
  };

  const handlePlayAudio = (slot: 'baseline' | 'latest', url?: string | null) => {
    if (playingSlot === slot) {
      audioRef.current?.pause();
      setPlayingSlot(null);
      return;
    }
    const targetUrl = url || '/api/speech/reference?text=Please%20call%20Stella';
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(targetUrl);
    audioRef.current = audio;
    setPlayingSlot(slot);
    audio.onended = () => setPlayingSlot(null);
    audio.onerror = () => {
      setPlayingSlot(null);
      setStatusMessage('Audio recording is not available for playback in this session.');
    };
    audio.play().catch(() => setPlayingSlot(null));
  };

  const handleShareReport = async () => {
    setStatusMessage(null);
    ctaAnalytics.track('final_report_viewed', { week: currentWeek });
    try {
      const res = await checkpointReportApi.shareReport({
        title: `LUMA 12-Week Progress Report (Week ${currentWeek})`,
        daysValid: 14,
      });
      const token = res.token || res.tokenHash || '';
      const url = res.shareUrl || `${window.location.origin}/api/reports/shared/${token}`;
      setShareState({ url, tokenHash: res.tokenHash || token });
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url).catch(() => {});
      }
      setStatusMessage('Privacy-safe share link created (no email or private PII exposed).');
    } catch (e: any) {
      setStatusMessage(e?.message || 'Unable to generate share link until baseline is completed.');
    }
  };

  const handleRevokeShare = async () => {
    if (!shareState?.tokenHash) return;
    try {
      await checkpointReportApi.revokeSharedReport(shareState.tokenHash);
      setShareState(null);
      setStatusMessage('Shared report link revoked.');
    } catch {
      setShareState(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                12-Week Checkpoints & Retesting
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[var(--text)] mt-1">
              Week {currentWeek} Milestone & Retest Status
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!hasBaseline && onOpenBaseline && (
              <Button variant="primary" size="sm" onClick={onOpenBaseline}>Start Baseline Assessment</Button>
            )}
            <Button variant="secondary" size="sm" isLoading={submittingRetest} onClick={() => handleLogCheckpoint('weekly', currentWeek)}>
              <CheckCircle2 size={14} /> Log Week {currentWeek} Checkpoint
            </Button>
            {isMilestoneWeek && (
              <Button variant="primary" size="sm" isLoading={submittingRetest} onClick={() => handleLogCheckpoint('retest', currentWeek)}>
                <RefreshCw size={14} /> Start Week {currentWeek} Retest
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { week: 0, label: 'Day-0 Baseline' },
            { week: 4, label: 'Week 4 Retest' },
            { week: 8, label: 'Week 8 Retest' },
            { week: 12, label: 'Week 12 Final' },
          ].map((m) => {
            const done = (m.week === 0 && hasBaseline) || checkpoints.some((c) => c.week_number === m.week);
            const isDue = currentWeek >= m.week && !done;
            return (
              <div key={m.week} className={`p-3.5 rounded-xl border ${done ? 'border-[var(--success)]/40 bg-[var(--success)]/5' : isDue ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/40'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[var(--text)]">{m.label}</span>
                  <StatusPill status={done ? 'measured' : isDue ? 'estimated' : 'not_measured_yet'} label={done ? 'Done' : isDue ? 'Due' : `Wk ${m.week}`} />
                </div>
                {m.week === 0 && !done && onOpenBaseline ? (
                  <button type="button" onClick={onOpenBaseline} className="text-xs font-semibold text-[var(--accent)] hover:underline mt-1">Record Baseline →</button>
                ) : m.week > 0 && isDue ? (
                  <button type="button" onClick={() => handleLogCheckpoint('retest', m.week)} className="text-xs font-semibold text-[var(--accent)] hover:underline mt-1">Log Week {m.week} Retest →</button>
                ) : (
                  <span className="text-[11px] text-[var(--muted)]">{done ? 'Recorded in program log' : 'Unlocks at milestone week'}</span>
                )}
              </div>
            );
          })}
        </div>

        {report?.baseline && (
          <div className="p-4 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--text)]">Before & After Comparison Report</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handlePlayAudio('baseline', report.baseline?.audioUrl)}>
                  {playingSlot === 'baseline' ? <Square size={13} /> : <Volume2 size={13} />}
                  {playingSlot === 'baseline' ? 'Stop Audio' : 'Play Baseline Audio'}
                </Button>
                {report.latest && (
                  <Button variant="ghost" size="sm" onClick={() => handlePlayAudio('latest', report.latest?.audioUrl)}>
                    {playingSlot === 'latest' ? <Square size={13} /> : <Volume2 size={13} />}
                    {playingSlot === 'latest' ? 'Stop Audio' : 'Play Latest Audio'}
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer size={13} /> Export PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={handleShareReport}>
                  <Share2 size={13} /> Share Report
                </Button>
              </div>
            </div>

            {shareState && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">
                <a href={shareState.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] font-mono truncate flex items-center gap-1 hover:underline">
                  {shareState.url} <ExternalLink size={12} />
                </a>
                <Button variant="danger" size="sm" onClick={handleRevokeShare}>
                  <Trash2 size={12} /> Revoke Link
                </Button>
              </div>
            )}
          </div>
        )}

        {phonemes.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Tracked Phoneme Mastery</span>
            <div className="flex flex-wrap gap-2">
              {phonemes.slice(0, 8).map((p) => (
                <div key={p.phoneme} className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs flex items-center gap-2">
                  <span className="font-mono font-bold text-[var(--text)]">/{p.phoneme}/</span>
                  <span className="text-[var(--muted)]">
                    {p.mastery !== null && p.mastery !== undefined ? `${Math.round(p.mastery)}%` : 'Not Measured'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] pt-1">
            <AlertCircle size={14} className="text-[var(--accent)] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </Card>
    </div>
  );
};
