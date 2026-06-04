export function calculatePositionSize(equity, riskPct, stopLossPct, leverage = 1) {
  const riskAmount = equity * (riskPct / 100);
  const positionSize = riskAmount / (stopLossPct / 100);
  return Math.min(positionSize, equity * leverage * 0.9);
}

export function getCurrentRiskExposure(positions, equity) {
  if (!positions || positions.length === 0) return { totalRisk: 0, pct: 0, positions: [] };

  let totalRisk = 0;
  const details = positions.map(p => {
    const risk = Math.abs(p.size * (p.stopLoss ? (p.entryPrice - p.stopLoss) / p.entryPrice : 0.02));
    totalRisk += risk;
    return { ...p, riskUsdc: risk, riskPct: (risk / equity) * 100 };
  });

  return {
    totalRisk,
    pct: (totalRisk / equity) * 100,
    positions: details
  };
}

export function getRiskLevel(riskPct) {
  if (riskPct <= 2) return { level: 'low', color: '#22c55e', label: 'Low Risk' };
  if (riskPct <= 5) return { level: 'medium', color: '#eab308', label: 'Medium Risk' };
  if (riskPct <= 8) return { level: 'high', color: '#f97316', label: 'High Risk' };
  return { level: 'critical', color: '#ef4444', label: 'Critical Risk' };
}

export function getStakeInfo(equity, modeConfig) {
  const maxStake = equity * (modeConfig.max_risk_pct / 100);
  const perTradeStake = equity * (modeConfig.risk_per_trade_pct / 100);
  const maxPositionUsdc = modeConfig.max_position_usdc || maxStake;
  const minPositionUsdc = modeConfig.min_position_usdc || 1;

  return {
    maxTotalStake: Math.round(maxStake * 100) / 100,
    perTradeStake: Math.round(perTradeStake * 100) / 100,
    maxPositionUsdc: Math.round(maxPositionUsdc * 100) / 100,
    minPositionUsdc,
    remainingCapacity: Math.round(maxStake * 100) / 100
  };
}

export function validateTradeEntry(equity, modeConfig, currentPositions, whaleFeedScore) {
  const reasons = [];
  const exposure = getCurrentRiskExposure(currentPositions, equity);

  if (currentPositions.length >= modeConfig.max_concurrent_positions) {
    reasons.push({
      code: 'max_positions',
      technical: `max_concurrent_positions=${modeConfig.max_concurrent_positions}`,
      human: `Maximum number of open positions reached (${currentPositions.length}/${modeConfig.max_concurrent_positions})`
    });
  }

  if (exposure.pct >= modeConfig.max_risk_pct) {
    reasons.push({
      code: 'max_risk',
      technical: `risk_exposure=${exposure.pct.toFixed(2)}% >= max_risk=${modeConfig.max_risk_pct}%`,
      human: `Current risk exposure is too high (${exposure.pct.toFixed(1)}% of your balance is at risk)`
    });
  }

  if (whaleFeedScore < modeConfig.whale_feed_threshold) {
    reasons.push({
      code: 'whale_feed_low',
      technical: `whale_feed=${whaleFeedScore.toFixed(3)} < threshold=${modeConfig.whale_feed_threshold}`,
      human: `Whale signals are too weak right now (score: ${(whaleFeedScore * 100).toFixed(0)}%, needed: ${(modeConfig.whale_feed_threshold * 100).toFixed(0)}%)`
    });
  }

  if (equity < 10) {
    reasons.push({
      code: 'equity_too_low',
      technical: `equity=${equity} < minimum=10`,
      human: 'Account balance is too low to open new positions'
    });
  }

  return {
    allowed: reasons.length === 0,
    reasons
  };
}
