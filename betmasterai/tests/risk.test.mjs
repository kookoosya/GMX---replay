import { calculatePositionSize, getCurrentRiskExposure, getRiskLevel, getStakeInfo, validateTradeEntry } from '../core/risk_manager.mjs';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log('=== Risk Manager Tests ===\n');

// calculatePositionSize
console.log('calculatePositionSize:');
const size = calculatePositionSize(100, 1, 2, 1);
assert(size > 0, 'should return positive size');
assert(size <= 100, 'size should not exceed equity');
assert(Math.abs(size - 50) < 0.01, 'should be ~$50 for 1% risk / 2% SL');

// getCurrentRiskExposure
console.log('getCurrentRiskExposure:');
const emptyRisk = getCurrentRiskExposure([], 100);
assert(emptyRisk.totalRisk === 0, 'empty positions should have 0 risk');
assert(emptyRisk.pct === 0, 'empty positions should have 0% risk');

const positions = [
  { size: 10, entryPrice: 100, stopLoss: 98, currentPrice: 101 },
  { size: 5, entryPrice: 50, stopLoss: 48, currentPrice: 49 }
];
const risk = getCurrentRiskExposure(positions, 100);
assert(risk.totalRisk > 0, 'positions should have positive risk');
assert(risk.pct > 0, 'risk percent should be > 0');
assert(risk.positions.length === 2, 'should detail both positions');

// getRiskLevel
console.log('getRiskLevel:');
assert(getRiskLevel(1).level === 'low', '1% should be low risk');
assert(getRiskLevel(1).color === '#22c55e', 'low risk should be green');
assert(getRiskLevel(3).level === 'medium', '3% should be medium risk');
assert(getRiskLevel(6).level === 'high', '6% should be high risk');
assert(getRiskLevel(10).level === 'critical', '10% should be critical risk');

// getStakeInfo
console.log('getStakeInfo:');
const stakeInfo = getStakeInfo(100, {
  risk_per_trade_pct: 1,
  max_risk_pct: 3,
  max_position_usdc: 10,
  min_position_usdc: 1
});
assert(stakeInfo.perTradeStake === 1, 'per trade stake should be $1 for 1% of $100');
assert(stakeInfo.maxTotalStake === 3, 'max total stake should be $3');
assert(stakeInfo.maxPositionUsdc === 10, 'max position should be $10');
assert(stakeInfo.minPositionUsdc === 1, 'min position should be $1');

// validateTradeEntry
console.log('validateTradeEntry:');
const allowedEntry = validateTradeEntry(100, {
  max_concurrent_positions: 3,
  max_risk_pct: 5,
  whale_feed_threshold: 0.4
}, [], 0.6);
assert(allowedEntry.allowed === true, 'should allow entry with no positions');
assert(allowedEntry.reasons.length === 0, 'should have no block reasons');

const blockedEntry = validateTradeEntry(100, {
  max_concurrent_positions: 2,
  max_risk_pct: 1,
  whale_feed_threshold: 0.7
}, [
  { size: 10, entryPrice: 100, stopLoss: 98 },
  { size: 10, entryPrice: 100, stopLoss: 98 }
], 0.3);
assert(blockedEntry.allowed === false, 'should block entry');
assert(blockedEntry.reasons.length >= 2, 'should have multiple block reasons');

// Check human-readable reasons
const humanReasons = blockedEntry.reasons;
assert(humanReasons.every(r => r.human && r.human.length > 10), 'all reasons should have human text');
assert(humanReasons.every(r => r.technical), 'all reasons should have technical text');
assert(humanReasons.every(r => !r.human.includes('overseer_rejected')), 'human text should not contain technical codes');
assert(humanReasons.every(r => !r.human.includes('debate_skip')), 'human text should not contain technical codes');

// Very low equity
const lowEquity = validateTradeEntry(5, {
  max_concurrent_positions: 3,
  max_risk_pct: 5,
  whale_feed_threshold: 0.4
}, [], 0.6);
assert(lowEquity.allowed === false, 'should block entry for low equity');
assert(lowEquity.reasons.some(r => r.code === 'equity_too_low'), 'should have equity_too_low reason');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
