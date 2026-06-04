(function () {
  'use strict';

  const API_BASE = location.origin;
  const REFRESH_MS = 5000;
  let lastStatus = null;
  let analyticsData = null;

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'whale-feed') renderWhaleFeedChart();
      if (tab.dataset.tab === 'analytics') loadAnalytics();
      if (tab.dataset.tab === 'whales') loadWhaleDirectory();
    });
  });

  async function fetchStatus() {
    try {
      const res = await fetch(API_BASE + '/api/status');
      if (!res.ok) throw new Error('Status ' + res.status);
      const data = await res.json();
      lastStatus = data;
      updateDashboard(data);
      setHealth(true);
    } catch (e) {
      console.error('Failed to fetch status:', e);
      setHealth(false);
    }
  }

  function setHealth(ok) {
    const dot = document.getElementById('healthDot');
    const label = document.getElementById('healthLabel');
    dot.className = 'health-dot ' + (ok ? 'ok' : 'error');
    label.textContent = ok ? 'Connected' : 'Disconnected';
  }

  function updateDashboard(s) {
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

    updateModeCard(s);
    updateEquity(s);
    updateWhaleFeed(s);
    updateEntryStatus(s);
    updateQuickStats(s);
    updatePositions(s);
    updateTierTrack(s);
  }

  /* ====== MODE CARD ====== */
  function updateModeCard(s) {
    const card = document.getElementById('modeCard');
    const display = s.mode_display || {};
    const degradation = s.mode_degradation || 'full';

    card.className = 'mode-card ' + degradation;
    document.getElementById('modeIcon').textContent = display.icon || '🛡️';
    document.getElementById('modeName').textContent = display.name || capitalize(s.current_mode);
    document.getElementById('modeName').style.color = display.color || '#22c55e';

    const degEl = document.getElementById('modeDegradation');
    degEl.textContent = display.degradationSuffix || capitalize(degradation);
    degEl.className = 'mode-card-degradation ' + degradation;

    document.getElementById('modeDesc').textContent = display.description || '';
    document.getElementById('modeTier').textContent = (s.current_tier || 'micro').toUpperCase();
  }

  /* ====== EQUITY ====== */
  function updateEquity(s) {
    const total = s.live_total_equity_usdc;
    const collateral = s.live_collateral_usdc;
    const posVal = s.live_positions_value_usdc;
    const breakdown = s.live_equity_breakdown || {};

    document.getElementById('totalEquity').textContent = total != null ? '$' + total.toFixed(2) : '$—';
    document.getElementById('collateralValue').textContent = collateral != null ? '$' + collateral.toFixed(2) : '$—';
    document.getElementById('positionsValue').textContent = posVal != null ? '$' + posVal.toFixed(2) : '$—';

    const collPct = breakdown.collateral_pct || 0;
    const posPct = breakdown.positions_pct || 0;
    document.getElementById('collateralBar').style.width = collPct + '%';
    document.getElementById('positionsBar').style.width = posPct + '%';
  }

  /* ====== WHALE FEED ====== */
  function updateWhaleFeed(s) {
    const score = s.whale_feed_score;
    const status = s.whale_feed_status || {};
    const scoreDisplay = score != null ? Math.round(score * 100) : '—';
    const scoreNum = document.getElementById('whaleScoreNumber');
    scoreNum.textContent = scoreDisplay;
    scoreNum.style.color = getScoreColor(score);

    const fill = document.getElementById('whaleScoreFill');
    fill.style.width = (score != null ? score * 100 : 0) + '%';
    fill.style.background = getScoreColor(score);

    const badge = document.getElementById('whaleBadge');
    badge.textContent = status.label || '—';
    badge.className = 'whale-status-badge ' + (status.level || '');

    document.getElementById('whaleActiveCount').textContent = s.whale_feed_active || '—';
    document.getElementById('whaleTotalCount').textContent = s.whale_feed_total || '—';
  }

  /* ====== ENTRY STATUS / WHY NOT ENTERING ====== */
  function updateEntryStatus(s) {
    const card = document.getElementById('entryCard');
    const badge = document.getElementById('entryBadge');
    const container = document.getElementById('entryReasons');
    const title = document.getElementById('entryTitle');

    if (s.entry_allowed) {
      card.className = 'card entry-card allowed';
      badge.textContent = 'Ready';
      badge.className = 'entry-status-badge ready';
      title.textContent = 'Entry Status';
      container.innerHTML = '<div class="entry-ready-msg">✅ Bot is ready to trade — scanning for opportunities</div>';
      return;
    }

    card.className = 'card entry-card blocked';
    badge.textContent = 'Waiting';
    badge.className = 'entry-status-badge blocked';
    title.textContent = 'Why the bot is not entering';

    const reasons = s.entry_block_reasons || [];
    if (reasons.length === 0) {
      container.innerHTML = '<div class="entry-ready-msg" style="background:var(--accent-yellow-dim);color:var(--accent-yellow)">⏳ Evaluating market conditions…</div>';
      return;
    }

    container.innerHTML = reasons.map(r => `
      <div class="entry-reason">
        <div class="entry-reason-icon">${r.icon || 'ℹ️'}</div>
        <div class="entry-reason-body">
          <div class="entry-reason-title">${escapeHtml(r.title)}</div>
          <div class="entry-reason-desc">${escapeHtml(r.description)}</div>
          <div class="entry-reason-tech">${escapeHtml(r.technical || '')}</div>
        </div>
      </div>
    `).join('');
  }

  /* ====== QUICK STATS ====== */
  function updateQuickStats(s) {
    document.getElementById('tradesToday').textContent = s.trades_today ?? '—';
    document.getElementById('tradesMax').textContent = '/ ' + (s.trades_max ?? '—');
    document.getElementById('positionsOpen').textContent = s.positions_open ?? '—';
    document.getElementById('positionsMax').textContent = '/ ' + (s.positions_max ?? '—');

    const riskPct = s.risk_exposure_pct;
    const riskEl = document.getElementById('riskExposure');
    riskEl.textContent = riskPct != null ? riskPct.toFixed(1) + '%' : '—';
    riskEl.style.color = riskPct != null ? getRiskColor(riskPct) : 'inherit';

    const riskLvl = s.risk_level || {};
    const riskLabel = document.getElementById('riskLevel');
    riskLabel.textContent = riskLvl.label || '—';
    riskLabel.style.color = riskLvl.color || 'inherit';

    const stake = s.risk_stake || {};
    document.getElementById('perTradeStake').textContent = stake.perTradeStake != null ? '$' + stake.perTradeStake.toFixed(2) : '—';
  }

  /* ====== POSITIONS ====== */
  function updatePositions(s) {
    const list = document.getElementById('positionsList');
    const positions = s.positions_list || [];

    if (positions.length === 0) {
      list.innerHTML = '<div class="positions-empty">No open positions</div>';
      return;
    }

    list.innerHTML = positions.map(p => {
      const pnlClass = (p.pnl || 0) >= 0 ? 'positive' : 'negative';
      const pnlSign = (p.pnl || 0) >= 0 ? '+' : '';
      return `
        <div class="position-item">
          <div>
            <span class="position-symbol">${escapeHtml(p.symbol)}</span>
            <span class="position-side ${p.side}">${p.side}</span>
          </div>
          <div>
            <span class="position-size">$${(p.size || 0).toFixed(2)}</span>
          </div>
          <div>
            <span class="position-pnl ${pnlClass}">${pnlSign}$${(p.pnl || 0).toFixed(2)} (${pnlSign}${(p.pnlPct || 0).toFixed(2)}%)</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ====== PROGRESSIVE TIER TRACK ====== */
  function updateTierTrack(s) {
    const track = document.getElementById('tierTrack');
    const currentTier = s.current_tier || 'micro';
    const equity = s.live_total_equity_usdc || 0;

    const tiers = [
      { id: 'micro', name: 'Micro', range: '$80–$150', mode: 'Safe' },
      { id: 'small', name: 'Small', range: '$150–$300', mode: 'Core' },
      { id: 'medium', name: 'Medium', range: '$300–$600', mode: 'Smart' },
      { id: 'full', name: 'Full', range: '$600+', mode: 'Ensemble' }
    ];

    const tierOrder = ['micro', 'small', 'medium', 'full'];
    const currentIdx = tierOrder.indexOf(currentTier);

    track.innerHTML = tiers.map((t, i) => {
      let cls = 'tier-step';
      if (i === currentIdx) cls += ' active';
      if (i < currentIdx) cls += ' completed';
      return `
        <div class="${cls}">
          <div class="tier-step-name">${t.name}</div>
          <div class="tier-step-range">${t.range}</div>
          <div class="tier-step-mode">${t.mode}</div>
        </div>
      `;
    }).join('');
  }

  /* ====== WHALE FEED CHART ====== */
  function renderWhaleFeedChart() {
    if (!lastStatus || !lastStatus.whale_feed_history) return;
    const canvas = document.getElementById('whaleFeedChart');
    Charts.drawWhaleFeedChart(canvas, lastStatus.whale_feed_history);
    updateWhaleDetails();
  }

  function updateWhaleDetails() {
    if (!lastStatus) return;
    const el = document.getElementById('whaleDetails');
    const status = lastStatus.whale_feed_status || {};
    el.innerHTML = `
      <div style="padding:16px; background:var(--bg-secondary); border-radius:8px; border-left: 4px solid ${status.color || '#6b7280'}">
        <div style="font-size:18px; font-weight:700; color:${status.color || '#e8eaed'}; margin-bottom:6px">
          ${status.label || '—'} — Score: ${lastStatus.whale_feed_score != null ? Math.round(lastStatus.whale_feed_score * 100) : '—'}%
        </div>
        <div style="color:var(--text-secondary); font-size:14px">${status.description || ''}</div>
        <div style="margin-top:12px; font-size:13px; color:var(--text-muted)">
          Active whales: ${lastStatus.whale_feed_active || 0} / ${lastStatus.whale_feed_total || 0}
        </div>
      </div>
    `;
  }

  /* ====== RISK TAB ====== */
  function updateRiskTab(s) {
    const meters = document.getElementById('riskMeters');
    if (!s) return;

    const riskPct = s.risk_exposure_pct || 0;
    const maxRisk = s.mode_display ? 6 : 5;
    const stake = s.risk_stake || {};

    meters.innerHTML = `
      <div class="risk-meter">
        <div class="risk-meter-header">
          <span class="risk-meter-label">Risk Exposure</span>
          <span class="risk-meter-value" style="color:${getRiskColor(riskPct)}">${riskPct.toFixed(1)}%</span>
        </div>
        <div class="risk-meter-bar">
          <div class="risk-meter-fill" style="width:${Math.min(100, (riskPct / maxRisk) * 100)}%; background:${getRiskColor(riskPct)}"></div>
        </div>
      </div>
      <div class="risk-meter">
        <div class="risk-meter-header">
          <span class="risk-meter-label">Positions Used</span>
          <span class="risk-meter-value">${s.positions_open || 0} / ${s.positions_max || 0}</span>
        </div>
        <div class="risk-meter-bar">
          <div class="risk-meter-fill" style="width:${s.positions_max ? (s.positions_open / s.positions_max) * 100 : 0}%; background:var(--accent-blue)"></div>
        </div>
      </div>
      <div class="risk-meter">
        <div class="risk-meter-header">
          <span class="risk-meter-label">Daily Trades</span>
          <span class="risk-meter-value">${s.trades_today || 0} / ${s.trades_max || 0}</span>
        </div>
        <div class="risk-meter-bar">
          <div class="risk-meter-fill" style="width:${s.trades_max ? (s.trades_today / s.trades_max) * 100 : 0}%; background:var(--accent-purple)"></div>
        </div>
      </div>
      <div class="risk-meter">
        <div class="risk-meter-header">
          <span class="risk-meter-label">Whale Feed Score</span>
          <span class="risk-meter-value" style="color:${getScoreColor(s.whale_feed_score)}">${s.whale_feed_score != null ? Math.round(s.whale_feed_score * 100) + '%' : '—'}</span>
        </div>
        <div class="risk-meter-bar">
          <div class="risk-meter-fill" style="width:${(s.whale_feed_score || 0) * 100}%; background:${getScoreColor(s.whale_feed_score)}"></div>
        </div>
      </div>
    `;

    const sizing = document.getElementById('sizingInfo');
    sizing.innerHTML = `
      <div class="sizing-item">
        <div class="sizing-item-label">Per-Trade Stake</div>
        <div class="sizing-item-value">$${(stake.perTradeStake || 0).toFixed(2)}</div>
        <div class="sizing-item-unit">USDC</div>
      </div>
      <div class="sizing-item">
        <div class="sizing-item-label">Max Total Stake</div>
        <div class="sizing-item-value">$${(stake.maxTotalStake || 0).toFixed(2)}</div>
        <div class="sizing-item-unit">USDC</div>
      </div>
      <div class="sizing-item">
        <div class="sizing-item-label">Max Position</div>
        <div class="sizing-item-value">$${(stake.maxPositionUsdc || 0).toFixed(2)}</div>
        <div class="sizing-item-unit">USDC</div>
      </div>
      <div class="sizing-item">
        <div class="sizing-item-label">Min Position</div>
        <div class="sizing-item-value">$${(stake.minPositionUsdc || 0).toFixed(2)}</div>
        <div class="sizing-item-unit">USDC</div>
      </div>
    `;
  }

  /* ====== ANALYTICS ====== */
  async function loadAnalytics() {
    try {
      const res = await fetch(API_BASE + '/api/analytics');
      if (!res.ok) throw new Error('Analytics ' + res.status);
      analyticsData = await res.json();
      renderAnalytics(analyticsData);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
  }

  function renderAnalytics(data) {
    // Equity curve
    const canvas = document.getElementById('equityCurveChart');
    if (data.equityCurve && data.equityCurve.length > 0) {
      Charts.drawEquityCurve(canvas, data.equityCurve);
    }

    // Win rate by mode
    const wrEl = document.getElementById('winRateByMode');
    const wr = data.winRateByMode || {};
    wrEl.innerHTML = Object.entries(wr).map(([mode, stats]) => `
      <div class="analytics-stat">
        <span class="analytics-stat-label">${capitalize(mode)}</span>
        <span class="analytics-stat-value">${stats.winRate}% <span style="color:var(--text-muted);font-size:12px">(${stats.wins}/${stats.trades})</span></span>
      </div>
    `).join('') || '<div style="color:var(--text-muted);padding:12px">No data yet</div>';

    // PnL stats
    const pnlEl = document.getElementById('pnlStats');
    const pnl = data.pnlStats || {};
    pnlEl.innerHTML = `
      <div class="analytics-stat">
        <span class="analytics-stat-label">Total PnL</span>
        <span class="analytics-stat-value" style="color:${pnl.totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${pnl.totalPnl >= 0 ? '+' : ''}$${(pnl.totalPnl || 0).toFixed(2)}</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-stat-label">Avg PnL / Trade</span>
        <span class="analytics-stat-value">${pnl.avgPnl >= 0 ? '+' : ''}$${(pnl.avgPnl || 0).toFixed(2)}</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-stat-label">Best Trade</span>
        <span class="analytics-stat-value" style="color:var(--accent-green)">+$${(pnl.maxWin || 0).toFixed(2)}</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-stat-label">Worst Trade</span>
        <span class="analytics-stat-value" style="color:var(--accent-red)">$${(pnl.maxLoss || 0).toFixed(2)}</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-stat-label">Sharpe Ratio</span>
        <span class="analytics-stat-value">${(pnl.sharpe || 0).toFixed(2)}</span>
      </div>
    `;

    // Whale feed correlation
    const corrEl = document.getElementById('whaleFeedCorrelation');
    const corr = data.whaleFeedCorrelation || {};
    corrEl.innerHTML = `
      <div class="analytics-stat">
        <span class="analytics-stat-label">Correlation</span>
        <span class="analytics-stat-value">${(corr.correlation || 0).toFixed(3)}</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-stat-label">Interpretation</span>
        <span class="analytics-stat-value">${corr.interpretation || '—'}</span>
      </div>
      <div class="analytics-stat">
        <span class="analytics-stat-label">Sample Size</span>
        <span class="analytics-stat-value">${corr.sampleSize || 0} trades</span>
      </div>
    `;

    // Risk heatmap
    renderRiskHeatmap(data.riskHeatmap);
  }

  function renderRiskHeatmap(heatmap) {
    const container = document.getElementById('riskHeatmap');
    if (!heatmap) {
      container.innerHTML = '<div style="color:var(--text-muted);padding:12px">No data yet</div>';
      return;
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '<table class="heatmap-table"><thead><tr><th></th>';
    for (let h = 0; h < 24; h++) html += `<th>${h}</th>`;
    html += '</tr></thead><tbody>';

    for (const day of days) {
      html += `<tr><th style="text-align:right;padding-right:8px">${day}</th>`;
      for (let h = 0; h < 24; h++) {
        const cell = heatmap[day] && heatmap[day][h] ? heatmap[day][h] : { trades: 0, avgPnl: 0 };
        const intensity = Math.min(1, cell.trades / 5);
        const isProfit = cell.avgPnl >= 0;
        const color = cell.trades === 0 ? 'var(--bg-secondary)' :
          isProfit ? `rgba(34, 197, 94, ${0.15 + intensity * 0.6})` :
                     `rgba(239, 68, 68, ${0.15 + intensity * 0.6})`;
        html += `<td><div class="heatmap-cell" style="background:${color}" title="${day} ${h}:00 — ${cell.trades} trades, PnL: $${cell.avgPnl.toFixed(2)}"></div></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  /* ====== WHALE DIRECTORY ====== */
  async function loadWhaleDirectory() {
    try {
      const res = await fetch(API_BASE + '/api/whales');
      if (!res.ok) throw new Error('Whales ' + res.status);
      const data = await res.json();
      renderWhaleDirectory(data);
    } catch (e) {
      console.error('Failed to load whales:', e);
    }
  }

  function renderWhaleDirectory(data) {
    document.getElementById('whaleDirectoryCount').textContent = `${data.active} active / ${data.total} total`;

    const table = document.getElementById('whaleTable');
    const whales = data.whales || [];

    table.innerHTML = whales.map((w, i) => `
      <div class="whale-row">
        <span class="whale-rank">#${i + 1}</span>
        <span class="whale-name">${escapeHtml(w.label)}</span>
        <span class="whale-tier-badge ${w.tier}">${w.tier}</span>
        <span class="whale-stat">WR: <strong>${(w.win_rate_30d * 100).toFixed(0)}%</strong></span>
        <span class="whale-stat">PnL: <strong>${w.avg_pnl_pct.toFixed(1)}%</strong></span>
        <span class="whale-stat">${w.trades_30d} trades</span>
      </div>
    `).join('');
  }

  /* ====== HELPERS ====== */
  function getScoreColor(score) {
    if (score == null) return '#6b7280';
    if (score >= 0.65) return '#22c55e';
    if (score >= 0.45) return '#eab308';
    return '#ef4444';
  }

  function getRiskColor(pct) {
    if (pct <= 2) return '#22c55e';
    if (pct <= 5) return '#eab308';
    if (pct <= 8) return '#f97316';
    return '#ef4444';
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initial load + polling
  fetchStatus();
  setInterval(() => {
    fetchStatus();
    if (lastStatus) updateRiskTab(lastStatus);
  }, REFRESH_MS);

  // Resize handler for charts
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.querySelector('#tab-whale-feed.active')) renderWhaleFeedChart();
      if (document.querySelector('#tab-analytics.active') && analyticsData) renderAnalytics(analyticsData);
    }, 200);
  });
})();
