import { getModeConfig, getModeForEquity, getEffectiveConfig, getDegradationLevel, getModeDisplayInfo, shouldAutoUpgrade, MODE_NAMES } from '../core/modes.mjs';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log('=== Modes Tests ===\n');

// MODE_NAMES
console.log('MODE_NAMES:');
assert(MODE_NAMES.length === 4, 'should have 4 modes');
assert(MODE_NAMES.includes('safe'), 'should include safe');
assert(MODE_NAMES.includes('ensemble'), 'should include ensemble');

// getModeConfig
console.log('getModeConfig:');
const safeCfg = getModeConfig('safe');
assert(safeCfg.risk_per_trade_pct === 0.8, 'safe risk should be 0.8%');
assert(safeCfg.max_trades_per_day === 5, 'safe max trades should be 5');
assert(safeCfg.debate_strictness === 'relaxed', 'safe debate should be relaxed');

const smartCfg = getModeConfig('smart');
assert(smartCfg.risk_per_trade_pct === 2.5, 'smart risk should be 2.5%');
assert(smartCfg.max_trades_per_day === 12, 'smart max trades should be 12');

// getModeForEquity
console.log('getModeForEquity:');
const micro = getModeForEquity(100);
assert(micro.tier === 'micro', '$100 should be micro tier');
assert(micro.mode === 'safe', '$100 should default to safe');

const small = getModeForEquity(200);
assert(small.tier === 'small', '$200 should be small tier');
assert(small.mode === 'core', '$200 should default to core');

const full = getModeForEquity(800);
assert(full.tier === 'full', '$800 should be full tier');
assert(full.mode === 'ensemble', '$800 should default to ensemble');

// getEffectiveConfig for micro
console.log('getEffectiveConfig (micro):');
const microCfg = getEffectiveConfig('safe', 100);
assert(microCfg._tier === 'micro', 'should be micro tier');
assert(microCfg.risk_per_trade_pct === 0.8, 'micro risk should be 0.8%');
assert(microCfg.max_trades_per_day === 6, 'micro should allow 6 trades/day');
assert(microCfg.copy_ratio_pct === 2.5, 'micro copy ratio should be 2.5%');
assert(microCfg.debate_strictness === 'relaxed', 'micro debate should be relaxed');
assert(microCfg._blocking !== null, 'micro should have blocking overrides');
assert(microCfg._blocking.max_consecutive_blocks === 3, 'micro max blocks should be 3');

// getEffectiveConfig for non-micro
const normalCfg = getEffectiveConfig('core', 300);
assert(normalCfg._tier === 'medium', '$300 core should be medium tier');
assert(normalCfg._blocking === null, 'non-micro should not have blocking overrides');

// getDegradationLevel
console.log('getDegradationLevel:');
assert(getDegradationLevel(0.7, 0.7) === 'full', 'high scores should be full');
assert(getDegradationLevel(0.5, 0.5) === 'cautious', 'medium scores should be cautious');
assert(getDegradationLevel(0.3, 0.3) === 'degraded', 'low scores should be degraded');

// getModeDisplayInfo
console.log('getModeDisplayInfo:');
const display = getModeDisplayInfo('safe', 'full');
assert(display.name === 'Safe Mode', 'should show Safe Mode');
assert(display.icon === '🛡️', 'should have shield icon');
assert(display.color === '#22c55e', 'full should be green');
assert(display.fullLabel === 'Safe Mode — Full', 'full label should combine');

const degradedDisplay = getModeDisplayInfo('smart', 'degraded');
assert(degradedDisplay.color === '#ef4444', 'degraded should be red');

// shouldAutoUpgrade
console.log('shouldAutoUpgrade:');
const upgrade = shouldAutoUpgrade('safe', 300);
assert(upgrade !== null, 'safe at $300 should suggest upgrade');
assert(upgrade.mode === 'smart', 'should suggest smart mode');

const noUpgrade = shouldAutoUpgrade('ensemble', 800);
assert(noUpgrade === null, 'ensemble at $800 should not suggest upgrade');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
