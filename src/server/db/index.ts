import { initDatabaseConnection, isDbConnected, getDbError } from './connection.ts';
import { runMigrations } from './migrator.ts';
import { clearMemoryDatabase } from './memoryStore.ts';
import { userRepository } from './repositories/userRepository.ts';
import { audioRepository } from './repositories/audioRepository.ts';
import { scoringRepository } from './repositories/scoringRepository.ts';
import { programRepository } from './repositories/programRepository.ts';
import { legacyRepository } from './repositories/legacyRepository.ts';

export * from './types.ts';
export { initDatabaseConnection, runMigrations, clearMemoryDatabase };

export const db = {
  isLive: () => isDbConnected(),
  getStatus: () => ({
    isLive: isDbConnected(),
    provider: isDbConnected() ? 'Neon Serverless PostgreSQL' : 'LocalStore (Development in-memory fallback, not for production)',
    error: getDbError(),
    hasConnectionString: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('ep-project-id'))
  }),

  // User & Auth & Sessions & Consents & Purge
  findUserByEmail: userRepository.findUserByEmail.bind(userRepository),
  findUserById: userRepository.findUserById.bind(userRepository),
  createUser: userRepository.createUser.bind(userRepository),
  updateUserProfile: userRepository.updateUserProfile.bind(userRepository),
  createSession: userRepository.createSession.bind(userRepository),
  findSessionById: userRepository.findSessionById.bind(userRepository),
  findSession: userRepository.findSession.bind(userRepository),
  touchSession: userRepository.touchSession.bind(userRepository),
  destroySession: userRepository.destroySession.bind(userRepository),
  savePasswordResetToken: userRepository.savePasswordResetToken.bind(userRepository),
  resetPassword: userRepository.resetPassword.bind(userRepository),
  getPrivacyConsents: userRepository.getPrivacyConsents.bind(userRepository),
  updatePrivacyConsents: userRepository.updatePrivacyConsents.bind(userRepository),
  purgeUserAccount: userRepository.purgeUserAccount.bind(userRepository),

  // Audio Recordings
  createRecording: audioRepository.createRecording.bind(audioRepository),
  findRecordingById: audioRepository.findRecordingById.bind(audioRepository),
  softDeleteRecording: audioRepository.softDeleteRecording.bind(audioRepository),
  purgeExpiredRecordings: audioRepository.purgeExpiredRecordings.bind(audioRepository),
  getRecordingsByUser: audioRepository.getRecordingsByUser.bind(audioRepository),

  // Scoring & Drills & Phoneme Mastery
  recordPronunciationAttempt: scoringRepository.recordPronunciationAttempt.bind(scoringRepository),
  findAttemptById: scoringRepository.findAttemptById.bind(scoringRepository),
  getAttemptsByUser: scoringRepository.getAttemptsByUser.bind(scoringRepository),
  upsertDrill: scoringRepository.upsertDrill.bind(scoringRepository),
  findDrillById: scoringRepository.findDrillById.bind(scoringRepository),
  getDrills: scoringRepository.getDrills.bind(scoringRepository),
  updatePhonemeMastery: scoringRepository.updatePhonemeMastery.bind(scoringRepository),
  getPhonemeMastery: scoringRepository.getPhonemeMastery.bind(scoringRepository),

  // 12-Week Program, Checkpoints & Shared Reports
  saveProgramEnrollment: programRepository.saveProgramEnrollment.bind(programRepository),
  getProgramEnrollment: programRepository.getProgramEnrollment.bind(programRepository),
  getAllProgramEnrollments: programRepository.getAllProgramEnrollments.bind(programRepository),
  recordCheckpoint: programRepository.recordCheckpoint.bind(programRepository),
  getCheckpoints: programRepository.getCheckpoints.bind(programRepository),
  createSharedReport: programRepository.createSharedReport.bind(programRepository),
  findSharedReportByToken: programRepository.findSharedReportByToken.bind(programRepository),
  revokeSharedReport: programRepository.revokeSharedReport.bind(programRepository),

  // Supporting / Legacy Progress, Vocabulary, Missions & Curricula
  getProgress: legacyRepository.getProgress.bind(legacyRepository),
  updateProgress: legacyRepository.updateProgress.bind(legacyRepository),
  recordLessonProgress: legacyRepository.recordLessonProgress.bind(legacyRepository),
  getVocabulary: legacyRepository.getVocabulary.bind(legacyRepository),
  addVocabulary: legacyRepository.addVocabulary.bind(legacyRepository),
  addOrUpdateVocabulary: legacyRepository.addOrUpdateVocabulary.bind(legacyRepository),
  recordAssessment: legacyRepository.recordAssessment.bind(legacyRepository),
  getAssessments: legacyRepository.getAssessments.bind(legacyRepository),
  appendMessage: legacyRepository.appendMessage.bind(legacyRepository),
  getMessages: legacyRepository.getMessages.bind(legacyRepository),
  saveOnboarding: legacyRepository.saveOnboarding.bind(legacyRepository),
  getOnboarding: legacyRepository.getOnboarding.bind(legacyRepository),
  savePersonalizedCurriculum: legacyRepository.savePersonalizedCurriculum.bind(legacyRepository),
  getPersonalizedCurriculum: legacyRepository.getPersonalizedCurriculum.bind(legacyRepository),
  recordMissionActivity: legacyRepository.recordMissionActivity.bind(legacyRepository),
  getMissionLogs: legacyRepository.getMissionLogs.bind(legacyRepository),
  exportFullUserData: legacyRepository.exportFullUserData.bind(legacyRepository)
};
