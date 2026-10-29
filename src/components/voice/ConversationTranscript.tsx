import React, { useEffect, useRef } from 'react';
import { Volume2, Sparkles, CheckCircle2, Bot, Mic } from 'lucide-react';
import { VoiceGenderToggle, VoiceGender } from './VoiceGenderToggle.tsx';
import { AudioWaveVisualizer } from '../audio/AudioWaveVisualizer.tsx';

export interface MessageEntry {
  id: string;
  sender: 'user' | 'luma';
  text: string;
  translation?: string;
  correction?: string;
  phonemeCue?: string;
  followUps?: string[];
  timestamp: string;
}

interface ConversationTranscriptProps {
  messages: MessageEntry[];
  currentTranscript: string;
  targetLang?: string;
  voiceGender?: VoiceGender;
  onVoiceGenderChange?: (gender: VoiceGender) => void;
  isAudioActive?: boolean;
  audioLevel?: number;
  onSpeakText?: (text: string) => void;
  onSelectPrompt?: (text: string) => void;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  currentTranscript,
  targetLang = 'en',
  voiceGender = 'female',
  onVoiceGenderChange,
  isAudioActive = false,
  audioLevel = 0,
  onSpeakText,
  onSelectPrompt
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const isArabic = targetLang === 'ar';
  const starterPrompts = isArabic
    ? [
        { text: 'السَّلَامُ عَلَيْكُمْ، دَعْنَا نَتَدَرَّبُ عَلَى مَخَارِجِ الحُرُوفِ.', tag: 'Phonetics', label: 'Articulatory Warm-up' },
        { text: 'كَيْفَ أُقَدِّمُ عَرْضًا مِهْنِيًّا أَمَامَ الفَرِيقِ؟', tag: 'Fluency', label: 'Workplace Speech' },
        { text: 'اشْرَحْ لِي طَرِيقَةَ نُطْقِ الحُرُوفِ اللَّثَوِيَّةِ بِوُضُوح.', tag: 'Clarity', label: 'Consonant Contrast' }
      ]
    : [
        { text: 'Let’s practice /θ/ and /ð/ minimal pairs with feedback.', tag: 'Phonetics', label: 'Dental Fricatives (/θ/ vs /ð/)' },
        { text: 'Simulate a quick 2-minute workplace project update.', tag: 'Fluency', label: 'Professional Cadence' },
        { text: 'Give me a fast tongue twister for consonant clusters.', tag: 'Speed', label: 'Cluster Agility' },
        { text: 'How do I master sentence stress and schwa reduction?', tag: 'Rhythm', label: 'Word & Sentence Stress' }
      ];

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface-2)]">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            {isAudioActive && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--success)] rounded-full ring-2 ring-[var(--surface)] animate-ping" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-[var(--text)]">LUMA Speaking Coach</span>
            <span className="text-[10px] text-[var(--muted)] block">Interactive Articulation & Fluency Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAudioActive && (
            <AudioWaveVisualizer isActive={true} audioLevel={audioLevel} colorScheme="cyan" />
          )}
          {onVoiceGenderChange && (
            <VoiceGenderToggle gender={voiceGender} onToggle={onVoiceGenderChange} compact={true} />
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0"
        role="log"
        aria-label="Conversation with coach"
      >
        {messages.length === 0 && !currentTranscript && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center mb-3 text-[var(--accent)] shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[var(--text)] tracking-tight">
              {isArabic ? 'تَحَدَّثْ مَعَ مُدَرِّبِ النُّطْقِ الفَوْرِيِّ' : 'Interactive Speaking Coach'}
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-xs mt-1">
              Click Start Speaking below, or choose an articulation prompt to begin your live dialogue.
            </p>

            <div className="w-full max-w-sm mt-4 space-y-2 text-left">
              {starterPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPrompt?.(p.text)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <div className="truncate mr-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent)] block">
                      {p.label}
                    </span>
                    <span className="text-xs text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate block">
                      {p.text}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-semibold shrink-0">
                    {p.tag}
                  </span>
                </button>
              ))}
            </div>
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
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 text-sm leading-relaxed border shadow-sm ${
                  isUser
                    ? 'bg-[var(--accent)] text-white border-transparent rounded-br-sm'
                    : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] rounded-bl-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {!isUser && onSpeakText && (
                    <button
                      type="button"
                      onClick={() => onSpeakText(msg.text)}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors shrink-0 cursor-pointer"
                      title="Listen to model pronunciation"
                      aria-label="Listen to model pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {msg.phonemeCue && (
                  <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs text-[var(--text)] flex items-center gap-1.5">
                    <span className="font-bold text-[var(--accent)]">Articulation Cue:</span>
                    <span>{msg.phonemeCue}</span>
                  </div>
                )}

                {msg.correction && (
                  <div className="mt-2 p-2 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 text-xs text-[var(--success)] flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{msg.correction}</span>
                  </div>
                )}

                {msg.translation && (
                  <p className="mt-2 pt-2 border-t border-[var(--border)]/60 text-xs text-[var(--muted)] italic">
                    {msg.translation}
                  </p>
                )}
              </div>

              <span className="text-[10px] text-[var(--muted)] mt-1 px-1">
                {isUser ? 'You' : 'LUMA Coach'} • {msg.timestamp}
              </span>
            </div>
          );
        })}

        {lastMessage && lastMessage.sender === 'luma' && lastMessage.followUps && lastMessage.followUps.length > 0 && (
          <div className="pt-1 flex flex-wrap gap-2" aria-label="Suggested responses">
            {lastMessage.followUps.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt?.(chip)}
                className="text-xs px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl p-3 text-sm bg-[var(--accent)]/15 text-[var(--text)] border border-[var(--accent)]/40 italic flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse shrink-0" />
              <span>{currentTranscript}...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
