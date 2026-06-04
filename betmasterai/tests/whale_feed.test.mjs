import { getWhaleFeedStatus, getScoreColor, computeWhaleFeedScore, getWhaleCount, pruneInactiveWhales, rankWhales, getActiveWhales, generateScoreHistory } from '../core/whale_feed.mjs';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log('=== Whale Feed Tests ===\n');

// getWhaleFeedStatus
console.log('getWhaleFeedStatus:');
const full = getWhaleFeedStatus(0.75);
assert(full.level === 'full', '0.75 should be full');
assert(full.label === 'FULL', 'label should be FULL');
assert(full.color === '#22c55e', 'color should be green');

const cautious = getWhaleFeedStatus(0.5);
assert(cautious.level === 'cautious', '0.5 should be cautious');
assert(cautious.label === 'CAUTIOUS', 'label should be CAUTIOUS');

const degraded = getWhaleFeedStatus(0.2);
assert(degraded.level === 'degraded', '0.2 should be degraded');
assert(degraded.label === 'DEGRADED', 'label should be DEGRADED');

// getScoreColor
console.log('getScoreColor:');
assert(getScoreColor(0.8) === '#22c55e', '0.8 should be green');
assert(getScoreColor(0.5) === '#eab308', '0.5 should be yellow');
assert(getScoreColor(0.3) === '#ef4444', '0.3 should be red');

// getWhaleCount
console.log('getWhaleCount:');
const count = getWhaleCount();
assert(count.active > 0, 'should have active whales');
assert(count.total >= count.active, 'total should be >= active');
assert(count.active <= 15, 'active should be <= 15 (audited list)');

// getActiveWhales
console.log('getActiveWhales:');
const active = getActiveWhales();
assert(active.length > 0, 'should have active whales');
assert(active.every(w => w.active === true), 'all should be active');

// rankWhales
console.log('rankWhales:');
const ranked = rankWhales(active);
assert(ranked.length === active.length, 'ranked should have same count');
assert(ranked[0].win_rate_30d >= ranked[ranked.length - 1].win_rate_30d * 0.8, 'top whale should be high performer');

// pruneInactiveWhales
console.log('pruneInactiveWhales:');
const testWhales = [
  { label: 'Active', last_trade: new Date().toISOString(), active: true },
  { label: 'Inactive', last_trade: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), active: true },
  { label: 'No trade', last_trade: null, active: true }
];
const pruned = pruneInactiveWhales(testWhales, 7);
assert(pruned.length === 1, 'should keep only 1 active whale');
assert(pruned[0].label === 'Active', 'should keep the recently active whale');

// computeWhaleFeedScore
console.log('computeWhaleFeedScore:');
const emptyScore = computeWhaleFeedScore([]);
assert(emptyScore === 0, 'empty signals should return 0');

const whales = getActiveWhales();
const signals = whales.slice(0, 3).map(w => ({
  address: w.address,
  timestamp: new Date().toISOString(),
  confidence: 0.8
}));
const score = computeWhaleFeedScore(signals);
assert(score > 0, 'signals should produce positive score');
assert(score <= 1, 'score should be <= 1');

// generateScoreHistory
console.log('generateScoreHistory:');
const history = generateScoreHistory(0.6, 6, 15);
assert(history.length > 0, 'should generate history points');
assert(history[history.length - 1].score === 0.6, 'last point should match current score');
assert(history.every(p => p.score >= 0 && p.score <= 1), 'all scores should be 0-1');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
