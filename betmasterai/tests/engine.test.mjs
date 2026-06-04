import { TradingEngine } from '../core/engine.mjs';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log('=== Engine Tests ===\n');

// Basic engine creation
console.log('Engine creation:');
const engine = new TradingEngine({ equity: 100, mode: 'safe' });
assert(engine.equity === 100, 'equity should be 100');
assert(engine.mode === 'safe', 'mode should be safe');

// stepOnce
console.log('stepOnce:');
const result = engine.stepOnce();
assert(result !== null, 'should return a result');
assert(result.mode.current === 'safe', 'mode should be safe');
assert(result.mode.tier === 'micro', 'tier should be micro at $100');
assert(result.equity.total > 0, 'total equity should be > 0');
assert(result.whale_feed.score >= 0, 'whale feed score should be >= 0');
assert(result.whale_feed.history.length > 0, 'should have score history');
assert(result.health.engine_running === true, 'engine should be running');

// Mode display info
console.log('Mode display:');
assert(result.mode.display.name !== undefined, 'should have display name');
assert(result.mode.display.color !== undefined, 'should have display color');
assert(result.mode.display.icon !== undefined, 'should have display icon');
assert(result.mode.display.fullLabel !== undefined, 'should have full label');

// Entry validation
console.log('Entry validation:');
assert(result.entry.block_reasons !== undefined, 'should have block reasons');
assert(Array.isArray(result.entry.block_reasons_human), 'should have human reasons array');

// toStatusJson
console.log('toStatusJson:');
const status = engine.toStatusJson();
assert(status.live_total_equity_usdc > 0, 'should have live equity');
assert(status.live_collateral_usdc > 0, 'should have collateral');
assert(status.current_mode === 'safe', 'should show current mode');
assert(status.whale_feed_score >= 0, 'should have whale feed score');
assert(status.whale_feed_status !== undefined, 'should have whale feed status');
assert(status.risk_level !== undefined, 'should have risk level');
assert(status.entry_block_reasons !== undefined, 'should have entry block reasons');
assert(status.updated_at !== undefined, 'should have updated_at');

// Equity breakdown
console.log('Equity breakdown:');
assert(status.live_equity_breakdown.collateral_pct >= 0, 'should have collateral %');
assert(status.live_equity_breakdown.positions_pct >= 0, 'should have positions %');

// Update equity
console.log('updateEquity:');
engine.updateEquity(200, 50);
assert(engine.equity === 250, 'equity should be 250');
assert(engine.collateral === 200, 'collateral should be 200');
assert(engine.positionsValue === 50, 'positions value should be 50');

// Progressive mode upgrade
console.log('Progressive upgrade:');
engine.updateEquity(400, 0);
engine.stepOnce();
const upgraded = engine.toStatusJson();
assert(upgraded.current_mode !== 'safe', 'should have upgraded from safe at $400');

// Whale signals update
console.log('Whale signals:');
engine.updateWhaleSignals([]);
assert(engine.whaleFeedScore === 0, 'empty signals should give 0 score');

// Positions management
console.log('Positions management:');
engine.addPosition({ id: 'test-1', symbol: 'BTC', size: 10 });
assert(engine.positions.length > 0, 'should have positions');
engine.removePosition('test-1');
assert(!engine.positions.find(p => p.id === 'test-1'), 'should remove position');

// Trade counter
console.log('Trade counter:');
engine.incrementTrades();
const before = engine.tradesToday;
engine.incrementTrades();
assert(engine.tradesToday === before + 1, 'should increment trades');
engine.resetDailyTrades();
assert(engine.tradesToday === 0, 'should reset daily trades');

// Block reasons translation
console.log('Block reasons (human-readable):');
const blockEngine = new TradingEngine({
  equity: 100,
  mode: 'safe',
  whaleFeedScore: 0.2,
  tradesToday: 10
});
blockEngine.stepOnce();
const blockStatus = blockEngine.toStatusJson();
if (!blockStatus.entry_allowed) {
  const reasons = blockStatus.entry_block_reasons;
  assert(reasons.length > 0, 'should have block reasons');
  for (const r of reasons) {
    assert(r.icon, `reason ${r.code} should have icon`);
    assert(r.title, `reason ${r.code} should have title`);
    assert(r.description, `reason ${r.code} should have description`);
    assert(!r.description.includes('overseer_rejected'), 'description should not contain tech codes');
    assert(!r.description.includes('debate_skip'), 'description should not contain tech codes');
    assert(r.description.length > 10, `reason ${r.code} description should be meaningful`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
