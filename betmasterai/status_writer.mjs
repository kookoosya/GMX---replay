import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TradingEngine } from './core/engine.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATUS_PATH = join(__dirname, 'data', 'status.json');

export function writeStatus(engine) {
  const dir = dirname(STATUS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const status = engine.toStatusJson();
  writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2), 'utf-8');
  return status;
}

export function createDemoEngine() {
  const engine = new TradingEngine({
    equity: 98.50,
    collateral: 85.20,
    positionsValue: 13.30,
    mode: 'safe',
    tradesToday: 2,
    whaleFeedScore: 0.58,
    positions: [
      {
        id: 'pos-1',
        symbol: 'BTC-USDC',
        side: 'long',
        size: 8.50,
        entryPrice: 68420,
        currentPrice: 68890,
        stopLoss: 67800,
        takeProfit: 69500,
        pnl: 0.58,
        pnlPct: 0.69,
        openedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'pos-2',
        symbol: 'ETH-USDC',
        side: 'long',
        size: 4.80,
        entryPrice: 3850,
        currentPrice: 3820,
        stopLoss: 3780,
        takeProfit: 3950,
        pnl: -0.37,
        pnlPct: -0.78,
        openedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  });

  return engine;
}

if (process.argv[1] && process.argv[1].includes('status_writer')) {
  const engine = createDemoEngine();
  engine.stepOnce();
  const status = writeStatus(engine);
  console.log('Status written to', STATUS_PATH);
  console.log(JSON.stringify(status, null, 2));
}
