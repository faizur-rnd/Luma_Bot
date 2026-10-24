import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Volume2, 
  Check, 
  RotateCw, 
  Plus, 
  Sparkles, 
  Search, 
  BookMarked,
  X
} from 'lucide-react';
import { apiClient, VocabularyItem, UserProfile } from '../services/apiClient.ts';

interface VocabularyVaultViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
}

export const VocabularyVaultView: React.FC<VocabularyVaultViewProps> = ({ profile, theme }) => {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBox, setSelectedBox] = useState<number | 'all'>('all');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newPos, setNewPos] = useState('noun');
  const [newExample, setNewExample] = useState('');

  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [newLanguage, setNewLanguage] = useState<string>(profile?.target_language || 'en');

  useEffect(() => {
    loadVocabulary();
    if (profile?.target_language) {
      setNewLanguage(profile.target_language);
    }
  }, [profile?.target_language]);

  const loadVocabulary = async () => {
    try {
      const vocab = await apiClient.getVocabulary();
      setItems(vocab);
    } catch (e) {
      console.error('Failed to load vocabulary:', e);
    }
  };

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const speakTerm = (term: string, e: React.MouseEvent, itemLang?: string) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(term);
      const isArabic = itemLang === 'ar' || /[ا-ي]/.test(term);
      const isGerman = itemLang === 'de' || /[äöüßÄÖÜ]/.test(term) || term.startsWith('Die ') || term.startsWith('Das ') || term.startsWith('Der ');
      u.lang = isArabic ? 'ar-SA' : isGerman ? 'de-DE' : 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const advanceLeitnerBox = async (item: VocabularyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBox = Math.min(5, (item.leitner_box || 1) + 1);
    const newMastery = Math.min(5, (item.mastery_level || 1) + 1);
    const updated = await apiClient.saveVocabulary({
      ...item,
      leitner_box: newBox,
      mastery_level: newMastery,
      next_review_at: new Date(Date.now() + newBox * 86400000).toISOString()
    });
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
  };

  const resetLeitnerBox = async (item: VocabularyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await apiClient.saveVocabulary({
      ...item,
      leitner_box: 1,
      mastery_level: Math.max(1, (item.mastery_level || 1) - 1),
      next_review_at: new Date().toISOString()
    });
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newTranslation.trim()) return;

    const newItem = await apiClient.saveVocabulary({
      term: newTerm.trim(),
      language: newLanguage,
      translation: newTranslation.trim(),
      part_of_speech: newPos,
      context_example: newExample.trim(),
      mastery_level: 1,
      leitner_box: 1
    });

    setItems(prev => [newItem, ...prev]);
    setNewTerm('');
    setNewTranslation('');
    setNewExample('');
    setShowAddModal(false);
  };

  const getItemLanguage = (item: any): string => {
    if (item.language) return item.language;
    if (/[ا-ي]/.test(item.term)) return 'ar';
    if (/[äöüßÄÖÜ]/.test(item.term) || item.term.startsWith('Die ') || item.term.startsWith('Das ') || item.term.startsWith('Der ')) return 'de';
    return 'en';
  };

  const filteredItems = items.filter(item => {
    const lang = getItemLanguage(item);
    const matchesLang = selectedLanguage === 'all' || lang === selectedLanguage;
    const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBox = selectedBox === 'all' || item.leitner_box === selectedBox;
    return matchesLang && matchesSearch && matchesBox;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-aurora p-[2px] flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-[#080B14] flex items-center justify-center">
              <Layers className="w-6 h-6 text-[#22D3EE]" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Spaced Repetition Vocabulary Vault</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Review words with the Leitner 5-box algorithm for high-retention conversational recall.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-cosmic text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/20 cursor-pointer hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Word</span>
        </button>
      </div>

      {/* Filter and Leitner Box Navigation */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border"
        style={{
          backgroundColor: theme === 'dark' ? '#0D1220' : '#F1F5F9',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words or bridge translations..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0',
                color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
              }}
            />
          </div>

          {/* Language Selector Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] mr-1">Language:</span>
            {[
              { code: 'all', label: 'All' },
              { code: 'en', label: '🇬🇧 English' },
              { code: 'ar', label: '🇸🇦 العربية' },
              { code: 'de', label: '🇩🇪 Deutsch' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setSelectedLanguage(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedLanguage === l.code
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[#64748B] dark:text-[#CBD5E1] hover:text-white bg-black/5 dark:bg-white/5'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leitner Box Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-black/5 dark:border-white/5">
          <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] mr-1">Leitner Level:</span>
          <button
            onClick={() => setSelectedBox('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              selectedBox === 'all'
                ? 'bg-gradient-cosmic text-white'
                : 'text-[#64748B] hover:text-white bg-black/5 dark:bg-white/5'
            }`}
          >
            All Boxes ({items.length})
          </button>
          {[1, 2, 3, 4, 5].map(b => {
            const count = items.filter(i => (i.leitner_box || 1) === b).length;
            return (
              <button
                key={b}
                onClick={() => setSelectedBox(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedBox === b
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#64748B] hover:text-white bg-black/5 dark:bg-white/5'
                }`}
              >
                Box {b} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isFlipped = Boolean(flippedCards[item.id]);
          const lang = getItemLanguage(item);
          const isArabic = lang === 'ar';

          return (
            <div
              key={item.id}
              onClick={() => toggleFlip(item.id)}
              className="min-h-[220px] p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 cursor-pointer hover:border-[#8B5CF6]/50 shadow-sm relative overflow-hidden"
              style={{
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
              }}
            >
              {/* Card Top: Part of Speech, Language Badge & Leitner Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    lang === 'ar' ? 'bg-[#10B981]/15 text-[#10B981]' : lang === 'de' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-[#3B82F6]/15 text-[#3B82F6]'
                  }`}>
                    {lang === 'ar' ? '🇸🇦 AR' : lang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] font-bold">
                    {item.part_of_speech}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded">
                  Leitner Box {item.leitner_box || 1}
                </span>
              </div>

              {/* Card Body: Front vs Back */}
              <div className="my-3">
                {!isFlipped ? (
                  <div dir={isArabic ? 'rtl' : 'ltr'}>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold tracking-tight ${isArabic ? 'text-2xl font-serif' : 'text-xl'}`}>
                        {item.term}
                      </h3>
                      <button
                        onClick={(e) => speakTerm(item.term, e, lang)}
                        className="p-1 rounded-full text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                        title="Pronounce aloud with native accent"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.phonetic && (
                      <span className="text-xs font-mono text-[#64748B] block mt-0.5" dir="ltr">
                        {item.phonetic}
                      </span>
                    )}
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-3 italic" dir="ltr">
                      Tap card to view bridge translation & example sentence
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="text-xs font-bold text-[#38BDF8]">
                      Bridge Translation:
                    </div>
                    <p className="text-sm font-semibold text-white/95">
                      {item.translation}
                    </p>
                    {item.context_example && (
                      <div className="pt-2 text-xs text-[#64748B] dark:text-[#CBD5E1] border-t border-black/5 dark:border-white/5 italic">
                        "{item.context_example}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Active Spaced Repetition Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/5 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => resetLeitnerBox(item, e)}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-[#FB7185]/30 text-[#FB7185] hover:bg-[#FB7185]/10 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Needs Practice (Reset to Box 1)"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Practice</span>
                </button>

                <button
                  onClick={(e) => advanceLeitnerBox(item, e)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 hover:bg-[#34D399]/25 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Mastered (Move to Next Box)"
                >
                  <Check className="w-3 h-3" />
                  <span>Mastered</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl border shadow-2xl relative"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#64748B] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold mb-4">Add Vocabulary to Vault</h3>

            <form onSubmit={handleAddWord} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#64748B]">Target Language</label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full px-3 py-2 mt-1 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                  }}
                >
                  <option value="en">English (English)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#64748B]">
                  {newLanguage === 'ar' ? 'Arabic Term (الكلمة باللغة العربية)' : newLanguage === 'de' ? 'German Term (Deutscher Begriff)' : 'English Term'}
                </label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder={newLanguage === 'ar' ? 'مثال: الفصاحة' : newLanguage === 'de' ? 'z.B. Die Aussprache' : 'e.g. Resilient'}
                  className="w-full px-3 py-2 mt-1 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#64748B]">Bridge Language Translation</label>
                <input
                  type="text"
                  required
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="e.g. மீள்திறன் கொண்ட (Able to recover quickly)"
                  className="w-full px-3 py-2 mt-1 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#64748B]">Part of Speech</label>
                <select
                  value={newPos}
                  onChange={(e) => setNewPos(e.target.value)}
                  className="w-full px-3 py-2 mt-1 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                  }}
                >
                  <option value="noun">Noun</option>
                  <option value="verb">Verb</option>
                  <option value="adjective">Adjective</option>
                  <option value="adverb">Adverb</option>
                  <option value="idiom">Idiom / Phrase</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#64748B]">Context Example</label>
                <textarea
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="e.g. The resilient distributed network recovered within seconds."
                  className="w-full px-3 py-2 mt-1 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] h-20"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                  }}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-cosmic text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
