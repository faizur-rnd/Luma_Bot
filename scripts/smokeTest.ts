import http from 'http';
import app from '../src/server/index.ts';

async function runSmokeTest() {
  console.log('=== Starting LUMA End-to-End Smoke Test ===');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check
    console.log('[1/5] Testing GET /healthz...');
    const healthRes = await fetch(`${baseUrl}/healthz`);
    if (healthRes.status !== 200) throw new Error(`Healthcheck returned status ${healthRes.status}`);
    const healthData = await healthRes.json();
    console.log('      /healthz OK:', healthData);

    // 2. Readiness check
    console.log('[2/5] Testing GET /readyz...');
    const readyRes = await fetch(`${baseUrl}/readyz`);
    if (readyRes.status !== 200 && readyRes.status !== 503) {
      throw new Error(`Readiness check failed with status ${readyRes.status}`);
    }
    const readyData = await readyRes.json();
    console.log('      /readyz status:', readyData.status);

    // 3. User Registration & Session Initialization
    console.log('[3/5] Testing Registration & Login...');
    const testEmail = `smoke.learner.${Date.now()}@test.local`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
      body: JSON.stringify({
        email: testEmail,
        password: 'SmokePassword123!#',
        displayName: 'Smoke Tester',
        targetLanguage: 'es',
        bridgeLanguage: 'en'
      })
    });
    if (regRes.status !== 201) throw new Error(`Register failed with status ${regRes.status}`);
    const regData = await regRes.json();
    const setCookie = regRes.headers.get('set-cookie');
    if (!setCookie) throw new Error('Missing session cookie on register');
    const cookie = setCookie.split(';')[0];
    const csrfToken = regData.csrfToken;
    console.log('      Auth succeeded. User:', regData.user.email);

    // 4. Load Home Screen & Curriculum Data
    console.log('[4/5] Testing Home Screen Data Loading...');
    const [profRes, lessonsRes, missionsRes] = await Promise.all([
      fetch(`${baseUrl}/api/auth/profile`, { headers: { Cookie: cookie } }),
      fetch(`${baseUrl}/api/curriculum/lessons`),
      fetch(`${baseUrl}/api/missions/summary`, { headers: { Cookie: cookie } })
    ]);

    if (profRes.status !== 200) throw new Error(`Profile load failed: ${profRes.status}`);
    if (lessonsRes.status !== 200) throw new Error(`Lessons load failed: ${lessonsRes.status}`);
    if (missionsRes.status !== 200) throw new Error(`Missions load failed: ${missionsRes.status}`);

    const lessonsData = await lessonsRes.json();
    console.log(`      Loaded ${lessonsData.lessons.length} lessons (Status: ${lessonsData.reviewStatus})`);

    // 5. Logout
    console.log('[5/5] Testing Logout...');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Origin': baseUrl,
        'Cookie': cookie,
        'X-CSRF-Token': csrfToken
      }
    });
    if (logoutRes.status !== 200) throw new Error(`Logout returned status ${logoutRes.status}`);
    console.log('      Logout successful.');

    console.log('\n=== SMOKE TEST PASSED: All critical paths verified ===\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ SMOKE TEST FAILED:', err?.message || err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runSmokeTest();
