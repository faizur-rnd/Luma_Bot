import { request, safeParseJson } from './baseClient.ts';
import { CurrentProgramSessionResponse, ProgramWeekInfo } from './types.ts';

export const programApi = {
  async enrollProgram(params: { nativeLanguage: string; targetAccent: string }) {
    const res = await request('/api/program/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await safeParseJson(res);
  },

  async getCurrentProgram(): Promise<CurrentProgramSessionResponse> {
    const res = await request('/api/program/current');
    if (!res.ok) throw new Error('Failed to load current program session');
    return await safeParseJson<CurrentProgramSessionResponse>(res);
  },

  async getProgramWeeks(): Promise<{ weeks: ProgramWeekInfo[] }> {
    const res = await request('/api/program/weeks');
    if (!res.ok) throw new Error('Failed to load program weeks');
    return await safeParseJson(res);
  },

  async completeStep(params: {
    weekNumber: number;
    dayNumber: number;
    stepNumber: number;
    durationSeconds?: number;
    phonemeScores?: Record<string, number>;
  }) {
    const res = await request('/api/program/step/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await safeParseJson(res);
  },

  async completeSession(params: {
    weekNumber: number;
    dayNumber: number;
    reflectionNotes?: string;
  }) {
    const res = await request('/api/program/session/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await safeParseJson(res);
  },

  async overrideWeek(weekNumber: number) {
    const res = await request('/api/program/override-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber })
    });
    return await safeParseJson(res);
  }
};
