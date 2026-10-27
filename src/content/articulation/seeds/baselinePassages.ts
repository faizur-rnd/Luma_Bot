import { BaselinePassage } from '../types.js';

export const baselinePassages: BaselinePassage[] = [
  {
    id: 'baseline_diagnostic_level_1',
    level: 'beginner',
    title: 'Daily Routine & Warm Welcomes',
    text: 'Good morning! Today is a clear and pleasant day to practice speaking. I walk to the park every morning, breathe the fresh air, and greet my friends with a warm smile. Learning clear pronunciation takes steady patience, but every small step makes conversation easier and more natural.',
    targetPhonemeCoverage: [
      'θ', 'ð', 'p', 'b', 'f', 'v', 'w', 's', 'z', 't', 'd', 'ɪ', 'iː', 'ʊ', 'uː', 'ə'
    ],
    wordCount: 47,
    suggestedPacingWpm: 120
  },
  {
    id: 'baseline_diagnostic_level_2',
    level: 'intermediate',
    title: 'Project Strategy & Team Communication',
    text: 'During our quarterly review yesterday, the product team delivered a thoughtful presentation on our global rollout strategy. We examined five specific metrics, identified key bottlenecks in system performance, and proposed structured improvements for customer feedback. Clear communication enables every partner to stay aligned, track progress systematically, and meet critical deadlines with absolute confidence.',
    targetPhonemeCoverage: [
      'θ', 'ð', 'p', 'b', 'f', 'v', 'w', 'ɹ', 'l', 't', 'd', 'k', 'g', 'sC_cluster', 'CC_coda', 'ə', 'eɪ', 'aɪ', 'oʊ'
    ],
    wordCount: 56,
    suggestedPacingWpm: 135
  },
  {
    id: 'baseline_diagnostic_level_3',
    level: 'advanced',
    title: 'Technological Innovation & Linguistic Nuance',
    text: 'Modern articulation synthesizers continuously bridge the gap between acoustic precision and natural expressive prosody. When speakers articulate subtle phonetic contrasts—distinguishing voiced from unvoiced dental fricatives, regulating vowel duration, and maintaining steady sentence intonation—their professional presence transforms dramatically. Genuine mastery requires deliberate practice, acute self-awareness, and disciplined feedback across complex multisyllabic phrases.',
    targetPhonemeCoverage: [
      'θ', 'ð', 'p', 'b', 'f', 'v', 'w', 'ɹ', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ŋ', 'sC_cluster', 'CC_coda', 'ə', 'aʊ', 'ɔɪ'
    ],
    wordCount: 56,
    suggestedPacingWpm: 145
  }
];
