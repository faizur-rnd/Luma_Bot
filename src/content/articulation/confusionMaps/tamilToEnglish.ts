import { ConfusionMap } from '../types.js';

/**
 * Phonological interference map for Tamil L1 speakers acquiring English.
 * Addresses:
 * - Dental fricatives /θ, ð/ vs dental stops /t̪, d̪/
 * - Labiodental fricative /f/ vs bilabial plosive /p/
 * - Labiodental /v/ vs labio-velar /w/
 * - Alveolar /t, d, l, n/ vs retroflex /ʈ, ɖ, ɭ, ɳ/
 * - Epenthetic vowel insertion (/ɪ/ or /ə/) before initial clusters (s-clusters)
 * - Word-final consonant release / epenthetic /u/
 * - Syllable-timed cadence vs stress-timed rhythm & schwa reduction
 */
export const tamilToEnglishConfusionMap: ConfusionMap = {
  sourceL1: 'ta',
  targetLanguage: 'en',
  description: 'Acoustic and articulatory interference patterns for Tamil native speakers learning English',
  contrasts: [
    {
      id: 'ta_en_theta',
      targetPhoneme: 'θ',
      l1Substitutes: ['t̪', 't'],
      acousticConfusionType: 'Unvoiced dental stop substitution',
      articulationTip: 'Place tongue tip gently between upper and lower teeth, blow steady continuous air without stopping it with your tongue.',
      bridgeExplanation: {
        ta: 'நாக்கின் நுனியை முன் பற்களுக்கு இடையே வைத்து காற்றை மெதுவாக விடவும். "த்" போன்று நிறுத்த வேண்டாம்.'
      },
      exampleWords: ['think', 'thank', 'theater', 'path', 'both', 'breath']
    },
    {
      id: 'ta_en_eth',
      targetPhoneme: 'ð',
      l1Substitutes: ['d̪', 'd'],
      acousticConfusionType: 'Voiced dental stop substitution',
      articulationTip: 'Put tongue tip between teeth and hum (voice vibration) while letting continuous air escape along the sides.',
      bridgeExplanation: {
        ta: 'பற்களுக்கு இடையில் நாக்கை வைத்து அதிர்வுடன் கூடிய காற்றை வெளியிடவும்.'
      },
      exampleWords: ['this', 'that', 'there', 'brother', 'weather', 'breathe']
    },
    {
      id: 'ta_en_f_p',
      targetPhoneme: 'f',
      l1Substitutes: ['p', 'pʰ'],
      acousticConfusionType: 'Bilabial plosive substitution for labiodental fricative',
      articulationTip: 'Touch your top teeth to your lower lip. Blow friction air; do NOT press your two lips together.',
      bridgeExplanation: {
        ta: 'மேல் பற்களால் கீழ் உதட்டை தொட்டு காற்றை வெளியேற்றவும். இரண்டு உதடுகளையும் சேர்க்க வேண்டாம்.'
      },
      exampleWords: ['fan', 'coffee', 'first', 'profile', 'leaf', 'effort']
    },
    {
      id: 'ta_en_v_w',
      targetPhoneme: 'w',
      l1Substitutes: ['ʋ', 'v'],
      acousticConfusionType: 'Labiodental approximant substitution for labio-velar glide',
      articulationTip: 'Round your lips into a tight small "O" circle like blowing a whistle. Do not let your teeth touch your lip.',
      bridgeExplanation: {
        ta: 'உதடுகளை வட்டமாக குவித்து "ஊ" சொல்வது போல் தொடங்கவும். பற்கள் உதட்டில் படக்கூடாது.'
      },
      exampleWords: ['water', 'wine', 'wonder', 'west', 'always', 'forward']
    },
    {
      id: 'ta_en_v_fricative',
      targetPhoneme: 'v',
      l1Substitutes: ['ʋ', 'w'],
      acousticConfusionType: 'Labiodental approximant substitution for voiced labiodental fricative',
      articulationTip: 'Rest upper teeth on lower lip and buzz your vocal cords. Feel clear friction.',
      bridgeExplanation: {
        ta: 'மேல் பற்களை கீழ் உதட்டில் வைத்து தொண்டையில் அதிர்வை உணரவும்.'
      },
      exampleWords: ['very', 'voice', 'vine', 'river', 'travel', 'live']
    },
    {
      id: 'ta_en_alveolar_retroflex',
      targetPhoneme: 't',
      l1Substitutes: ['ʈ'],
      acousticConfusionType: 'Retroflex stop substitution for alveolar stop',
      articulationTip: 'Tap the tip of your tongue against the bumpy gum ridge right behind your upper front teeth (alveolar ridge). Do not curl tongue back toward palate.',
      bridgeExplanation: {
        ta: 'நாக்கை பின்னோக்கி சுழற்றாமல் பற்களுக்கு பின்னாலுள்ள மேடான ஈறு பகுதியில் தட்டவும்.'
      },
      exampleWords: ['time', 'table', 'water', 'city', 'matter', 'write']
    },
    {
      id: 'ta_en_cluster_epenthesis',
      targetPhoneme: 'sC_cluster',
      l1Substitutes: ['ɪsC', 'esC'],
      acousticConfusionType: 'Prothetic vowel insertion before initial s-clusters',
      articulationTip: 'Start immediately with pure hiss sound /s/ without any starting vowel (e.g., "sss-chool", not "is-school").',
      bridgeExplanation: {
        ta: 'வார்த்தையை தொடங்கும் போது "இ" அல்லது "எ" சேர்க்காமல் நேரடியாக "ஸ்" சத்தத்துடன் தொடங்கவும்.'
      },
      exampleWords: ['school', 'station', 'special', 'speak', 'structure', 'student']
    },
    {
      id: 'ta_en_schwa_reduction',
      targetPhoneme: 'ə',
      l1Substitutes: ['a', 'o', 'e'],
      acousticConfusionType: 'Full vowel substitution for reduced unstressed schwa',
      articulationTip: 'Relax jaw and tongue completely to neutral central position. Make the sound very short, quiet, and effortless.',
      bridgeExplanation: {
        ta: 'அழுத்தமில்லாத எழுத்துக்களில் வாயை நடுநிலையாக வைத்து மிக லேசாக ஒலிக்கவும்.'
      },
      exampleWords: ['about', 'banana', 'camera', 'police', 'support', 'today']
    }
  ]
};
