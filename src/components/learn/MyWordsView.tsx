import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, RotateCcw, Plus, Layers, List } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { StatusPill } from '../ui/StatusPill.tsx';
import { apiClient, VocabularyItem, UserProfile } from '../../services/apiClient.ts';
import { DEFAULT_ARABIC_VOCABULARY, DEFAULT_ENGLISH_VOCABULARY } from './defaultVocabulary.ts';
import { AddWordDialog } from './AddWordDialog.tsx';

interface MyWordsViewProps {
  profile?: UserProfile | null;
  onSpeakWord?: (word: string) => void;
}

export const MyWordsView: React.FC<MyWordsViewProps> = ({ profile, onSpeakWord }) => {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'flashcards' | 'list'>('flashcards');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const targetLang = profile?.targetLanguage || profile?.target_language || 'ar';
  const isArabicTarget = targetLang === 'ar';

  useEffect(() => {
    loadWords();
  }, [targetLang]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const vocab = await apiClient.getVocabulary();
      if (vocab.length === 0) {
        const defaultWords = isArabicTarget ? DEFAULT_ARABIC_VOCABULARY : DEFAULT_ENGLISH_VOCABULARY;
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
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (word: string) => {
    if (onSpeakWord) {
      onSpeakWord(word);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = /[\u0600-\u06FF]/.test(word) ? 'ar-SA' : 'en-US';
      window.speechSynthesis.speak(u);
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

  const handleSaveCustomWord = async (wordData: { term: string; translation: string; phonetic?: string; context_example?: string }) => {
    const saved = await apiClient.saveVocabulary({
      ...wordData,
      part_of_speech: 'noun',
      leitner_box: 1,
      mastery_level: 1
    });
    setItems((prev) => [saved, ...prev]);
  };

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.term.toLowerCase().includes(q) ||
      item.translation.toLowerCase().includes(q) ||
      (item.phonetic && item.phonetic.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const current = items[currentIndex];

  return (
    <div className="w-full max-w-[720px] mx-auto flex flex-col gap-5 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['flashcards', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                viewMode === mode
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {mode === 'flashcards' ? <Layers className="w-4 h-4" /> : <List className="w-4 h-4" />}
              <span>{mode === 'flashcards' ? 'Flashcards' : `All Words (${items.length})`}</span>
            </button>
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add word</span>
        </Button>
      </div>

      {viewMode === 'flashcards' && items.length > 0 && current && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium">
            <span>Card {currentIndex + 1} of {items.length}</span>
            <StatusPill label={`Leitner Box ${current.leitner_box || 1}`} variant="accent" />
          </div>

          <Card
            padding="lg"
            className="min-h-[290px] flex flex-col justify-between text-center relative cursor-pointer select-none border-2 border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors shadow-[var(--shadow-md)] bg-[var(--surface)]"
            onClick={() => setShowAnswer((prev) => !prev)}
          >
            <div className="flex justify-between items-center text-xs text-[var(--muted)]">
              <span>{current.part_of_speech || 'word'}</span>
              <span>{showAnswer ? 'Tap to hide answer' : 'Tap to reveal answer'}</span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto gap-3 py-6">
              <h2 className={`text-[32px] sm:text-[38px] font-extrabold text-[var(--text)] tracking-tight ${
                /[\u0600-\u06FF]/.test(current.term) ? 'font-arabic text-[38px] leading-[1.6]' : ''
              }`}>
                {current.term}
              </h2>

              {current.phonetic && (
                <p className="text-[16px] text-[var(--accent)] font-medium">
                  {current.phonetic}
                </p>
              )}

              {showAnswer && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] w-full flex flex-col gap-2 animate-in fade-in duration-200">
                  <p className="text-[20px] font-bold text-[var(--text)]">
                    {current.translation}
                  </p>
                  {current.context_example && (
                    <p className={`text-[14px] text-[var(--muted)] italic max-w-md mx-auto ${
                      /[\u0600-\u06FF]/.test(current.context_example) ? 'font-arabic text-base' : ''
                    }`}>
                      "{current.context_example}"
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak(current.term);
                }}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors inline-flex items-center justify-center cursor-pointer"
                title="Hear pronunciation"
                aria-label="Hear pronunciation"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              type="button"
              onClick={() => handleRate('again')}
              className="min-h-[50px] px-6 py-2.5 rounded-[16px] bg-[var(--surface-2)] text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Review Again</span>
            </button>

            <button
              type="button"
              onClick={() => handleRate('good')}
              className="min-h-[50px] px-6 py-2.5 rounded-[16px] bg-[var(--success)] text-white hover:opacity-95 font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mastered (Good)</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          <Input
            id="search-vocab"
            label="Search vocabulary"
            placeholder="Search by term, translation, or pronunciation..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />

          <div className="grid gap-3">
            {filteredItems.map((item) => {
              const isItemArabic = /[\u0600-\u06FF]/.test(item.term);
              return (
                <Card key={item.id} padding="md" className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[18px] font-bold text-[var(--text)] ${isItemArabic ? 'font-arabic text-[20px]' : ''}`}>
                        {item.term}
                      </span>
                      {item.phonetic && (
                        <span className="text-xs text-[var(--accent)] font-medium">
                          ({item.phonetic})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-0.5 truncate">
                      {item.translation}
                    </p>
                    {item.context_example && (
                      <p className="text-xs text-[var(--muted)] italic mt-1 line-clamp-1">
                        "{item.context_example}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill label={`Box ${item.leitner_box || 1}`} variant="accent" />
                    <button
                      type="button"
                      onClick={() => handleSpeak(item.term)}
                      className="min-h-[40px] min-w-[40px] p-2 rounded-lg bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors inline-flex items-center justify-center cursor-pointer"
                      title="Hear pronunciation"
                      aria-label="Hear pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <AddWordDialog
        isOpen={showAddModal}
        isArabicTarget={isArabicTarget}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveCustomWord}
      />
    </div>
  );
};
