import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tests = ['modes.test.mjs', 'whale_feed.test.mjs', 'risk.test.mjs', 'ensemble.test.mjs', 'engine.test.mjs'];

let allPassed = true;

console.log('╔════════════════════════════════════╗');
console.log('║   BetMasterAI — Test Suite         ║');
console.log('╚════════════════════════════════════╝\n');

for (const test of tests) {
  console.log(`\n▶ Running ${test}...`);
  console.log('─'.repeat(40));
  try {
    execSync(`node ${join(__dirname, test)}`, { stdio: 'inherit' });
    console.log(`✅ ${test} — PASSED\n`);
  } catch (e) {
    allPassed = false;
    console.log(`❌ ${test} — FAILED\n`);
  }
}

console.log('\n' + '═'.repeat(40));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
