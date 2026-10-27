export interface TopicOption {
  id: string;
  title: string;
  language: string;
  prompt: string;
  hint: string;
}

export const TOPICS: TopicOption[] = [
  {
    id: 'arabic-roots',
    title: 'Arabic 3-Letter Roots (الجذور الثلاثية)',
    language: 'ar',
    prompt: 'اشرح كيف تُشتق الكلمات العربية من الجذر الثلاثي (مثل: ك-ت-ب: كتاب، كاتب، مكتبة) وكيف تغير الحركات المعنى.',
    hint: 'Explain how 3-letter roots form nouns, verbs, and places, and why this system makes vocabulary learning fast.'
  },
  {
    id: 'arabic-hospitality',
    title: 'Arabic Hospitality & Coffee (آداب الضيافة والقهوة)',
    language: 'ar',
    prompt: 'اشرح طقوس تقديم القهوة العربية، وماذا تقول عند قبول الفنجان، وكيف تشير إلى أنك اكتفيت بهز الفنجان.',
    hint: 'Mention phrases like "Dā\'imah" and explain the cultural significance of offering with the right hand.'
  },
  {
    id: 'cafe-order',
    title: 'Ordering at a cafe',
    language: 'en',
    prompt: 'Explain in your target language how to politely order a coffee with milk, ask for the bill, and thank the host.',
    hint: 'Use polite phrases and explain why respectful tone matters in daily interactions.'
  },
  {
    id: 'directions',
    title: 'Asking for directions',
    language: 'en',
    prompt: 'Explain how to ask someone for directions to the nearest train station and understand left/right/straight cues.',
    hint: 'Mention key orientation words and courteous opening inquiries.'
  }
];
