import 'dotenv/config';
import { runAllLumaTests } from './lumaSystem.test.ts';
import { runSecurityTests } from './security.test.ts';
import { runHttpApiTests } from './httpApi.test.ts';
import { runLayoutTests } from './layout.test.ts';

async function main() {
  console.log('--- Starting LUMA Automated System & Security Test Suite ---');
  console.log('[1/4] Running system verification tests...');
  const sysResult = await runAllLumaTests();
  console.log('[2/4] Running security hardening tests...');
  const secResults = await runSecurityTests();
  console.log('[3/4] Running layout overlap prevention tests...');
  const layoutResults = await runLayoutTests();
  console.log('[4/4] Running HTTP API & health probe tests...');
  const httpResults = await runHttpApiTests();
  console.log('Completed all test suites. Compiling results...');

  const allResults = [
    ...sysResult.results,
    ...secResults.map(r => ({ ...r, durationMs: 0 })),
    ...layoutResults.map(r => ({ ...r, durationMs: 0 })),
    ...httpResults.map(r => ({ ...r, durationMs: 0 }))
  ];

  const total = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;

  console.log(`\nTest Summary: ${passed}/${total} Passed (${failed} Failed)\n`);

  allResults.forEach(r => {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${symbol}] ${r.suite} - ${r.name}`);
    if (r.error) {
      console.error(`       Error: ${r.error}`);
    }
  });

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test execution threw error:', err);
  process.exit(1);
});
