import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { getLanguageCapabilities } from './languageRegistry.ts';

export interface OnboardingAnswers {
  q1_nativeLanguage: string; // e.g. 'ta', 'hi', 'ar', 'es', 'fr', 'en', 'de'
  q2_targetLanguage: string; // 'en' | 'ar' | 'de'
  q3_primaryPurposes: string[]; // ['Everyday conversation', 'Job interviews', ...]
  q4_currentProficiency: string; // 'Complete beginner', 'I can manage basic conversations', etc.
  q5_speakingDifficulties: string[]; // ['Cannot find right words', 'Fear of making mistakes', ...]
  q6_dailyMinutes: number; // 10, 15, 20, 30, 45, 60
  q7_targetMonths: number; // 1, 2, 3, 6, 9, 12
  q8_learningPreferences: string[]; // ['Talk with an AI tutor', 'Practice real-life role-play', ...]
  q9_schedulePreferences: {
    preferredDays: string[];
    preferredTimeOfDay: string;
    speechSpeed: 'slow' | 'normal' | 'fast';
    interactionMode: 'voice_primary' | 'balanced';
    feedbackTiming: 'immediate' | 'delayed';
  };
  q10_successDefinition: string; // e.g. 'Hold a 10-minute conversation'
}

export interface DailyMissionActivity {
  dayNumber: number;
  theme: string;
  speakingTask: {
    id: string;
    scenario: string;
    prompt: string;
    targetMinutes: number;
    samplePhrases: string[];
    bridgeTranslation?: string;
  };
  listeningTask: {
    id: string;
    audioContext: string;
    passage: string;
    question: string;
    options: string[];
    correctIndex: number;
    targetMinutes: number;
  };
  writingTask: {
    id: string;
    prompt: string;
    guidelines: string;
    sampleAnswer: string;
    targetMinutes: number;
  };
}

export interface PersonalizedCurriculum {
  id: string;
  userId: string;
  version: string;
  createdAt: string;
  learnerProfile: OnboardingAnswers;
  estimatedCefrLevel: string;
  targetCefrLevel: string;
  allocation70_20_10: {
    totalDailyMinutes: number;
    plannedSpeakingMinutes: number;
    plannedListeningMinutes: number;
    plannedWritingMinutes: number;
    ratioDescription: string;
  };
  overallGoal: string;
  milestones: Array<{
    period: string;
    focus: string;
    targetCompetency: string;
  }>;
  weeklyOverview: {
    week1Theme: string;
    focusSkills: string[];
    dailyMissions: DailyMissionActivity[];
  };
  remediationPlan: string[];
  generationSource: 'gemini_ai_custom' | 'approved_pedagogical_template';
  reviewStatus: 'Draft, not yet reviewed';
  explanation: string;
}

export function calculate70_20_10Allocation(dailyMinutes: number) {
  const speaking = Math.max(1, Math.round((dailyMinutes * 70) / 100));
  const listening = Math.max(1, Math.round((dailyMinutes * 20) / 100));
  const writing = Math.max(1, dailyMinutes - speaking - listening);

  return {
    totalDailyMinutes: dailyMinutes,
    plannedSpeakingMinutes: speaking,
    plannedListeningMinutes: listening,
    plannedWritingMinutes: writing,
    ratioDescription: `70% Speaking (${speaking} min), 20% Listening (${listening} min), 10% Writing (${writing} min)`
  };
}

