import { ArticulationDrill } from '../types.js';

export const tamilEnglishDrillsPart3: ArticulationDrill[] = [
  {
    id: 'drill_ta_29',
    language: 'en',
    l1: 'ta',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'e-CON-o-my vs ec-o-NOM-ic',
      cueText: 'Stress shifts from second syllable to third syllable. Notice the vowel changes.',
      cueTranslation: { ta: 'அழுத்தம் மாறும் போது முதன்மை உச்சரிப்பு எங்கு விழுகிறது என்பதை கவனியுங்கள்.' },
      stressPattern: 'e-CON-o-my vs ec-o-NOM-ic',
      words: ['economy', 'economic', 'economist'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_30',
    language: 'en',
    l1: 'ta',
    category: 'sentence_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'Could you SEND the REPORT by FRIDAY afternoon?',
      cueText: 'Give prominence to SEND, REPORT, and FRIDAY; let "could you the by afternoon" glide softly.',
      cueTranslation: { ta: 'செயல் மற்றும் நாள் சார்ந்த முக்கியமான சொற்களை நீட்டி அழுத்தவும்.' },
      stressPattern: 'Polite workplace request prominence',
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_31',
    language: 'en',
    l1: 'ta',
    category: 'sentence_stress',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'Although we PLANNED to launch in MARCH, the RELEASE was delayed until MAY.',
      cueText: 'Mark the contrasting months (MARCH vs MAY) and key milestones with clear pitch accents.',
      cueTranslation: { ta: 'மாறுபட்ட மாதங்களையும் மைல்கற்களையும் குரல் ஏற்ற இறக்கத்துடன் வேறுபடுத்தவும்.' },
      stressPattern: 'Contrastive stress across subordinate and main clauses',
      estimatedSeconds: 40,
      difficultyScore: 4
    }
  },
  {
    id: 'drill_ta_32',
    language: 'en',
    l1: 'ta',
    category: 'shadowing',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ', 'ð', 'ə', 'ɹ'],
      referenceText: 'Throughout the enterprise, clear articulation builds lasting trust with stakeholders.',
      cueText: 'Listen to the natural rhythm and shadow closely within a quarter-second delay.',
      cueTranslation: { ta: 'முழு வாக்கியத்தின் ஒட்டத்தையும் தொனியையும் பின்பற்றி பேசவும்.' },
      estimatedSeconds: 45,
      difficultyScore: 4
    }
  },
  {
    id: 'drill_ta_33',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sC_cluster'],
      referenceText: 'Stand straight and speak clearly.',
      cueText: 'Direct release into /st/ and /sp/. Avoid starting with "is-".',
      cueTranslation: { ta: 'முன்னால் "இ" சேர்க்காமல் நேரடியாக ஒலிக்கவும்.' },
      words: ['stand', 'straight', 'speak'],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_34',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sC_cluster'],
      referenceText: 'Specific standards spark splendid solutions.',
      cueText: 'Maintain brisk tempo across repetitive s-clusters without vocalic insertions.',
      cueTranslation: { ta: 'தொடர்ச்சியான கூட்டெழுத்துக்களை சரளமாக உச்சரிக்கவும்.' },
      words: ['specific', 'standards', 'spark', 'splendid'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_35',
    language: 'en',
    l1: 'ta',
    category: 'vowel_contrast',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ɪ', 'iː'],
      referenceText: 'ship vs sheep, fit vs feet',
      cueText: 'Keep /ɪ/ lax and short; hold /iː/ longer with tense spread lips.',
      cueTranslation: { ta: 'குறில் மற்றும் நெடில் உயிர் ஒலிகளை சரியான அளவில் வேறுபடுத்தவும்.' },
      pairs: [
        { wordA: 'ship', ipaA: '/ʃɪp/', wordB: 'sheep', ipaB: '/ʃiːp/', contrastDescription: 'Lax front vs tense front vowel' },
        { wordA: 'fit', ipaA: '/fɪt/', wordB: 'feet', ipaB: '/fiːt/', contrastDescription: 'Lax front vs tense front vowel' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_36',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ'],
      contrastPhonemes: ['f'],
      referenceText: 'three vs free, thirst vs first',
      cueText: 'Stick tongue tip out for "three". Bite lower lip with upper teeth for "free".',
      cueTranslation: { ta: 'three-க்கு நாக்கை வெளியே நீட்டவும்; free-க்கு மேல் பல்லை கீழ் உதட்டில் வைக்கவும்.' },
      pairs: [
        { wordA: 'three', ipaA: '/θriː/', wordB: 'free', ipaB: '/friː/', contrastDescription: 'Dental fricative vs labiodental fricative' },
        { wordA: 'thirst', ipaA: '/θɜːrst/', wordB: 'first', ipaB: '/fɜːrst/', contrastDescription: 'Dental fricative vs labiodental fricative' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_37',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ð'],
      contrastPhonemes: ['v'],
      referenceText: 'breathe vs brief, soothe vs serve',
      cueText: 'Tongue between teeth with voice for "breathe". Teeth on lip for /v/ and /f/.',
      cueTranslation: { ta: 'பற்கள் மற்றும் உதடு தொடர்பு நிலைகளை மிகச் சரியாக கவனியுங்கள்.' },
      words: ['breathe', 'brief', 'soothe', 'serve'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_38',
    language: 'en',
    l1: 'ta',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'ana-LYZ-er vs anal-Y-sis',
      cueText: 'Shift primary stress from syllable two in "analysis" to syllable one in "analyze".',
      cueTranslation: { ta: 'சொல் வடிவ மாற்றம் ஏற்படும் போது அசை அழுத்த மாற்றத்தை கவனிக்கவும்.' },
      stressPattern: 'AN-a-lyze vs a-NAL-y-sis',
      words: ['analyze', 'analysis', 'analytical'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_39',
    language: 'en',
    l1: 'ta',
    category: 'shadowing',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['f', 'v', 'w', 'sC_cluster'],
      referenceText: 'Every morning, the team focuses on practical speaking workouts.',
      cueText: 'Deliver smoothly with steady rhythm. Avoid chopping every syllable into equal beats.',
      cueTranslation: { ta: 'ஒவ்வொரு அசையையும் தனித்தனியாக பிரிக்காமல் சீரான தாளத்துடன் பேசவும்.' },
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_40',
    language: 'en',
    l1: 'ta',
    category: 'shadowing',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ', 'ð', 'ə', 'CC_coda'],
      referenceText: 'In our quarterly review, both stakeholders appreciated our thorough work.',
      cueText: 'Focus on "thorough" (/ˈθɜːroʊ/) and ensure "appreciated" ends cleanly without an added vowel.',
      cueTranslation: { ta: 'thorough மற்றும் appreciated ஆகியவற்றை இயற்கை வேகத்தில் தெளிவாக பேசவும்.' },
      estimatedSeconds: 40,
      difficultyScore: 4
    }
  },
  {
    id: 'drill_ta_41',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_coda'],
      referenceText: 'solved, turned, changed, planned',
      cueText: 'Connect the voiced coda /vd/, /nd/, /dʒd/ smoothly without vowel intrusion.',
      cueTranslation: { ta: 'இறுதி கூட்டொலிகளை இடைப்பட்ட உயிர் ஒலியின்றி இணைக்கவும்.' },
      words: ['solved', 'turned', 'changed', 'planned'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_42',
    language: 'en',
    l1: 'ta',
    category: 'sentence_stress',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'It’s NOT about SPEAKING fast; it’s about BEING understood.',
      cueText: 'Contrast NOT and SPEAKING against BEING and UNDERSTOOD with balanced intonation peaks.',
      cueTranslation: { ta: 'கருத்து வேறுபாட்டை உணர்த்தும் சொற்களுக்கு தெளிவான ஏற்றம் கொடுக்கவும்.' },
      stressPattern: 'Antithetical contrastive pitch accent',
      estimatedSeconds: 35,
      difficultyScore: 4
    }
  }
];
