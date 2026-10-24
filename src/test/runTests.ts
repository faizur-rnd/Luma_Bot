import 'dotenv/config';
import { runAllLumaTests } from './lumaSystem.test.ts';
import { runSecurityTests } from './security.test.ts';

async function main() {
  console.log('--- Starting LUMA Automated System & Security Test Suite ---');
  const sysResult = await runAllLumaTests();
  const secResults = await runSecurityTests();

  const allResults = [
    ...sysResult.results,
    ...secResults.map(r => ({ ...r, durationMs: 0 }))
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
