// LUMA Database Domain Types & Schema Entities

export type MeasurementStatus = 'measured' | 'estimated' | 'unavailable';
export type RecordingKind = 'baseline' | 'drill' | 'conversation' | 'retest';
export type CheckpointType = 'baseline' | 'weekly' | 'retest';
export type EnrollmentStatus = 'active' | 'completed' | 'paused';
export type DrillReviewStatus = 'draft' | 'reviewed' | 'clinical_verified';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  targetLanguage: string;
  bridgeLanguage: string;
  proficiencyLevel: string;
  dailyGoalMinutes: number;
  streakCount: number;
  emailVerified: boolean;
  nativeLanguage?: string;
  targetAccent?: string;
  goal?: string;
  programStartDate?: string;
  resetToken?: string;
  resetTokenExpiresAt?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AudioRecordingRecord {
  id: string;
  userId: string;
  kind: RecordingKind;
  storageKey: string;
  durationMs: number;
  sampleRate: number;
  createdAt: string;
  deletedAt?: string | null;
}

export interface DrillRecord {
  id: string;
  language: string;
  l1: string;
  category: string;
  payload: Record<string, any>;
  level: string;
  reviewStatus: DrillReviewStatus;
  createdAt?: string;
}

export interface PhonemeScore {
  phoneme: string;
  ipa?: string;
  score: number | null;
  status: MeasurementStatus;
}

export interface WordScore {
  word: string;
  accuracyScore: number | null;
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
  phonemes?: PhonemeScore[];
}

export interface PronunciationAttemptRecord {
  id: string;
  userId: string;
  recordingId?: string | null;
  drillId?: string;
  referenceText: string;
  provider: string;
  language: string;
  accuracy: number | null;
  fluency: number | null;
  prosody: number | null;
  completeness: number | null;
  overall: number | null;
  phonemes: PhonemeScore[];
  words: WordScore[];
  measurementStatus: MeasurementStatus;
  createdAt: string;
}

export interface ProgramEnrollmentRecord {
  id: string;
  userId: string;
  weekNumber: number;
  plan: Record<string, any>;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointRecord {
  id: string;
  userId: string;
  weekNumber: number;
  type: CheckpointType;
  attemptId?: string | null;
  metrics: Record<string, any>;
  createdAt: string;
}

export interface PhonemeMasteryRecord {
  userId: string;
  language: string;
  phoneme: string;
  mastery: number;
  lastSeen: string;
  nextReviewAt: string;
}

export interface SharedReportRecord {
  id: string;
  userId: string;
  tokenHash: string;
  title: string;
  reportData: Record<string, any>;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
}

export interface PrivacyConsentsRecord {
  userId: string;
  storeTranscripts: boolean;
  storeAudioSamples: boolean;
  analyticsEnabled: boolean;
  updatedAt: string;
}
