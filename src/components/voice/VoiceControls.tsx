import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';
import { VoiceSessionState } from '../VoiceOrb.tsx';

interface VoiceControlsProps {
  orbState: VoiceSessionState;
  isListening: boolean;
  isMuted: boolean;
  textInput: string;
  theme: 'dark' | 'light';
  onToggleMic: () => void;
  onToggleMute: () => void;
  onTextInputChange: (val: string) => void;
  onSendTextMessage: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  orbState,
  isListening,
  isMuted,
  textInput,
  theme,
  onToggleMic,
  onToggleMute,
  onTextInputChange,
  onSendTextMessage
}) => {
  const getStatusText = (): string => {
    switch (orbState) {
      case 'listening':
        return 'Listening...';
      case 'transcribing':
        return 'Processing speech...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      case 'offline_error':
        return 'Tutor unavailable';
      default:
        return 'Tap to talk';
    }
  };

  const isOrbActive = orbState === 'listening' || orbState === 'speaking' || orbState === 'thinking';

  return (
    <div
      className="p-3 sm:p-4 border-t transition-colors backdrop-blur-md"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
      }}
    >
      <div className="flex flex-col gap-3 max-w-2xl mx-auto">
        {/* Primary Interactive Mic Button with Plain Status */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onToggleMic}
            className={`min-h-[48px] px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-3 transition-all cursor-pointer shadow-md select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : isOrbActive
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white'
            }`}
            aria-label={getStatusText()}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white animate-bounce" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
            <span className="tracking-wide">{getStatusText()}</span>
          </button>

          {/* Speaker Mute/Unmute */}
          <button
            onClick={onToggleMute}
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-colors cursor-pointer hover:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500"
            style={{
              backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
              borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
              color: isMuted ? '#EF4444' : theme === 'dark' ? '#F8FAFC' : '#0F172A'
            }}
            aria-label={isMuted ? 'Unmute tutor audio' : 'Mute tutor audio'}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Text fallback input */}
        <div className="flex items-center gap-2">
          <label htmlFor="voice-text-input" className="sr-only">Type a message to tutor</label>
          <input
            id="voice-text-input"
            type="text"
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendTextMessage()}
            placeholder="Or type a message to your tutor..."
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
              borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
              color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
            }}
          />
          <button
            onClick={onSendTextMessage}
            disabled={!textInput.trim()}
            className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
