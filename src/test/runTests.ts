import 'dotenv/config';
import { runAllLumaTests } from './lumaSystem.test.ts';

async function main() {
  console.log('--- Starting LUMA Automated System Test Suite ---');
  const result = await runAllLumaTests();
  console.log(`\nTest Summary: ${result.passed}/${result.total} Passed (${result.failed} Failed)`);

  result.results.forEach(r => {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${symbol}] ${r.suite} - ${r.name} (${r.durationMs}ms)`);
    if (r.error) {
      console.error(`       Error: ${r.error}`);
    }
  });

  if (result.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test execution threw error:', err);
  process.exit(1);
});
