import { EnsembleFilter, createEnsembleFilter } from '../core/ensemble.mjs';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log('=== Ensemble Filter Tests ===\n');

// Basic creation
console.log('Creation:');
const filter = new EnsembleFilter();
assert(filter.minEdge === 0.15, 'default minEdge should be 0.15');
assert(filter.minConfidence === 0.55, 'default minConfidence should be 0.55');
assert(filter.maxSignals === 10, 'default maxSignals should be 10');

// Filter by edge
console.log('Edge filtering:');
const signals = [
  { id: '1', symbol: 'BTC', side: 'long', edge: 0.30, confidence: 0.70, timestamp: new Date().toISOString() },
  { id: '2', symbol: 'ETH', side: 'long', edge: 0.05, confidence: 0.80, timestamp: new Date().toISOString() },
  { id: '3', symbol: 'SOL', side: 'short', edge: 0.20, confidence: 0.60, timestamp: new Date().toISOString() }
];
const filtered = filter.filterSignals(signals);
assert(filtered.length === 2, 'should filter out low-edge signal');
assert(!filtered.find(s => s.id === '2'), 'ETH signal (edge=0.05) should be filtered');

// Filter by confidence
console.log('Confidence filtering:');
const lowConfSignals = [
  { id: '4', edge: 0.20, confidence: 0.40, symbol: 'AVAX', side: 'long', timestamp: new Date().toISOString() },
  { id: '5', edge: 0.25, confidence: 0.70, symbol: 'DOGE', side: 'long', timestamp: new Date().toISOString() }
];
const confFiltered = filter.filterSignals(lowConfSignals);
assert(confFiltered.length === 1, 'should filter out low-confidence signal');
assert(confFiltered[0].id === '5', 'should keep DOGE signal');

// Duplicate filtering
console.log('Duplicate filtering:');
const dupeFilter = new EnsembleFilter();
dupeFilter.addToHistory({ id: 'dup', symbol: 'BTC', side: 'long', timestamp: new Date().toISOString() });
dupeFilter.signalHistory = [{ symbol: 'BTC', side: 'long', timestamp: new Date().toISOString() }];
const dupeSignals = [
  { id: 'new-btc', symbol: 'BTC', side: 'long', edge: 0.30, confidence: 0.70, timestamp: new Date().toISOString() },
  { id: 'new-eth', symbol: 'ETH', side: 'long', edge: 0.25, confidence: 0.65, timestamp: new Date().toISOString() }
];
const dupeFiltered = dupeFilter.filterSignals(dupeSignals);
assert(dupeFiltered.length === 1, 'should filter duplicate BTC long');
assert(dupeFiltered[0].symbol === 'ETH', 'should keep ETH');

// Scoring & sorting
console.log('Signal scoring:');
const sortSignals = [
  { id: 'low', symbol: 'A', side: 'long', edge: 0.16, confidence: 0.56, whaleAlignment: 0.3, timestamp: new Date().toISOString() },
  { id: 'high', symbol: 'B', side: 'long', edge: 0.40, confidence: 0.85, whaleAlignment: 0.9, timestamp: new Date().toISOString() }
];
const sorted = new EnsembleFilter().filterSignals(sortSignals);
assert(sorted[0].id === 'high', 'higher-scored signal should be first');

// Max signals limit
console.log('Max signals limit:');
const tinyFilter = new EnsembleFilter({ maxSignals: 2, minEdge: 0, minConfidence: 0 });
const manySignals = Array.from({ length: 10 }, (_, i) => ({
  id: `s-${i}`, symbol: `T${i}`, side: 'long', edge: 0.2 + i * 0.01, confidence: 0.6, timestamp: new Date().toISOString()
}));
const limited = tinyFilter.filterSignals(manySignals);
assert(limited.length === 2, 'should limit to maxSignals=2');

// Accuracy tracking
console.log('Accuracy tracking:');
const accFilter = new EnsembleFilter();
accFilter.signalHistory = [
  { id: 'w1', source: 'whale', outcome: 'win', pnl: 2.5 },
  { id: 'w2', source: 'whale', outcome: 'win', pnl: 1.0 },
  { id: 'l1', source: 'whale', outcome: 'loss', pnl: -1.5 },
  { id: 'w3', source: 'technical', outcome: 'win', pnl: 0.5 },
  { id: 'l2', source: 'technical', outcome: 'loss', pnl: -2.0 }
];
const stats = accFilter.getAccuracyStats();
assert(stats.accuracy === 60, 'overall accuracy should be 60% (3/5)');
assert(stats.sampleSize === 5, 'sample size should be 5');
assert(stats.bySource.whale.accuracy === 66.7, 'whale accuracy should be ~66.7%');
assert(stats.bySource.technical.accuracy === 50, 'technical accuracy should be 50%');

// createEnsembleFilter presets
console.log('Presets:');
const relaxed = createEnsembleFilter({ debate_strictness: 'relaxed' });
assert(relaxed.minEdge === 0.10, 'relaxed minEdge should be 0.10');
assert(relaxed.minConfidence === 0.45, 'relaxed minConfidence should be 0.45');

const strict = createEnsembleFilter({ debate_strictness: 'strict' });
assert(strict.minEdge === 0.25, 'strict minEdge should be 0.25');
assert(strict.minConfidence === 0.65, 'strict minConfidence should be 0.65');
assert(strict.maxSignals === 6, 'strict maxSignals should be 6');

// Filter stats
console.log('Filter stats:');
const filterStats = filter.getFilterStats();
assert(filterStats.minEdge === 0.15, 'stats should show minEdge');
assert(filterStats.accuracy !== undefined, 'stats should include accuracy');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
