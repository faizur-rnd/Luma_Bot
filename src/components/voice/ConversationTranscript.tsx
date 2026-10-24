import React, { useEffect, useRef } from 'react';
import { Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

export interface MessageEntry {
  id: string;
  sender: 'user' | 'luma';
  text: string;
  translation?: string;
  correction?: string;
  pronunciationTip?: string;
  isCurriculumRedirect?: boolean;
  timestamp: string;
}

interface ConversationTranscriptProps {
  messages: MessageEntry[];
  currentTranscript: string;
  theme: 'dark' | 'light';
  onSpeakText?: (text: string) => void;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  currentTranscript,
  theme,
  onSpeakText
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4"
      role="log"
      aria-label="Conversation history"
    >
      {messages.length === 0 && !currentTranscript && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-75">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Start talking with LUMA
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Tap the button below or start speaking. Ask questions, practice dialogues, or explain ideas.
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
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-sm text-sm ${
                isUser
                  ? 'bg-violet-600 text-white rounded-br-none'
                  : theme === 'dark'
                  ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
                  : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none shadow'
              }`}
            >
              {/* Message Content */}
              <div className="flex items-start justify-between gap-3">
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {!isUser && onSpeakText && (
                  <button
                    onClick={() => onSpeakText(msg.text)}
                    className="p-1 rounded hover:bg-slate-700/30 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                    title="Listen to this message"
                    aria-label="Listen to message"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Translation if available */}
              {msg.translation && (
                <div className="mt-2 pt-2 border-t border-slate-700/40 text-xs text-slate-400 dark:text-slate-300 italic">
                  <span>Translation: {msg.translation}</span>
                </div>
              )}

              {/* Gentle Grammar/Vocabulary Correction */}
              {msg.correction && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold">Helpful tip: </span>
                    <span>{msg.correction}</span>
                  </div>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        );
      })}

      {/* Real-time live transcript while user is speaking */}
      {currentTranscript && (
        <div className="flex flex-col items-end">
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-violet-600/30 border border-violet-500/50 text-slate-200 text-sm animate-pulse rounded-br-none">
            <span className="italic">{currentTranscript}</span>
          </div>
          <span className="text-[10px] text-violet-400 mt-1">Speaking now...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
