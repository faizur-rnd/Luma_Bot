// LUMA 12-Week Articulation & Speaking Program Engine
// Deterministic curriculum generator customized by native language (L1) and target accent

export interface DailyStep {
  stepNumber: number;
  type: 'warmup' | 'drills' | 'shadowing' | 'spontaneous' | 'reflection';
  title: string;
  durationMinutes: number;
  instructions: string;
  payload: Record<string, any>;
}

export interface DailySessionPlan {
  dayNumber: number;
  dayTitle: string;
  theme: string;
  steps: DailyStep[];
}

export interface WeekPlan {
  weekNumber: number;
  title: string;
  focusPhonemes: string[];
  theme: string;
  milestoneType: 'none' | 'weekly_checkpoint' | 'retest';
  sessions: DailySessionPlan[];
}

const WARMUPS = [
  {
    title: 'Jaw & Soft Palate Release',
    cues: 'Drop jaw gently 5 times, yawn deeply to elevate soft palate, glide from low hum to high pitch.'
  },
  {
    title: 'Tongue Apex & Alveolar Precision',
    cues: 'Tap tongue tip rapidly behind upper teeth /t-d-t-d/, alternate with /l-n-l-n/ maintaining relaxed lips.'
  },
  {
    title: 'Lip Rounding & Labiodental Isolation',
    cues: 'Alternate exaggerated smile /iː/ with pursed lips /uː/, bite lower lip lightly for /f-v/ airflow.'
  },
  {
    title: 'Diaphragmatic Breath & Subglottal Push',
    cues: 'Inhale silently through nose 4 counts, exhale sustained unvoiced /s/ for 12 counts without throat tension.'
  },
  {
    title: 'Resonance & Connected Voice Glide',
    cues: 'Hum into mask of face /m/, open slowly into /mɑː/, feel frontal vibration on upper lip and nasal bridge.'
  }
];

