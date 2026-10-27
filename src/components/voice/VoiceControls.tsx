import React, { useState } from 'react';
import { Mic, MicOff, MessageSquare, Send, RotateCcw, Gauge } from 'lucide-react';
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
  onRepeatLastReply,
  onToggleSlowerSpeech,
  onTextInputChange,
  onSendTextMessage
}) => {
  const [showTextInput, setShowTextInput] = useState(false);

  const getStatusText = (): string => {
    switch (orbState) {
      case 'listening': return 'Listening...';
      case 'transcribing': return 'Processing...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'offline_error': return 'Coach unavailable';
      case 'idle':
      default:
        return 'Tap to Speak';
    }
  };

  const statusWord = getStatusText();

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
              onClick={() => setShowTextInput(false)}
              className="h-11 px-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-cyan-400 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
              title="Switch back to voice"
              aria-label="Switch back to microphone"
            >
              <Mic className="w-4 h-4 text-cyan-400" />
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => onTextInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendTextMessage()}
              placeholder="Ask coach or practice phrase..."
              aria-label="Message to coach"
              className="flex-1 h-11 px-4 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] focus:border-indigo-500 text-sm outline-none transition-colors"
              autoFocus
            />
            <Button
              variant="primary"
              onClick={onSendTextMessage}
              disabled={!textInput.trim()}
              className="h-11 shrink-0 bg-gradient-to-r from-indigo-600 to-cyan-600 border-none shadow-md"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2.5">
            {/* Repeat coach audio */}
            <button
              onClick={onRepeatLastReply}
              className="h-11 px-3.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-indigo-400/50 transition-all inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm active:scale-95"
              title="Replay coach audio"
              aria-label="Replay coach audio"
            >
              <RotateCcw className="w-4 h-4 text-[var(--muted)]" />
              <span className="hidden sm:inline">Replay</span>
            </button>

            {/* Glowing Center Microphone Button */}
            <button
              onClick={onToggleMic}
              aria-pressed={isListening}
              aria-label={`${statusWord} - click to toggle speech input`}
              className={`flex-1 max-w-[280px] h-12 px-6 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer select-none shadow-lg active:scale-95 ${
                isListening
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white hover:shadow-cyan-500/25 shadow-indigo-600/25'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <AudioWaveVisualizer isActive={true} audioLevel={audioLevel} barCount={4} colorScheme="cyan" />
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white" />
                  <span>{statusWord}</span>
                </>
              )}
            </button>

            {/* Slower & Type toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSlowerSpeech}
                className={`h-11 px-3 rounded-xl border text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                  isSlowerSpeech
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:border-indigo-400/50'
                }`}
                title={isSlowerSpeech ? '0.8x Slow Pacing active' : 'Switch to 0.8x slow pacing'}
                aria-pressed={isSlowerSpeech}
              >
                <Gauge className="w-4 h-4 text-[var(--muted)]" />
                <span className="hidden sm:inline">{isSlowerSpeech ? '0.8x' : '1.0x'}</span>
              </button>

              <button
                onClick={() => setShowTextInput(true)}
                className="h-11 px-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-indigo-400/50 transition-all inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm active:scale-95"
                title="Type instead of speaking"
                aria-label="Type instead"
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
