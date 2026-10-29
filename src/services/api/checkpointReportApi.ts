import { request, safeParseJson } from './baseClient.ts';
import { PhonemeMasteryItem } from './types.ts';

export const checkpointReportApi = {
  async submitBaseline(data: {
    passageId: string;
    passageAttemptId?: string;
    spontaneousAttemptId?: string;
    passageText?: string;
    spontaneousTranscript?: string;
    metrics: {
      passageAccuracy?: number | null;
      fluencyWpm?: number | null;
      phonemeScores?: Record<string, number>;
      targetPhonemesToPractice?: string[];
      clarityScore?: number | null;
      measurementStatus?: 'measured' | 'estimated' | 'unavailable' | 'not_measured_yet';
    };
  }) {
    const res = await request('/api/checkpoints/baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeParseJson(res);
  },

  async getCheckpoints() {
    const res = await request('/api/checkpoints');
    if (!res.ok) return { checkpoints: [] };
    return await safeParseJson(res);
  },

  async submitRetest(data: {
    weekNumber: number;
    type?: 'weekly' | 'retest';
    attemptId?: string;
    metrics: Record<string, any>;
  }) {
    const res = await request('/api/checkpoints/retest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeParseJson(res);
  },

  async getPhonemeMastery(language = 'en'): Promise<{ phonemes: PhonemeMasteryItem[] }> {
    const res = await request(`/api/checkpoints/phonemes?language=${language}`);
    if (!res.ok) return { phonemes: [] };
    return await safeParseJson(res);
  },

  async getComparisonReport() {
    const res = await request('/api/reports/comparison');
    if (!res.ok) throw new Error('Failed to load comparison report');
    return await safeParseJson(res);
  },

  async shareReport(params: { title?: string; daysValid?: number }) {
    const res = await request('/api/reports/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await safeParseJson(res);
  },

  async getPublicSharedReport(token: string) {
    const res = await request(`/api/reports/shared/${token}`);
    return await safeParseJson(res);
  },

  async revokeSharedReport(tokenHash: string) {
    const res = await request('/api/reports/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenHash })
    });
    return await safeParseJson(res);
  }
};
