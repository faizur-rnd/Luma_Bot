import { SessionUser, UserSession } from '../auth.ts';
import {
  AudioRecordingRecord,
  DrillRecord,
  PronunciationAttemptRecord,
  ProgramEnrollmentRecord,
  CheckpointRecord,
  PhonemeMasteryRecord,
  SharedReportRecord,
  UserRecord
} from './types.ts';

export interface InMemoryStorage {
  users: Map<string, UserRecord>;
  usersByEmail: Map<string, string>; // lowercase email -> userId
  sessions: Map<string, UserSession>;
  progress: Map<string, Map<string, any>>;
  vocabulary: Map<string, any[]>;
  assessments: Map<string, any[]>;
  conversations: Map<string, any[]>;
  consents: Map<string, any>;
  onboarding: Map<string, any>;
  curricula: Map<string, any>;
  missionLogs: Map<string, any[]>;
  auditLogs: any[];
  // Articulation Training Entities
  audioRecordings: Map<string, AudioRecordingRecord>;
  drills: Map<string, DrillRecord>;
  pronunciationAttempts: Map<string, PronunciationAttemptRecord>;
  programEnrollments: Map<string, Map<number, ProgramEnrollmentRecord>>; // userId -> (weekNumber -> record)
  checkpoints: Map<string, CheckpointRecord[]>; // userId -> checkpoints
  phonemeMastery: Map<string, Map<string, PhonemeMasteryRecord>>; // userId -> (lang:phoneme -> record)
  sharedReports: Map<string, SharedReportRecord>; // tokenHash -> record
}

export const memDb: InMemoryStorage = {
  users: new Map(),
  usersByEmail: new Map(),
  sessions: new Map(),
  progress: new Map(),
  vocabulary: new Map(),
  assessments: new Map(),
  conversations: new Map(),
  consents: new Map(),
  onboarding: new Map(),
  curricula: new Map(),
  missionLogs: new Map(),
  auditLogs: [],
  audioRecordings: new Map(),
  drills: new Map(),
  pronunciationAttempts: new Map(),
  programEnrollments: new Map(),
  checkpoints: new Map(),
  phonemeMastery: new Map(),
  sharedReports: new Map()
};

export function clearMemoryDatabase() {
  memDb.users.clear();
  memDb.usersByEmail.clear();
  memDb.sessions.clear();
  memDb.progress.clear();
  memDb.vocabulary.clear();
  memDb.assessments.clear();
  memDb.conversations.clear();
  memDb.consents.clear();
  memDb.onboarding.clear();
  memDb.curricula.clear();
  memDb.missionLogs.clear();
  memDb.auditLogs = [];
  memDb.audioRecordings.clear();
  memDb.drills.clear();
  memDb.pronunciationAttempts.clear();
  memDb.programEnrollments.clear();
  memDb.checkpoints.clear();
  memDb.phonemeMastery.clear();
  memDb.sharedReports.clear();
}
