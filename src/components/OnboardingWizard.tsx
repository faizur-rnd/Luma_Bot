import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Compass, 
  Target, 
  Volume2, 
  ShieldCheck, 
  Calendar, 
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';

interface OnboardingWizardProps {
  theme: 'dark' | 'light';
  onComplete: (curriculum: any) => void;
  onCancel?: () => void;
  existingAnswers?: any;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  theme,
  onComplete,
  onCancel,
  existingAnswers
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCurriculum, setGeneratedCurriculum] = useState<any | null>(null);
  const [searchLangQuery, setSearchLangQuery] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [customGoalText, setCustomGoalText] = useState('');

  // 10 Primary Answers
  const [answers, setAnswers] = useState({
    q1_nativeLanguage: existingAnswers?.q1_nativeLanguage || 'ta',
    q2_targetLanguage: 'en',
    q3_primaryPurposes: existingAnswers?.q3_primaryPurposes || ['Everyday conversation', 'Career growth'],
    q4_currentProficiency: existingAnswers?.q4_currentProficiency || 'I can manage basic conversations',
    q5_speakingDifficulties: existingAnswers?.q5_speakingDifficulties || ['I cannot find the right words', 'I translate from my native language'],
    q6_dailyMinutes: existingAnswers?.q6_dailyMinutes || 30,
    q7_targetMonths: existingAnswers?.q7_targetMonths || 3,
    q8_learningPreferences: existingAnswers?.q8_learningPreferences || ['Talk with an AI tutor', 'Practice real-life role-play', 'Receive explanations in my native language'],
    q9_schedulePreferences: existingAnswers?.q9_schedulePreferences || {
      preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      preferredTimeOfDay: 'evening',
      speechSpeed: 'normal' as 'slow' | 'normal' | 'fast',
      interactionMode: 'voice_primary' as 'voice_primary' | 'balanced',
      feedbackTiming: 'immediate' as 'immediate' | 'delayed'
    },
    q10_successDefinition: existingAnswers?.q10_successDefinition || 'Hold a 10-minute spontaneous conversation without hesitation.'
  });

  // Save progress safely on step changes
  useEffect(() => {
    apiClient.saveOnboarding(answers).catch(() => {});
  }, [answers, currentStep]);

  const toggleMultiSelect = (key: 'q3_primaryPurposes' | 'q5_speakingDifficulties' | 'q8_learningPreferences', value: string) => {
    setAnswers(prev => {
      const list: string[] = (prev[key] as string[]) || [];
      const updated = list.includes(value)
        ? list.filter((item: string) => item !== value)
        : [...list, value];
      return { ...prev, [key]: updated };
    });
  };

  const supportedLanguages = [
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', badge: 'Full Bridge Support' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', badge: 'Full Bridge Support' },
    { code: 'ar', name: 'Arabic', native: 'العربية', badge: 'Full Bridge Support' },
    { code: 'es', name: 'Spanish', native: 'Español', badge: 'Full Bridge Support' },
    { code: 'fr', name: 'French', native: 'Français', badge: 'Full Bridge Support' },
    { code: 'de', name: 'German', native: 'Deutsch', badge: 'Bridge Explanations' },
    { code: 'ja', name: 'Japanese', native: '日本語', badge: 'Bridge Explanations' },
    { code: 'other', name: 'Other', native: 'Custom', badge: 'Text Fallback' }
  ];

  const filteredLangs = supportedLanguages.filter(l => 
    l.name.toLowerCase().includes(searchLangQuery.toLowerCase()) ||
    l.native.toLowerCase().includes(searchLangQuery.toLowerCase())
  );

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(s => s + 1);
    } else {
      triggerCurriculumGeneration();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };

  const triggerCurriculumGeneration = async () => {
    setIsGenerating(true);
    try {
      const finalAnswers = {
        ...answers,
        q10_successDefinition: customGoalText.trim() || answers.q10_successDefinition
      };
      const curriculum = await apiClient.generateCurriculum(finalAnswers);
      setGeneratedCurriculum(curriculum);
    } catch (e) {
      console.error('Curriculum generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptCurriculum = async () => {
    if (generatedCurriculum) {
      await apiClient.acceptCurriculum(generatedCurriculum.id);
      onComplete(generatedCurriculum);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Onboarding Wizard Card */}
      <div className="p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        {/* Step Indicator Header (unless reviewing generated curriculum) */}
        {!generatedCurriculum && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
              <span className="flex items-center gap-1.5 text-[#8B5CF6] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Tutor Placement Assessment</span>
              </span>
              <span>Step {currentStep} of 10</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-aurora rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 1 — Native Language
        ========================================================================= */}
        {currentStep === 1 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                Question 1 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                What is your native language, or the language you are most comfortable speaking?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                LUMA uses this as your bridge language for translations, grammatical insights, and spoken coaching.
              </p>
            </div>

            {/* Language search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchLangQuery}
                onChange={(e) => setSearchLangQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                style={{
                  backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                  borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                }}
              />
            </div>

            {/* Language Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredLangs.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setAnswers(prev => ({ ...prev, q1_nativeLanguage: lang.code }))}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    answers.q1_nativeLanguage === lang.code
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 shadow-sm'
                      : 'border-black/5 dark:border-white/10 hover:border-[#8B5CF6]/40'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{lang.name}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{lang.native}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 font-semibold text-[#8B5CF6]">
                    {lang.badge}
                  </span>
                </button>
              ))}
            </div>

            {answers.q1_nativeLanguage === 'other' && (
              <input
                type="text"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder="Specify your native language (e.g. Swahili, Bengali, Urdu)..."
                className="w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                style={{
                  backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                  borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                }}
              />
            )}
          </div>
        )}

        {/* =========================================================================
            QUESTION 2 — Target Language
        ========================================================================= */}
        {currentStep === 2 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                Question 2 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                Which language would you like to learn?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                LUMA provides full acoustic voice recognition, pronunciation scoring, and generative CEFR curriculum for English, Arabic, and German.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  code: 'en',
                  title: 'English (English)',
                  desc: 'Full acoustic voice recognition (en-US), natural TTS, and CEFR A1-C1 curriculum.',
                  badge: 'Active Target'
                },
                {
                  code: 'ar',
                  title: 'Arabic (العربية - الفصحى)',
                  desc: 'Modern Standard Arabic with RTL support, Web Speech API (ar-SA), and phonological root coaching.',
                  badge: 'Active Target'
                },
                {
                  code: 'es',
                  title: 'Spanish (Español)',
                  desc: 'Full speech recognition (es-ES / es-MX), natural TTS, DELE / SIELE certification, and situational fluency.',
                  badge: 'Active Target'
                },
                {
                  code: 'de',
                  title: 'German (Deutsch)',
                  desc: 'Full speech recognition (de-DE), natural TTS, case declension (der/die/das), and situational fluency.',
                  badge: 'Active Target'
                }
              ].map(target => (
                <button
                  key={target.code}
                  type="button"
                  onClick={() => {
                    const newLang = target.code;
                    setAnswers(prev => {
                      let newPurposes = prev.q3_primaryPurposes;
                      let newDifficulties = prev.q5_speakingDifficulties;
                      let newGoal = prev.q10_successDefinition;

                      if (newLang === 'ar') {
                        newPurposes = [
                          'Everyday conversation & Arab hospitality (الحديث اليومي وحسن الضيافة)',
                          'Arabic language proficiency exams (ALPT / CIMA / ACTFL OPI)',
                          'GCC & Middle East workplace communication (بيئة العمل في دول الخليج)'
                        ];
                        newDifficulties = [
                          'Pharyngeal & emphatic sounds (ح، خ، ع، ص، ض، ط، ظ)',
                          'Deriving words from the 3-letter root system (الجذور والأوزان)',
                          'Arabic case endings & grammatical syntax (الإعراب وقواعد النحو)'
                        ];
                        newGoal = 'Score Level 4/5 in ALPT or C1 in CIMA (Institut du Monde Arabe) and hold spontaneous Fusha conversations.';
                      } else if (newLang === 'es') {
                        newPurposes = [
                          'Everyday conversation & social networking (Conversación cotidiana)',
                          'Spanish proficiency exams (DELE / SIELE / OPI)',
                          'Travel and business across Spain & Latin America (Negocios y viajes)'
                        ];
                        newDifficulties = [
                          'Ser vs Estar and Por vs Para distinctions',
                          'Subjunctive mood & past tense conjugations (Pretérito vs Imperfecto)',
                          'Natural spoken speed and liaison between words'
                        ];
                        newGoal = 'Score DELE B2/C1 and speak spontaneously with native Spanish speakers in professional and social settings.';
                      } else if (newLang === 'de') {
                        newPurposes = [
                          'Everyday conversation & social life (Alltägliche Konversation)',
                          'German proficiency exams (Goethe-Zertifikat / TestDaF / telc / DSH)',
                          'Workplace & career in DACH region (Arbeitsplatz in Deutschland/Schweiz/Österreich)'
                        ];
                        newDifficulties = [
                          'Genders & case declensions (der/die/das - Akkusativ/Dativ)',
                          'Separable verbs & subordinate clause word order (Verbendstellung)'
                        ];
                        newGoal = 'Pass Goethe-Zertifikat B2/C1 or TestDaF and speak fluently in daily professional situations.';
                      } else {
                        newPurposes = [
                          'Everyday conversation & small talk',
                          'International examinations (IELTS Academic / TOEFL iBT / Cambridge)',
                          'Career growth & international promotion'
                        ];
                        newDifficulties = [
                          'I cannot find the right words',
                          'I translate from my native language'
                        ];
                        newGoal = 'Hold a 15-minute spontaneous conversation without hesitation and score Band 7.5+ in IELTS.';
                      }

                      return {
                        ...prev,
                        q2_targetLanguage: newLang,
                        q3_primaryPurposes: newPurposes,
                        q5_speakingDifficulties: newDifficulties,
                        q10_successDefinition: newGoal
                      };
                    });
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    answers.q2_targetLanguage === target.code
                      ? 'border-[#34D399] bg-[#34D399]/15 shadow-md'
                      : 'border-black/5 dark:border-white/10 hover:border-[#34D399]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#34D399]/20 flex items-center justify-center font-bold text-sm text-[#34D399] uppercase">
                      {target.code}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{target.title}</div>
                      <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{target.desc}</div>
                    </div>
                  </div>
                  {answers.q2_targetLanguage === target.code && (
                    <CheckCircle2 className="w-6 h-6 text-[#34D399] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <strong>Verified Target Languages: </strong> English, Arabic, and German are all officially supported with real speech synthesis, speech recognition, and generative 70/20/10 curriculum planning.
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 3 — Primary Purpose (Dynamic by Target Language)
        ========================================================================= */}
        {currentStep === 3 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">
                Question 3 of 10 (Select all that apply)
              </span>
              <h2 className="text-xl font-bold mt-1">
                Why do you want to learn {answers.q2_targetLanguage === 'ar' ? 'Arabic (العربية)' : answers.q2_targetLanguage === 'de' ? 'German (Deutsch)' : 'English'}?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                This shapes your dialogue contexts, spoken scenarios, and target exam benchmarks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(answers.q2_targetLanguage === 'ar' ? [
                'Everyday conversation & Arab hospitality (الحديث اليومي وحسن الضيافة)',
                'GCC & Middle East workplace communication (بيئة العمل في دول الخليج)',
                'Business meetings & commercial negotiation (الاجتماعات والمفاوضات)',
                'Arabic language proficiency exams (ALPT / CIMA / ACTFL OPI)',
                'Travel & cultural immersion in Arab countries (السفر والسياحة العربية)',
                'Media Arabic & news journalism (لغة الإعلام والصحافة)',
                'Islamic & classical literature studies (الدراسات التراثية والأدبية)',
                'Government & diplomatic communication (العلاقات الدبلوماسية)',
                'Public speaking & keynote oratory (الخطابة والإلقاء)',
                'Confidence & spontaneous fluency (الطلاقة والتحدث العفوي)'
              ] : answers.q2_targetLanguage === 'de' ? [
                'Everyday conversation & social life (Alltägliche Konversation)',
                'Workplace & career in DACH region (Arbeitsplatz in Deutschland/Schweiz/Österreich)',
                'Job interviews & salary negotiations (Vorstellungsgespräche)',
                'German proficiency exams (Goethe-Zertifikat / TestDaF / telc / DSH)',
                'University study & academic research (Studium an deutschen Universitäten)',
                'Travel & daily navigation in Germany (Reisen & Alltag)',
                'Immigration & naturalization requirements (Einbürgerungstest & Aufenthalt)',
                'Confidence & spontaneous fluency (Sprechsicherheit im Alltag)',
                'Technical & engineering discussions (Fachsprache & Technik)',
                'Business meetings & stakeholder presentations'
              ] : [
                'Everyday conversation & small talk',
                'Career growth & international promotion',
                'Job interviews & salary negotiation',
                'Workplace & corporate communication',
                'Business & executive meetings',
                'International examinations (IELTS Academic / TOEFL iBT / Cambridge)',
                'Travel & international trips',
                'Relocation & immigration',
                'Confidence & spontaneous fluency',
                'Academic presentations & thesis defense'
              ]).map(purpose => {
                const selected = answers.q3_primaryPurposes.includes(purpose);
                return (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => toggleMultiSelect('q3_primaryPurposes', purpose)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#8B5CF6]'
                        : 'border-black/5 dark:border-white/10 hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    <span>{purpose}</span>
                    {selected && <Check className="w-4 h-4 text-[#8B5CF6] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 4 — Current Proficiency (Dynamic by Target Language)
        ========================================================================= */}
        {currentStep === 4 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D946EF]">
                Question 4 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                How comfortable are you using {answers.q2_targetLanguage === 'ar' ? 'Arabic' : answers.q2_targetLanguage === 'de' ? 'German' : 'English'} today?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                This determines your CEFR starting tier. LUMA adapts as your spoken assessments progress.
              </p>
            </div>

            <div className="space-y-2">
              {(answers.q2_targetLanguage === 'ar' ? [
                { title: 'Complete beginner (أبجدية)', desc: 'No prior exposure to the Arabic script or basic sounds.' },
                { title: 'Recognize letters & common words (معرفة الحروف)', desc: 'Can read basic words, recognize simple signage, isolated vocabulary.' },
                { title: 'Simple everyday greetings (التحيات والعبارات اليومية)', desc: 'Can say Salam, introduce myself, and ask simple survival questions.' },
                { title: 'Basic conversation with hesitation (محادثة أساسية مع تردد)', desc: 'Can handle souks, travel, and food orders, but struggle with verb forms.' },
                { title: 'Intermediate conversation with root/grammar errors (محادثة متوسطة)', desc: 'Can hold discussions, but make mistakes with Arabic root patterns and case endings.' },
                { title: 'Advanced fluency seeking executive presence (فصاحة مهنية وإعلامية)', desc: 'Want nuanced commercial rhetoric, conference delivery, and formal Fusha mastery.' },
                { title: 'Unsure (Adaptive assessment)', desc: 'Let LUMA determine my level through active voice placement.' }
              ] : answers.q2_targetLanguage === 'de' ? [
                { title: 'Complete beginner (A1 starter)', desc: 'Little to no previous exposure to German vocabulary or grammar.' },
                { title: 'Recognize isolated words (A1)', desc: 'Know numbers, greetings, and basic phrases like "Guten Tag".' },
                { title: 'Simple everyday conversations (A2)', desc: 'Can handle routine situations: ordering at a bakery, asking for directions.' },
                { title: 'Conversational with grammar errors (B1)', desc: 'Can express opinions, but hesitate with der/die/das cases and sentence order.' },
                { title: 'Professional fluency seeking precision (B2/C1)', desc: 'Want fluent business negotiations, complex German syntax, and idiomatic ease.' },
                { title: 'Unsure (Adaptive assessment)', desc: 'Let LUMA determine my level through active voice placement.' }
              ] : [
                { title: 'Complete beginner', desc: 'I have had very little or no previous exposure.' },
                { title: 'I know a few words', desc: 'I recognize isolated words and common signs.' },
                { title: 'I can understand simple sentences', desc: 'I understand slow, clear speech about familiar things.' },
                { title: 'I can manage basic conversations', desc: 'I can handle everyday situations like ordering food or simple greetings.' },
                { title: 'I can communicate but make frequent mistakes', desc: 'I can hold a conversation, but hesitate and search for grammar rules.' },
                { title: 'I can communicate comfortably and want advanced fluency', desc: 'I want professional nuance, executive presence, and rapid debate agility.' },
                { title: 'I am unsure', desc: 'Let LUMA determine my level through adaptive practice.' }
              ]).map(prof => (
                <button
                  key={prof.title}
                  type="button"
                  onClick={() => setAnswers(prev => ({ ...prev, q4_currentProficiency: prof.title }))}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    answers.q4_currentProficiency === prof.title
                      ? 'border-[#D946EF] bg-[#D946EF]/15 shadow-sm'
                      : 'border-black/5 dark:border-white/10 hover:border-[#D946EF]/40'
                  }`}
                >
                  <div className="text-xs font-bold">{prof.title}</div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{prof.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 5 — Speaking Difficulties (Dynamic by Target Language)
        ========================================================================= */}
        {currentStep === 5 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB7185]">
                Question 5 of 10 (Select all that apply)
              </span>
              <h2 className="text-xl font-bold mt-1">
                What makes speaking {answers.q2_targetLanguage === 'ar' ? 'Arabic' : answers.q2_targetLanguage === 'de' ? 'German' : 'English'} difficult for you?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                LUMA designs targeted remediation exercises for each acoustic, phonetic, or grammatical obstacle selected.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(answers.q2_targetLanguage === 'ar' ? [
                'Pharyngeal & emphatic sounds (ح، خ، ع، ص، ض، ط، ظ)',
                'Deriving words from the 3-letter root system (الجذور والأوزان)',
                'Arabic case endings & grammatical syntax (الإعراب وقواعد النحو)',
                'Distinguishing formal Fusha from regional dialects (الفصحى والعامية)',
                'Hesitation when retrieving formal vocabulary under pressure',
                'Translating from my native bridge language in my mind',
                'Understanding fast native spoken Arabic audio',
                'Fear of making pronunciation or voweling errors',
                'Lack of professional & diplomatic Arabic terminology',
                'Maintaining rhythm and breath control during long sentences'
              ] : answers.q2_targetLanguage === 'de' ? [
                'Genders & case declensions (der/die/das - Akkusativ/Dativ)',
                'Separable verbs & subordinate clause word order (Verbendstellung)',
                'Pronouncing umlauts and consonant clusters (ö, ä, ü, ch, sch)',
                'Translating from native language instead of thinking in German',
                'Hesitation finding specialized vocabulary',
                'Understanding fast native German speakers in everyday noise',
                'Fear of making grammatical mistakes in public',
                'Subjunctive II & polite business formulations (Konjunktiv II)'
              ] : [
                'I cannot find the right words',
                'I translate from my native language',
                'I am afraid of making mistakes',
                'I struggle with pronunciation',
                'I understand English but cannot reply quickly',
                'I make grammar mistakes',
                'I struggle to understand other speakers',
                'I lack confidence',
                'I need professional vocabulary'
              ]).map(diff => {
                const selected = answers.q5_speakingDifficulties.includes(diff);
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => toggleMultiSelect('q5_speakingDifficulties', diff)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#FB7185] bg-[#FB7185]/15 text-[#FB7185]'
                        : 'border-black/5 dark:border-white/10 hover:border-[#FB7185]/40'
                    }`}
                  >
                    <span>{diff}</span>
                    {selected && <Check className="w-4 h-4 text-[#FB7185] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 6 — Daily Learning Time (70/20/10 Allocation)
        ========================================================================= */}
        {currentStep === 6 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB923C]">
                Question 6 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                How much time can you realistically study each day?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Every session strictly enforces the 70% Speaking, 20% Listening, and 10% Writing breakdown.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[10, 15, 20, 30, 45, 60].map(mins => {
                const spk = Math.round(mins * 0.70);
                const lis = Math.round(mins * 0.20);
                const wri = mins - spk - lis;

                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, q6_dailyMinutes: mins }))}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      answers.q6_dailyMinutes === mins
                        ? 'border-[#FB923C] bg-[#FB923C]/15 shadow-md'
                        : 'border-black/5 dark:border-white/10 hover:border-[#FB923C]/40'
                    }`}
                  >
                    <div className="text-2xl font-black text-white">{mins} min</div>
                    <div className="text-[10px] font-mono text-[#FB923C] mt-1">
                      {spk}m spk • {lis}m lis • {wri}m wri
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-3 text-xs">
              <Clock className="w-5 h-5 text-[#FB923C] flex-shrink-0" />
              <div>
                <span className="font-bold">LUMA 70/20/10 Guarantee: </span>
                In a {answers.q6_dailyMinutes}-minute plan, you will spend {Math.round(answers.q6_dailyMinutes * 0.7)} minutes actively speaking aloud, {Math.round(answers.q6_dailyMinutes * 0.2)} minutes listening, and {answers.q6_dailyMinutes - Math.round(answers.q6_dailyMinutes * 0.7) - Math.round(answers.q6_dailyMinutes * 0.2)} minutes writing.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 7 — Target Duration & Milestone Reality Check
        ========================================================================= */}
        {currentStep === 7 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                Question 7 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                When would you like to achieve your main learning goal?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                We calibrate milestones by month to ensure your goal is realistically achievable without burnout.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 6, 9, 12].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAnswers(prev => ({ ...prev, q7_targetMonths: m }))}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    answers.q7_targetMonths === m
                      ? 'border-[#34D399] bg-[#34D399]/15 shadow-md'
                      : 'border-black/5 dark:border-white/10 hover:border-[#34D399]/40'
                  }`}
                >
                  <div className="text-xl font-black text-white">{m} {m === 1 ? 'Month' : 'Months'}</div>
                  <div className="text-[10px] text-[#34D399] mt-1">
                    ~{m * 30 * answers.q6_dailyMinutes / 60 | 0} hours total practice
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 text-xs text-[#34D399]">
              <strong>Pedagogical Milestone Note: </strong>
              With {answers.q6_dailyMinutes} mins/day across {answers.q7_targetMonths} months, you will achieve approximately {Math.round((answers.q7_targetMonths * 30 * answers.q6_dailyMinutes) / 60)} hours of intensive spoken practice—ideal for transitioning to spontaneous conversational fluency.
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 8 — Preferred Learning Experience (Multi-select)
        ========================================================================= */}
        {currentStep === 8 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                Question 8 of 10 (Select all that apply)
              </span>
              <h2 className="text-xl font-bold mt-1">
                How would you like to practice?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                We tailor exercise formats and feedback timing to your learning style.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Talk with an AI tutor',
                'Practice real-life role-play',
                'Listen and answer questions',
                'Repeat sentences aloud',
                'Learn through stories',
                'Practice workplace scenarios',
                'Practice interviews and presentations',
                'Learn vocabulary with spaced repetition',
                'Receive explanations in my native language',
                'Receive corrections after every response',
                'Receive corrections after I finish speaking'
              ].map(pref => {
                const selected = answers.q8_learningPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleMultiSelect('q8_learningPreferences', pref)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selected
                        ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#22D3EE]'
                        : 'border-black/5 dark:border-white/10 hover:border-[#22D3EE]/40'
                    }`}
                  >
                    <span>{pref}</span>
                    {selected && <Check className="w-4 h-4 text-[#22D3EE]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 9 — Schedule & Voice Preferences
        ========================================================================= */}
        {currentStep === 9 && !generatedCurriculum && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">
                Question 9 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                When and how do you prefer to learn?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Configure your preferred study routine, speech pace, and feedback style.
              </p>
            </div>

            {/* Speech speed */}
            <div>
              <label className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Tutor Speech Speed:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['slow', 'normal', 'fast'] as const).map(speed => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setAnswers(prev => ({
                      ...prev,
                      q9_schedulePreferences: { ...prev.q9_schedulePreferences, speechSpeed: speed }
                    }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      answers.q9_schedulePreferences.speechSpeed === speed
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#8B5CF6]'
                        : 'border-black/5 dark:border-white/10'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Time of Day */}
            <div>
              <label className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Optimal Time of Day:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['morning', 'afternoon', 'evening'].map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setAnswers(prev => ({
                      ...prev,
                      q9_schedulePreferences: { ...prev.q9_schedulePreferences, preferredTimeOfDay: time }
                    }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      answers.q9_schedulePreferences.preferredTimeOfDay === time
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#8B5CF6]'
                        : 'border-black/5 dark:border-white/10'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice vs Text Notice */}
            <div className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#34D399]">
                <ShieldCheck className="w-4 h-4" />
                <span>Microphone & Privacy Guarantee</span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                LUMA uses the browser Web Speech API. Audio is processed for immediate pronunciation evaluation and is never retained without your explicit consent.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            QUESTION 10 — Success Definition (Dynamic by Target Language)
        ========================================================================= */}
        {currentStep === 10 && !generatedCurriculum && !isGenerating && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D946EF]">
                Question 10 of 10
              </span>
              <h2 className="text-xl font-bold mt-1">
                What would you like to be able to do confidently by your target date?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Choose a concrete target outcome or write your own custom definition of success.
              </p>
            </div>

            <div className="space-y-2">
              {(answers.q2_targetLanguage === 'ar' ? [
                'Hold a 15-minute spontaneous conversation in Modern Standard Arabic (الفصحى).',
                'Score Level 4/5 in ALPT or C1 in CIMA (Institut du Monde Arabe).',
                'Conduct professional business meetings and negotiations in the GCC.',
                'Deliver a clear 10-minute presentation or keynote in formal Arabic.',
                'Confidently navigate travel, restaurants, and souks across Arab nations.',
                'Speak with accurate voweling, natural cadence, and no mental translation.'
              ] : answers.q2_targetLanguage === 'de' ? [
                'Pass Goethe-Zertifikat B2/C1 or TestDaF with high scores.',
                'Hold spontaneous workplace discussions and team syncs in German.',
                'Conduct job interviews and salary negotiations in Germany confidently.',
                'Give a structured business or technical presentation in German.',
                'Handle administrative and civic tasks in Germany without hesitation.'
              ] : [
                'Hold a 10-minute spontaneous conversation without hesitation.',
                'Score Band 7.5+ in IELTS Academic or 100+ in TOEFL iBT.',
                'Introduce myself confidently to international colleagues and clients.',
                'Speak persuasively during a job interview in English.',
                'Participate actively and express opinions in workplace meetings.',
                'Explain complex ideas and technical trade-offs clearly.'
              ]).map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, q10_successDefinition: goal }));
                    setCustomGoalText('');
                  }}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                    answers.q10_successDefinition === goal && !customGoalText
                      ? 'border-[#D946EF] bg-[#D946EF]/15 text-[#D946EF]'
                      : 'border-black/5 dark:border-white/10 hover:border-[#D946EF]/40'
                  }`}
                >
                  "{goal}"
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Or describe your own personal goal:
              </label>
              <textarea
                value={customGoalText}
                onChange={(e) => setCustomGoalText(e.target.value)}
                placeholder={answers.q2_targetLanguage === 'ar' 
                  ? "مثال: إلقاء كلمة رئيسية لمدة ١٥ دقيقة في مؤتمر تقني باللغة الفصحى دون الرجوع للملاحظات..."
                  : "e.g. Give a 15-minute keynote presentation on cloud architecture without checking my notes..."}
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#D946EF] h-16"
                style={{
                  backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
                  borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
                }}
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            CURRICULUM GENERATION PROGRESS FEEDBACK
        ========================================================================= */}
        {isGenerating && (
          <div className="py-8 px-4 text-center space-y-6 animate-fadeIn">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] border-r-[#22D3EE] animate-spin" />
              <Sparkles className="w-8 h-8 text-[#8B5CF6] animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">
                Instant Curriculum Synthesis
              </span>
              <h2 className="text-xl font-bold">
                Synthesizing Your {answers.q2_targetLanguage === 'ar' ? 'Arabic' : answers.q2_targetLanguage === 'de' ? 'German' : 'English'} Curriculum
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
                Calibrating your 70/20/10 active learning ratio, CEFR milestones, and spoken dialogue missions.
              </p>
            </div>

            {/* Step-by-Step Progress Feedback Indicators */}
            <div className="max-w-md mx-auto space-y-2 text-left bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                <span className="font-medium">
                  Linguistic bridge mapped: <strong className="text-[#8B5CF6]">{answers.q1_nativeLanguage.toUpperCase()} → {answers.q2_targetLanguage.toUpperCase()}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                <span className="font-medium">
                  70/20/10 immersion split: <strong className="text-[#34D399]">{answers.q6_dailyMinutes} min/day</strong> ({Math.round(answers.q6_dailyMinutes * 0.7)}m Spoken, {Math.round(answers.q6_dailyMinutes * 0.2)}m Feedback, {Math.round(answers.q6_dailyMinutes * 0.1)}m Drills)
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <RefreshCw className="w-4 h-4 text-[#22D3EE] animate-spin shrink-0" />
                <span className="font-medium text-[#22D3EE]">
                  Exam benchmarks: <strong className="underline">{answers.q2_targetLanguage === 'ar' ? 'ALPT & CIMA (Arab Institute)' : answers.q2_targetLanguage === 'de' ? 'Goethe & TestDaF' : 'IELTS & TOEFL'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Generating Day 1-3 active role-plays, root drills & acoustic assessments...</span>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-aurora rounded-full animate-pulse w-4/5 transition-all duration-500" />
            </div>
          </div>
        )}

        {/* =========================================================================
            GENERATED CURRICULUM REVIEW SCREEN
        ========================================================================= */}
        {generatedCurriculum && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span>Personalized Curriculum Ready</span>
                </span>
                <h2 className="text-xl font-bold mt-1">Review Your Learning Blueprint</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] font-semibold border border-[#8B5CF6]/30">
                {generatedCurriculum.generationSource === 'gemini_ai_custom' ? 'Gemini 3.8 AI Generated' : 'Approved Pedagogical Plan'}
              </span>
            </div>

            {/* Target Goal & 70/20/10 Ratio Banner */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">Target Outcome:</span>
                <p className="text-sm font-bold text-white mt-0.5">
                  "{generatedCurriculum.overallGoal}"
                </p>
              </div>

              {/* 70/20/10 Allocation Metric */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span>Daily Schedule Allocation ({generatedCurriculum.allocation70_20_10.totalDailyMinutes} min total):</span>
                  <span className="text-[#34D399]">70% Speaking Enforced</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
                    <div className="font-black text-base">{generatedCurriculum.allocation70_20_10.plannedSpeakingMinutes}m</div>
                    <div className="text-[10px] uppercase font-bold">Speaking (70%)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                    <div className="font-black text-base">{generatedCurriculum.allocation70_20_10.plannedListeningMinutes}m</div>
                    <div className="text-[10px] uppercase font-bold">Listening (20%)</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                    <div className="font-black text-base">{generatedCurriculum.allocation70_20_10.plannedWritingMinutes}m</div>
                    <div className="text-[10px] uppercase font-bold">Writing (10%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                Target Progression Milestones:
              </h3>
              <div className="space-y-2">
                {generatedCurriculum.milestones?.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-start justify-between text-xs gap-4">
                    <div>
                      <span className="font-bold text-[#8B5CF6]">{m.period}: </span>
                      <span className="font-semibold">{m.focus}</span>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{m.targetCompetency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Week 1 Daily Missions Preview */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                Week 1 Missions Preview ({generatedCurriculum.weeklyOverview?.week1Theme}):
              </h3>
              <div className="space-y-2">
                {generatedCurriculum.weeklyOverview?.dailyMissions?.map((miss: any) => (
                  <div key={miss.dayNumber} className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">Day {miss.dayNumber}: {miss.theme}</span>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-3 mt-0.5">
                        <span className="text-[#22D3EE]">🗣️ Speaking: {miss.speakingTask?.scenario}</span>
                        <span className="text-[#3B82F6]">🎧 Listening: {miss.listeningTask?.audioContext}</span>
                        <span className="text-[#8B5CF6]">✍️ Writing</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Accept / Recalibrate Buttons */}
            <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
            >
              <button
                type="button"
                onClick={() => setGeneratedCurriculum(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-semibold text-[#64748B] hover:text-white cursor-pointer"
              >
                Adjust My Preferences
              </button>

              <button
                type="button"
                onClick={handleAcceptCurriculum}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-cosmic text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/30 hover:opacity-95 cursor-pointer"
              >
                <span>Publish Plan & Launch Day 1 Mission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        {!generatedCurriculum && !isGenerating && (
          <div className="mt-8 pt-4 border-t flex items-center justify-between"
            style={{ borderColor: theme === 'dark' ? '#263044' : '#E2E8F0' }}
          >
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-white disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-[#64748B] hover:text-white"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-cosmic text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/20 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating AI Curriculum...</span>
                </>
              ) : currentStep === 10 ? (
                <>
                  <span>Generate My Plan</span>
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
