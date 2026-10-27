import { VocabularyItem } from '../../services/apiClient.ts';

export const DEFAULT_ARABIC_VOCABULARY: Partial<VocabularyItem>[] = [
  { 
    term: 'السَّلَامُ عَلَيْكُمْ', 
    translation: 'Peace be upon you (Universal Arabic greeting)', 
    phonetic: 'As-salāmu ʿalaykum',
    part_of_speech: 'expression', 
    context_example: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّه' 
  },
  { 
    term: 'شُكْرًا جَزِيلًا', 
    translation: 'Thank you very much', 
    phonetic: 'Shukran jazīlan',
    part_of_speech: 'expression', 
    context_example: 'شُكْرًا جَزِيلًا عَلَى حُسْنِ ضِيَافَتِكُم' 
  },
  { 
    term: 'أَهْلًا وَسَهْلًا', 
    translation: 'Welcome / You are with family', 
    phonetic: 'Ahlan wa sahlan',
    part_of_speech: 'expression', 
    context_example: 'أَهْلًا وَسَهْلًا بِكُمْ فِي بَيْتِنَا' 
  },
  { 
    term: 'تَفَضَّلْ', 
    translation: 'Please go ahead / Here you are', 
    phonetic: 'Tafaḍḍal',
    part_of_speech: 'verb', 
    context_example: 'تَفَضَّلْ بِالدُّخُولِ يَا أَخِي' 
  },
  { 
    term: 'فُرْصَة سَعِيدَة', 
    translation: 'Pleased to make your acquaintance', 
    phonetic: 'Furṣah saʿīdah',
    part_of_speech: 'expression', 
    context_example: 'تَشَرَّفْنَا بِمَعْرِفَتِكُمْ، فُرْصَة سَعِيدَة' 
  }
];

export const DEFAULT_ENGLISH_VOCABULARY: Partial<VocabularyItem>[] = [
  { term: 'Gratitude', translation: 'A feeling of thankfulness and appreciation', part_of_speech: 'noun', context_example: 'She expressed deep gratitude for their support.' },
  { term: 'Patience', translation: 'The capacity to accept delay calmly', part_of_speech: 'noun', context_example: 'Learning a new language requires patience and repetition.' },
  { term: 'Opportunity', translation: 'A set of circumstances making something possible', part_of_speech: 'noun', context_example: 'Speaking daily is an opportunity to improve.' }
];
