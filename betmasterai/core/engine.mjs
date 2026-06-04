import { getEffectiveConfig, getModeForEquity, getDegradationLevel, getModeDisplayInfo, shouldAutoUpgrade } from './modes.mjs';
import { computeWhaleFeedScore, getWhaleFeedStatus, getWhaleCount, generateScoreHistory } from './whale_feed.mjs';
import { validateTradeEntry, getCurrentRiskExposure, getRiskLevel, getStakeInfo } from './risk_manager.mjs';
import { translateBlockReasons } from './reason_translator.mjs';
import { createEnsembleFilter } from './ensemble.mjs';

/**
 * Main trading engine. Holds account state and produces a status snapshot
 * on each `stepOnce()` call. The snapshot is the single source of truth
 * for the dashboard (written to status.json by status_writer).
 *
 * Simplified flow of stepOnce:
 *   1. Auto-upgrade mode based on equity tier
 *   2. Resolve effective config (micro overrides if applicable)
 *   3. Compute whale feed score & degradation
 *   4. Validate whether a new entry is allowed
 *   5. Compute risk exposure snapshot
 *   6. Build & return the full status object
 */
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
    this.blockLog = [];
    this.scoreHistory = generateScoreHistory(this.whaleFeedScore);
    this.ensembleFilter = createEnsembleFilter(
      getEffectiveConfig(this.mode, this.equity)
    );
  }

  /**
   * Core loop iteration. Called on each tick (typically every 5s).
   * Returns a complete status snapshot consumed by the dashboard.
   */
  stepOnce() {
    // --- Step 1: auto-upgrade mode if equity crossed a tier boundary ---
    const upgrade = shouldAutoUpgrade(this.mode, this.equity);
    if (upgrade) this.mode = upgrade.mode;

    // --- Step 2: resolve config (applies micro overrides for small accounts) ---
    const config = getEffectiveConfig(this.mode, this.equity);
    const { tier } = getModeForEquity(this.equity);

    // --- Step 3: whale feed & degradation ---
    const wfScore = this.whaleSignals.length > 0
      ? computeWhaleFeedScore(this.whaleSignals)
      : this.whaleFeedScore;
    this.whaleFeedScore = wfScore;

    const wfStatus = getWhaleFeedStatus(wfScore);
    const avgConfidence = this._avgConfidence();
    const degradation = getDegradationLevel(wfScore, avgConfidence);
    const modeDisplay = getModeDisplayInfo(this.mode, degradation);

    // --- Step 4: entry validation ---
    const validation = this._validateEntry(config, wfScore);

    // --- Step 5: risk snapshot ---
    const riskExposure = getCurrentRiskExposure(this.positions, this.equity);
    const riskLevel = getRiskLevel(riskExposure.pct);
    const stakeInfo = getStakeInfo(this.equity, config);
    const whaleCount = getWhaleCount();

    // --- Step 6: assemble result ---
    this.lastStepResult = {
      timestamp: new Date().toISOString(),
      mode: { current: this.mode, tier, degradation, display: modeDisplay, config },
      equity: this._equitySnapshot(),
      whale_feed: {
        score: round3(wfScore),
        status: wfStatus,
        active_whales: whaleCount.active,
        total_whales: whaleCount.total,
        history: this.scoreHistory
      },
      risk: { exposure: riskExposure, level: riskLevel, stake: stakeInfo },
      positions: { open: this.positions.length, max: config.max_concurrent_positions, list: this.positions },
      trades_today: { count: this.tradesToday, max: config.max_trades_per_day },
      entry: {
        allowed: validation.allowed,
        block_reasons: translateBlockReasons(validation.reasons),
        block_reasons_human: validation.reasons.map(r => r.human),
        block_reasons_technical: validation.reasons.map(r => r.technical)
      },
      ensemble: this.ensembleFilter.getFilterStats(),
      health: {
        engine_running: true,
        last_update: new Date().toISOString(),
        uptime_hours: round1(process.uptime() / 3600),
        errors_24h: 0
      }
    };

    if (!validation.allowed) {
      this.blockLog.push({ timestamp: new Date().toISOString(), reasons: validation.reasons.map(r => r.code) });
    }

    return this.lastStepResult;
  }

  // ---------- entry validation (extracted for clarity) ----------

  _validateEntry(config, wfScore) {
    const validation = validateTradeEntry(this.equity, config, this.positions, wfScore);

    if (this.tradesToday >= config.max_trades_per_day) {
      validation.allowed = false;
      validation.reasons.push({
        code: 'daily_limit',
        technical: `trades_today=${this.tradesToday} >= max=${config.max_trades_per_day}`,
        human: `Daily trade limit reached (${this.tradesToday}/${config.max_trades_per_day} trades used today)`
      });
    }

    if (config.debate_strictness === 'strict' && wfScore < 0.6) {
      validation.allowed = false;
      validation.reasons.push({
        code: 'debate_block',
        technical: 'debate_strictness=strict, consensus_low',
        human: 'Signal debate system requires stronger consensus before entry'
      });
    }

    return validation;
  }

  // ---------- equity helpers ----------

  _equitySnapshot() {
    const total = round2(this.collateral + this.positionsValue);
    const collPct = total > 0 ? Math.round((this.collateral / total) * 100) : 100;
    return {
      total,
      collateral: this.collateral,
      positions_value: this.positionsValue,
      breakdown: { collateral_pct: collPct, positions_pct: 100 - collPct }
    };
  }

  _avgConfidence() {
    if (this.whaleSignals.length === 0) return this.whaleFeedScore;
    return this.whaleSignals.reduce((s, x) => s + (x.confidence || 0.5), 0) / this.whaleSignals.length;
  }

  // ---------- public accessors ----------

  getStatus() {
    if (!this.lastStepResult) this.stepOnce();
    return this.lastStepResult;
  }

  /** Flat key-value object written to status.json for the dashboard. */
  toStatusJson() {
    const s = this.getStatus();
    return {
      live_total_equity_usdc: s.equity.total,
      live_collateral_usdc: s.equity.collateral,
      live_positions_value_usdc: s.equity.positions_value,
      live_equity_breakdown: s.equity.breakdown,
      current_mode: s.mode.current,
      current_tier: s.mode.tier,
      mode_degradation: s.mode.degradation,
      mode_display: s.mode.display,
      whale_feed_score: s.whale_feed.score,
      whale_feed_status: s.whale_feed.status,
      whale_feed_active: s.whale_feed.active_whales,
      whale_feed_total: s.whale_feed.total_whales,
      whale_feed_history: s.whale_feed.history,
      risk_exposure_pct: s.risk.exposure.pct,
      risk_level: s.risk.level,
      risk_stake: s.risk.stake,
      positions_open: s.positions.open,
      positions_max: s.positions.max,
      positions_list: s.positions.list,
      trades_today: s.trades_today.count,
      trades_max: s.trades_today.max,
      entry_allowed: s.entry.allowed,
      entry_block_reasons: s.entry.block_reasons,
      entry_block_reasons_human: s.entry.block_reasons_human,
      ensemble_stats: s.ensemble,
      health: s.health,
      updated_at: new Date().toISOString()
    };
  }

  // ---------- mutators (called by external controllers) ----------

  updateEquity(collateral, positionsValue = 0) {
    this.collateral = collateral;
    this.positionsValue = positionsValue;
    this.equity = collateral + positionsValue;
  }

  updateWhaleSignals(signals) {
    this.whaleSignals = signals;
    this.whaleFeedScore = computeWhaleFeedScore(signals);
    this.scoreHistory.push({ timestamp: Date.now(), score: this.whaleFeedScore });
    if (this.scoreHistory.length > 500) this.scoreHistory = this.scoreHistory.slice(-400);
  }

  addPosition(position) { this.positions.push(position); }
  removePosition(id) { this.positions = this.positions.filter(p => p.id !== id); }
  incrementTrades() { this.tradesToday++; }
  resetDailyTrades() { this.tradesToday = 0; }

  /** Feed a raw signal through the ensemble filter and optionally record it. */
  processSignal(signal) {
    const filtered = this.ensembleFilter.filterSignals([signal]);
    if (filtered.length > 0) {
      this.ensembleFilter.addToHistory(filtered[0]);
      return { accepted: true, signal: filtered[0] };
    }
    return { accepted: false, reason: 'filtered_by_ensemble' };
  }
}

function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }
function round1(n) { return Math.round(n * 10) / 10; }
