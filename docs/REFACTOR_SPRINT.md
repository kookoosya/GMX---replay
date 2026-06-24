# Refactor Sprint 1 — tracker

Rules: `.cursor/rules/sprint-workflow.mdc` (one step at a time, no parity drift).

## 1.1 Arcade cover imageUrl — DONE

**Problem:** 9 games used another game's `imageUrl` (copy-paste). Users saw wrong covers (e.g. Marble Shooter showed Cut the Rope).

**Fix:**
- `tools/audit-arcade-cover-collisions.mjs` — detects shared URLs
- `tools/fix-arcade-stolen-covers.mjs` — clears stolen URL or applies `arcade-covers.json` when verified (`hole-io`)
- 8 games → empty `imageUrl` → category SVG fallback (correct, not another game's art)
- 1 game (`hole-io`) → verified CrazyGames CDN URL from `arcade-covers.json`

**Verify:** `node tools/audit-arcade-cover-collisions.mjs` → no collisions; `npm run test:suite` → client-invariants includes collision check.

## 1.2 ru/uk Arcade i18n — pending

## 1.3 duplicate coverSrc() — pending

## 1.4 bridge/app.html copy — pending

## 1.5 mountLineListSkeleton — pending
