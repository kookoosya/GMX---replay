import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _config = null;
function loadConfig() {
  if (!_config) {
    const raw = readFileSync(join(__dirname, '..', 'config', 'default.json'), 'utf-8');
    _config = JSON.parse(raw);
  }
  return _config;
}

let _microOverrides = null;
function loadMicroOverrides() {
  if (!_microOverrides) {
    const raw = readFileSync(join(__dirname, '..', 'config', 'safe_micro.json'), 'utf-8');
    _microOverrides = JSON.parse(raw);
  }
  return _microOverrides;
}

export const MODE_NAMES = ['safe', 'core', 'smart', 'ensemble'];

export function getModeConfig(modeName) {
  const cfg = loadConfig();
  return cfg.modes[modeName] || cfg.modes.safe;
}

export function getModeForEquity(equity) {
  const cfg = loadConfig();
  const tiers = cfg.progressive_tiers;

  if (equity < tiers.micro.max_equity) return { tier: 'micro', mode: tiers.micro.default_mode };
  if (equity < tiers.small.max_equity) return { tier: 'small', mode: tiers.small.default_mode };
  if (equity < tiers.medium.max_equity) return { tier: 'medium', mode: tiers.medium.default_mode };
  return { tier: 'full', mode: tiers.full.default_mode };
}

export function getEffectiveConfig(modeName, equity) {
  const base = getModeConfig(modeName);
  const cfg = loadConfig();

  if (equity <= 150 && modeName === 'safe') {
    const micro = loadMicroOverrides();
    return { ...base, ...micro.overrides, _tier: 'micro', _blocking: micro.blocking_overrides };
  }

  return { ...base, _tier: getTierLabel(equity), _blocking: null };
}

function getTierLabel(equity) {
  const cfg = loadConfig();
  const tiers = cfg.progressive_tiers;
  if (equity < tiers.micro.max_equity) return 'micro';
  if (equity < tiers.small.max_equity) return 'small';
  if (equity < tiers.medium.max_equity) return 'medium';
  return 'full';
}

export function getProgressiveTiers() {
  return loadConfig().progressive_tiers;
}

export function shouldAutoUpgrade(currentMode, equity) {
  const recommended = getModeForEquity(equity);
  const currentIdx = MODE_NAMES.indexOf(currentMode);
  const recommendedIdx = MODE_NAMES.indexOf(recommended.mode);
  return recommendedIdx > currentIdx ? recommended : null;
}

export function getDegradationLevel(whaleFeedScore, signalConfidence) {
  if (whaleFeedScore >= 0.65 && signalConfidence >= 0.6) return 'full';
  if (whaleFeedScore >= 0.45 && signalConfidence >= 0.45) return 'cautious';
  return 'degraded';
}

export function getModeDisplayInfo(modeName, degradation) {
  const labels = {
    safe: { name: 'Safe Mode', icon: '🛡️', description: 'Conservative trading with strict risk limits' },
    core: { name: 'Core Mode', icon: '⚙️', description: 'Balanced trading with moderate risk' },
    smart: { name: 'Smart Mode', icon: '🧠', description: 'Intelligent trading with adaptive risk' },
    ensemble: { name: 'Ensemble Mode', icon: '🎯', description: 'Full ensemble signals with maximum opportunity' }
  };

  const degradationLabels = {
    full: { suffix: 'Full', color: '#22c55e' },
    cautious: { suffix: 'Cautious', color: '#eab308' },
    degraded: { suffix: 'Degraded', color: '#ef4444' }
  };

  const mode = labels[modeName] || labels.safe;
  const deg = degradationLabels[degradation] || degradationLabels.full;

  return {
    ...mode,
    degradation,
    degradationSuffix: deg.suffix,
    color: deg.color,
    fullLabel: `${mode.name} — ${deg.suffix}`
  };
}
