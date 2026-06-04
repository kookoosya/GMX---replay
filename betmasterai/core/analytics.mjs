export function computeEquityCurve(tradeHistory) {
  if (!tradeHistory || tradeHistory.length === 0) return [];

  const curve = [];
  let equity = tradeHistory[0].equity_before || 100;
  curve.push({ timestamp: tradeHistory[0].timestamp, equity });

  for (const trade of tradeHistory) {
    equity += trade.pnl || 0;
    curve.push({ timestamp: trade.close_timestamp || trade.timestamp, equity: Math.round(equity * 100) / 100 });
  }
  return curve;
}

export function computeWinRate(trades) {
  if (!trades || trades.length === 0) return 0;
  const wins = trades.filter(t => (t.pnl || 0) > 0).length;
  return Math.round((wins / trades.length) * 1000) / 10;
}

export function computeWinRateByMode(trades) {
  const byMode = {};
  for (const trade of trades) {
    const mode = trade.mode || 'unknown';
    if (!byMode[mode]) byMode[mode] = { wins: 0, total: 0 };
    byMode[mode].total++;
    if ((trade.pnl || 0) > 0) byMode[mode].wins++;
  }

  const result = {};
  for (const [mode, stats] of Object.entries(byMode)) {
    result[mode] = {
      winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 1000) / 10 : 0,
      trades: stats.total,
      wins: stats.wins
    };
  }
  return result;
}

export function computePnLStats(trades) {
  if (!trades || trades.length === 0) {
    return { totalPnl: 0, avgPnl: 0, maxWin: 0, maxLoss: 0, sharpe: 0 };
  }

  const pnls = trades.map(t => t.pnl || 0);
  const totalPnl = pnls.reduce((a, b) => a + b, 0);
  const avgPnl = totalPnl / pnls.length;
  const maxWin = Math.max(...pnls);
  const maxLoss = Math.min(...pnls);

  const mean = avgPnl;
  const variance = pnls.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pnls.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? mean / stdDev : 0;

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    avgPnl: Math.round(avgPnl * 100) / 100,
    maxWin: Math.round(maxWin * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    sharpe: Math.round(sharpe * 100) / 100
  };
}

export function computeWhaleFeedCorrelation(trades) {
  if (!trades || trades.length < 5) return { correlation: 0, sampleSize: trades?.length || 0 };

  const withFeed = trades.filter(t => t.whale_feed_score !== undefined && t.pnl !== undefined);
  if (withFeed.length < 5) return { correlation: 0, sampleSize: withFeed.length };

  const scores = withFeed.map(t => t.whale_feed_score);
  const pnls = withFeed.map(t => t.pnl);

  const meanX = scores.reduce((a, b) => a + b, 0) / scores.length;
  const meanY = pnls.reduce((a, b) => a + b, 0) / pnls.length;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < scores.length; i++) {
    const dx = scores[i] - meanX;
    const dy = pnls[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  const correlation = den > 0 ? num / den : 0;

  return {
    correlation: Math.round(correlation * 1000) / 1000,
    sampleSize: withFeed.length,
    interpretation: correlation > 0.5 ? 'Strong positive' :
                    correlation > 0.2 ? 'Moderate positive' :
                    correlation > -0.2 ? 'Weak / no correlation' :
                    correlation > -0.5 ? 'Moderate negative' : 'Strong negative'
  };
}

export function generateRiskHeatmap(trades) {
  const heatmap = {};
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (const day of days) {
    heatmap[day] = {};
    for (const hour of hours) {
      heatmap[day][hour] = { trades: 0, avgPnl: 0, winRate: 0 };
    }
  }

  for (const trade of trades) {
    const d = new Date(trade.timestamp);
    const day = days[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1];
    const hour = d.getUTCHours();
    const cell = heatmap[day][hour];
    cell.trades++;
    cell.avgPnl = (cell.avgPnl * (cell.trades - 1) + (trade.pnl || 0)) / cell.trades;
    if ((trade.pnl || 0) > 0) cell.winRate = ((cell.winRate * (cell.trades - 1)) + 1) / cell.trades;
  }

  return heatmap;
}
