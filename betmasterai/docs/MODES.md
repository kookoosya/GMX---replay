# BetMasterAI — Mode System Documentation

## Overview

BetMasterAI uses a **progressive mode system** that automatically adjusts trading aggressiveness based on account equity. Each mode has different risk parameters, and modes can be **degraded** based on real-time signal quality.

## Modes

### Safe Mode 🛡️
**For:** Micro accounts ($80–$150)

| Parameter | Value |
|-----------|-------|
| Risk per trade | 0.8% |
| Max total risk | 1.2% |
| Max trades/day | 5–6 |
| Max concurrent positions | 2 |
| Copy ratio | 2.0–2.5% |
| Debate strictness | Relaxed |
| Overseer strictness | Relaxed |
| Anti-stall | Disabled |

**Behavior:** Most conservative mode. Designed for small accounts where preservation of capital is paramount. Debate and overseer systems are relaxed to avoid excessive blocking on micro balances. The bot will take fewer trades but with higher conviction.

**Micro overrides ($80–$150):**
- Debate system is bypassed below $150 equity
- Overseer is bypassed below $120 equity
- Maximum 3 consecutive blocks before forced reset
- Confidence threshold drops to 0.45 after 2 consecutive blocks

---

### Core Mode ⚙️
**For:** Small accounts ($150–$300)

| Parameter | Value |
|-----------|-------|
| Risk per trade | 1.5% |
| Max total risk | 3.0% |
| Max trades/day | 8 |
| Max concurrent positions | 3 |
| Copy ratio | 3.0% |
| Debate strictness | Normal |
| Overseer strictness | Normal |
| Anti-stall | Enabled |

**Behavior:** Balanced approach. Normal debate and overseer systems are active. Anti-stall protection prevents the bot from sitting idle for too long during sideways markets. Good balance between opportunity and risk management.

---

### Smart Mode 🧠
**For:** Medium accounts ($300–$600)

| Parameter | Value |
|-----------|-------|
| Risk per trade | 2.5% |
| Max total risk | 5.0% |
| Max trades/day | 12 |
| Max concurrent positions | 5 |
| Copy ratio | 4.0% |
| Debate strictness | Normal |
| Overseer strictness | Normal |
| Anti-stall | Enabled |

**Behavior:** More aggressive trading with adaptive risk. Takes advantage of more signal sources and can run multiple positions simultaneously. Suitable for accounts with enough cushion to absorb drawdowns.

---

### Ensemble Mode 🎯
**For:** Full accounts ($600+)

| Parameter | Value |
|-----------|-------|
| Risk per trade | 3.0% |
| Max total risk | 6.0% |
| Max trades/day | 15 |
| Max concurrent positions | 6 |
| Copy ratio | 5.0% |
| Debate strictness | Strict |
| Overseer strictness | Strict |
| Anti-stall | Enabled |

**Behavior:** Full ensemble with all signal sources active. Strict debate means signals must have strong agreement before entry. High capacity for concurrent positions and daily trades. Designed for well-funded accounts that can leverage the full power of the system.

---

## Degradation Levels

Each mode operates at one of three degradation levels based on real-time whale feed score and signal confidence:

### FULL (Green) ✅
- **Whale Feed Score:** ≥ 65%
- **Signal Confidence:** ≥ 60%
- **Meaning:** Strong whale consensus, all systems aligned. Normal trading parameters apply.

### CAUTIOUS (Yellow) ⚠️
- **Whale Feed Score:** 45–64%
- **Signal Confidence:** 45–59%
- **Meaning:** Mixed signals from whales. The bot still trades but with increased caution. May skip lower-conviction setups.

### DEGRADED (Red) 🔴
- **Whale Feed Score:** < 45%
- **Signal Confidence:** < 45%
- **Meaning:** Weak or conflicting whale signals. Trading is significantly reduced. Only the highest-conviction setups will be executed. The bot actively protects capital.

---

## Progressive Tier System

The bot automatically transitions between modes as equity grows:

```
$80 ──────── $150 ──────── $300 ──────── $600 ────────→
   MICRO          SMALL          MEDIUM          FULL
   (Safe)         (Core)         (Smart)        (Ensemble)
```

**Auto-upgrade rules:**
1. When equity crosses a tier boundary, the bot suggests or auto-applies a mode upgrade
2. Upgrades only go UP (safe → core → smart → ensemble)
3. The system never auto-downgrades — manual intervention needed if equity drops
4. Each tier uses optimized parameters for that equity range

---

## Whale Feed Thresholds

| Mode | Min Whale Feed Score to Enter |
|------|------|
| Safe | 55% (50% for micro) |
| Core | 50% |
| Smart | 45% |
| Ensemble | 40% |

Lower thresholds for aggressive modes allow more entries, while Safe mode requires stronger whale consensus.

---

## Ensemble Signal Filtering

Signals pass through the ensemble filter before being acted on:

1. **Edge filter:** Signal must have minimum edge (0.10–0.25 depending on mode strictness)
2. **Confidence filter:** Minimum confidence threshold (0.45–0.65)
3. **Deduplication:** No duplicate signals for same symbol+side within 5 minutes
4. **Scoring:** Signals ranked by composite score (35% edge + 35% confidence + 20% whale alignment + 10% recency)
5. **Limit:** Maximum signals per batch (6–12 depending on mode)

**Accuracy tracking:** The system records outcomes of filtered signals and reports accuracy by source, enabling continuous improvement of filter parameters.

---

## When to Use Each Mode

| Situation | Recommended Mode |
|-----------|-----------------|
| Just started, < $150 | Safe (auto) |
| Growing steadily, $150–300 | Core (auto) |
| Consistent profits, $300–600 | Smart (auto) |
| Well-funded, > $600 | Ensemble (auto) |
| High volatility / uncertain market | Consider manual downgrade to Safe |
| Testing new whale addresses | Safe regardless of equity |
| After a losing streak | Safe until recovery |
