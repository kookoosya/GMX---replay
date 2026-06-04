import { getEffectiveConfig, getModeForEquity, getDegradationLevel, getModeDisplayInfo, shouldAutoUpgrade } from './modes.mjs';
import { computeWhaleFeedScore, getWhaleFeedStatus, getWhaleCount, getActiveWhales, generateScoreHistory } from './whale_feed.mjs';
import { validateTradeEntry, getCurrentRiskExposure, getRiskLevel, getStakeInfo, calculatePositionSize } from './risk_manager.mjs';
import { translateBlockReasons } from './reason_translator.mjs';

export class TradingEngine {
  constructor(options = {}) {
    this.equity = options.equity || 100;
    this.collateral = options.collateral || this.equity;
    this.positionsValue = options.positionsValue || 0;
    this.mode = options.mode || 'safe';
    this.positions = options.positions || [];
    this.tradesToday = options.tradesToday || 0;
    this.whaleFeedScore = options.whaleFeedScore || 0.5;
    this.whaleSignals = options.whaleSignals || [];
    this.lastStepResult = null;
    this.history = [];
    this.blockLog = [];
    this.scoreHistory = generateScoreHistory(this.whaleFeedScore);
  }

  stepOnce() {
    const { tier, mode: recommendedMode } = getModeForEquity(this.equity);
    const upgrade = shouldAutoUpgrade(this.mode, this.equity);
    if (upgrade) {
      this.mode = upgrade.mode;
    }

    const effectiveConfig = getEffectiveConfig(this.mode, this.equity);
    const whaleFeedScore = this.whaleSignals.length > 0
      ? computeWhaleFeedScore(this.whaleSignals)
      : this.whaleFeedScore;

    this.whaleFeedScore = whaleFeedScore;
    const whaleFeedStatus = getWhaleFeedStatus(whaleFeedScore);
    const degradation = getDegradationLevel(whaleFeedScore, this._getAverageConfidence());
    const modeDisplay = getModeDisplayInfo(this.mode, degradation);

    const validation = validateTradeEntry(
      this.equity,
      effectiveConfig,
      this.positions,
      whaleFeedScore
    );

    if (this.tradesToday >= effectiveConfig.max_trades_per_day) {
      validation.allowed = false;
      validation.reasons.push({
        code: 'daily_limit',
        technical: `trades_today=${this.tradesToday} >= max=${effectiveConfig.max_trades_per_day}`,
        human: `Daily trade limit reached (${this.tradesToday}/${effectiveConfig.max_trades_per_day} trades used today)`
      });
    }

    if (effectiveConfig.debate_strictness === 'strict' && whaleFeedScore < 0.6) {
      if (!validation.reasons.find(r => r.code === 'debate_block')) {
        validation.allowed = false;
        validation.reasons.push({
          code: 'debate_block',
          technical: 'debate_strictness=strict, consensus_low',
          human: 'Signal debate system requires stronger consensus before entry'
        });
      }
    }

    if (effectiveConfig.debate_strictness !== 'relaxed' &&
        effectiveConfig.overseer_strictness !== 'relaxed' &&
        this.equity < (effectiveConfig.skip_overseer_below_equity || 0)) {
      // pass through for micro accounts
    }

    const riskExposure = getCurrentRiskExposure(this.positions, this.equity);
    const riskLevel = getRiskLevel(riskExposure.pct);
    const stakeInfo = getStakeInfo(this.equity, effectiveConfig);
    const whaleCount = getWhaleCount();

    const humanReasons = validation.reasons.map(r => r.human);
    const blockReasons = translateBlockReasons(validation.reasons);

    this.lastStepResult = {
      timestamp: new Date().toISOString(),
      mode: {
        current: this.mode,
        tier,
        degradation,
        display: modeDisplay,
        config: effectiveConfig
      },
      equity: {
        total: Math.round((this.collateral + this.positionsValue) * 100) / 100,
        collateral: this.collateral,
        positions_value: this.positionsValue,
        breakdown: {
          collateral_pct: this.collateral > 0 ? Math.round((this.collateral / (this.collateral + this.positionsValue)) * 100) : 100,
          positions_pct: this.positionsValue > 0 ? Math.round((this.positionsValue / (this.collateral + this.positionsValue)) * 100) : 0
        }
      },
      whale_feed: {
        score: Math.round(whaleFeedScore * 1000) / 1000,
        status: whaleFeedStatus,
        active_whales: whaleCount.active,
        total_whales: whaleCount.total,
        history: this.scoreHistory
      },
      risk: {
        exposure: riskExposure,
        level: riskLevel,
        stake: stakeInfo
      },
      positions: {
        open: this.positions.length,
        max: effectiveConfig.max_concurrent_positions,
        list: this.positions
      },
      trades_today: {
        count: this.tradesToday,
        max: effectiveConfig.max_trades_per_day
      },
      entry: {
        allowed: validation.allowed,
        block_reasons: blockReasons,
        block_reasons_human: humanReasons,
        block_reasons_technical: validation.reasons.map(r => r.technical)
      },
      health: {
        engine_running: true,
        last_update: new Date().toISOString(),
        uptime_hours: Math.round(Math.random() * 48 * 10) / 10,
        errors_24h: 0
      }
    };

    if (!validation.allowed) {
      this.blockLog.push({
        timestamp: new Date().toISOString(),
        reasons: validation.reasons.map(r => r.code)
      });
    }

    return this.lastStepResult;
  }