export async function generatePersonalizedCurriculum(
  answers: OnboardingAnswers,
  userId?: string
): Promise<PersonalizedCurriculum> {
  const resolvedUserId = userId || crypto.randomUUID();
  const allocation = calculate70_20_10Allocation(answers.q6_dailyMinutes || 30);
  const langCap = getLanguageCapabilities(answers.q1_nativeLanguage || 'ta');
  const targetLang = answers.q2_targetLanguage || 'en';
  const targetLangCap = getLanguageCapabilities(targetLang);

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && !apiKey.includes('MY_GEMINI_API_KEY')) {
    try {
      const ai = new GoogleGenAI({});
      const prompt = `
You are LUMA's Master Multilingual Curriculum Architect.
Generate an individual, scientifically grounded personalized curriculum for a learner learning ${targetLangCap.name} (${targetLangCap.nativeName}) with these 10 onboarding answers:

1. Native / Bridge Language: ${langCap.name} (${langCap.nativeName})
2. Target Language to Learn: ${targetLangCap.name} (${targetLangCap.nativeName}) [Code: ${targetLang}]
3. Primary Purpose: ${answers.q3_primaryPurposes.join(', ')}
4. Self-Reported Proficiency: ${answers.q4_currentProficiency}
5. Speaking Difficulties: ${answers.q5_speakingDifficulties.join(', ')}
6. Daily Learning Time: ${answers.q6_dailyMinutes} minutes
7. Target Deadline: ${answers.q7_targetMonths} months
8. Preferred Experience: ${answers.q8_learningPreferences.join(', ')}
9. Schedule & Voice: ${JSON.stringify(answers.q9_schedulePreferences)}
10. Success Outcome: "${answers.q10_successDefinition}"

MANDATORY RULES:
- The target language of all missions, sample phrases, listening audio, and writing tasks MUST be in ${targetLangCap.name}.
- STRICT 70/20/10 ALLOCATION: Speaking (${allocation.plannedSpeakingMinutes}m), Listening (${allocation.plannedListeningMinutes}m), Writing (${allocation.plannedWritingMinutes}m).
- Provide Day 1 through Day 3 full daily missions with distinct Speaking, Listening, and Writing exercises.
- Output strictly in valid JSON matching this structure:

{
  "estimatedCefrLevel": "A1" | "A2" | "B1" | "B2",
  "targetCefrLevel": "B1" | "B2" | "C1",
  "overallGoal": "Clear description of final milestone in ${targetLangCap.name}",
  "milestones": [
    { "period": "Month 1", "focus": "...", "targetCompetency": "..." },
    { "period": "Month 2", "focus": "...", "targetCompetency": "..." },
    { "period": "Month 3", "focus": "...", "targetCompetency": "..." }
  ],
  "weeklyOverview": {
    "week1Theme": "...",
    "focusSkills": ["...", "..."],
    "dailyMissions": [
      {
        "dayNumber": 1,
        "theme": "...",
        "speakingTask": {
          "id": "spk_d1",
          "scenario": "...",
          "prompt": "...",
          "targetMinutes": ${allocation.plannedSpeakingMinutes},
          "samplePhrases": ["...", "..."],
          "bridgeTranslation": "Translation in ${langCap.name}"
        },
        "listeningTask": {
          "id": "lis_d1",
          "audioContext": "...",
          "passage": "A realistic spoken passage in ${targetLangCap.name}.",
          "question": "Comprehension question in ${targetLangCap.name}?",
          "options": ["Option A", "Option B", "Option C"],
          "correctIndex": 0,
          "targetMinutes": ${allocation.plannedListeningMinutes}
        },
        "writingTask": {
          "id": "wri_d1",
          "prompt": "...",
          "guidelines": "...",
          "sampleAnswer": "...",
          "targetMinutes": ${allocation.plannedWritingMinutes}
        }
      }
    ]
  },
  "remediationPlan": [
    "Specific remediation for difficulty 1",
    "Specific remediation for difficulty 2"
  ],
  "explanation": "Why this curriculum perfectly addresses the learner's timeline and difficulties."
}
`;

      // Optimized rapid generation: single fast model with 4-second timeout to avoid long waits
      const fastAiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3800));
      const response = await Promise.race([fastAiPromise, timeoutPromise]);

      let parsed: any = null;
      if (response && (response as any).text) {
        try {
          parsed = JSON.parse((response as any).text);
        } catch {}
      }

      if (parsed) {
        return {
          id: `curr_${Date.now()}`,
          userId: resolvedUserId,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          learnerProfile: answers,
          estimatedCefrLevel: parsed.estimatedCefrLevel || 'B1',
          targetCefrLevel: parsed.targetCefrLevel || 'B2',
          allocation70_20_10: allocation,
          overallGoal: parsed.overallGoal || answers.q10_successDefinition,
          milestones: parsed.milestones || [],
          weeklyOverview: {
            week1Theme: parsed.weeklyOverview?.week1Theme || `${targetLangCap.name} Situational Communication`,
            focusSkills: parsed.weeklyOverview?.focusSkills || ['Fluency', 'Spontaneous Response'],
            dailyMissions: parsed.weeklyOverview?.dailyMissions || generateFallbackMissions(allocation, langCap, targetLang)
          },
          remediationPlan: parsed.remediationPlan || [
            'Daily 5-minute sentence reformulation drills to stop mental translation.',
            'Spoken shadow repetition to improve syllable-timed rhythm.'
          ],
          generationSource: 'gemini_ai_custom',
          reviewStatus: 'Draft, not yet reviewed',
          explanation: parsed.explanation || `Personalized ${targetLangCap.name} plan prioritizing spoken practice and rapid conversational recall.`
        };
      }
    } catch {
      // Immediate seamless fallback to tailored approved pedagogical curriculum
    }
  }

  // Approved Pedagogical Instant Fallback Template (< 200ms)
  return generateApprovedTemplateCurriculum(answers, resolvedUserId, allocation, langCap, targetLang);
}

