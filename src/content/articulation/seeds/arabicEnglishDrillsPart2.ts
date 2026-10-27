import { ArticulationDrill } from '../types.js';

export const arabicEnglishDrillsPart2: ArticulationDrill[] = [
  {
    id: 'drill_ar_15',
    language: 'en',
    l1: 'ar',
    category: 'tongue_twister',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'b'],
      referenceText: 'Peter Piper picked a peck of pickled peppers.',
      cueText: 'Make every single "P" pop with unvoiced aspiration, never voicing into "B".',
      cueTranslation: { ar: 'حافظ على اندفاع الهواء الصامت مع كل حرف P دون تحويله إلى باء.' },
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_16',
    language: 'en',
    l1: 'ar',
    category: 'tongue_twister',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['v', 'f'],
      referenceText: 'Very few valiant firefighters fear violent flames.',
      cueText: 'Switch cleanly between buzzing /v/ and breathy unvoiced /f/.',
      cueTranslation: { ar: 'بدل بوضوح بين صوت V المهتز وصوت F الصامت.' },
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_17',
    language: 'en',
    l1: 'ar',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'OB-ject vs ob-JECT',
      cueText: 'OB-ject (noun) stresses first syllable; ob-JECT (verb) stresses second syllable.',
      cueTranslation: { ar: 'الاسم يشدد المقطع الأول، والفعل يشدد المقطع الثاني.' },
      stressPattern: 'OB-ject (noun) vs ob-JECT (verb)',
      words: ['object', 'subject', 'conduct'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_18',
    language: 'en',
    l1: 'ar',
    category: 'sentence_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'I said we should MEET at FIVE, not SIX.',
      cueText: 'Emphasize the contrastive numbers FIVE and SIX with higher pitch and clear duration.',
      cueTranslation: { ar: 'أبرز الأرقام المتناقضة في الجملة بنبرة أعلى ومد أطول.' },
      stressPattern: 'Contrastive numerical emphasis',
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_19',
    language: 'en',
    l1: 'ar',
    category: 'shadowing',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'v', 'ɪ', 'iː'],
      referenceText: 'We provide valuable feedback to help people improve their speaking skills.',
      cueText: 'Focus on "provide", "valuable", and "people". Shadow model audio promptly.',
      cueTranslation: { ar: 'ركز على مخارج P و V في سياق الجملة الطبيعية.' },
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_20',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ɪ', 'iː'],
      referenceText: 'bit vs beat, sit vs seat',
      cueText: 'Keep /ɪ/ lax and rapid. Lengthen /iː/ with smiling lips.',
      cueTranslation: { ar: 'اجعل الصوت الأول قصيراً وسريعاً، وأطل الصوت الثاني مع فتح زوايا الفم.' },
      pairs: [
        { wordA: 'bit', ipaA: '/bɪt/', wordB: 'beat', ipaB: '/biːt/', contrastDescription: 'Lax /ɪ/ vs tense /iː/' },
        { wordA: 'sit', ipaA: '/sɪt/', wordB: 'seat', ipaB: '/siːt/', contrastDescription: 'Lax /ɪ/ vs tense /iː/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_21',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_coda'],
      referenceText: 'texts, facts, attempts, glimpsed',
      cueText: 'Hold the full coda cluster. Say /ksts/ in "texts" and /pts/ in "attempts" without adding /ɪ/.',
      cueTranslation: { ar: 'انطق التجمع الساكن في نهاية الكلمة كاملاً دون إضافة حرف علة.' },
      words: ['texts', 'facts', 'attempts', 'glimpsed'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_22',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p'],
      contrastPhonemes: ['b'],
      referenceText: 'peach vs beach, pride vs bride',
      cueText: 'Produce clear aspiration on "peach" and "pride". Do not voice the initial lip closure.',
      cueTranslation: { ar: 'احرص على خروج هواء صامت واضح مع peach و pride.' },
      pairs: [
        { wordA: 'peach', ipaA: '/piːtʃ/', wordB: 'beach', ipaB: '/biːtʃ/', contrastDescription: 'Voiceless vs voiced bilabial' },
        { wordA: 'pride', ipaA: '/praɪd/', wordB: 'bride', ipaB: '/braɪd/', contrastDescription: 'Voiceless vs voiced bilabial' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_23',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['v'],
      contrastPhonemes: ['f'],
      referenceText: 'prove vs proof, believe vs belief',
      cueText: 'Verbs end with voiced /v/; corresponding nouns end with voiceless /f/.',
      cueTranslation: { ar: 'الأفعال تنتهي بصوت V المهتز، والأسماء المقابلة تنتهي بصوت F الصامت.' },
      pairs: [
        { wordA: 'prove', ipaA: '/pruːv/', wordB: 'proof', ipaB: '/pruːf/', contrastDescription: 'Voiced verb coda vs voiceless noun coda' },
        { wordA: 'believe', ipaA: '/bɪˈliːv/', wordB: 'belief', ipaB: '/bɪˈliːf/', contrastDescription: 'Voiced verb coda vs voiceless noun coda' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_24',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_onset'],
      referenceText: 'Strict structures stabilize strategic growth.',
      cueText: 'Keep three-consonant clusters clean. Transition directly from /s/ to /t/ to /r/.',
      cueTranslation: { ar: 'حافظ على تدفق الحروف الساكنة الثلاثة معاً بنقاء ودون تقطيع.' },
      words: ['strict', 'structures', 'stabilize', 'strategic'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_25',
    language: 'en',
    l1: 'ar',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'COM-pa-ny vs com-PA-ri-son',
      cueText: 'Stress changes word shape: COM-pa-ny (stress 1) vs com-PA-ri-son (stress 2).',
      cueTranslation: { ar: 'لاحظ انتقال النبر الصوتي عند تغير بنية الكلمة واختزال الحروف غير المشددة.' },
      stressPattern: 'COM-pa-ny vs com-PA-ri-son',
      words: ['company', 'comparison', 'comparable'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_26',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ʊ', 'uː'],
      referenceText: 'look vs Luke, soot vs suit',
      cueText: 'Differentiate lax /ʊ/ from long tense /uː/.',
      cueTranslation: { ar: 'ميز بدقة بين الضمة الخفيفة القصيرة والواو الممدودة المشدودة.' },
      pairs: [
        { wordA: 'look', ipaA: '/lʊk/', wordB: 'Luke', ipaB: '/luːk/', contrastDescription: 'Lax /ʊ/ vs tense /uː/' },
        { wordA: 'soot', ipaA: '/sʊt/', wordB: 'suit', ipaB: '/suːt/', contrastDescription: 'Lax /ʊ/ vs tense /uː/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_27',
    language: 'en',
    l1: 'ar',
    category: 'sentence_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'Can you PREPARE the PROPOSAL for the PARTNERS?',
      cueText: 'Stress PREPARE, PROPOSAL, and PARTNERS. Keep "can you" and "for the" rapid and reduced.',
      cueTranslation: { ar: 'ركز النبر على كلمات المعنى الأساسية وخفف الكلمات الوظيفية الصغيرة.' },
      stressPattern: 'Workplace presentation rhythm',
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_28',
    language: 'en',
    l1: 'ar',
    category: 'tongue_twister',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'b', 'v', 'f'],
      referenceText: 'Brave people proved perfect plans produce vibrant profit.',
      cueText: 'Rapidly navigate between /b/, /p/, /v/, and /f/. Do not collapse /p/ into /b/.',
      cueTranslation: { ar: 'تنقل بسرعة ودقة بين مخارج B و P و V و F بدون أي خلط.' },
      estimatedSeconds: 40,
      difficultyScore: 4
    }
  }
];
