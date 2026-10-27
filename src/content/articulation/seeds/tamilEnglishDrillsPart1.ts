import { ArticulationDrill } from '../types.js';

export const tamilEnglishDrillsPart1: ArticulationDrill[] = [
  {
    id: 'drill_ta_01',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ'],
      contrastPhonemes: ['t'],
      referenceText: 'think vs tink',
      cueText: 'Slide your tongue tip lightly between teeth for /θ/. Do not tap the roof of your mouth.',
      cueTranslation: { ta: 'நாக்கை முன் பற்களுக்கு இடையில் வைக்கவும். ஈற்றில் தட்ட வேண்டாம்.' },
      pairs: [
        { wordA: 'think', ipaA: '/θɪŋk/', wordB: 'tink', ipaB: '/tɪŋk/', contrastDescription: 'Dental fricative vs alveolar stop' },
        { wordA: 'thank', ipaA: '/θæŋk/', wordB: 'tank', ipaB: '/tæŋk/', contrastDescription: 'Dental fricative vs alveolar stop' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ta_02',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ð'],
      contrastPhonemes: ['d'],
      referenceText: 'then vs den',
      cueText: 'Hum with tongue between teeth for /ð/. Feel the continuous vibration on your tongue tip.',
      cueTranslation: { ta: 'பற்களுக்கு இடையில் நாக்கை வைத்து அதிர்வுடன் ஒலிக்கவும்.' },
      pairs: [
        { wordA: 'then', ipaA: '/ðɛn/', wordB: 'den', ipaB: '/dɛn/', contrastDescription: 'Voiced dental fricative vs alveolar stop' },
        { wordA: 'they', ipaA: '/ðeɪ/', wordB: 'day', ipaB: '/deɪ/', contrastDescription: 'Voiced dental fricative vs alveolar stop' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ta_03',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['f'],
      contrastPhonemes: ['p'],
      referenceText: 'fan vs pan',
      cueText: 'Touch upper teeth to lower lip. Blow friction air; do not seal both lips together.',
      cueTranslation: { ta: 'மேல் பற்கள் கீழ் உதட்டில் பட வேண்டும், இரு உதடுகளையும் சேர்க்க வேண்டாம்.' },
      pairs: [
        { wordA: 'fan', ipaA: '/fæn/', wordB: 'pan', ipaB: '/pæn/', contrastDescription: 'Labiodental fricative vs bilabial stop' },
        { wordA: 'coffee', ipaA: '/ˈkɔːfi/', wordB: 'copy', ipaB: '/ˈkɑːpi/', contrastDescription: 'Medial fricative vs stop' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ta_04',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['w'],
      contrastPhonemes: ['v'],
      referenceText: 'wine vs vine',
      cueText: 'Round your lips into a tight O circle for /w/. For /v/, rest top teeth on bottom lip.',
      cueTranslation: { ta: 'w-க்கு உதடுகளை வட்டமாக்கவும்; v-க்கு பற்களை உதட்டில் வைக்கவும்.' },
      pairs: [
        { wordA: 'wine', ipaA: '/waɪn/', wordB: 'vine', ipaB: '/vaɪn/', contrastDescription: 'Labio-velar approximant vs labiodental fricative' },
        { wordA: 'west', ipaA: '/wɛst/', wordB: 'vest', ipaB: '/vɛst/', contrastDescription: 'Initial glide vs fricative' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_05',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sC_cluster'],
      referenceText: 'Speak slowly at school.',
      cueText: 'Start directly with /s/ hiss. Do NOT say "is-speak" or "is-school".',
      cueTranslation: { ta: 'முன்னால் "இ" சேர்க்காமல் நேரடியாக "ஸ்" சத்தத்துடன் தொடங்கவும்.' },
      words: ['speak', 'slowly', 'school', 'special'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_06',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sC_cluster'],
      referenceText: 'The student stopped at the station.',
      cueText: 'Connect /s/ directly into /t/ without an intervening or preceding vowel.',
      cueTranslation: { ta: 'ஸ் மற்றும் ட் ஆகியவற்றை இடைவெளியின்றி இணைக்கவும்.' },
      words: ['student', 'stopped', 'station', 'start'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_07',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['t'],
      contrastPhonemes: ['ʈ'],
      referenceText: 'time, table, travel, return',
      cueText: 'Alveolar /t/: Tap the gum ridge behind front teeth, do not curl tongue backward.',
      cueTranslation: { ta: 'நாக்கை பின்னோக்கி சுழற்றாமல் பற்களுக்கு பின்னாலுள்ள ஈற்றில் தட்டவும்.' },
      words: ['time', 'table', 'travel', 'return'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_08',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['d'],
      contrastPhonemes: ['ɖ'],
      referenceText: 'door, daily, border, leader',
      cueText: 'Alveolar /d/: Keep tongue tip forward at the tooth ridge, avoiding retroflex curling.',
      cueTranslation: { ta: 'நாக்கின் நுனியை முன் ஈறு பகுதியில் மென்மையாக வைக்கவும்.' },
      words: ['door', 'daily', 'border', 'leader'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_09',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ'],
      contrastPhonemes: ['s'],
      referenceText: 'think vs sink',
      cueText: 'Stick tongue tip slightly out for /θ/. Pull tongue inside mouth for /s/.',
      cueTranslation: { ta: 'think-க்கு நாக்கை வெளியே நீட்டவும்; sink-க்கு நாக்கை உள்ளே இழுக்கவும்.' },
      pairs: [
        { wordA: 'think', ipaA: '/θɪŋk/', wordB: 'sink', ipaB: '/sɪŋk/', contrastDescription: 'Dental fricative vs alveolar sibilant' },
        { wordA: 'thick', ipaA: '/θɪk/', wordB: 'sick', ipaB: '/sɪk/', contrastDescription: 'Dental fricative vs alveolar sibilant' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_10',
    language: 'en',
    l1: 'ta',
    category: 'vowel_contrast',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'About a minute ago, the camera focused.',
      cueText: 'Reduce unstressed "a-" to a quick neutral murmur /ə/. Do not pronounce as broad "aa".',
      cueTranslation: { ta: 'அழுத்தமில்லாத எழுத்துக்களை மிக லேசாக ஒலிக்கவும்.' },
      words: ['about', 'a', 'camera', 'police'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_11',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ', 'ð'],
      referenceText: 'breath vs breathe',
      cueText: 'Turn voice off for "breath" (/θ/). Turn voice ON for "breathe" (/ð/).',
      cueTranslation: { ta: 'breath-க்கு தொண்டை அதிர்வின்றி; breathe-க்கு அதிர்வுடன் ஒலிக்கவும்.' },
      pairs: [
        { wordA: 'breath', ipaA: '/brɛθ/', wordB: 'breathe', ipaB: '/briːð/', contrastDescription: 'Voiceless noun vs voiced verb' },
        { wordA: 'cloth', ipaA: '/klɔːθ/', wordB: 'clothe', ipaB: '/kloʊð/', contrastDescription: 'Voiceless noun vs voiced verb' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_12',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['v'],
      contrastPhonemes: ['w'],
      referenceText: 'very wary visitors went voting',
      cueText: 'Alternate between lip-rounding for /w/ and tooth-lip contact for /v/.',
      cueTranslation: { ta: 'w மற்றும் v ஒலிகளை மாறி மாறி துல்லியமாக உச்சரிக்கவும்.' },
      words: ['very', 'wary', 'visitors', 'went', 'voting'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_13',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sC_cluster'],
      referenceText: 'Smart students study spatial structures.',
      cueText: 'Keep consonants clean. Avoid adding initial vowels to "smart", "study", or "spatial".',
      cueTranslation: { ta: 'சொற்களின் தொடக்கத்தில் தேவையின்றி உயிர் ஒலிகளை சேர்க்க வேண்டாம்.' },
      words: ['smart', 'students', 'study', 'spatial', 'structures'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_14',
    language: 'en',
    l1: 'ta',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'PHO-to-graph vs pho-TOG-ra-phy',
      cueText: 'Notice how syllable stress shifts the vowel from clear /oʊ/ to reduced schwa /ə/.',
      cueTranslation: { ta: 'அழுத்தம் மாறும் போது உயிர் ஒலி சுருங்குவதை கவனியுங்கள்.' },
      stressPattern: 'PHO-to-graph (primary on 1st) vs pho-TOG-ra-phy (primary on 2nd)',
      words: ['photograph', 'photography', 'photographic'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  }
];
