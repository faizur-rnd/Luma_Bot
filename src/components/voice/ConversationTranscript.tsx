import React, { useEffect, useRef } from 'react';
import { Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

export interface MessageEntry {
  id: string;
  sender: 'user' | 'luma';
  text: string;
  translation?: string;
  correction?: string;
  timestamp: string;
}

interface ConversationTranscriptProps {
  messages: MessageEntry[];
  currentTranscript: string;
  onSpeakText?: (text: string) => void;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  currentTranscript,
  onSpeakText
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0"
      role="log"
      aria-label="Conversation history"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.length === 0 && !currentTranscript && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-[16px] bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center mb-3 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-[20px] font-bold text-[var(--text)] leading-[1.3]">
            Start talking with LUMA
          </h3>
          <p className="text-[14px] text-[var(--muted)] max-w-sm mt-1 leading-[1.5]">
            Tap the microphone button or type a message to start practicing.
          </p>
        </div>
      )}

      {messages.map((msg) => {
        const isUser = msg.sender === 'user';
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-[16px] p-4 text-[16px] leading-[1.5] shadow-[var(--shadow-sm)] border ${
                isUser
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-transparent rounded-br-[4px]'
                  : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] rounded-bl-[4px]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {!isUser && onSpeakText && (
                  <button
                    onClick={() => onSpeakText(msg.text)}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-[12px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors inline-flex items-center justify-center shrink-0"
                    title="Repeat aloud"
                    aria-label="Repeat aloud"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {msg.translation && (
                <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] text-[14px] text-[var(--muted)] italic">
                  <span>Translation: {msg.translation}</span>
                </div>
              )}

              {msg.correction && (
                <div className="mt-2.5 p-3 rounded-[12px] bg-[var(--success)]/10 border border-[var(--success)]/30 text-[14px] text-[var(--success)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Suggestion: </span>
                    <span>{msg.correction}</span>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[14px] text-[var(--muted)] px-1 mt-1">
              {msg.timestamp}
            </span>
          </div>
        );
      })}

      {currentTranscript && (
        <div className="flex flex-col items-end">
          <div className="max-w-[88%] rounded-[16px] p-4 bg-[var(--accent)]/30 text-[var(--text)] border border-[var(--accent)]/50 rounded-br-[4px] animate-pulse text-[16px]">
            <p className="italic">{currentTranscript}...</p>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
