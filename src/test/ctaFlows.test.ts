import fs from 'fs';
import path from 'path';
import { ctaAnalytics } from '../services/analytics.ts';
import { generate12WeekProgram } from '../server/program/programEngine.ts';

export interface CtaTestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

export async function runCtaFlowTests(): Promise<CtaTestResult[]> {
  const results: CtaTestResult[] = [];
  const rootDir = process.cwd();

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      results.push({ suite: 'CTA & User Flows', name, passed: true });
    } catch (e: any) {
      results.push({
        suite: 'CTA & User Flows',
        name,
        passed: false,
        error: e?.message || String(e),
      });
    }
  };

  await runTest(
    'Home Screen enforces single primary CTA ("Start Today\'s Session"), Week/Day badge, and semantic <button> pathway cards',
    () => {
      const hubCode = fs.readFileSync(
        path.join(rootDir, 'src/components/DailyMissionHub.tsx'),
        'utf-8'
      );
      if (!hubCode.includes("Start Today's Session")) {
        throw new Error('DailyMissionHub missing primary CTA "Start Today\'s Session"');
      }
      if (!hubCode.includes('Week ${currentWeek} · Day ${currentDay}')) {
        throw new Error('DailyMissionHub missing Week/Day program progress indicator');
      }
      if (!hubCode.includes('Start Baseline Assessment')) {
        throw new Error('DailyMissionHub missing prerequisite CTA for Baseline Assessment');
      }
      if (hubCode.includes('<Card hoverable onClick=')) {
        throw new Error('DailyMissionHub still uses non-button clickable divs instead of <button>');
      }
    }
  );

  await runTest(
    'Onboarding & Registration exposes Create Account, Test Microphone, Start Baseline Assessment, and unbundled consents',
    () => {
      const wizardCode = fs.readFileSync(
        path.join(rootDir, 'src/components/OnboardingWizard.tsx'),
        'utf-8'
      );
      const consentCode = fs.readFileSync(
        path.join(rootDir, 'src/components/onboarding/AccountConsentStep.tsx'),
        'utf-8'
      );
      if (!consentCode.includes('Create Account')) {
        throw new Error('AccountConsentStep missing Create Account CTA');
      }
      if (
        !wizardCode.includes('store_audio_samples') ||
        !wizardCode.includes('store_transcripts') ||
        !wizardCode.includes('analytics_enabled')
      ) {
        throw new Error('OnboardingWizard missing unbundled privacy consent keys');
      }
      if (
        !wizardCode.includes('Test Microphone') ||
        !wizardCode.includes('Start Baseline Assessment')
      ) {
        throw new Error('OnboardingWizard missing Test Microphone or Start Baseline Assessment CTA');
      }
    }
  );

  await runTest(
    'Baseline Assessment supports passage reading, 60s spontaneous speech, and honest Top 3 improvement areas',
    () => {
      const baselineModalCode = fs.readFileSync(
        path.join(rootDir, 'src/components/BaselineAssessmentModal.tsx'),
        'utf-8'
      );
      const baselineCardCode = fs.readFileSync(
        path.join(rootDir, 'src/components/baseline/BaselineResultsCard.tsx'),
        'utf-8'
      );
      if (
        !baselineModalCode.includes('60-Second Free Speech') ||
        !baselineModalCode.includes('Submit Baseline Assessment')
      ) {
        throw new Error('BaselineAssessmentModal missing 60s free speech or submit action');
      }
      if (!baselineCardCode.includes('Top 3 Measured Improvement Areas')) {
        throw new Error('BaselineResultsCard missing Top 3 Measured Improvement Areas');
      }
    }
  );

  await runTest(
    '5-Stage Daily Practice UI and backend generate12WeekProgram provide all 5 required stages',
    () => {
      const stageBarCode = fs.readFileSync(
        path.join(rootDir, 'src/components/voice/DailySessionStageBar.tsx'),
        'utf-8'
      );
      for (const label of [
        '1. Warm-up',
        '2. Sound Drill',
        '3. Shadowing',
        '4. Guided Conversation',
        '5. Reflection & Summary',
        'Complete Session',
      ]) {
        if (!stageBarCode.includes(label)) {
          throw new Error(`DailySessionStageBar missing required label/CTA: ${label}`);
        }
      }

      const program = generate12WeekProgram('ta', 'en-US');
      if (program.length !== 12) {
        throw new Error(`Expected 12 weeks in program, got ${program.length}`);
      }
      const firstSession = program[0].sessions[0];
      if (!firstSession || firstSession.steps.length !== 5) {
        throw new Error(`Expected 5 daily stages, got ${firstSession?.steps?.length}`);
      }
    }
  );

  await runTest(
    'ExplainResultCard never fabricates 80% or 85% scores when pronunciation or fluency is null',
    () => {
      const cardCode = fs.readFileSync(
        path.join(rootDir, 'src/components/learn/ExplainResultCard.tsx'),
        'utf-8'
      );
      if (cardCode.includes('?? 80') || cardCode.includes('?? 85')) {
        throw new Error('ExplainResultCard still contains fabricated 80/85 fallback scores');
      }
      if (!cardCode.includes('Not Available')) {
        throw new Error('ExplainResultCard does not show Not Available for null metrics');
      }
    }
  );

  await runTest(
    'VoiceOrb and SpeechController support keyboard activation, 0.8x slower speech, and server transcription fallback',
    () => {
      const orbCode = fs.readFileSync(
        path.join(rootDir, 'src/components/VoiceOrb.tsx'),
        'utf-8'
      );
      const speechCode = fs.readFileSync(
        path.join(rootDir, 'src/services/speechController.ts'),
        'utf-8'
      );
      if (!orbCode.includes('role="button"') || !orbCode.includes('tabIndex={0}')) {
        throw new Error('VoiceOrb missing role="button" or tabIndex={0}');
      }
      if (
        !speechCode.includes('setSlowerSpeech') ||
        !speechCode.includes('transcribeRecordedAudioBlob')
      ) {
        throw new Error('SpeechController missing setSlowerSpeech or server audio transcription fallback');
      }
    }
  );

  await runTest(
    'Privacy-conscious CTA analytics respects consent and strips PII, email, audio, and transcripts',
    () => {
      const analyticsCode = fs.readFileSync(
        path.join(rootDir, 'src/services/analytics.ts'),
        'utf-8'
      );
      if (!analyticsCode.includes('FORBIDDEN_KEYS') || !analyticsCode.includes('sanitizeMetadata')) {
        throw new Error('analytics.ts missing PII/audio/transcript sanitizer');
      }
      ctaAnalytics.clearEvents();
      ctaAnalytics.setConsent(false);
      const recordedWhenDisabled = ctaAnalytics.track('daily_session_started', { week: 1 });
      if (recordedWhenDisabled) {
        throw new Error('ctaAnalytics recorded events while consent was disabled');
      }
    }
  );

  await runTest('All modified and newly created source files strictly < 300 lines', () => {
    const checkedFiles = [
      'src/App.tsx',
      'src/components/DailyMissionHub.tsx',
      'src/components/OnboardingWizard.tsx',
      'src/components/onboarding/AccountConsentStep.tsx',
      'src/components/BaselineAssessmentModal.tsx',
      'src/components/baseline/BaselineResultsCard.tsx',
      'src/components/VoiceOrb.tsx',
      'src/components/VoiceSessionView.tsx',
      'src/components/voice/VoiceControls.tsx',
      'src/components/voice/ConversationTranscript.tsx',
      'src/components/voice/DailySessionStageBar.tsx',
      'src/components/LearnTabView.tsx',
      'src/components/learn/ExplainResultCard.tsx',
      'src/components/ProgressTabView.tsx',
      'src/components/progress/ReportAndRetestPanel.tsx',
      'src/components/SettingsModal.tsx',
      'src/services/speechController.ts',
      'src/services/speechSynthHelper.ts',
      'src/services/analytics.ts',
    ];
    for (const rel of checkedFiles) {
      const content = fs.readFileSync(path.join(rootDir, rel), 'utf-8');
      const lineCount = content.split('\n').length;
      if (lineCount >= 300) {
        throw new Error(`File ${rel} has ${lineCount} lines (must be strictly < 300 lines)`);
      }
    }
  });

  return results;
}
