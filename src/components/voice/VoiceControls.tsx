import React, { useState } from 'react';
import { Mic, MicOff, MessageSquare, Send, RotateCcw, Gauge, Square } from 'lucide-react';
import { VoiceSessionState } from '../orb/types.ts';
import { Button } from '../ui/Button.tsx';
import { AudioWaveVisualizer } from '../audio/AudioWaveVisualizer.tsx';

interface VoiceControlsProps {
  orbState: VoiceSessionState;
  isListening: boolean;
  isSlowerSpeech: boolean;
  audioLevel?: number;
  textInput: string;
  onToggleMic: () => void;
  onStopSpeaking?: () => void;
  onRepeatLastReply: () => void;
  onToggleSlowerSpeech: () => void;
  onTextInputChange: (val: string) => void;
  onSendTextMessage: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  orbState,
  isListening,
  isSlowerSpeech,
  audioLevel = 0,
  textInput,
  onToggleMic,
  onStopSpeaking,
  onRepeatLastReply,
  onToggleSlowerSpeech,
  onTextInputChange,
  onSendTextMessage
}) => {
  const [showTextInput, setShowTextInput] = useState(false);

  const getPrimaryLabel = (): string => {
    if (isListening) return 'Stop Recording';
    switch (orbState) {
      case 'transcribing':
        return 'Processing Speech...';
      case 'thinking':
        return 'Coach Thinking...';
      case 'speaking':
        return 'Interrupt & Speak';
      case 'offline_error':
        return 'Retry Microphone';
      case 'idle':
      default:
        return 'Start Speaking';
    }
  };

  const primaryLabel = getPrimaryLabel();

  return (
    <div
      className="p-3.5 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md"
      role="region"
      aria-label="Voice conversation controls"
    >
      <div className="max-w-[720px] mx-auto flex flex-col gap-2.5">
        {showTextInput ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTextInput(false)}
              className="h-11 px-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors inline-flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              title="Switch back to voice microphone"
              aria-label="Switch back to microphone"
            >
              <Mic className="w-4 h-4 text-[var(--accent)]" />
              <span className="hidden sm:inline">Voice</span>
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => onTextInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && textInput.trim() && onSendTextMessage()}
              placeholder="Type a response or phrase to practice..."
              aria-label="Message to coach"
              className="flex-1 h-11 px-4 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] focus:border-[var(--accent)] text-sm outline-none transition-colors"
              autoFocus
            />
            <Button
              variant="primary"
              onClick={onSendTextMessage}
              disabled={!textInput.trim()}
              className="h-11 shrink-0"
              aria-label="Send message to coach"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRepeatLastReply}
                className="h-11 px-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                title="Replay last coach audio"
                aria-label="Replay coach audio"
              >
                <RotateCcw className="w-4 h-4 text-[var(--muted)]" />
                <span className="hidden sm:inline">Replay</span>
              </button>

              {orbState === 'speaking' && onStopSpeaking && (
                <button
                  type="button"
                  onClick={onStopSpeaking}
                  className="h-11 px-3 rounded-xl bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger)]/25 transition-all inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
                  title="Stop coach audio playback"
                  aria-label="Stop coach audio"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Stop Audio</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleMic}
              disabled={orbState === 'transcribing' || orbState === 'thinking'}
              aria-pressed={isListening}
              aria-label={primaryLabel}
              className={`flex-1 max-w-[270px] h-12 px-5 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer select-none shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isListening
                  ? 'bg-[var(--danger)] text-white'
                  : 'bg-[var(--accent)] text-white hover:opacity-95'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white shrink-0" />
                  <span>Stop Recording</span>
                  <AudioWaveVisualizer isActive={true} audioLevel={audioLevel} barCount={4} colorScheme="cyan" />
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white shrink-0" />
                  <span className="truncate">{primaryLabel}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleSlowerSpeech}
                className={`h-11 px-3 rounded-xl border text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isSlowerSpeech
                    ? 'bg-[var(--warning)]/15 border-[var(--warning)] text-[var(--warning)]'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]'
                }`}
                title={isSlowerSpeech ? '0.8x Slow Pace active — click for 1.0x Normal Pace' : 'Switch to 0.8x Slow Pace'}
                aria-pressed={isSlowerSpeech}
                aria-label={isSlowerSpeech ? '0.8x Slow Pace active' : '1.0x Normal Pace'}
              >
                <Gauge className="w-4 h-4 text-[var(--muted)]" />
                <span className="hidden sm:inline">{isSlowerSpeech ? '0.8x Slow' : '1.0x Pace'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTextInput(true)}
                className="h-11 px-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                title="Type message instead of speaking"
                aria-label="Type message instead of speaking"
              >
                <MessageSquare className="w-4 h-4 text-[var(--muted)]" />
                <span className="hidden md:inline">Type</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
