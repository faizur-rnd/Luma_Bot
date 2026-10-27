import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog.tsx';
import { Button } from '../ui/Button.tsx';

interface AddWordDialogProps {
  isOpen: boolean;
  isArabicTarget: boolean;
  onClose: () => void;
  onSave: (word: { term: string; translation: string; phonetic?: string; context_example?: string }) => Promise<void>;
}

export const AddWordDialog: React.FC<AddWordDialogProps> = ({
  isOpen,
  isArabicTarget,
  onClose,
  onSave
}) => {
  const [term, setTerm] = useState('');
  const [translation, setTranslation] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [example, setExample] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !translation.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        term: term.trim(),
        translation: translation.trim(),
        phonetic: phonetic.trim() || undefined,
        context_example: example.trim() || undefined
      });
      setTerm('');
      setTranslation('');
      setPhonetic('');
      setExample('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Vocabulary Word"
      description="Save a new word or phrase to your personal spaced repetition deck."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div>
          <label className="block text-sm font-semibold text-[var(--text)] mb-1">
            Word or Phrase (Target Language)
          </label>
          <input
            type="text"
            required
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={isArabicTarget ? 'مثال: السَّلَامُ عَلَيْكُمْ' : 'e.g. Bonjour, Gracias'}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            dir={/[\u0600-\u06FF]/.test(term) ? 'rtl' : 'ltr'}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text)] mb-1">
            Translation & Meaning
          </label>
          <input
            type="text"
            required
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="e.g. Peace be upon you / Hello"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text)] mb-1">
            Pronunciation / Transliteration (Optional)
          </label>
          <input
            type="text"
            value={phonetic}
            onChange={(e) => setPhonetic(e.target.value)}
            placeholder="e.g. As-salāmu ʿalaykum"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text)] mb-1">
            Context Example Sentence (Optional)
          </label>
          <input
            type="text"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="Use it in a natural sentence..."
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            dir={/[\u0600-\u06FF]/.test(example) ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="flex gap-2.5 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving} fullWidth>
            {isSaving ? 'Saving word...' : 'Save to My Words'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
