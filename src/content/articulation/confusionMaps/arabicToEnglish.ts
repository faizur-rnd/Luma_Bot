import { ConfusionMap } from '../types.js';

/**
 * Phonological interference map for Arabic L1 speakers acquiring English.
 * Addresses:
 * - Bilabial plosive voicing contrast /p/ vs /b/
 * - Labiodental fricative voicing contrast /v/ vs /f/
 * - Vowel duration & quality: lax /ɪ/ vs tense /iː/, lax /ʊ/ vs tense /uː/
 * - Consonant cluster epenthesis (inserting /i/ or /e/ before or between clusters)
 * - Syllabic vs stress timing and unstressed schwa /ə/ reduction
 * - Alveolar trill/tap /r/ vs English post-alveolar approximant /ɹ/
 * - Final consonant cluster simplifications
 */
export const arabicToEnglishConfusionMap: ConfusionMap = {
  sourceL1: 'ar',
  targetLanguage: 'en',
  description: 'Acoustic and articulatory interference patterns for Arabic native speakers learning English',
  contrasts: [
    {
      id: 'ar_en_p_b',
      targetPhoneme: 'p',
      l1Substitutes: ['b'],
      acousticConfusionType: 'Voiced bilabial plosive substitution for voiceless plosive',
      articulationTip: 'Keep vocal cords quiet (no humming in throat). Build air behind closed lips and release with a clean puff of air.',
      bridgeExplanation: {
        ar: 'اغلق الشفتين واحبس الهواء ثم أطلقه بدفعة هواء قوية بدون اهتزاز الحبال الصوتية (لا تنطقها مثل حرف الباء العربي).'
      },
      exampleWords: ['park', 'pen', 'people', 'simple', 'happy', 'cup']
    },
    {
      id: 'ar_en_v_f',
      targetPhoneme: 'v',
      l1Substitutes: ['f'],
      acousticConfusionType: 'Voiceless labiodental fricative substitution for voiced fricative',
      articulationTip: 'Place upper front teeth on lower lip just like making "F", but turn your vocal cords ON to feel a buzzing vibration.',
      bridgeExplanation: {
        ar: 'ضع الأسنان العلوية على الشفة السفلية كما في حرف الفاء، ولكن قم بتشغيل الصوت ليشعر الحلق باهتزاز وطنين واضح.'
      },
      exampleWords: ['very', 'voice', 'value', 'drive', 'seven', 'wave']
    },
    {
      id: 'ar_en_vowel_ship_sheep',
      targetPhoneme: 'ɪ',
      l1Substitutes: ['iː', 'e'],
      acousticConfusionType: 'Tense vowel lengthening replacing short lax vowel',
      articulationTip: 'Drop jaw slightly, relax tongue and lips. Make this sound quick, lax, and effortless without smiling or stretching lips.',
      bridgeExplanation: {
        ar: 'صوت قصير ومريح بدون شد الشفتين أو ابتسامة مبالغ فيها، يختلف تماماً عن الياء الممدودة.'
      },
      exampleWords: ['ship', 'sit', 'hit', 'fit', 'minute', 'build']
    },
    {
      id: 'ar_en_vowel_pull_pool',
      targetPhoneme: 'ʊ',
      l1Substitutes: ['uː', 'o'],
      acousticConfusionType: 'Tense long back vowel replacing short lax back vowel',
      articulationTip: 'Loosen lips with relaxed slight rounding. Do not purse tightly into a deep long "oo". Keep it short and relaxed.',
      bridgeExplanation: {
        ar: 'صوت واو قصير وخفيف دون ضم الشفتين بقوة كما في المد الطويل.'
      },
      exampleWords: ['put', 'pull', 'book', 'look', 'good', 'foot']
    },
    {
      id: 'ar_en_cluster_onset',
      targetPhoneme: 'CC_onset',
      l1Substitutes: ['eCC', 'iCC', 'CəC'],
      acousticConfusionType: 'Epenthetic vowel insertion in initial consonant clusters',
      articulationTip: 'Glide smoothly between consonants without pausing or inserting a small vowel between or before them (e.g. "street", not "is-street").',
      bridgeExplanation: {
        ar: 'انطق الحرفين الساكنين معاً بدون إدخال همزة أو كسرة قبلهما أو بينهما.'
      },
      exampleWords: ['street', 'spring', 'strategy', 'problem', 'screen', 'train']
    },
    {
      id: 'ar_en_schwa_reduction',
      targetPhoneme: 'ə',
      l1Substitutes: ['a', 'o', 'u'],
      acousticConfusionType: 'Full vowel substitution for reduced unstressed syllable',
      articulationTip: 'English vowels in unstressed syllables shrink to a relaxed murmur /ə/. Don’t pronounce every syllable with equal weight.',
      bridgeExplanation: {
        ar: 'المقاطع غير المشددة في الإنجليزية تنطق بصوت خفيف ومختصر (شوَا) ولا تُعطى مدّاً كاملاً.'
      },
      exampleWords: ['problem', 'connect', 'pencil', 'supply', 'method', 'camera']
    },
    {
      id: 'ar_en_approximant_r',
      targetPhoneme: 'ɹ',
      l1Substitutes: ['ɾ', 'r'],
      acousticConfusionType: 'Alveolar tap or trill replacing post-alveolar approximant',
      articulationTip: 'Curl the tip of your tongue slightly back toward the roof of your mouth without touching anything. No tapping or fluttering.',
      bridgeExplanation: {
        ar: 'ارفع طرف اللسان للأعلى دون أن يلمس سقف الحلق، تجنب تكرار أو ضرب اللسان كما في الراء العربية.'
      },
      exampleWords: ['right', 'red', 'room', 'very', 'around', 'direct']
    },
    {
      id: 'ar_en_consonant_cluster_coda',
      targetPhoneme: 'CC_coda',
      l1Substitutes: ['CəC', 'C'],
      acousticConfusionType: 'Final cluster reduction or vowel insertion',
      articulationTip: 'Hold the final consonant cluster firmly without dropping the last sound or adding a vowel at the end.',
      bridgeExplanation: {
        ar: 'حافظ على نطق الحرفين الساكنين في نهاية الكلمة بوضوح دون حذف الحرف الأخير.'
      },
      exampleWords: ['asked', 'texts', 'film', 'crisp', 'hands', 'cold']
    }
  ]
};
