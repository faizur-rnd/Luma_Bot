import React, { useState } from 'react';
import { Mic, MicOff, MessageSquare, Send, RotateCcw, Gauge } from 'lucide-react';
import { VoiceSessionState } from '../orb/types.ts';
import { Button } from '../ui/Button.tsx';

interface VoiceControlsProps {
  orbState: VoiceSessionState;
  isListening: boolean;
  isSlowerSpeech: boolean;
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
  textInput,
  onToggleMic,
  onRepeatLastReply,
  onToggleSlowerSpeech,
  onTextInputChange,
  onSendTextMessage
}) => {
  const [showTextInput, setShowTextInput] = useState(false);

  // Status words from REAL events only
  const getStatusText = (): string => {
    switch (orbState) {
      case 'listening':
        return 'Listening';
      case 'transcribing':
        return 'Listening';
      case 'thinking':
        return 'Thinking';
      case 'speaking':
        return 'Speaking';
      case 'offline_error':
        return 'Tutor unavailable';
      case 'idle':
      default:
        return 'Tap to talk';
    }
  };

  const statusWord = getStatusText();

  return (
    <div 
      className="p-4 border-t border-[var(--border)] bg-[var(--surface)] backdrop-blur-md transition-colors"
      role="region"
      aria-label="Voice conversation controls"
    >
      <div className="max-w-[720px] mx-auto flex flex-col gap-3">
        {showTextInput ? (
          /* Type Instead Mode */
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTextInput(false)}
              className="min-h-[44px] min-w-[44px] px-3 rounded-[12px] bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors inline-flex items-center justify-center text-[14px] font-semibold cursor-pointer shrink-0"
              title="Switch back to voice"
              aria-label="Switch back to microphone"
            >
              <Mic className="w-5 h-5 text-[var(--accent)]" />
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => onTextInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendTextMessage()}
              placeholder="Type your message to the tutor..."
              aria-label="Message to tutor"
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] focus:border-[var(--accent)] text-[16px] outline-none transition-colors"
              autoFocus
            />
            <Button
              variant="primary"
              onClick={onSendTextMessage}
              disabled={!textInput.trim()}
              className="shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send</span>
            </Button>
          </div>
        ) : (
          /* One Big Mic Button with Secondary Small Buttons */
          <div className="flex items-center justify-between gap-3">
            {/* Small Repeat button */}
            <button
              onClick={onRepeatLastReply}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-[12px] bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors inline-flex items-center justify-center gap-1.5 text-[14px] font-medium cursor-pointer"
              title="Repeat tutor's last response"
              aria-label="Repeat tutor's last response"
            >
              <RotateCcw className="w-4 h-4 text-[var(--muted)]" />
              <span className="hidden sm:inline">Repeat</span>
            </button>

            {/* ONE Big Mic Button */}
            <button
              onClick={onToggleMic}
              aria-pressed={isListening}
              aria-label={`${statusWord} - click to toggle speech input`}
              className={`flex-1 max-w-[280px] min-h-[52px] px-6 py-3 rounded-full font-bold text-[16px] inline-flex items-center justify-center gap-3 transition-all duration-150 cursor-pointer select-none shadow-[var(--shadow-sm)] active:scale-[0.98] ${
                isListening
                  ? 'bg-[var(--danger)] text-white animate-pulse'
                  : 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95'
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
              <span>{statusWord}</span>
            </button>

            {/* Slower & Type Instead controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSlowerSpeech}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-[12px] border transition-colors inline-flex items-center justify-center gap-1.5 text-[14px] font-medium cursor-pointer ${
                  isSlowerSpeech
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]'
                }`}
                title={isSlowerSpeech ? 'Slower speech enabled' : 'Toggle slower speech'}
                aria-pressed={isSlowerSpeech}
                aria-label="Toggle slower speech rate"
              >
                <Gauge className="w-4 h-4 text-[var(--muted)]" />
                <span className="hidden sm:inline">Slower</span>
              </button>

              <button
                onClick={() => setShowTextInput(true)}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-[12px] bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors inline-flex items-center justify-center gap-1.5 text-[14px] font-medium cursor-pointer"
                title="Type message instead of speaking"
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
