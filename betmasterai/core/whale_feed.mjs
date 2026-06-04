import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _whaleConfig = null;
function loadWhaleConfig() {
  if (!_whaleConfig) {
    const raw = readFileSync(join(__dirname, '..', 'config', 'whales.json'), 'utf-8');
    _whaleConfig = JSON.parse(raw);
  }
  return _whaleConfig;
}

let _feedConfig = null;
function loadFeedConfig() {
  if (!_feedConfig) {
    const raw = readFileSync(join(__dirname, '..', 'config', 'default.json'), 'utf-8');
    _feedConfig = JSON.parse(raw).whale_feed;
  }
  return _feedConfig;
}

export function getActiveWhales() {
  const cfg = loadWhaleConfig();
  return cfg.whales.filter(w => w.active);
}

export function getWhaleCount() {
  const cfg = loadWhaleConfig();
  const active = cfg.whales.filter(w => w.active).length;
  const total = cfg.whales.length;
  return { active, total };
}

export function computeWhaleFeedScore(whaleSignals = []) {
  const cfg = loadWhaleConfig();
  const tierWeights = cfg.tier_weights;

  if (whaleSignals.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const signal of whaleSignals) {
    const whale = cfg.whales.find(w => w.address === signal.address);
    if (!whale || !whale.active) continue;

    const tierWeight = tierWeights[whale.tier] || 0.25;
    const recency = computeRecencyFactor(signal.timestamp);
    const confidence = signal.confidence || 0.5;

    weightedSum += confidence * tierWeight * recency;
    totalWeight += tierWeight;
  }

  return totalWeight > 0 ? Math.min(1, weightedSum / totalWeight) : 0;
}

function computeRecencyFactor(timestamp) {
  const cfg = loadFeedConfig();
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const decayMinutes = cfg.score_decay_minutes || 60;
  const factor = Math.max(0, 1 - (ageMs / (decayMinutes * 60 * 1000)));
  return factor;
}

export function getWhaleFeedStatus(score) {
  const cfg = loadFeedConfig();
  const thresholds = cfg.thresholds;

  if (score >= thresholds.full) {
    return {
      level: 'full',
      label: 'FULL',
      color: '#22c55e',
      colorName: 'green',
      description: 'Strong whale consensus — all signals aligned'
    };
  }
  if (score >= thresholds.cautious) {
    return {
      level: 'cautious',
      label: 'CAUTIOUS',
      color: '#eab308',
      colorName: 'yellow',
      description: 'Mixed whale signals — proceed with caution'
    };
  }
  return {
    level: 'degraded',
    label: 'DEGRADED',
    color: '#ef4444',
    colorName: 'red',
    description: 'Weak or conflicting whale signals — reduced exposure'
  };
}

export function getScoreColor(score) {
  if (score >= 0.65) return '#22c55e';
  if (score >= 0.45) return '#eab308';
  return '#ef4444';
}

export function pruneInactiveWhales(whales, maxInactiveDays = 7) {
  const cutoff = Date.now() - maxInactiveDays * 24 * 60 * 60 * 1000;
  return whales.filter(w => {
    if (!w.last_trade) return false;
    return new Date(w.last_trade).getTime() >= cutoff;
  });
}

export function rankWhales(whales) {
  return [...whales].sort((a, b) => {
    const scoreA = (a.win_rate_30d * 2 + a.avg_pnl_pct * 0.5) * (a.trades_30d > 20 ? 1 : 0.5);
    const scoreB = (b.win_rate_30d * 2 + b.avg_pnl_pct * 0.5) * (b.trades_30d > 20 ? 1 : 0.5);
    return scoreB - scoreA;
  });
}

export function generateScoreHistory(currentScore, hours = 24, intervalMinutes = 15) {
  const points = [];
  const totalPoints = (hours * 60) / intervalMinutes;
  const now = Date.now();

  for (let i = totalPoints; i >= 0; i--) {
    const ts = now - i * intervalMinutes * 60 * 1000;
    const drift = (Math.sin(i * 0.1) * 0.15) + (Math.random() - 0.5) * 0.1;
    const score = Math.max(0, Math.min(1, currentScore + drift));
    points.push({ timestamp: ts, score: Math.round(score * 1000) / 1000 });
  }

  points[points.length - 1].score = currentScore;
  return points;
}
