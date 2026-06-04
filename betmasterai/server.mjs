import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TradingEngine } from './core/engine.mjs';
import { writeStatus, createDemoEngine } from './status_writer.mjs';
import { getActiveWhales, rankWhales, pruneInactiveWhales } from './core/whale_feed.mjs';
import { getProgressiveTiers } from './core/modes.mjs';
import { computeEquityCurve, computeWinRate, computeWinRateByMode, computePnLStats, computeWhaleFeedCorrelation, generateRiskHeatmap } from './core/analytics.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.BETMASTER_PORT || 3737;

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'dashboard')));

const engine = createDemoEngine();
engine.stepOnce();
writeStatus(engine);

let statusInterval = setInterval(() => {
  engine.whaleFeedScore = Math.max(0.1, Math.min(0.95,
    engine.whaleFeedScore + (Math.random() - 0.48) * 0.05
  ));
  engine.scoreHistory.push({
    timestamp: Date.now(),
    score: engine.whaleFeedScore
  });
  if (engine.scoreHistory.length > 500) {
    engine.scoreHistory = engine.scoreHistory.slice(-400);
  }
  engine.stepOnce();
  writeStatus(engine);
}, 5000);

app.get('/api/status', (req, res) => {
  const status = engine.toStatusJson();
  res.json(status);
});

app.get('/api/whale-feed', (req, res) => {
  const whales = getActiveWhales();
  const ranked = rankWhales(whales);
  res.json({
    score: engine.whaleFeedScore,
    status: engine.getStatus().whale_feed.status,
    whales: ranked,
    history: engine.scoreHistory.slice(-200)
  });
});

app.get('/api/whale-feed/history', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const filtered = engine.scoreHistory.filter(p => p.timestamp >= cutoff);
  res.json({ hours, points: filtered });
});

app.get('/api/whales', (req, res) => {
  const whales = getActiveWhales();
  const ranked = rankWhales(whales);
  const pruned = pruneInactiveWhales(ranked);
  res.json({
    active: pruned.length,
    total: whales.length,
    whales: ranked
  });
});

app.get('/api/modes', (req, res) => {
  const tiers = getProgressiveTiers();
  const status = engine.getStatus();
  res.json({
    current: status.mode,
    tiers,
    equity: status.equity.total
  });
});

app.get('/api/risk', (req, res) => {
  const status = engine.getStatus();
  res.json({
    exposure: status.risk.exposure,
    level: status.risk.level,
    stake: status.risk.stake,
    positions: status.positions
  });
});

app.get('/api/analytics', (req, res) => {
  const demoTrades = generateDemoTrades();
  res.json({
    equityCurve: computeEquityCurve(demoTrades),
    winRate: computeWinRate(demoTrades),
    winRateByMode: computeWinRateByMode(demoTrades),
    pnlStats: computePnLStats(demoTrades),
    whaleFeedCorrelation: computeWhaleFeedCorrelation(demoTrades),
    riskHeatmap: generateRiskHeatmap(demoTrades),
    totalTrades: demoTrades.length
  });
});

app.get('/api/entry-blocks', (req, res) => {
  const status = engine.getStatus();
  res.json({
    allowed: status.entry.allowed,
    reasons: status.entry.block_reasons,
    human_summary: status.entry.block_reasons_human,
    recent_blocks: engine.blockLog.slice(-20)
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'running',
    engine_mode: engine.mode,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

function generateDemoTrades() {
  const modes = ['safe', 'core', 'smart', 'ensemble'];
  const symbols = ['BTC-USDC', 'ETH-USDC', 'SOL-USDC'];
  const trades = [];
  let equity = 100;

  for (let i = 0; i < 50; i++) {
    const pnl = (Math.random() - 0.42) * 3;
    const mode = modes[Math.floor(Math.random() * 2)];
    equity += pnl;
    trades.push({
      id: `trade-${i}`,
      timestamp: new Date(Date.now() - (50 - i) * 3600000).toISOString(),
      close_timestamp: new Date(Date.now() - (50 - i) * 3600000 + 1800000).toISOString(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: Math.random() > 0.5 ? 'long' : 'short',
      mode,
      pnl: Math.round(pnl * 100) / 100,
      equity_before: Math.round((equity - pnl) * 100) / 100,
      whale_feed_score: 0.3 + Math.random() * 0.5
    });
  }
  return trades;
}

app.listen(PORT, () => {
  console.log(`BetMasterAI Dashboard running on http://localhost:${PORT}`);
});

export { app, engine };
