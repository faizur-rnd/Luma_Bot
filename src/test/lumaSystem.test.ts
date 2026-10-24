// LUMA Automated System Verification Test Suite
// Verifies 10-question onboarding, 70/20/10 math, language capabilities, and curriculum structure

import { calculate70_20_10Allocation, OnboardingAnswers } from '../server/curriculumGenerator.ts';
import { getLanguageCapabilities, LANGUAGE_REGISTRY } from '../server/languageRegistry.ts';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export async function runAllLumaTests(): Promise<{ total: number; passed: number; failed: number; results: TestResult[] }> {
  const results: TestResult[] = [];

  const runTest = (suite: string, name: string, fn: () => void) => {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite,
        name,
        passed: true,
        durationMs: Math.round(performance.now() - start)
      });
    } catch (e: any) {
      results.push({
        suite,
        name,
        passed: false,
        error: e.message || String(e),
        durationMs: Math.round(performance.now() - start)
      });
    }
  };

  // 1. 70/20/10 Allocation Math Tests
  runTest('70/20/10 Allocation', 'Validates 30-minute plan allocation (21m speaking, 6m listening, 3m writing)', () => {
    const alloc = calculate70_20_10Allocation(30);
    if (alloc.plannedSpeakingMinutes !== 21) throw new Error(`Expected 21m speaking, got ${alloc.plannedSpeakingMinutes}`);
    if (alloc.plannedListeningMinutes !== 6) throw new Error(`Expected 6m listening, got ${alloc.plannedListeningMinutes}`);
    if (alloc.plannedWritingMinutes !== 3) throw new Error(`Expected 3m writing, got ${alloc.plannedWritingMinutes}`);
    if (alloc.plannedSpeakingMinutes + alloc.plannedListeningMinutes + alloc.plannedWritingMinutes !== 30) {
      throw new Error('Total minutes must equal 30');
    }
  });

  runTest('70/20/10 Allocation', 'Validates 60-minute plan allocation (42m speaking, 12m listening, 6m writing)', () => {
    const alloc = calculate70_20_10Allocation(60);
    if (alloc.plannedSpeakingMinutes !== 42) throw new Error(`Expected 42m speaking, got ${alloc.plannedSpeakingMinutes}`);
    if (alloc.plannedListeningMinutes !== 12) throw new Error(`Expected 12m listening, got ${alloc.plannedListeningMinutes}`);
    if (alloc.plannedWritingMinutes !== 6) throw new Error(`Expected 6m writing, got ${alloc.plannedWritingMinutes}`);
    if (alloc.plannedSpeakingMinutes + alloc.plannedListeningMinutes + alloc.plannedWritingMinutes !== 60) {
      throw new Error('Total minutes must equal 60');
    }
  });

  runTest('70/20/10 Allocation', 'Validates short 15-minute plan rounding', () => {
    const alloc = calculate70_20_10Allocation(15);
    const sum = alloc.plannedSpeakingMinutes + alloc.plannedListeningMinutes + alloc.plannedWritingMinutes;
    if (sum !== 15) throw new Error(`Total minutes must equal 15, got ${sum}`);
    if (alloc.plannedSpeakingMinutes < 10) throw new Error('Speaking must be >= 10m for 15m session');
  });

  runTest('70/20/10 Allocation', 'Validates 10-minute short plan rounding (7m, 2m, 1m)', () => {
    const alloc = calculate70_20_10Allocation(10);
    const sum = alloc.plannedSpeakingMinutes + alloc.plannedListeningMinutes + alloc.plannedWritingMinutes;
    if (sum !== 10) throw new Error(`Total minutes must equal 10, got ${sum}`);
    if (alloc.plannedSpeakingMinutes !== 7) throw new Error(`Expected 7m speaking, got ${alloc.plannedSpeakingMinutes}`);
  });

  runTest('70/20/10 Allocation', 'Validates 45-minute plan rounding (32m, 9m, 4m)', () => {
    const alloc = calculate70_20_10Allocation(45);
    const sum = alloc.plannedSpeakingMinutes + alloc.plannedListeningMinutes + alloc.plannedWritingMinutes;
    if (sum !== 45) throw new Error(`Total minutes must equal 45, got ${sum}`);
    if (alloc.plannedSpeakingMinutes !== 32) throw new Error(`Expected 32m speaking, got ${alloc.plannedSpeakingMinutes}`);
  });

  // 2. Multilingual Capability Registry Tests
  runTest('Language Capabilities', 'Verifies English target language registry completeness', () => {
    const en = getLanguageCapabilities('en');
    if (en.role !== 'target' && en.role !== 'both') throw new Error('English must be marked as target/both');
    if (en.speechRecognition !== 'full') throw new Error('English must have full speech recognition');
    if (en.voiceActivityDetection !== false) throw new Error('English must honestly report no raw acoustic VAD for browser STT');
    if (en.offlineAvailable !== false) throw new Error('English must honestly report no offline STT support');
  });

  runTest('Language Capabilities', 'Verifies Arabic target language registry completeness', () => {
    const ar = getLanguageCapabilities('ar');
    if (ar.role !== 'target' && ar.role !== 'both') throw new Error('Arabic must be marked as target/both');
    if (ar.speechRecognition !== 'full') throw new Error('Arabic must support speech recognition');
    if (!ar.textGeneration) throw new Error('Arabic must support text generation');
    if (ar.nativeName !== 'العربية') throw new Error('Arabic must specify native name العربية');
  });

  runTest('Language Capabilities', 'Verifies German target language registry completeness', () => {
    const de = getLanguageCapabilities('de');
    if (de.role !== 'target' && de.role !== 'both') throw new Error('German must be marked as target/both');
    if (de.speechRecognition !== 'full') throw new Error('German must support speech recognition');
    if (!de.textGeneration) throw new Error('German must support text generation');
    if (de.nativeName !== 'Deutsch') throw new Error('German must specify native name Deutsch');
  });

  runTest('Language Capabilities', 'Verifies bridge language capabilities for Tamil and Hindi', () => {
    const languages = ['ta', 'hi'];
    languages.forEach(code => {
      const cap = getLanguageCapabilities(code);
      if (cap.role !== 'bridge') throw new Error(`Language ${code} must be registered as bridge`);
      if (!cap.textGeneration) throw new Error(`Language ${code} must support text generation`);
      if (!cap.nativeName) throw new Error(`Language ${code} must specify native name`);
    });
  });

  runTest('Language Capabilities', 'Gracefully handles unlisted custom languages without throwing', () => {
    const custom = getLanguageCapabilities('custom_lang');
    if (!custom || custom.code !== 'custom_lang') throw new Error('Must return fallback capability object');
    if (custom.translationQuality !== 'moderate') throw new Error('Fallback quality must be realistic');
  });

  // 3. 10-Question Onboarding Schema Completeness Tests
  runTest('Onboarding Schema', 'Validates completeness of 10 primary question fields', () => {
    const sampleAnswers: OnboardingAnswers = {
      q1_nativeLanguage: 'ta',
      q2_targetLanguage: 'en',
      q3_primaryPurposes: ['Everyday conversation', 'Career growth'],
      q4_currentProficiency: 'I can manage basic conversations',
      q5_speakingDifficulties: ['Cannot find right words', 'Mental translation'],
      q6_dailyMinutes: 30,
      q7_targetMonths: 3,
      q8_learningPreferences: ['Talk with an AI tutor', 'Practice real-life role-play'],
      q9_schedulePreferences: {
        preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
        preferredTimeOfDay: 'evening',
        speechSpeed: 'normal',
        interactionMode: 'voice_primary',
        feedbackTiming: 'immediate'
      },
      q10_successDefinition: 'Speak comfortably in meetings and travel'
    };

    const keys = Object.keys(sampleAnswers);
    for (let i = 1; i <= 10; i++) {
      const hasKey = keys.some(k => k.startsWith(`q${i}_`));
      if (!hasKey) throw new Error(`Missing question field for q${i}`);
    }
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
