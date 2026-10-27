import { ArticulationDrill } from '../types.js';

export const arabicEnglishDrillsPart1: ArticulationDrill[] = [
  {
    id: 'drill_ar_01',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p'],
      contrastPhonemes: ['b'],
      referenceText: 'park vs bark',
      cueText: 'Keep vocal cords turned off for /p/. Release a strong puff of air. For /b/, feel throat vibration.',
      cueTranslation: { ar: 'احبس الهواء واطلقه بدفعة قوية بدون اهتزاز الحبال الصوتية لحرف P.' },
      pairs: [
        { wordA: 'park', ipaA: '/pɑːrk/', wordB: 'bark', ipaB: '/bɑːrk/', contrastDescription: 'Voiceless aspirated plosive vs voiced plosive' },
        { wordA: 'pen', ipaA: '/pɛn/', wordB: 'ben', ipaB: '/bɛn/', contrastDescription: 'Voiceless aspirated plosive vs voiced plosive' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ar_02',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p'],
      contrastPhonemes: ['b'],
      referenceText: 'rope vs robe, cap vs cab',
      cueText: 'In word-final position, release /p/ cleanly without voicing it into a /b/.',
      cueTranslation: { ar: 'في نهاية الكلمة، انطق حرف P بدون صوت اهتزازي.' },
      pairs: [
        { wordA: 'rope', ipaA: '/roʊp/', wordB: 'robe', ipaB: '/roʊb/', contrastDescription: 'Word-final /p/ vs /b/' },
        { wordA: 'cap', ipaA: '/kæp/', wordB: 'cab', ipaB: '/kæb/', contrastDescription: 'Word-final /p/ vs /b/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_03',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['v'],
      contrastPhonemes: ['f'],
      referenceText: 'fan vs van',
      cueText: 'Rest upper teeth on lower lip. For /v/, turn your voice box ON so you feel a strong buzz.',
      cueTranslation: { ar: 'ضع الأسنان العلوية على الشفة السفلية مع اهتزاز واضح في الحلق لحرف V.' },
      pairs: [
        { wordA: 'fan', ipaA: '/fæn/', wordB: 'van', ipaB: '/væn/', contrastDescription: 'Voiceless vs voiced labiodental fricative' },
        { wordA: 'fine', ipaA: '/faɪn/', wordB: 'vine', ipaB: '/vaɪn/', contrastDescription: 'Voiceless vs voiced labiodental fricative' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ar_04',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['v'],
      contrastPhonemes: ['f'],
      referenceText: 'leaf vs leave, safe vs save',
      cueText: 'Feel continuous vocal vibration at the end of "leave" and "save".',
      cueTranslation: { ar: 'اشعر باهتزاز الحبال الصوتية في نهاية كلمة leave و save.' },
      pairs: [
        { wordA: 'leaf', ipaA: '/liːf/', wordB: 'leave', ipaB: '/liːv/', contrastDescription: 'Word-final /f/ vs /v/' },
        { wordA: 'safe', ipaA: '/seɪf/', wordB: 'save', ipaB: '/seɪv/', contrastDescription: 'Word-final /f/ vs /v/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_05',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ɪ'],
      contrastPhonemes: ['iː'],
      referenceText: 'ship vs sheep',
      cueText: 'Lax /ɪ/ in "ship" is quick, low, and relaxed. Tense /iː/ in "sheep" is stretched like a wide smile.',
      cueTranslation: { ar: 'صوت ɪ قصير ومسترخي؛ صوت iː ممدود مع شد الشفتين كابتسامة.' },
      pairs: [
        { wordA: 'ship', ipaA: '/ʃɪp/', wordB: 'sheep', ipaB: '/ʃiːp/', contrastDescription: 'Short lax front vs long tense front vowel' },
        { wordA: 'hit', ipaA: '/hɪt/', wordB: 'heat', ipaB: '/hiːt/', contrastDescription: 'Short lax front vs long tense front vowel' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_06',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ʊ'],
      contrastPhonemes: ['uː'],
      referenceText: 'pull vs pool, full vs fool',
      cueText: 'Keep /ʊ/ in "pull" relaxed and slightly open. Hold /uː/ in "pool" longer with tighter rounded lips.',
      cueTranslation: { ar: 'صوت ʊ قصير وخفيف؛ صوت uː ممدود مع ضم كامل للشفتين.' },
      pairs: [
        { wordA: 'pull', ipaA: '/pʊl/', wordB: 'pool', ipaB: '/puːl/', contrastDescription: 'Lax back vs tense long back vowel' },
        { wordA: 'full', ipaA: '/fʊl/', wordB: 'fool', ipaB: '/fuːl/', contrastDescription: 'Lax back vs tense long back vowel' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_07',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_onset'],
      referenceText: 'street, straight, strong, stream',
      cueText: 'Blend s-t-r seamlessly without inserting an "i-" before or between consonants (not "is-treet").',
      cueTranslation: { ar: 'انطق أحرف str متصلة بدون إضافة كسرة أو همزة في البداية.' },
      words: ['street', 'straight', 'strong', 'stream'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_08',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_onset'],
      referenceText: 'spring, split, splash, spread',
      cueText: 'Flow from /s/ straight into voiceless /p/ and liquid /r/ or /l/.',
      cueTranslation: { ar: 'تدرج بسلاسة من حرف s إلى p ثم r/l بدون توقف.' },
      words: ['spring', 'split', 'splash', 'spread'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_09',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p'],
      contrastPhonemes: ['b'],
      referenceText: 'pig vs big, pack vs back',
      cueText: 'Feel the puff of air on your hand for "pig" and "pack". No puff for "big" and "back".',
      cueTranslation: { ar: 'ضع يدك أمام فمك واشعر باندفاع الهواء مع حرف P.' },
      pairs: [
        { wordA: 'pig', ipaA: '/pɪɡ/', wordB: 'big', ipaB: '/bɪɡ/', contrastDescription: 'Aspirated initial /p/ vs voiced /b/' },
        { wordA: 'pack', ipaA: '/pæk/', wordB: 'back', ipaB: '/bæk/', contrastDescription: 'Aspirated initial /p/ vs voiced /b/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ar_10',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'b', 'v', 'f'],
      referenceText: 'Peter bought five valuable phones.',
      cueText: 'Balance all four labial sounds: voiceless /p/, voiced /b/, voiced /v/, and voiceless /f/.',
      cueTranslation: { ar: 'ميز بين الأصوات الشفوية الأربعة: P و B و V و F في جملة واحدة.' },
      words: ['Peter', 'bought', 'five', 'valuable', 'phones'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_11',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['æ'],
      contrastPhonemes: ['ʌ'],
      referenceText: 'cat vs cut, hat vs hut',
      cueText: 'Drop your jaw down wide for /æ/ in "cat". Keep jaw mid-neutral for /ʌ/ in "cut".',
      cueTranslation: { ar: 'افتح الفك للأسفل بوضوح لصوت cat، واجعله محايداً لصوت cut.' },
      pairs: [
        { wordA: 'cat', ipaA: '/kæt/', wordB: 'cut', ipaB: '/kʌt/', contrastDescription: 'Open front /æ/ vs open-mid central /ʌ/' },
        { wordA: 'hat', ipaA: '/hæt/', wordB: 'hut', ipaB: '/hʌt/', contrastDescription: 'Open front /æ/ vs open-mid central /ʌ/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_12',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_onset'],
      referenceText: 'Clear projects drive great progress.',
      cueText: 'Say /pr/ and /gr/ with immediate release. Do not place a short vowel inside the cluster.',
      cueTranslation: { ar: 'انطق تتابع الأحرف الساكنة مباشرة بدون إدخال حركة قصيرة بينها.' },
      words: ['projects', 'drive', 'great', 'progress'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_13',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'today, support, police, collect',
      cueText: 'Do not pronounce unstressed vowels fully. Reduce them to short quiet schwa /ə/.',
      cueTranslation: { ar: 'اختصر المقاطع غير المشددة إلى صوت الشوَا القصير جداً.' },
      words: ['today', 'support', 'police', 'collect'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_14',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ɹ'],
      contrastPhonemes: ['r'],
      referenceText: 'red, right, around, very',
      cueText: 'Curl tongue tip back into mouth cavity without touching palate or tapping teeth.',
      cueTranslation: { ar: 'ارفع طرف اللسان للأعلى دون ملامسة سقف الحلق أو إحداث تكرار كالراء العربية.' },
      words: ['red', 'right', 'around', 'very'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  }
];
