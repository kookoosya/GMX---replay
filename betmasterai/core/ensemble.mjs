export class EnsembleFilter {
  constructor(options = {}) {
    this.minEdge = options.minEdge || 0.15;
    this.minConfidence = options.minConfidence || 0.55;
    this.maxSignals = options.maxSignals || 10;
    this.accuracyWindow = options.accuracyWindow || 50;
    this.signalHistory = [];
  }

  filterSignals(rawSignals) {
    return rawSignals
      .filter(s => this._hasMinimumEdge(s))
      .filter(s => this._hasMinimumConfidence(s))
      .filter(s => !this._isDuplicate(s))
      .sort((a, b) => this._scoreSignal(b) - this._scoreSignal(a))
      .slice(0, this.maxSignals);
  }

  _hasMinimumEdge(signal) {
    const edge = signal.edge || 0;
    return edge >= this.minEdge;
  }

  _hasMinimumConfidence(signal) {
    const confidence = signal.confidence || 0;
    return confidence >= this.minConfidence;
  }

  _isDuplicate(signal) {
    const recentWindow = 5 * 60 * 1000;
    return this.signalHistory.some(h =>
      h.symbol === signal.symbol &&
      h.side === signal.side &&
      (Date.now() - new Date(h.timestamp).getTime()) < recentWindow
    );
  }

  _scoreSignal(signal) {
    const edge = signal.edge || 0;
    const confidence = signal.confidence || 0;
    const whaleAlign = signal.whaleAlignment || 0;
    const recency = this._recencyBonus(signal.timestamp);

    return (edge * 0.35) + (confidence * 0.35) + (whaleAlign * 0.2) + (recency * 0.1);
  }

  _recencyBonus(timestamp) {
    if (!timestamp) return 0;
    const ageMs = Date.now() - new Date(timestamp).getTime();
    const maxAge = 30 * 60 * 1000;
    return Math.max(0, 1 - (ageMs / maxAge));
  }

  recordOutcome(signalId, pnl) {
    const signal = this.signalHistory.find(s => s.id === signalId);
    if (signal) {
      signal.outcome = pnl > 0 ? 'win' : 'loss';
      signal.pnl = pnl;
    }
  }

  addToHistory(signal) {
    this.signalHistory.push({
      ...signal,
      recordedAt: Date.now()
    });
    if (this.signalHistory.length > this.accuracyWindow * 2) {
      this.signalHistory = this.signalHistory.slice(-this.accuracyWindow);
    }
  }

  getAccuracyStats() {
    const resolved = this.signalHistory.filter(s => s.outcome);
    if (resolved.length === 0) {
      return { accuracy: 0, sampleSize: 0, bySource: {} };
    }

    const wins = resolved.filter(s => s.outcome === 'win').length;
    const accuracy = wins / resolved.length;

    const bySource = {};
    for (const s of resolved) {
      const src = s.source || 'unknown';
      if (!bySource[src]) bySource[src] = { wins: 0, total: 0 };
      bySource[src].total++;
      if (s.outcome === 'win') bySource[src].wins++;
    }

    for (const [src, stats] of Object.entries(bySource)) {
      bySource[src].accuracy = stats.total > 0
        ? Math.round((stats.wins / stats.total) * 1000) / 10
        : 0;
    }

    return {
      accuracy: Math.round(accuracy * 1000) / 10,
      sampleSize: resolved.length,
      totalTracked: this.signalHistory.length,
      bySource
    };
  }

  getFilterStats() {
    return {
      minEdge: this.minEdge,
      minConfidence: this.minConfidence,
      maxSignals: this.maxSignals,
      historySize: this.signalHistory.length,
      accuracy: this.getAccuracyStats()
    };
  }
}

export function createEnsembleFilter(modeConfig) {
  const strictness = modeConfig.debate_strictness || 'normal';
  const presets = {
    relaxed: { minEdge: 0.10, minConfidence: 0.45, maxSignals: 12 },
    normal: { minEdge: 0.15, minConfidence: 0.55, maxSignals: 10 },
    strict: { minEdge: 0.25, minConfidence: 0.65, maxSignals: 6 }
  };
  return new EnsembleFilter(presets[strictness] || presets.normal);
}
