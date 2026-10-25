import http from 'http';
import app, { authRateLimiter } from '../server/index.ts';

export async function runHttpApiTests(): Promise<Array<{ suite: string; name: string; passed: boolean; error?: string }>> {
  const results: Array<{ suite: string; name: string; passed: boolean; error?: string }> = [];

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      results.push({ suite: 'HTTP API & Security', name, passed: true });
    } catch (e: any) {
      results.push({ suite: 'HTTP API & Security', name, passed: false, error: e?.message || String(e) });
    }
  };

  // Start temporary server on random port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 0. Health probes
    await test('HTTP Health: GET /healthz returns status 200 OK', async () => {
      const res = await fetch(`${baseUrl}/healthz`);
      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200 for /healthz, got ${res.status}`);
      }
      const data = await res.json();
      if (data.status !== 'ok') {
        throw new Error(`Expected { status: 'ok' }, got: ${JSON.stringify(data)}`);
      }
    });

    await test('HTTP Health: GET /readyz returns status and diagnostic information', async () => {
      const res = await fetch(`${baseUrl}/readyz`);
      if (res.status !== 200 && res.status !== 503) {
        throw new Error(`Expected HTTP 200 or 503 for /readyz, got ${res.status}`);
      }
      const data = await res.json();
      if (!data.database) {
        throw new Error(`Expected readiness payload to contain database info`);
      }
    });

    // 1. Auth Flow: Register, Login, Protected Route, Logout
    let userCookie = '';
    let csrfToken = '';
    const testEmail = `http.test.${Date.now()}@test.local`;
    const testPassword = 'StrongPassword123!#';

    await test('HTTP Auth: Register a new user and receive session cookie & CSRF token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          displayName: 'HTTP Tester',
          targetLanguage: 'en',
          bridgeLanguage: 'ta'
        })
      });

      if (res.status !== 201) {
        const text = await res.text();
        throw new Error(`Register expected status 201, got ${res.status}: ${text}`);
      }

      const body = await res.json();
      if (!body.csrfToken) {
        throw new Error('Registration did not return CSRF token');
      }
      csrfToken = body.csrfToken;

      const setCookie = res.headers.get('set-cookie');
      if (!setCookie || !setCookie.includes('luma_session')) {
        throw new Error('Registration did not set luma_session cookie');
      }
      userCookie = setCookie.split(';')[0];
    });

    await test('HTTP Auth: Access protected /api/auth/profile with session cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: {
          'Cookie': userCookie
        }
      });

      if (res.status !== 200) {
        throw new Error(`Protected profile returned status ${res.status}`);
      }

      const profile = await res.json();
      if (profile.email !== testEmail.toLowerCase()) {
        throw new Error(`Expected email ${testEmail.toLowerCase()}, got ${profile.email}`);
      }
    });

    await test('HTTP Auth: State-changing protected request without CSRF is rejected (403)', async () => {
      const res = await fetch(`${baseUrl}/api/vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Cookie': userCookie
          // No X-CSRF-Token
        },
        body: JSON.stringify({
          term: 'Gratitude',
          translation: 'நன்றி'
        })
      });

      if (res.status !== 403) {
        throw new Error(`Expected status 403 for missing CSRF token, got ${res.status}`);
      }
    });

    await test('HTTP Auth: State-changing protected request with valid CSRF succeeds', async () => {
      const res = await fetch(`${baseUrl}/api/vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Cookie': userCookie,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          term: 'Gratitude',
          translation: 'நன்றி',
          part_of_speech: 'noun'
        })
      });

      if (res.status !== 200) {
        const text = await res.text();
        throw new Error(`Expected status 200, got ${res.status}: ${text}`);
      }
    });

    await test('HTTP Auth: Logout clears session and destroys access', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Origin': baseUrl,
          'Cookie': userCookie,
          'X-CSRF-Token': csrfToken
        }
      });

      if (res.status !== 200) {
        throw new Error(`Logout failed with status ${res.status}`);
      }

      // Check access after logout
      const profileCheck = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { 'Cookie': userCookie }
      });
      if (profileCheck.status !== 401) {
        throw new Error(`Session still active after logout (status ${profileCheck.status})`);
      }
    });

    await test('HTTP Auth: Login with correct credentials restores session', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      if (res.status !== 200) {
        throw new Error(`Login failed with status ${res.status}`);
      }

      const body = await res.json();
      if (!body.csrfToken) throw new Error('Login did not return csrfToken');
      csrfToken = body.csrfToken;
      const setCookie = res.headers.get('set-cookie');
      if (!setCookie) throw new Error('Login did not return session cookie');
      userCookie = setCookie.split(';')[0];
    });

    // 2. Malformed JSON returns 400
    await test('HTTP Security: Malformed JSON returns HTTP 400 instead of 500', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl
        },
        body: '{ "invalidJson": broken, '
      });

      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for malformed JSON, got ${res.status}`);
      }

      const body = await res.json();
      if (body.code !== 'MALFORMED_JSON') {
        throw new Error(`Expected code MALFORMED_JSON, got ${body.code}`);
      }
    });

    // 3. Origin check: require Origin or Referer for mutating requests
    await test('HTTP Security: Mutating request without Origin/Referer is rejected (403)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No Origin or Referer
        },
        body: JSON.stringify({ email: 'test@test.local', password: 'abc' })
      });

      if (res.status !== 403) {
        throw new Error(`Expected HTTP 403 for missing origin, got ${res.status}`);
      }
    });

    // 4. Rate Limiting on Login (triggers 429)
    await test('HTTP Abuse Controls: Repeated login attempts trigger 429 Too Many Requests', async () => {
      let triggered429 = false;
      for (let i = 0; i < 20; i++) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': baseUrl
          },
          body: JSON.stringify({ email: 'rate.limit@test.local', password: 'WrongPassword123!' })
        });

        if (res.status === 429) {
          triggered429 = true;
          const body = await res.json();
          if (body.code !== 'AUTH_RATE_LIMITED') {
            throw new Error(`Expected code AUTH_RATE_LIMITED, got: ${body.code}`);
          }
          break;
        }
      }

      if (!triggered429) {
        throw new Error('Rate limiter failed to return HTTP 429 after 20 rapid login attempts');
      }
    });

    // 5. Assessment Scoring Route (deterministic + server-side compute)
    await test('HTTP Assessments: Rejects empty spoken audio with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Cookie': userCookie,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          topic_id: 'lesson_a1_01',
          topic_title: 'Ordering Coffee',
          transcribed_text: '   '
        })
      });

      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for empty transcript, got: ${res.status}`);
      }
    });

    await test('HTTP Assessments: Rejects gibberish keystrokes with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Cookie': userCookie,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          topic_id: 'lesson_a1_01',
          topic_title: 'Ordering Coffee',
          transcribed_text: 'aaaaaaaaaaaaaaaaaaaa'
        })
      });

      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for repetitive gibberish, got: ${res.status}`);
      }
    });

    await test('HTTP Assessments: Computes scores server-side and ignores client-sent fake scores', async () => {
      const res = await fetch(`${baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Cookie': userCookie,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          topic_id: 'lesson_a1_01',
          topic_title: 'Ordering Coffee',
          transcribed_text: 'In this lesson I learned how to politely order a cappuccino with oat milk using modal verbs.',
          pronunciation_score: 99, // client-sent fake score
          fluency_score: 99,       // client-sent fake score
          overall_score: 99        // client-sent fake score
        })
      });

      if (res.status !== 200) {
        const text = await res.text();
        throw new Error(`Assessment submission failed with status ${res.status}: ${text}`);
      }

      const result = await res.json();

      // Pronunciation score MUST NOT be shown/faked (browser speech recognition returns text only)
      if (result.pronunciation_score !== null) {
        throw new Error(`Expected pronunciation_score to be null ("Not measured yet"), got: ${result.pronunciation_score}`);
      }

      // Fluency score without timestamps/duration must be null
      if (result.fluency_score !== null) {
        throw new Error(`Expected fluency_score to be null without duration timestamps, got: ${result.fluency_score}`);
      }

      // Overall score must be derived from measured scores (grammar + lexical), NOT client-sent 99
      if (result.overall_score === 99) {
        throw new Error('Server accepted client-sent fake overall_score of 99 instead of computing it');
      }

      if (typeof result.grammar_score !== 'number' || typeof result.lexical_score !== 'number') {
        throw new Error('Server failed to compute grammar_score or lexical_score');
      }
    });

    await test('HTTP Assessments: Computes fluency when real duration timestamps are provided', async () => {
      const res = await fetch(`${baseUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Cookie': userCookie,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          topic_id: 'lesson_a1_01',
          topic_title: 'Ordering Coffee',
          transcribed_text: 'In this lesson I learned how to politely order coffee using modal verbs.',
          user_voice_duration: 6.5
        })
      });

      if (res.status !== 200) {
        throw new Error(`Assessment with duration failed: ${res.status}`);
      }

      const result = await res.json();
      if (typeof result.fluency_score !== 'number' || result.fluency_score <= 0) {
        throw new Error(`Expected real computed fluency_score, got: ${result.fluency_score}`);
      }
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return results;
}
