/** Referral unlock ladder — shared between site UI and tests. */

export const REF_UNLOCK_LADDER = Object.freeze([1, 3, 7, 15, 30, 50, 100]);

export function nextReferralUnlockAt(eligible) {
  const e = Math.max(0, Number(eligible || 0) || 0);
  for (const step of REF_UNLOCK_LADDER) {
    if (e < step) return step;
  }
  return 0;
}

export function previousReferralUnlockAt(nextStep) {
  const n = Number(nextStep || 0) || 0;
  if (n <= 0) return REF_UNLOCK_LADDER[REF_UNLOCK_LADDER.length - 1] || 0;
  const idx = REF_UNLOCK_LADDER.indexOf(n);
  return idx > 0 ? REF_UNLOCK_LADDER[idx - 1] : 0;
}

export function neededForNextUnlock(eligible, nextStep) {
  const e = Math.max(0, Number(eligible || 0) || 0);
  const next = Number(nextStep || 0) || 0;
  if (next <= 0) return 0;
  return Math.max(0, next - e);
}

export function referralProgressPct(eligible, nextStep, prevStep) {
  const next = Number(nextStep || 0) || 0;
  if (next <= 0) return 100;
  const prev = Math.max(0, Number(prevStep || 0) || 0);
  const e = Math.max(0, Number(eligible || 0) || 0);
  const span = Math.max(1, next - prev);
  const progress = Math.max(0, e - prev);
  return Math.max(0, Math.min(100, Math.round((progress / span) * 100)));
}

export function referralProgressState(eligible) {
  const e = Math.max(0, Number(eligible || 0) || 0);
  const nextStep = nextReferralUnlockAt(e);
  const prevStep = previousReferralUnlockAt(nextStep);
  return {
    eligible: e,
    nextStep,
    prevStep,
    needed: neededForNextUnlock(e, nextStep),
    pct: referralProgressPct(e, nextStep, prevStep),
    complete: nextStep <= 0,
  };
}
