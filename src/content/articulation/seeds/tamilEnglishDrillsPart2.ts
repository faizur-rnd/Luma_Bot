import { ArticulationDrill } from '../types.js';

export const tamilEnglishDrillsPart2: ArticulationDrill[] = [
  {
    id: 'drill_ta_15',
    language: 'en',
    l1: 'ta',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'PRE-sent vs pre-SENT',
      cueText: 'Noun has stress on first syllable; verb has stress on second syllable.',
      cueTranslation: { ta: 'பெயர்ச்சொல்லுக்கு முதல் அசையிலும், வினைச்சொல்லுக்கு இரண்டாம் அசையிலும் அழுத்தம்.' },
      stressPattern: 'PRE-sent (noun) vs pre-SENT (verb)',
      words: ['present', 'record', 'contrast'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_16',
    language: 'en',
    l1: 'ta',
    category: 'tongue_twister',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ', 'ð', 'f', 'v'],
      referenceText: 'Thirty-three thankful brothers breathed through free fresh fog.',
      cueText: 'Keep dental fricatives distinct from labiodental fricatives at steady tempo.',
      cueTranslation: { ta: 'பற்கள் மற்றும் உதடு நிலைகளை துல்லியமாக மாற்றி உச்சரிக்கவும்.' },
      estimatedSeconds: 40,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_17',
    language: 'en',
    l1: 'ta',
    category: 'sentence_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'I DID not say he stole the money.',
      cueText: 'Stress "DID" with higher pitch and longer duration to emphasize emphatic denial.',
      cueTranslation: { ta: 'DID என்ற சொல்லுக்கு அதிக நேரமும் உயரமான குரல் தொனியும் கொடுக்கவும்.' },
      stressPattern: 'Emphatic focus on auxiliary verb',
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_18',
    language: 'en',
    l1: 'ta',
    category: 'sentence_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'We NEED clear DATA before making DECISIONS.',
      cueText: 'Lengthen content words (NEED, DATA, DECISIONS); compress grammar words.',
      cueTranslation: { ta: 'முக்கியமான தகவலைக் கூறும் சொற்களுக்கு அழுத்தம் தரவும்.' },
      stressPattern: 'Content word prominence vs function word reduction',
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_19',
    language: 'en',
    l1: 'ta',
    category: 'shadowing',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ', 'w', 'v', 'ə'],
      referenceText: 'When we think about our future goals, clear communication paves the way.',
      cueText: 'Shadow immediately after model audio, matching rhythm and pitch curves.',
      cueTranslation: { ta: 'மாதிரி ஒலியைத் தொடர்ந்து அதே வேகத்திலும் ஏற்ற இறக்கத்திலும் பேசவும்.' },
      estimatedSeconds: 40,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_20',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['l'],
      contrastPhonemes: ['ɭ'],
      referenceText: 'light, little, yellow, global',
      cueText: 'Light alveolar /l/: Keep tongue blade forward on alveolar ridge; do not curl backward.',
      cueTranslation: { ta: 'நாக்கை பின்னோக்கி சுழற்றாமல் பற்களுக்கு பின்னாலுள்ள ஈற்றில் தொடவும்.' },
      words: ['light', 'little', 'yellow', 'global'],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_21',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_coda'],
      referenceText: 'tests, desks, tasks, masks',
      cueText: 'Hold the final /s/ after /t/ or /k/. Do not drop the final consonants or append an extra vowel.',
      cueTranslation: { ta: 'இறுதி எழுத்துக்களை கைவிடாமல் முழுமையாக உச்சரிக்கவும்.' },
      words: ['tests', 'desks', 'tasks', 'masks'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_22',
    language: 'en',
    l1: 'ta',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_coda'],
      referenceText: 'He asked six specific questions.',
      cueText: 'Cleanly articulate /skt/ in "asked" and /ks/ in "six" without adding /u/ at the end.',
      cueTranslation: { ta: 'வார்த்தையின் இறுதியில் "உ" சேர்க்காமல் சுத்தமாக முடிக்கவும்.' },
      words: ['asked', 'six', 'specific', 'questions'],
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_23',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ'],
      contrastPhonemes: ['t'],
      referenceText: 'three vs tree',
      cueText: 'In "three", start with continuous airflow between teeth. In "tree", release a firm alveolar stop.',
      cueTranslation: { ta: 'three-ல் காற்று வெளிவர வேண்டும்; tree-ல் பற்களுக்கு பின்னால் தட்டி தொடங்கவும்.' },
      pairs: [
        { wordA: 'three', ipaA: '/θriː/', wordB: 'tree', ipaB: '/triː/', contrastDescription: 'Dental fricative cluster vs stop cluster' },
        { wordA: 'through', ipaA: '/θruː/', wordB: 'true', ipaB: '/truː/', contrastDescription: 'Dental fricative cluster vs stop cluster' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_24',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ð'],
      contrastPhonemes: ['d'],
      referenceText: 'there vs dare',
      cueText: 'Vocal vibration between teeth for "there". Tongue tip tapping alveolar ridge for "dare".',
      cueTranslation: { ta: 'there-ல் பற்களுக்கிடையில் அதிர்வு; dare-ல் ஈற்றில் தட்டி உச்சரிப்பு.' },
      pairs: [
        { wordA: 'there', ipaA: '/ðɛər/', wordB: 'dare', ipaB: '/dɛər/', contrastDescription: 'Voiced dental fricative vs alveolar stop' },
        { wordA: 'those', ipaA: '/ðoʊz/', wordB: 'doze', ipaB: '/doʊz/', contrastDescription: 'Voiced dental fricative vs alveolar stop' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_25',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['f'],
      contrastPhonemes: ['p'],
      referenceText: 'full vs pull',
      cueText: 'Keep upper teeth on lower lip for "full". Close both lips for "pull".',
      cueTranslation: { ta: 'full-க்கு பல் மற்றும் கீழ் உதடு; pull-க்கு இரு உதடுகளும் இணைய வேண்டும்.' },
      pairs: [
        { wordA: 'full', ipaA: '/fʊl/', wordB: 'pull', ipaB: '/pʊl/', contrastDescription: 'Labiodental fricative vs bilabial stop' },
        { wordA: 'fast', ipaA: '/fæst/', wordB: 'past', ipaB: '/pæst/', contrastDescription: 'Labiodental fricative vs bilabial stop' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ta_26',
    language: 'en',
    l1: 'ta',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['w'],
      contrastPhonemes: ['v'],
      referenceText: 'wheel vs veal',
      cueText: 'Round lips firmly for "wheel". Bite lower lip lightly with upper teeth for "veal".',
      cueTranslation: { ta: 'wheel-க்கு உதடுகள் வட்டமாக வேண்டும்; veal-க்கு மேல் பற்கள் கீழ் உதட்டில் பட வேண்டும்.' },
      pairs: [
        { wordA: 'wheel', ipaA: '/wiːl/', wordB: 'veal', ipaB: '/viːl/', contrastDescription: 'Glide vs fricative' },
        { wordA: 'worse', ipaA: '/wɜːrs/', wordB: 'verse', ipaB: '/vɜːrs/', contrastDescription: 'Glide vs fricative' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ta_27',
    language: 'en',
    l1: 'ta',
    category: 'tongue_twister',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['w', 'v'],
      referenceText: 'Which wealthy wizard viewed vivid waterfalls?',
      cueText: 'Rapidly toggle between rounded /w/ and buzzing /v/. Maintain steady articulation.',
      cueTranslation: { ta: 'w மற்றும் v ஒலிகளுக்கு இடையே விரைவாக உதடு அமைப்பை மாற்றவும்.' },
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ta_28',
    language: 'en',
    l1: 'ta',
    category: 'tongue_twister',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['θ', 's', 'ʃ'],
      referenceText: 'Selfless thinkers thoughtfully soothe swift thoughts.',
      cueText: 'Isolate dental /θ/, alveolar /s/, and post-alveolar /ʃ/ cleanly without blending.',
      cueTranslation: { ta: 'பல், ஈறு, அண்ணம் ஆகிய மூன்று வெவ்வேறு ஒலிப்பிறப்பிடங்களை தெளிவாக வேறுபடுத்தவும்.' },
      estimatedSeconds: 45,
      difficultyScore: 4
    }
  }
];
