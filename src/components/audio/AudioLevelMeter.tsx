import React from 'react';

interface AudioLevelMeterProps {
  level: number; // 0 to 100
  waveform?: number[]; // array of 8 normalized values (0..1)
  durationMs: number;
  maxDurationMs?: number;
  isRecording: boolean;
}

export const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({
  level,
  waveform = [0.1, 0.2, 0.3, 0.2, 0.1, 0.2, 0.1, 0.05],
  durationMs,
  maxDurationMs = 90000,
  isRecording
}) => {
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentFormatted = formatTime(durationMs);
  const maxFormatted = formatTime(maxDurationMs);

  return (
    <div
      className="w-full flex flex-col gap-2 p-3 rounded-[14px] bg-[var(--surface-2)] border border-[var(--border)]"
      role="status"
      aria-live="polite"
      aria-label={`Recording time: ${currentFormatted} of ${maxFormatted}. Current audio input level: ${level} percent.`}
    >
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-[var(--muted)]'
            }`}
            aria-hidden="true"
          />
          <span className="text-[var(--text)]">{isRecording ? 'Recording audio' : 'Microphone ready'}</span>
        </div>
        <span className="text-[var(--muted)] tabular-nums">
          {currentFormatted} / {maxFormatted}
        </span>
      </div>

      {/* Waveform Equalizer Bars */}
      <div className="h-8 flex items-center justify-center gap-1.5 px-2" aria-hidden="true">
        {waveform.map((val, idx) => {
          const heightPct = isRecording ? Math.max(12, Math.min(100, val * 100 * (level > 5 ? 1 : 0.2))) : 12;
          return (
            <div
              key={idx}
              className="w-2 rounded-full bg-[var(--accent)] transition-all duration-75"
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>

      {/* Level Track Bar */}
      <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden" aria-hidden="true">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-75"
          style={{ width: `${isRecording ? level : 0}%` }}
        />
      </div>
    </div>
  );
};