function generateFallbackMissions(allocation: any, langCap: any, targetLang: string = 'en'): DailyMissionActivity[] {
  // Arabic Target Language Fallback Missions
  if (targetLang === 'ar') {
    return [
      {
        dayNumber: 1,
        theme: 'التعارف المهني والتحية الرسمية (Professional Introductions)',
        speakingTask: {
          id: 'spk_d1',
          scenario: 'لقاء زميل جديد في مؤتمر دولي بدبي (Meeting in Dubai)',
          prompt: 'قدم نفسك باللغة العربية الفصحى، واذكر وظيفتك وهدفك المهني لهذا العام.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'مرحباً بالجميع، اسمي كريم وأنا متخصص في هندسة البرمجيات.',
            'أعمل حالياً على تطوير أنظمة سحابية متقدمة.',
            'يسعدني جداً تبادل الخبرات والتواصل معكم اليوم.'
          ],
          bridgeTranslation: langCap.code === 'ta'
            ? 'அனைவருக்கும் வணக்கம், என் பெயர் கரீம். நான் மென்பொருள் பொறியாளர்.'
            : 'Hello everyone, my name is Karim and I am a software engineer.'
        },
        listeningTask: {
          id: 'lis_d1',
          audioContext: 'إعلان منظم المؤتمر (Conference Announcement)',
          passage: 'أهلاً وسهلاً بجميع الحضور الكرام! ستبدأ الجلسة الافتتاحية للمؤتمر في تمام الساعة العاشرة صباحاً في القاعة الرئيسية. يرجى إبراز بطاقات الدخول عند المداخل.',
          question: 'في أي ساعة تبدأ الجلسة الافتتاحية؟',
          options: ['التاسعة والنصف', 'العاشرة تماماً', 'الحادية عشرة'],
          correctIndex: 1,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d1',
          prompt: 'اكتب رسالة مهنية قصيرة من جملتين لزميل التقيت به في المؤتمر عبر لينكد إن.',
          guidelines: 'استخدم أسلوباً مهنياً ولطيفاً.',
          sampleAnswer: 'أهلاً زميلي العزيز، تشرفت بلقائك اليوم في المؤتمر وأتطلع لمتابعة نقاشنا الشيق حول الحوسبة السحابية.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      },
      {
        dayNumber: 2,
        theme: 'المحادثات في المقهى واللباقة اليومية (Polite Café Exchanges)',
        speakingTask: {
          id: 'spk_d2',
          scenario: 'مقهى تقليدي راقٍ في الرياض (Café in Riyadh)',
          prompt: 'اطلب قهوة عربية بالهيل، واسأل عن الحلويات المتوفرة واطلب الفاتورة بلطف.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'صباح الخير، هل يمكنني الحصول على دلة قهوة عربية بالهيل؟',
            'هل يتوفر لديكم تمور محشوة أو حلويات طازجة؟',
            'شكراً جزيلاً، وأرجو تزويدي بالفاتورة أيضاً.'
          ],
          bridgeTranslation: 'Practice polite conditional phrasing in Modern Standard Arabic.'
        },
        listeningTask: {
          id: 'lis_d2',
          audioContext: 'حديث النادل مع الزبون (Barista Explanation)',
          passage: 'أهلاً بك يا فندم! لدينا اليوم قهوة عربية شقراء بالزعفران والهيل، وتستغرق دقيقتين فقط للتحضير.',
          question: 'كم دقيقة يستغرق تحضير القهوة؟',
          options: ['دقيقة واحدة', 'دقيقتان', 'خمس دقائق'],
          correctIndex: 1,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d2',
          prompt: 'اكتب تقييماً قصيراً (20-30 كلمة) تمدح فيه جودة القهوة وحسن الاستقبال.',
          guidelines: 'استخدم كلمتين وصفيّتين إيجابيتين على الأقل.',
          sampleAnswer: 'كانت القهوة العربية ممتازة ورائعة المذاق، وحسن الضيافة هنا يفوق التوقعات.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      },
      {
        dayNumber: 3,
        theme: 'إجراءات السفر والجوازات (Airport Immigration & Travel)',
        speakingTask: {
          id: 'spk_d3',
          scenario: 'مكتب الجوازات في مطار القاهرة الدولي (Cairo Airport)',
          prompt: 'أخبر ضابط الجوازات عن سبب زيارتك، ومدة إقامتك، ومكان فندقك بوضوح.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'أنا هنا في زيارة عمل لحضور مؤتمر التكنولوجيا لمدة خمسة أيام.',
            'سأقيم في فندق النيل بوسط القاهرة.',
            'هذه تذكرة العودة وتأكيد حجز الفندق الرسمي.'
          ],
          bridgeTranslation: 'Speak clearly and confidently when stating travel facts.'
        },
        listeningTask: {
          id: 'lis_d3',
          audioContext: 'نداء صعود الطائرة (Airport Gate Broadcast)',
          passage: 'تنبيه لركاب الرحلة رقم 204 المتجهة إلى الرياض: تم تغيير بوابة المغادرة من البوابة سبعة إلى البوابة اثني عشر. يرجى التوجه للبوابة فوراً.',
          question: 'إلى أي بوابة تم تغيير الرحلة؟',
          options: ['البوابة 5', 'البوابة 7', 'البوابة 12', 'البوابة 14'],
          correctIndex: 2,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d3',
          prompt: 'أرسل رسالة نصية سريعة لزميلك تخبره فيها بتغيير بوابة الطائرة.',
          guidelines: 'اجعل الرسالة واضحة ومباشرة.',
          sampleAnswer: 'مرحباً، تم تغيير بوابة المغادرة إلى البوابة رقم 12 وسيبدأ الصعود بعد 10 دقائق.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      }
    ];
  }

  // German Target Language Fallback Missions
  if (targetLang === 'de') {
    return [
      {
        dayNumber: 1,
        theme: 'Professionelle Vorstellung und Networking (Self-Introduction)',
        speakingTask: {
          id: 'spk_d1',
          scenario: 'Internationales Tech-Meetup in Berlin',
          prompt: 'Stelle dich vor, nenne deinen beruflichen Schwerpunkt und dein Ziel für dieses Jahr auf Deutsch.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'Guten Tag allerseits, mein Name ist Alex und ich bin Softwarearchitekt.',
            'Zurzeit beschäftige ich mich intensiv mit verteilten Cloud-Systemen.',
            'Ich freue mich sehr darauf, mich heute mit Ihnen auszutauschen.'
          ],
          bridgeTranslation: langCap.code === 'ta'
            ? 'வணக்கம், என் பெயர் அலெக்ஸ். நான் மென்பொருள் கட்டிடக் கலைஞர்.'
            : 'Hello everyone, my name is Alex and I am a software architect.'
        },
        listeningTask: {
          id: 'lis_d1',
          audioContext: 'Durchsage des Konferenzveranstalters (Conference Announcement)',
          passage: 'Herzlich willkommen an alle Teilnehmer! Die Keynote-Präsentation beginnt pünktlich um zehn Uhr in Halle B. Bitte tragen Sie Ihren Ausweis sichtbar bei sich.',
          question: 'Wann beginnt die Keynote-Präsentation?',
          options: ['Um 9:30 Uhr', 'Um 10:00 Uhr', 'Um 10:30 Uhr'],
          correctIndex: 1,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d1',
          prompt: 'Schreibe eine kurze LinkedIn-Folgenachricht (2 Sätze) an einen Redner auf Deutsch.',
          guidelines: 'Höflicher geschäftlicher Ton.',
          sampleAnswer: 'Sehr geehrter Herr Marcus, vielen Dank für Ihren inspirierenden Vortrag heute. Ich würde mich sehr freuen, mich hier auf LinkedIn mit Ihnen zu vernetzen.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      },
      {
        dayNumber: 2,
        theme: 'Höfliche Bestellungen im Café (Ordering Food & Politeness)',
        speakingTask: {
          id: 'spk_d2',
          scenario: 'Ein Café in München (Café in Munich)',
          prompt: 'Bestelle ein Heißgetränk, frage nach Hafermilch und verlange höflich die Rechnung.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'Guten Morgen, könnte ich bitte einen Cappuccino mit Hafermilch haben?',
            'Haben Sie heute auch frische Buttercroissants?',
            'Könnte ich bitte auch die Quittung bekommen?'
          ],
          bridgeTranslation: 'Practice German polite conditional modals: "Könnte ich bitte..."'
        },
        listeningTask: {
          id: 'lis_d2',
          audioContext: 'Antwort des Baristas (Barista Response)',
          passage: 'Sehr gerne! Unser Kaffee heute stammt aus Äthiopien mit einer feinen Fruchtnote. Die Zubereitung dauert etwa drei Minuten.',
          question: 'Wie lange dauert die Zubereitung des Kaffees?',
          options: ['Eine Minute', 'Drei Minuten', 'Fünf Minuten'],
          correctIndex: 1,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d2',
          prompt: 'Schreibe eine kurze Café-Bewertung (20-30 Wörter) über die freundliche Bedienung.',
          guidelines: 'Verwende mindestens zwei Adjektive.',
          sampleAnswer: 'Die Atmosphäre ist wunderbar gemütlich. Die Mitarbeiter sind außergewöhnlich freundlich und der Cappuccino schmeckt hervorragend.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      },
      {
        dayNumber: 3,
        theme: 'Reisen und Passkontrolle (Airport Navigation & Immigration)',
        speakingTask: {
          id: 'spk_d3',
          scenario: 'Einreisekontrolle am Flughafen Frankfurt (Frankfurt Airport)',
          prompt: 'Erkläre dem Grenzbeamten deinen Reisezweck, deine Aufenthaltsdauer und dein Hotel.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'Ich reise für eine fünftägige Fachkonferenz über künstliche Intelligenz ein.',
            'Ich übernachte im Hotel in der Frankfurter Innenstadt.',
            'Hier sind meine Buchungsbestätigung und mein Rückflugticket.'
          ],
          bridgeTranslation: 'State your purpose clearly using concise German sentences.'
        },
        listeningTask: {
          id: 'lis_d3',
          audioContext: 'Flughafendurchsage (Airport Gate Change)',
          passage: 'Achtung an den Fluggästen des Fluges LH 450 nach Zürich: Das Abfluggate hat sich von Gate A12 auf Gate A24 geändert. Das Boarding beginnt in Kürze.',
          question: 'Auf welches Gate hat sich der Flug geändert?',
          options: ['Gate A10', 'Gate A12', 'Gate A24', 'Gate B15'],
          correctIndex: 2,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d3',
          prompt: 'Schicke eine kurze SMS an deinen Kollegen über die Gate-Änderung.',
          guidelines: 'Kurz und präzise.',
          sampleAnswer: 'Hallo David, unser Flug geht jetzt von Gate A24 ab. Das Boarding startet gleich!',
          targetMinutes: allocation.plannedWritingMinutes
        }
      }
    ];
  }

  // Spanish Target Language Fallback Missions
  if (targetLang === 'es') {
    return [
      {
        dayNumber: 1,
        theme: 'Presentaciones Profesionales y Networking (Introductions)',
        speakingTask: {
          id: 'spk_d1',
          scenario: 'Encuentro profesional y networking en Madrid',
          prompt: 'Preséntate en español con confianza, indicando tu profesión, intereses y objetivos.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            '¡Hola a todos! Mucho gusto, me llamo Carlos y soy desarrollador de software.',
            'Actualmente estoy trabajando en arquitecturas cloud y aprendizaje automático.',
            'Es un verdadero placer estar aquí y conectar con todos vosotros.'
          ],
          bridgeTranslation: langCap.code === 'ta'
            ? 'வணக்கம், என் பெயர் கார்லோஸ். நான் மென்பொருள் பொறியாளர்.'
            : 'Hello everyone! Pleased to meet you, my name is Carlos and I am a software engineer.'
        },
        listeningTask: {
          id: 'lis_d1',
          audioContext: 'Anuncio inaugural del evento (Event Welcome)',
          passage: '¡Bienvenidos al congreso de innovación! La conferencia magistral comenzará a las diez en punto en el auditorio principal.',
          question: '¿A qué hora comienza la conferencia magistral?',
          options: ['A las 9:30', 'A las 10:00', 'A las 10:30'],
          correctIndex: 1,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d1',
          prompt: 'Escribe un mensaje breve de conexión en LinkedIn (2 frases) en español.',
          guidelines: 'Tono profesional y cordial.',
          sampleAnswer: 'Estimado Carlos, muchas gracias por tu charla de hoy en Madrid. Sería un placer conectar y seguir en contacto por aquí.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      },
      {
        dayNumber: 2,
        theme: 'Cortesía en el Restaurante y Café (Polite Ordering)',
        speakingTask: {
          id: 'spk_d2',
          scenario: 'Una cafetería tradicional en Barcelona',
          prompt: 'Pide una bebida caliente y comida con cortesía, pregunta por opciones y solicita la cuenta.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'Buenos días, ¿me podría poner un café con leche y una tostada con tomate, por favor?',
            '¿Tienen leche vegetal o de avena?',
            'La cuenta cuando pueda, muchas gracias.'
          ],
          bridgeTranslation: 'Use polite Spanish conditional structures: "¿Me podría poner...?"'
        },
        listeningTask: {
          id: 'lis_d2',
          audioContext: 'Respuesta del camarero (Waiter Recommendation)',
          passage: 'Con mucho gusto. Nuestro café de hoy es de especialidad colombiano. Se lo preparamos en unos tres minutos.',
          question: '¿De dónde es el café de especialidad?',
          options: ['Etiopía', 'Colombia', 'Brasil'],
          correctIndex: 1,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d2',
          prompt: 'Escribe una breve reseña (20-30 palabras) alabando la calidad del café y la atención.',
          guidelines: 'Usa al menos dos adjetivos positivos.',
          sampleAnswer: 'El ambiente es sumamente agradable. El café es delicioso y la atención del personal fue rápida y muy amable.',
          targetMinutes: allocation.plannedWritingMinutes
        }
      },
      {
        dayNumber: 3,
        theme: 'Viajes y Control Migratorio (Airport Customs & DELE Oral)',
        speakingTask: {
          id: 'spk_d3',
          scenario: 'Control aduanero en el Aeropuerto de Madrid-Barajas',
          prompt: 'Explica al oficial el motivo de tu visita, duración de estancia y lugar de alojamiento.',
          targetMinutes: allocation.plannedSpeakingMinutes,
          samplePhrases: [
            'Vengo por una estancia de dos semanas para asistir a un congreso de tecnología.',
            'Me alojaré en el hotel céntrico y aquí tengo mi billete de regreso confirmado.',
            'Toda mi documentación y seguro de viaje están en regla.'
          ],
          bridgeTranslation: 'State your travel details with clarity and confidence in Spanish.'
        },
        listeningTask: {
          id: 'lis_d3',
          audioContext: 'Megafonía del aeropuerto (Airport Gate Broadcast)',
          passage: 'Atención a los pasajeros del vuelo IB 310 con destino a Buenos Aires: la puerta de embarque ha cambiado a la puerta B24.',
          question: '¿A qué puerta ha cambiado el embarque?',
          options: ['Puerta A12', 'Puerta B10', 'Puerta B24', 'Puerta C15'],
          correctIndex: 2,
          targetMinutes: allocation.plannedListeningMinutes
        },
        writingTask: {
          id: 'wri_d3',
          prompt: 'Envía un mensaje rápido a un compañero avisándole del cambio de puerta de embarque.',
          guidelines: 'Mensaje conciso e informativo.',
          sampleAnswer: 'Hola David, acaban de anunciar que el vuelo sale por la puerta B24. ¡Nos vemos allí!',
          targetMinutes: allocation.plannedWritingMinutes
        }
      }
    ];
  }

  // English Target Language Fallback Missions (Default)
  return [
    {
      dayNumber: 1,
      theme: 'Spontaneous Self-Introduction & Impact',
      speakingTask: {
        id: 'spk_d1',
        scenario: 'International Tech Meetup in London',
        prompt: 'Introduce yourself, your professional focus, and one ambition for this year.',
        targetMinutes: allocation.plannedSpeakingMinutes,
        samplePhrases: [
          'Hello everyone, my name is Alex and I specialize in software architecture.',
          'Currently, I am focused on building resilient distributed systems.',
          'I am eager to exchange insights on modern cloud paradigms.'
        ],
        bridgeTranslation: langCap.code === 'ta'
          ? 'அனைவருக்கும் வணக்கம், என் பெயர் அலெக்ஸ். நான் மென்பொருள் கட்டமைப்பில் நிபுணத்துவம் பெற்றுள்ளேன்.'
          : 'Introduce yourself with crisp diction and natural pause phrasing.'
      },
      listeningTask: {
        id: 'lis_d1',
        audioContext: 'Conference Organizer Announcement',
        passage: 'Welcome attendees! Keynote presentations commence at 10:00 AM sharp in Hall B. Please ensure your badges are visible at all entrance checkpoints.',
        question: 'What time does the keynote presentation commence?',
        options: ['9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'],
        correctIndex: 1,
        targetMinutes: allocation.plannedListeningMinutes
      },
      writingTask: {
        id: 'wri_d1',
        prompt: 'Draft a short 2-sentence LinkedIn follow-up note to a speaker you met.',
        guidelines: 'Use polite, professional tone with a clear reference to their talk.',
        sampleAnswer: 'Dear Marcus, thank you for your inspiring talk on distributed caches. I would love to connect and follow your upcoming engineering posts.',
        targetMinutes: allocation.plannedWritingMinutes
      }
    },
    {
      dayNumber: 2,
      theme: 'Polite Inquiries & Food / Beverage Orders',
      speakingTask: {
        id: 'spk_d2',
        scenario: 'Artisan Coffeehouse in Central London',
        prompt: 'Order a beverage, inquire about oat milk alternatives, and ask for a receipt.',
        targetMinutes: allocation.plannedSpeakingMinutes,
        samplePhrases: [
          'Good morning, could I please have a flat white?',
          'Do you happen to have oat milk available today?',
          'Could you also provide a receipt, please?'
        ],
        bridgeTranslation: langCap.code === 'ta'
          ? 'காலை வணக்கம், தயவுசெய்து எனக்கு ஒரு பிளாட் ஒயிட் காபி தர முடியுமா? ஓட்ஸ் பால் உள்ளதா?'
          : 'Practice polite modal phrasing.'
      },
      listeningTask: {
        id: 'lis_d2',
        audioContext: 'Barista Answering Customer Inquiries',
        passage: 'Certainly! We have fresh Colombian beans today with notes of dark chocolate and citrus. An oat flat white will take approximately three minutes.',
        question: 'How long will the coffee preparation take?',
        options: ['1 minute', '3 minutes', '5 minutes', '10 minutes'],
        correctIndex: 1,
        targetMinutes: allocation.plannedListeningMinutes
      },
      writingTask: {
        id: 'wri_d2',
        prompt: 'Write a brief review (30-40 words) praising the coffeehouse ambiance and friendly staff.',
        guidelines: 'Include at least two descriptive adjectives.',
        sampleAnswer: 'The ambiance here is wonderfully cozy and serene. The baristas are exceptionally polite, and their oat flat white is truly remarkable.',
        targetMinutes: allocation.plannedWritingMinutes
      }
    },
    {
      dayNumber: 3,
      theme: 'Airport Navigation & Border Immigration',
      speakingTask: {
        id: 'spk_d3',
        scenario: 'Border Control at JFK International Airport',
        prompt: 'State your length of stay, conference invitation, and return itinerary to the border officer.',
        targetMinutes: allocation.plannedSpeakingMinutes,
        samplePhrases: [
          'I am visiting for ten days to attend an international technology symposium.',
          'I will be staying at the Manhattan Downtown hotel.',
          'Here is my return flight confirmation departing on the fourteenth.'
        ],
        bridgeTranslation: langCap.code === 'ta'
          ? 'நான் பத்து நாட்கள் தொழில்நுட்ப மாநாட்டில் கலந்து கொள்ள வந்துள்ளேன்.'
          : 'State your travel facts concisely and transparently.'
      },
      listeningTask: {
        id: 'lis_d3',
        audioContext: 'Terminal Gate Change Broadcast',
        passage: 'Attention passengers on flight BA248 to London Heathrow: our boarding gate has changed from Gate 14 to Gate 22. Boarding will commence in fifteen minutes.',
        question: 'Which gate has the flight changed to?',
        options: ['Gate 12', 'Gate 14', 'Gate 22', 'Gate 24'],
        correctIndex: 2,
        targetMinutes: allocation.plannedListeningMinutes
      },
      writingTask: {
        id: 'wri_d3',
        prompt: 'Write a brief text message informing your colleague that your gate changed.',
        guidelines: 'Keep it concise and clear.',
        sampleAnswer: 'Hi David, quick update: our gate has just moved to Gate 22. Boarding starts in 15 minutes, see you there!',
        targetMinutes: allocation.plannedWritingMinutes
      }
    }
  ];
}

function generateApprovedTemplateCurriculum(
  answers: OnboardingAnswers,
  userId: string,
  allocation: any,
  langCap: any,
  targetLang: string = 'en'
): PersonalizedCurriculum {
  const missions = generateFallbackMissions(allocation, langCap, targetLang);
  const targetCap = getLanguageCapabilities(targetLang);

  let overallGoal = answers.q10_successDefinition;
  let milestones: any[] = [];
  let week1Theme = answers.q3_primaryPurposes[0] || `${targetCap.name} Situational Fluency`;
  let focusSkills = ['Spontaneous Speaking', 'Listening Comprehension', 'Concise Writing'];
  let remediationPlan: string[] = [];

  if (targetLang === 'ar') {
    overallGoal = answers.q10_successDefinition || 'إتقان التحدث باللغة العربية الفصحى واجتياز اختبار الكفاءة اللغوية (ALPT / CIMA) والتواصل المهني بثقة.';
    milestones = [
      {
        period: `الشهر 1 (من ${answers.q7_targetMonths})`,
        focus: 'إتقان مخارج الحروف الحلقية والتعبير الشفهي التلقائي',
        targetCompetency: 'إتقان نطق الحروف الحلقية (ع، ح، خ) والمفخمة (ص، ض، ط، ظ) والتحدث دون ترجمة ذهنية.'
      },
      {
        period: `الشهر 2 (من ${answers.q7_targetMonths})`,
        focus: 'المحادثة المؤسسية وبيئة الأعمال في الخليج والشرق الأوسط',
        targetCompetency: 'المشاركة الفعالة في الاجتماعات المهنية وإجراء المفاوضات التجارية بلباقة وبلاغة (B1-B2).'
      },
      {
        period: `الهدف النهائي (${answers.q7_targetMonths} أشهر)`,
        focus: 'الطلاقة الفصيحة واجتياز اختبار الكفاءة (ALPT / CIMA)',
        targetCompetency: answers.q10_successDefinition || 'اجتياز المقابلة الشفهية واختبار الكفاءة (ALPT/CIMA) والخطابة المهنية الفصيحة.'
      }
    ];
    week1Theme = answers.q3_primaryPurposes.some(p => p.includes('ALPT') || p.includes('CIMA'))
      ? 'أساسيات اختبار الكفاءة والمحادثة الرسمية (ALPT Foundations)'
      : 'التعارف واللباقة والضيافة في المحيط العربي (Arabic Introductions & Etiquette)';
    focusSkills = ['التحدث الشفهي الفصيح (70%)', 'الاستماع وفهم السياق (20%)', 'الصياغة والتركيب النحوي (10%)'];
    remediationPlan = [
      'تدريب يومي لمدة 5 دقائق على تمييز ونطق الأصوات الحلقية (ع، ح، خ) والمفخمة (ص، ض، ط) لمنع التردد الصوتي.',
      'تمارين شفهية مكثفة على نظام الجذور والأوزان الصرفية لتوليد الكلمات المناسبة فوراً دون الحاجة للترجمة من اللغة الأم.'
    ];
  } else if (targetLang === 'de') {
    overallGoal = answers.q10_successDefinition || 'Sichere und spontane Kommunikation auf Deutsch im Beruf und Alltag.';
    milestones = [
      {
        period: `Monat 1 von ${answers.q7_targetMonths}`,
        focus: 'Beseitigung von Zögern und mentaler Übersetzung auf Deutsch',
        targetCompetency: 'Flüssige 5-minütige Alltagsgespräche mit weniger als 2 Sekunden Reaktionszeit.'
      },
      {
        period: `Monat 2 von ${answers.q7_targetMonths}`,
        focus: 'Grammatikalische Präzision und berufliche Verhandlung (B1-B2)',
        targetCompetency: 'Sichere Teilnahme an Meetings und souveränes Äußern eigener Fachmeinungen.'
      },
      {
        period: `Ziel (${answers.q7_targetMonths} Monate)`,
        focus: 'Vorbereitung auf Goethe-Zertifikat / TestDaF und berufliche Meisterschaft',
        targetCompetency: answers.q10_successDefinition || 'Bestehen des Goethe-Zertifikats und verhandlungssichere Deutschkenntnisse.'
      }
    ];
    week1Theme = answers.q3_primaryPurposes[0] || 'Grundlagen Deutsch & Berufskommunikation';
    focusSkills = ['Aktives Sprechen (70%)', 'Hörverständnis (20%)', 'Schriftliche Formulierung (10%)'];
    remediationPlan = [
      'Tägliche 5-minütige Satzstruktur-Drills (Verb an Position 2 im Hauptsatz).',
      'Lautes Sprechtraining für korrekte Umlaute (ä, ö, ü) und weiches ch.'
    ];
  } else {
    overallGoal = answers.q10_successDefinition || `Confident, spontaneous ${targetCap.name} fluency in professional and social settings.`;
    milestones = [
      {
        period: `Month 1 of ${answers.q7_targetMonths}`,
        focus: `Eliminating Hesitation & Mental Translation in ${targetCap.name}`,
        targetCompetency: 'Sustain 5-minute spontaneous exchanges with under 2-second response latency.'
      },
      {
        period: `Month 2 of ${answers.q7_targetMonths}`,
        focus: 'Nuance, Idiomatic Fluency & Scenario Agility',
        targetCompetency: 'Navigate professional disagreements, polite negotiations, and impromptu questions.'
      },
      {
        period: `Target (${answers.q7_targetMonths} months)`,
        focus: 'Executive Clarity & Goal Mastery',
        targetCompetency: answers.q10_successDefinition
      }
    ];
    remediationPlan = [
      `Daily 70% Speaking allocation ensures vocal cords and neural retrieval paths in ${targetCap.name} are actively exercised.`,
      `Targeted bridge-language insights in ${langCap.name} clarify syntactic differences without fostering reliance on direct word-for-word translation.`
    ];
  }

  return {
    id: `curr_tmpl_${Date.now()}`,
    userId,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    learnerProfile: answers,
    estimatedCefrLevel: answers.q4_currentProficiency.includes('advanced') ? 'B2' : 'B1',
    targetCefrLevel: 'C1',
    allocation70_20_10: allocation,
    overallGoal,
    milestones,
    weeklyOverview: {
      week1Theme,
      focusSkills,
      dailyMissions: missions
    },
    remediationPlan,
    generationSource: 'approved_pedagogical_template',
    reviewStatus: 'Draft, not yet reviewed',
    explanation: targetLang === 'ar'
      ? `خطة تعليمية منهجية معتمدة مخصصة لإتقان اللغة العربية الفصحى وفق جدول ${answers.q6_dailyMinutes} دقيقة يومياً وهدف ${answers.q7_targetMonths} أشهر.`
      : `Approved pedagogical framework tailored to learning ${targetCap.name} with your ${answers.q6_dailyMinutes}-minute daily schedule and ${answers.q7_targetMonths}-month milestone target.`
  };
}
