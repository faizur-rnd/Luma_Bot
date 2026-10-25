import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, RotateCcw, Plus, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { apiClient, VocabularyItem, UserProfile } from '../../services/apiClient.ts';

interface MyWordsViewProps {
  profile?: UserProfile | null;
  onSpeakWord?: (word: string) => void;
}

export const MyWordsView: React.FC<MyWordsViewProps> = ({ profile, onSpeakWord }) => {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    try {
      const vocab = await apiClient.getVocabulary();
      if (vocab.length === 0) {
        // Seed initial practice words if empty
        const defaultWords: Partial<VocabularyItem>[] = [
          { term: 'Gratitude', translation: 'நன்றி / A feeling of thankfulness', part_of_speech: 'noun', context_example: 'She expressed deep gratitude for their support.' },
          { term: 'Patience', translation: 'பொறுமை / The capacity to accept delay calmly', part_of_speech: 'noun', context_example: 'Learning a new language requires patience and repetition.' },
          { term: 'Opportunity', translation: 'வாய்ப்பு / A set of circumstances making something possible', part_of_speech: 'noun', context_example: 'Speaking daily is an opportunity to improve.' }
        ];
        const seeded: VocabularyItem[] = [];
        for (const w of defaultWords) {
          const saved = await apiClient.saveVocabulary(w);
          seeded.push(saved);
        }
        setItems(seeded);
      } else {
        setItems(vocab);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (performance: 'again' | 'good') => {
    if (items.length === 0) return;
    const current = items[currentIndex];

    const nextBox = performance === 'good' ? Math.min(5, (current.leitner_box || 1) + 1) : 1;
    const nextMastery = performance === 'good' ? Math.min(5, (current.mastery_level || 1) + 1) : Math.max(1, (current.mastery_level || 1) - 1);

    const updated = await apiClient.saveVocabulary({
      ...current,
      leitner_box: nextBox,
      mastery_level: nextMastery,
      next_review_at: new Date(Date.now() + nextBox * 24 * 60 * 60 * 1000).toISOString()
    });

    const updatedList = [...items];
    updatedList[currentIndex] = updated;
    setItems(updatedList);

    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="w-7 h-7" />}
        title="No words added yet"
        description="Words you practice in conversations will appear here for spaced flashcard review."
      />
    );
  }

  const current = items[currentIndex];

  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col gap-5 py-4">
      {/* Progress Counter */}
      <div className="flex items-center justify-between text-[14px] text-[var(--muted)] font-medium">
        <span>Word {currentIndex + 1} of {items.length}</span>
        <StatusPill label={`Box ${current.leitner_box || 1}`} variant="accent" />
      </div>

      {/* ONE Flashcard at a time */}
      <Card
        padding="lg"
        className="min-h-[280px] flex flex-col justify-between text-center relative cursor-pointer select-none border-2 border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors shadow-[var(--shadow-md)]"
        onClick={() => setShowAnswer((prev) => !prev)}
      >
        <div className="flex justify-end">
          <span className="text-[14px] text-[var(--muted)]">
            {showAnswer ? 'Tap to hide answer' : 'Tap to reveal answer'}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center my-auto gap-3 py-6">
          <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[var(--text)] tracking-tight">
            {current.term}
          </h2>

          {current.phonetic && (
            <p className="text-[16px] text-[var(--muted)] font-mono">
              /{current.phonetic}/
            </p>
          )}

          {current.part_of_speech && (
            <span className="text-[14px] px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-medium">
              {current.part_of_speech}
            </span>
          )}

          {showAnswer && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] w-full flex flex-col gap-2 animate-in fade-in duration-200">
              <p className="text-[20px] font-semibold text-[var(--accent)]">
                {current.translation}
              </p>
              {current.context_example && (
                <p className="text-[14px] text-[var(--muted)] italic max-w-md mx-auto">
                  "{current.context_example}"
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          {onSpeakWord && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSpeakWord(current.term);
              }}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors inline-flex items-center justify-center cursor-pointer"
              title="Hear pronunciation"
              aria-label="Hear pronunciation"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </Card>

      {/* BIG Again / Good Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <button
          onClick={() => handleRate('again')}
          className="min-h-[52px] px-6 py-3 rounded-[16px] bg-[var(--surface-2)] text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 font-bold text-[16px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Again</span>
        </button>

        <button
          onClick={() => handleRate('good')}
          className="min-h-[52px] px-6 py-3 rounded-[16px] bg-[var(--success)] text-white hover:opacity-95 font-bold text-[16px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Good</span>
        </button>
      </div>
    </div>
  );
};