export function generate12WeekProgram(l1: string = 'ta', targetAccent: string = 'en-US'): WeekPlan[] {
  const isTamil = l1 === 'ta';
  const isArabic = l1 === 'ar';

  const weeksConfig = [
    {
      week: 1,
      title: 'Plosive Contrast & Aspiration Control',
      phonemes: isTamil ? ['p', 'b', 't', 'd'] : ['p', 'b'],
      theme: 'Mastering the unvoiced vs voiced plosive distinction and aspiration bursts.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 2,
      title: 'Labiodental & Dental Fricatives',
      phonemes: isTamil ? ['f', 'v', 'w'] : ['v', 'f'],
      theme: 'Differentiating upper-teeth/lower-lip /f, v/ from bilabial rounded /w/.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 3,
      title: 'Interdental Friction & Alveolar Sibilants',
      phonemes: isTamil ? ['θ', 'ð', 's', 'z'] : ['θ', 'ð', 'z'],
      theme: 'Placing tongue tip between teeth for "th" sounds without dental stop substitution.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 4,
      title: 'Vowel Duration & Tense/Lax Contrast + Retest 1',
      phonemes: isTamil ? ['iː', 'ɪ', 'uː', 'ʊ'] : ['ɪ', 'e', 'æ'],
      theme: 'Holding long tense vowels vs clipping short lax vowels cleanly.',
      milestone: 'retest' as const
    },
    {
      week: 5,
      title: 'Alveolar Approximants & Lateral Liquids',
      phonemes: ['ɹ', 'l'],
      theme: 'Bunched or retroflex English /r/ vs dental lateral /l/ with zero trilling.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 6,
      title: 'Word-Initial & Coda Consonant Clusters',
      phonemes: isTamil ? ['sC_cluster', 'CC_coda'] : ['sC_cluster', 'epenthesis_reduction'],
      theme: 'Eliminating vowel insertion (epenthesis) before /s/ clusters and after word-final stops.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 7,
      title: 'Syllable Stress & The Schwa Vowel',
      phonemes: ['ə', 'ʌ'],
      theme: 'Mastering rhythmic stress timing and reducing unstressed English syllables to schwa.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 8,
      title: 'Connected Speech & Catenation + Retest 2',
      phonemes: ['linking_r', 'catenation', 'weak_forms'],
      theme: 'Smooth word linking across boundaries: consonant-to-vowel glide and reduced function words.',
      milestone: 'retest' as const
    },
    {
      week: 9,
      title: 'Affricate Precision & Postalveolar Friction',
      phonemes: isTamil ? ['tʃ', 'dʒ', 'ʃ', 'ʒ'] : ['tʃ', 'ʃ', 'dʒ'],
      theme: 'Distinguishing smooth friction /ʃ/ from sharp stop-release /tʃ/.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 10,
      title: 'Intonation Contours & Pitch Accents',
      phonemes: ['rising_tone', 'falling_tone', 'tonic_stress'],
      theme: 'Modulating pitch across clauses: questioning rises, authoritative falls, and list pivots.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 11,
      title: 'Discourse Pacing & High-Stakes Articulation',
      phonemes: ['pause_management', 'thought_groups'],
      theme: 'Maintaining clear articulation under speed: thought groups, breath marks, and zero filler words.',
      milestone: 'weekly_checkpoint' as const
    },
    {
      week: 12,
      title: 'Capstone Graduation & Final Benchmark Retest',
      phonemes: ['all_target_phonemes', 'overall_fluency'],
      theme: 'Full speech presentation, side-by-side diagnostic evaluation, and graduation certification.',
      milestone: 'retest' as const
    }
  ];

  return weeksConfig.map((cfg) => {
    const sessions: DailySessionPlan[] = [];

    for (let day = 1; day <= 5; day++) {
      const warmupIndex = (cfg.week + day) % WARMUPS.length;
      const warmup = WARMUPS[warmupIndex];

      const steps: DailyStep[] = [
        {
          stepNumber: 1,
          type: 'warmup',
          title: 'Articulatory Warmup',
          durationMinutes: 2,
          instructions: `${warmup.title}: ${warmup.cues}`,
          payload: { focus: cfg.phonemes[0] || 'neutral', warmup }
        },
        {
          stepNumber: 2,
          type: 'drills',
          title: 'Target Phoneme Drills',
          durationMinutes: 4,
          instructions: `Practice focused minimal pair contrasts for ${cfg.phonemes.join(', ')}.`,
          payload: { targetPhonemes: cfg.phonemes, l1, targetAccent }
        },
        {
          stepNumber: 3,
          type: 'shadowing',
          title: 'Native Model Shadowing',
          durationMinutes: 4,
          instructions: 'Listen to the native reference audio model and repeat with matched rhythm and intonation.',
          payload: { targetAccent, dialect: targetAccent === 'en-IN' ? 'Indian English' : 'American English' }
        },
        {
          stepNumber: 4,
          type: 'spontaneous',
          title: 'Spontaneous Speaking (60s)',
          durationMinutes: 3,
          instructions: 'Speak continuously on the given topic without notes, maintaining target sounds under pressure.',
          payload: {
            topic: day === 5 && cfg.milestone === 'retest'
              ? 'Comprehensive Milestone Spontaneous Check'
              : `Describe a recent experience involving ${cfg.title.toLowerCase()}.`,
            timeLimitSeconds: 60
          }
        },
        {
          stepNumber: 5,
          type: 'reflection',
          title: 'Review & Mastery Update',
          durationMinutes: 2,
          instructions: 'Review feedback, track phoneme accuracy progress, and save your practice streak.',
          payload: { week: cfg.week, day }
        }
      ];

      sessions.push({
        dayNumber: day,
        dayTitle: `Week ${cfg.week} Day ${day}`,
        theme: `${cfg.title} - Step ${day}`,
        steps
      });
    }

    return {
      weekNumber: cfg.week,
      title: cfg.title,
      focusPhonemes: cfg.phonemes,
      theme: cfg.theme,
      milestoneType: cfg.milestone,
      sessions
    };
  });
}