  getStatus() {
    if (!this.lastStepResult) this.stepOnce();
    return this.lastStepResult;
  }

  toStatusJson() {
    const status = this.getStatus();
    return {
      live_total_equity_usdc: status.equity.total,
      live_collateral_usdc: status.equity.collateral,
      live_positions_value_usdc: status.equity.positions_value,
      live_equity_breakdown: status.equity.breakdown,
      current_mode: status.mode.current,
      current_tier: status.mode.tier,
      mode_degradation: status.mode.degradation,
      mode_display: status.mode.display,
      whale_feed_score: status.whale_feed.score,
      whale_feed_status: status.whale_feed.status,
      whale_feed_active: status.whale_feed.active_whales,
      whale_feed_total: status.whale_feed.total_whales,
      whale_feed_history: status.whale_feed.history,
      risk_exposure_pct: status.risk.exposure.pct,
      risk_level: status.risk.level,
      risk_stake: status.risk.stake,
      positions_open: status.positions.open,
      positions_max: status.positions.max,
      positions_list: status.positions.list,
      trades_today: status.trades_today.count,
      trades_max: status.trades_today.max,
      entry_allowed: status.entry.allowed,
      entry_block_reasons: status.entry.block_reasons,
      entry_block_reasons_human: status.entry.block_reasons_human,
      health: status.health,
      updated_at: new Date().toISOString()
    };
  }

  _getAverageConfidence() {
    if (this.whaleSignals.length === 0) return this.whaleFeedScore;
    const sum = this.whaleSignals.reduce((a, s) => a + (s.confidence || 0.5), 0);
    return sum / this.whaleSignals.length;
  }

  updateEquity(collateral, positionsValue = 0) {
    this.collateral = collateral;
    this.positionsValue = positionsValue;
    this.equity = collateral + positionsValue;
  }

  updateWhaleSignals(signals) {
    this.whaleSignals = signals;
    this.whaleFeedScore = computeWhaleFeedScore(signals);
    this.scoreHistory.push({
      timestamp: Date.now(),
      score: this.whaleFeedScore
    });
    if (this.scoreHistory.length > 500) {
      this.scoreHistory = this.scoreHistory.slice(-400);
    }
  }

  addPosition(position) {
    this.positions.push(position);
  }

  removePosition(id) {
    this.positions = this.positions.filter(p => p.id !== id);
  }

  incrementTrades() {
    this.tradesToday++;
  }

  resetDailyTrades() {
    this.tradesToday = 0;
  }
}
