import { ArticulationDrill } from '../types.js';

export const arabicEnglishDrillsPart3: ArticulationDrill[] = [
  {
    id: 'drill_ar_29',
    language: 'en',
    l1: 'ar',
    category: 'shadowing',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'b', 'v', 'ə'],
      referenceText: 'Building strong speaking habits requires persistent daily practice and clear purpose.',
      cueText: 'Shadow the model speaker with natural pauses between thought units.',
      cueTranslation: { ar: 'ردد بعد التسجيل النموذجي مباشرة مع التوقف الطبيعي عند فواصل المعنى.' },
      estimatedSeconds: 35,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_30',
    language: 'en',
    l1: 'ar',
    category: 'shadowing',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_coda', 'CC_onset', 'ɹ', 'ə'],
      referenceText: 'Strategic partnerships transform innovative concepts into global marketplace victories.',
      cueText: 'Deliver multisyllabic words with confident stress and crisp consonant releases.',
      cueTranslation: { ar: 'انطق الكلمات متعددة المقاطع بنبر واثق ونهايات ساكنة واضحة.' },
      estimatedSeconds: 40,
      difficultyScore: 4
    }
  },
  {
    id: 'drill_ar_31',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_onset'],
      referenceText: 'black, blue, clear, class',
      cueText: 'Release /b/ and /k/ directly into liquid /l/ without any vowel transition.',
      cueTranslation: { ar: 'انطلق مباشرة من الحرف الساكن إلى حرف اللام دون إدخال حركة فاصلة.' },
      words: ['black', 'blue', 'clear', 'class'],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ar_32',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p'],
      contrastPhonemes: ['b'],
      referenceText: 'pin vs bin, pat vs bat',
      cueText: 'Feel the sharp burst of air on the palm of your hand for "pin" and "pat".',
      cueTranslation: { ar: 'اشعر بدفعة الهواء النقي على راحة يدك عند نطق pin و pat.' },
      pairs: [
        { wordA: 'pin', ipaA: '/pɪn/', wordB: 'bin', ipaB: '/bɪn/', contrastDescription: 'Initial /p/ vs /b/' },
        { wordA: 'pat', ipaA: '/pæt/', wordB: 'bat', ipaB: '/bæt/', contrastDescription: 'Initial /p/ vs /b/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ar_33',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_coda'],
      referenceText: 'helped, jumped, worked, laughed',
      cueText: 'Voiceless ending rule: words ending in /p, k, f/ take voiceless /t/ (e.g. "helpt", "jumpt").',
      cueTranslation: { ar: 'الأفعال المنتهية بأصوات مهموسة تنطق نهايتها -ed بصوت T واضح.' },
      words: ['helped', 'jumped', 'worked', 'laughed'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_34',
    language: 'en',
    l1: 'ar',
    category: 'word_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['ə'],
      referenceText: 'RE-cord (noun) vs re-CORD (verb)',
      cueText: 'Noun has loud, clear first vowel; verb has reduced first vowel and strong second syllable.',
      cueTranslation: { ar: 'الاسم يبرز المقطع الأول، والفعل يختصر الأول ويبرز الثاني بقوة.' },
      stressPattern: 'RE-cord vs re-CORD',
      words: ['record', 'rebel', 'permit'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_35',
    language: 'en',
    l1: 'ar',
    category: 'sentence_stress',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'We can’t solve the problem if we don’t identify the root cause.',
      cueText: 'Pitch climbs on "can’t solve", resets, and peaks on "root cause".',
      cueTranslation: { ar: 'اتبع التدرج النغمي للجملة بين شطريها الشرطيين.' },
      stressPattern: 'Conditional sentence two-peak contour',
      estimatedSeconds: 35,
      difficultyScore: 4
    }
  },
  {
    id: 'drill_ar_36',
    language: 'en',
    l1: 'ar',
    category: 'vowel_contrast',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['æ', 'ɛ'],
      referenceText: 'bad vs bed, man vs men',
      cueText: 'Lower your jaw significantly more for /æ/ in "bad" and "man".',
      cueTranslation: { ar: 'أنزل الفك أكثر لصوت bad و man مقارنة بصوت bed و men.' },
      pairs: [
        { wordA: 'bad', ipaA: '/bæd/', wordB: 'bed', ipaB: '/bɛd/', contrastDescription: 'Low front /æ/ vs mid-low front /ɛ/' },
        { wordA: 'man', ipaA: '/mæn/', wordB: 'men', ipaB: '/mɛn/', contrastDescription: 'Low front /æ/ vs mid-low front /ɛ/' }
      ],
      estimatedSeconds: 25,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_37',
    language: 'en',
    l1: 'ar',
    category: 'consonant_cluster',
    level: 'beginner',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['CC_onset'],
      referenceText: 'fly, floor, flat, flip',
      cueText: 'Maintain clean tooth-to-lip contact for /f/ before gliding into /l/.',
      cueTranslation: { ar: 'ثبت الأسنان على الشفة السفلية لحرف F قبل الانتقال السلس لحرف L.' },
      words: ['fly', 'floor', 'flat', 'flip'],
      estimatedSeconds: 25,
      difficultyScore: 1
    }
  },
  {
    id: 'drill_ar_38',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p'],
      contrastPhonemes: ['b'],
      referenceText: 'simple vs symbol, staple vs stable',
      cueText: 'In the middle of words, keep /p/ unvoiced and crisp.',
      cueTranslation: { ar: 'حافظ على حرف P صامتاً ونقياً في وسط الكلمات.' },
      pairs: [
        { wordA: 'simple', ipaA: '/ˈsɪmpəl/', wordB: 'symbol', ipaB: '/ˈsɪmbəl/', contrastDescription: 'Medial /p/ vs /b/' },
        { wordA: 'staple', ipaA: '/ˈsteɪpəl/', wordB: 'stable', ipaB: '/ˈsteɪbəl/', contrastDescription: 'Medial /p/ vs /b/' }
      ],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_39',
    language: 'en',
    l1: 'ar',
    category: 'shadowing',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'b', 'v', 'ɹ', 'ə'],
      referenceText: 'Professional development provides the pathway for extraordinary career progress.',
      cueText: 'Emulate standard cadence without rushing or inserting vowels into consonant clusters.',
      cueTranslation: { ar: 'حاكي السرعة الطبيعية للمتحدث دون استعجال أو إضافة حركات زائدة.' },
      estimatedSeconds: 40,
      difficultyScore: 4
    }
  },
  {
    id: 'drill_ar_40',
    language: 'en',
    l1: 'ar',
    category: 'sentence_stress',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['sentence_stress'],
      referenceText: 'What TIME is the PRESENTATION scheduled?',
      cueText: 'Rise on TIME and peak on PRESENTATION, then drop intonation at the end of the question.',
      cueTranslation: { ar: 'ارفع النبرة على TIME و PRESENTATION ثم اختم بانخفاض طبيعي للسؤال الاستفهامي.' },
      stressPattern: 'Wh-question falling intonation contour',
      estimatedSeconds: 30,
      difficultyScore: 2
    }
  },
  {
    id: 'drill_ar_41',
    language: 'en',
    l1: 'ar',
    category: 'minimal_pair',
    level: 'intermediate',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['v'],
      contrastPhonemes: ['f'],
      referenceText: 'favor vs fever, flavor vs savior',
      cueText: 'Alternate between /v/ and /f/ across multisyllabic words with constant voice control.',
      cueTranslation: { ar: 'تحكم في تشغيل وإيقاف اهتزاز الحلق بين V و F في الكلمات متقاربة النطق.' },
      words: ['favor', 'fever', 'flavor', 'savior'],
      estimatedSeconds: 30,
      difficultyScore: 3
    }
  },
  {
    id: 'drill_ar_42',
    language: 'en',
    l1: 'ar',
    category: 'tongue_twister',
    level: 'advanced',
    reviewStatus: 'draft',
    payload: {
      targetPhonemes: ['p', 'b', 'CC_onset', 'CC_coda'],
      referenceText: 'Big black bugs bled black blood on broad brown bricks.',
      cueText: 'Keep /b/ resonant and distinct from /p/, and enunciate all initial and final stops.',
      cueTranslation: { ar: 'حافظ على وضوح صوت B دون خلط، مع بيان مخارج الحروف في بداية ونهاية الكلمات.' },
      estimatedSeconds: 40,
      difficultyScore: 4
    }
  }
];
