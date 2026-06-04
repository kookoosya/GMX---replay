const REASON_TRANSLATIONS = {
  max_positions: {
    icon: '📊',
    title: 'All slots occupied',
    getDescription: (r) => r.human || 'All available position slots are currently in use. Wait for an existing trade to close.'
  },
  max_risk: {
    icon: '⚠️',
    title: 'Risk limit reached',
    getDescription: (r) => r.human || 'Your current risk exposure is at the maximum allowed level. No new trades until risk decreases.'
  },
  whale_feed_low: {
    icon: '🐋',
    title: 'Weak whale signals',
    getDescription: (r) => r.human || 'Top traders are not showing strong consensus right now. The bot waits for better whale alignment.'
  },
  equity_too_low: {
    icon: '💰',
    title: 'Balance too low',
    getDescription: (r) => r.human || 'Account balance is below the minimum required to open new positions safely.'
  },
  daily_limit: {
    icon: '📅',
    title: 'Daily trade limit',
    getDescription: (r) => r.human || 'Maximum number of trades for today has been reached. Resets at midnight UTC.'
  },
  debate_block: {
    icon: '🤔',
    title: 'Signals not aligned',
    getDescription: () => 'Multiple signal sources are giving conflicting opinions. The bot is waiting for clearer direction.'
  },
  overseer_rejected: {
    icon: '🛡️',
    title: 'Safety check failed',
    getDescription: () => 'The risk overseer detected conditions that make this trade too risky right now.'
  },
  debate_skip: {
    icon: '⏸️',
    title: 'Waiting for consensus',
    getDescription: () => 'Signal analysis is ongoing. The bot needs more data points to make a confident decision.'
  },
  antistall_block: {
    icon: '🔄',
    title: 'Anti-stall protection',
    getDescription: () => 'The bot detected potential market stalling. Pausing entries to avoid getting stuck in sideways movement.'
  },
  confidence_low: {
    icon: '📉',
    title: 'Low confidence',
    getDescription: () => 'Signal confidence is below the required threshold. Waiting for a stronger setup.'
  },
  cooldown: {
    icon: '⏰',
    title: 'Cooldown active',
    getDescription: () => 'Waiting for the minimum time between trades. This prevents overtrading.'
  },
  market_closed: {
    icon: '🚫',
    title: 'Market conditions poor',
    getDescription: () => 'Current market conditions (high volatility, low liquidity, or extreme fear/greed) make trading inadvisable.'
  }
};

const FALLBACK = {
  icon: 'ℹ️',
  title: 'Entry paused',
  getDescription: (r) => r.human || r.technical || 'The bot is waiting for better conditions to enter a trade.'
};

export function translateBlockReasons(reasons) {
  return reasons.map(reason => {
    const template = REASON_TRANSLATIONS[reason.code] || FALLBACK;
    return {
      code: reason.code,
      icon: template.icon,
      title: template.title,
      description: template.getDescription(reason),
      technical: reason.technical
    };
  });
}

export function getReasonSummary(reasons) {
  if (reasons.length === 0) return 'Bot is ready to trade — looking for opportunities.';
  if (reasons.length === 1) return reasons[0].description;
  return `${reasons.length} conditions are preventing entry: ${reasons.map(r => r.title).join(', ')}.`;
}
