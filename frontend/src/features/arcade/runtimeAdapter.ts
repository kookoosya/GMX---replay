import { getCheckpointSummary, loadCheckpoint, saveCheckpoint } from "./storage";
import { LIVE_REACT_GAMES, type ArcadeGameKey, type ReactArcadeGameKey } from "./gameRegistry";

export interface ArcadeRunEntry {
  score: number;
  game: ArcadeGameKey;
  gameLabel: string;
  option1: string;
  option2: string;
  ts: number;
  source: "bridge" | "react" | string;
  durationSec?: number;
}

export interface ArcadeRuntimeBridge {
  submitScore: (entry: Partial<ArcadeRunEntry> & Pick<ArcadeRunEntry, "game" | "score">) => ArcadeRunEntry;
  setStatus: (status: string) => void;
  getStatus: () => string;
}

const BEST_PREFIX = "gmx_arcade_best_";
const HISTORY_PREFIX = "gmx_arcade_runs_";
const ALL_RUNS_KEY = "gmx_arcade_all_runs";
const RUNS_LIMIT = 8;
const ALL_RUNS_LIMIT = 120;
const STATUS_KEY = "gmx_arcade_runtime_status";
const BRIDGE_SELECTION_KEY = "gmx_arcade_bridge_selection";
const REACT_SELECTION_KEY = "gmx_arcade_react_selection";
const BRIDGE_ACTION_KEY = "gmx_arcade_bridge_action";
const BRIDGE_QUEUE_TEXT_KEY = "gmx_arcade_bridge_queue_text";
const BRIDGE_BOOT_KEY = "gmx_arcade_bridge_booted";
const BRIDGE_RUNTIME_LABEL_KEY = "gmx_arcade_bridge_runtime_label";
const BRIDGE_CONTROL_HINT_KEY = "gmx_arcade_bridge_control_hint";
const BRIDGE_SELECTION_NOTE_KEY = "gmx_arcade_bridge_selection_note";
const BRIDGE_SURFACE_NOTE_KEY = "gmx_arcade_bridge_surface_note";
const BRIDGE_PROGRESS_NOTE_KEY = "gmx_arcade_bridge_progress_note";
const BRIDGE_UPGRADE_NOTE_KEY = "gmx_arcade_bridge_upgrade_note";
const BRIDGE_OVERVIEW_NOTE_KEY = "gmx_arcade_bridge_overview_note";
const BRIDGE_DIAGNOSTICS_NOTE_KEY = "gmx_arcade_bridge_diagnostics_note";
const BRIDGE_ROUTE_NOTE_KEY = "gmx_arcade_bridge_route_note";
const BRIDGE_NARRATIVE_STATE_KEY = "gmx_arcade_bridge_narrative_state";
export type BridgeArcadeGameKey = "neon" | "payload" | "steel" | "star" | "boss";
const BRIDGE_GAMES: BridgeArcadeGameKey[] = ["neon", "payload", "steel", "star", "boss"];
const REACT_GAMES: ReactArcadeGameKey[] = ["rift", "metro", "void", "gravity", "ember", "prism", "thermal", "sky", "glass", "quarry", "drift", "bloom", "echo", "vale", "anchor", "shunt", "moss", "ion", "citadel", "tower", "deep", "signal", "harbor", "warden", "flare"];
const ALL_GAMES: ArcadeGameKey[] = ["neon", "payload", "steel", "star", "boss", "rift", "metro", "void", "gravity", "ember", "prism", "thermal", "sky", "glass", "quarry", "drift", "bloom", "echo", "vale", "anchor", "shunt", "moss", "ion", "citadel", "tower", "deep", "signal", "harbor", "warden", "flare"];

function isArcadeGameKey(value: unknown): value is ArcadeGameKey {
  return typeof value === "string" && ALL_GAMES.includes(value as ArcadeGameKey);
}

export function isBridgeGameSelection(value: unknown): value is BridgeArcadeGameKey {
  return typeof value === "string" && BRIDGE_GAMES.includes(value as BridgeArcadeGameKey);
}

export function isReactGameSelection(value: unknown): value is ReactArcadeGameKey {
  return typeof value === "string" && REACT_GAMES.includes(value as ReactArcadeGameKey);
}

export type BridgeActionType = "launch" | "restart";

export interface BridgeActionRequest {
  action: BridgeActionType;
  game: BridgeArcadeGameKey;
  ts: number;
}

declare global {
  interface Window {
    __GMX_ARCADE_RUNTIME__?: ArcadeRuntimeBridge;
    __GMX_ARCADE_BOOTED?: boolean;
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sortRuns(list: ArcadeRunEntry[]) {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.ts - a.ts;
  });
}

function historyKey(game: ArcadeGameKey) {
  return `${HISTORY_PREFIX}${game}`;
}

function bestKey(game: ArcadeGameKey) {
  return `${BEST_PREFIX}${game}`;
}

export function getBestScore(game: ArcadeGameKey) {
  try {
    return Math.max(0, Number(window.localStorage.getItem(bestKey(game)) || "0") || 0);
  } catch {
    return 0;
  }
}

export function listGameRuns(game: ArcadeGameKey) {
  try {
    return sortRuns(safeParse<ArcadeRunEntry[]>(window.localStorage.getItem(historyKey(game)), [])).slice(0, RUNS_LIMIT);
  } catch {
    return [];
  }
}

export function listAllRuns() {
  try {
    return sortRuns(safeParse<ArcadeRunEntry[]>(window.localStorage.getItem(ALL_RUNS_KEY), [])).slice(0, ALL_RUNS_LIMIT);
  } catch {
    return [];
  }
}

export function listSeasonRuns(days: number) {
  const cutoff = Date.now() - Math.max(1, Number(days) || 7) * 86400000;
  return listAllRuns().filter((entry) => (entry?.ts || 0) >= cutoff).slice(0, 10);
}

export function formatTopRuns(days: number) {
  const runs = listSeasonRuns(days).slice(0, 5);
  if (!runs.length) return "No runs yet";
  return runs.map((entry, idx) => `#${idx + 1} ${entry.score} · ${entry.gameLabel}`).join(" | ");
}

function saveList(key: string, list: ArcadeRunEntry[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

function normalizeRunSource(source: unknown) {
  const value = String(source || "").trim().toLowerCase();
  if (!value || value === "legacy") return "bridge";
  return value;
}

function setBestScore(game: ArcadeGameKey, score: number) {
  try {
    const next = Math.max(getBestScore(game), Math.max(0, Math.round(score)));
    window.localStorage.setItem(bestKey(game), String(next));
  } catch {}
}

export function submitArcadeRun(entry: Partial<ArcadeRunEntry> & Pick<ArcadeRunEntry, "game" | "score">): ArcadeRunEntry {
  const normalized: ArcadeRunEntry = {
    score: Math.max(0, Math.round(Number(entry.score) || 0)),
    game: entry.game,
    gameLabel: entry.gameLabel || entry.game,
    option1: entry.option1 || "Default",
    option2: entry.option2 || "Default",
    ts: entry.ts || Date.now(),
    source: normalizeRunSource(entry.source || "react"),
    durationSec: entry.durationSec ? Math.max(0, Math.round(entry.durationSec)) : undefined,
  };

  const gameRuns = sortRuns([...listGameRuns(normalized.game), normalized]).slice(0, RUNS_LIMIT);
  const allRuns = sortRuns([...listAllRuns(), normalized]).slice(0, ALL_RUNS_LIMIT);

  saveList(historyKey(normalized.game), gameRuns);
  saveList(ALL_RUNS_KEY, allRuns);
  setBestScore(normalized.game, normalized.score);

  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-run-recorded", { detail: normalized }));
  } catch {}

  return normalized;
}

export function writeRuntimeStatus(status: string) {
  const next = String(status || "Ready");
  try {
    window.localStorage.setItem(STATUS_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-status-changed", { detail: { status: next } }));
  } catch {}
}

export function readRuntimeStatus() {
  try {
    return String(window.localStorage.getItem(STATUS_KEY) || "Ready");
  } catch {
    return "Ready";
  }
}

export function readBridgeSelection(): BridgeArcadeGameKey {
  try {
    const raw = window.localStorage.getItem(BRIDGE_SELECTION_KEY);
    if (isBridgeGameSelection(raw)) return raw;
  } catch {}
  return "neon";
}

export function writeBridgeSelection(game: BridgeArcadeGameKey) {
  const next = isBridgeGameSelection(game) ? game : "neon";
  try {
    window.localStorage.setItem(BRIDGE_SELECTION_KEY, next);
  } catch {}
  syncBridgeControlHint();
  syncBridgeSelectionNote();
  syncBridgeSurfaceNote();
  syncBridgeProgressNote();
  syncBridgeUpgradeNote();
  syncBridgeOverviewNote();
  syncBridgeRouteNote();
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-selection", { detail: { game: next } }));
  } catch {}
  return next;
}

export function readBridgeQueueText() {
  try {
    return String(window.localStorage.getItem(BRIDGE_QUEUE_TEXT_KEY) || "No queued arcade action");
  } catch {
    return "No queued arcade action";
  }
}

export function readBridgeRuntimeLabel() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_RUNTIME_LABEL_KEY);
    if (raw) return String(raw);
  } catch {}
  return readBridgeBooted() ? "ready" : "waiting";
}

export function writeBridgeRuntimeLabel(label: string) {
  const next = String(label || (readBridgeBooted() ? "ready" : "waiting"));
  try {
    window.localStorage.setItem(BRIDGE_RUNTIME_LABEL_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-runtime-label", { detail: { label: next } }));
  } catch {}
  syncBridgeDiagnosticsNote();
  return next;
}

function syncBridgeRuntimeLabel() {
  return writeBridgeRuntimeLabel(readBridgeBooted() ? "ready" : "waiting");
}

function composeBridgeControlHint() {
  const pending = readBridgeActionRequest();
  if (!readBridgeBooted()) {
    if (pending) return `Arcade page is still loading. ${pending.action} for ${pending.game} stays queued until controls are ready.`;
    return "Arcade page is still loading. Selection, actions, and queue status will appear as soon as controls are ready.";
  }
  if (pending) {
    return `Arcade page is ready. ${pending.action} for ${pending.game} stays queued until the current control flush finishes.`;
  }
  return "Arcade page is ready. Selection, launch, restart, and queue status are live.";
}

export function readBridgeControlHint() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_CONTROL_HINT_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeControlHint();
}

export function writeBridgeControlHint(text: string) {
  const next = String(text || composeBridgeControlHint());
  try {
    window.localStorage.setItem(BRIDGE_CONTROL_HINT_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-control-hint", { detail: { text: next } }));
  } catch {}
  syncBridgeDiagnosticsNote();
  return next;
}

function syncBridgeControlHint() {
  return writeBridgeControlHint(composeBridgeControlHint());
}

function composeBridgeSelectionNote() {
  const game = readBridgeSelection();
  const pending = readBridgeActionRequest();
  if (!readBridgeBooted()) {
    if (pending) return `${game} is selected. ${pending.action} stays queued until the arcade page finishes loading.`;
    return `${game} is selected. The arcade page will launch it as soon as controls are ready.`;
  }
  if (pending) {
    return `${game} is selected. ${pending.action} stays queued until the current action flush finishes.`;
  }
  return `${game} is selected and ready to launch from the arcade page.`;
}

export function readBridgeSelectionNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_SELECTION_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeSelectionNote();
}

export function writeBridgeSelectionNote(text: string) {
  const next = String(text || composeBridgeSelectionNote());
  try {
    window.localStorage.setItem(BRIDGE_SELECTION_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-selection-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeSelectionNote() {
  return writeBridgeSelectionNote(composeBridgeSelectionNote());
}

function composeBridgeSurfaceNote() {
  const pending = readBridgeActionRequest();
  if (!readBridgeBooted()) {
    if (pending) return `The arcade page owns launch controls. ${pending.action} for ${pending.game} is queued until loading finishes.`;
    return "The arcade page owns launch controls. React-only games launch here once loading finishes.";
  }
  if (pending) return `The arcade page owns launch controls. ${pending.action} for ${pending.game} is still queued.`;
  return "The arcade page owns launch controls. React-only games launch here, while canvas titles stay available on the same page.";
}

export function readBridgeSurfaceNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_SURFACE_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeSurfaceNote();
}

export function writeBridgeSurfaceNote(text: string) {
  const next = String(text || composeBridgeSurfaceNote());
  try {
    window.localStorage.setItem(BRIDGE_SURFACE_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-surface-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeSurfaceNote() {
  return writeBridgeSurfaceNote(composeBridgeSurfaceNote());
}

function composeBridgeProgressNote() {
  const pending = readBridgeActionRequest();
  const reactCount = REACT_GAMES.length;
  const bridgeCount = BRIDGE_GAMES.length;
  if (!readBridgeBooted()) {
    if (pending) return `The arcade page offers ${bridgeCount} canvas titles and ${reactCount} React live modules. ${pending.action} stays queued while the page finishes loading.`;
    return `The arcade page offers ${bridgeCount} canvas titles and ${reactCount} React live modules while the page finishes loading.`;
  }
  if (pending) return `The arcade page offers ${bridgeCount} canvas titles and ${reactCount} React live modules. ${pending.action} is still queued.`;
  return `The arcade page offers ${bridgeCount} canvas titles and ${reactCount} React live modules.`;
}

export function readBridgeProgressNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_PROGRESS_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeProgressNote();
}

export function writeBridgeProgressNote(text: string) {
  const next = String(text || composeBridgeProgressNote());
  try {
    window.localStorage.setItem(BRIDGE_PROGRESS_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-progress-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeProgressNote() {
  return writeBridgeProgressNote(composeBridgeProgressNote());
}

function composeBridgeUpgradeNote() {
  const pending = readBridgeActionRequest();
  if (!readBridgeBooted()) {
    if (pending) return `Free keeps 5 showcase slots. Deeper modules stay in Pro. ${pending.action} for ${pending.game} is queued while the page finishes loading.`;
    return "Free keeps 5 showcase slots. Deeper modules stay in Pro.";
  }
  if (pending) return `Free keeps 5 showcase slots. Deeper modules stay in Pro. ${pending.action} for ${pending.game} is still queued.`;
  return "Free keeps 5 showcase slots. Deeper modules stay in Pro.";
}

export function readBridgeUpgradeNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_UPGRADE_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeUpgradeNote();
}

export function writeBridgeUpgradeNote(text: string) {
  const next = String(text || composeBridgeUpgradeNote());
  try {
    window.localStorage.setItem(BRIDGE_UPGRADE_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-upgrade-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeUpgradeNote() {
  return writeBridgeUpgradeNote(composeBridgeUpgradeNote());
}


function composeBridgeOverviewNote() {
  const pending = readBridgeActionRequest();
  const reactCount = REACT_GAMES.length;
  const freeCount = 5;
  if (!readBridgeBooted()) {
    if (pending) return `Neon stays free. The arcade page offers ${reactCount} React live modules and ${bridgeCount} canvas titles while ${pending.action} for ${pending.game} waits for loading to finish.`;
    return `Neon stays free. The arcade page offers ${reactCount} React live modules and ${bridgeCount} canvas titles. Free keeps ${freeCount} showcase slots led by Rift Harvest, while deeper modules stay in Pro.`;
  }
  if (pending) return `Neon stays free. The arcade page offers ${reactCount} React live modules and ${bridgeCount} canvas titles while ${pending.action} for ${pending.game} is still queued.`;
  return `Neon stays free. The arcade page offers ${reactCount} React live modules and ${bridgeCount} canvas titles. Free keeps ${freeCount} showcase slots led by Rift Harvest, while deeper modules stay in Pro.`;
}

export function readBridgeOverviewNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_OVERVIEW_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeOverviewNote();
}

export function writeBridgeOverviewNote(text: string) {
  const next = String(text || composeBridgeOverviewNote());
  try {
    window.localStorage.setItem(BRIDGE_OVERVIEW_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-overview-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeOverviewNote() {
  return writeBridgeOverviewNote(composeBridgeOverviewNote());
}

function composeBridgeDiagnosticsNote() {
  const runtimeLabel = readBridgeRuntimeLabel();
  const queueText = readBridgeQueueText();
  const controlHint = readBridgeControlHint();
  return `Arcade runtime ${runtimeLabel}. Queue ${queueText}. ${controlHint}`;
}

export function readBridgeDiagnosticsNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_DIAGNOSTICS_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeDiagnosticsNote();
}

export function writeBridgeDiagnosticsNote(text: string) {
  const next = String(text || composeBridgeDiagnosticsNote());
  try {
    window.localStorage.setItem(BRIDGE_DIAGNOSTICS_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-diagnostics-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeDiagnosticsNote() {
  return writeBridgeDiagnosticsNote(composeBridgeDiagnosticsNote());
}

function composeBridgeRouteNote() {
  const pending = readBridgeActionRequest();
  const reactCount = REACT_GAMES.length;
  const freeCount = 5;
  if (!readBridgeBooted()) {
    if (pending) return `Longer sessions, English-only game UI, and deeper React modules now cover ${reactCount} live modules with ${freeCount} Free showcase slots led by Rift Harvest while ${pending.action} for ${pending.game} waits for loading.`;
    return `Longer sessions, English-only game UI, and deeper React modules now cover ${reactCount} live modules with ${freeCount} Free showcase slots led by Rift Harvest while top-depth modules stay in Pro.`;
  }
  if (pending) return `Longer sessions, English-only game UI, and deeper React modules now cover ${reactCount} live modules with ${freeCount} Free showcase slots led by Rift Harvest while ${pending.action} for ${pending.game} is still queued.`;
  return `Longer sessions, English-only game UI, and deeper React modules now cover ${reactCount} live modules with ${freeCount} Free showcase slots led by Rift Harvest while top-depth modules stay in Pro.`;
}

export function readBridgeRouteNote() {
  try {
    const raw = window.localStorage.getItem(BRIDGE_ROUTE_NOTE_KEY);
    if (raw) return String(raw);
  } catch {}
  return composeBridgeRouteNote();
}

export function writeBridgeRouteNote(text: string) {
  const next = String(text || composeBridgeRouteNote());
  try {
    window.localStorage.setItem(BRIDGE_ROUTE_NOTE_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-route-note", { detail: { text: next } }));
  } catch {}
  emitBridgeNarrativeChanged();
  return next;
}

function syncBridgeRouteNote() {
  return writeBridgeRouteNote(composeBridgeRouteNote());
}

export function writeBridgeQueueText(text: string) {
  const next = String(text || "No queued arcade action");
  try {
    window.localStorage.setItem(BRIDGE_QUEUE_TEXT_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-queue", { detail: { text: next } }));
  } catch {}
  syncBridgeDiagnosticsNote();
  return next;
}

function syncBridgeQueueTextFromPending() {
  const pending = readBridgeActionRequest();
  if (!pending) return writeBridgeQueueText("No queued arcade action");
  return writeBridgeQueueText(`queued · ${pending.action} · ${pending.game}`);
}

export function readReactSelection(): ReactArcadeGameKey {
  try {
    const raw = window.localStorage.getItem(REACT_SELECTION_KEY);
    if (isReactGameSelection(raw)) return raw;
  } catch {}
  return "rift";
}

export type ArcadeAccessPlan = "loading" | "free" | "pro";

export interface ArcadePlanPanelState {
  planLabel: string;
  accessLine: string;
  shelfLine: string;
  premiumLine: string;
  summaryLine: string;
}

export interface ReactSelectionPanelState {
  selectedLine: string;
  lockedLead: string;
  lockedSummary: string;
  lockedShelfLine: string;
  lockedPremiumLine: string;
  fallbackCta: string;
}

export interface ArcadePageMetaState {
  heroLine: string;
  migrationLine: string;
  bridgeRefreshLine: string;
}

export interface ArcadeMigrationPanelState {
  keepBridgeLine: string;
  summaryLine: string;
  supabaseLine: string;
}

export interface ArcadeRuntimePanelState {
  layerLine: string;
  weeklySampleLine: string;
  monthlySampleLine: string;
  weeklyLeadersLine: string;
  monthlyLeadersLine: string;
  statusLine: string;
}

export function buildArcadePageMetaState(plan: ArcadeAccessPlan): ArcadePageMetaState {
  const freeCount = 5;
  const reactCount = REACT_GAMES.length;
  if (plan === "pro") {
    return {
      heroLine: `The arcade route is React/Vite. The Free shelf stays capped at ${freeCount} games with Rift Harvest as the showcase hook, while deeper flagship loops stay in Pro across ${reactCount} live modules.`,
      migrationLine: `The page keeps the ${freeCount}-game Free shelf stable, stores runtime notes locally, and keeps cloud sync disabled in this archive.`,
      bridgeRefreshLine: "Arcade notes now come from one shared runtime layer instead of scattered page strings.",
    };
  }
  if (plan === "free") {
    return {
      heroLine: `The arcade route is React/Vite. Free stays intentionally tight at ${freeCount} games so Rift Harvest remains the clear showcase hook, while deeper flagship loops stay in Pro across ${reactCount} live modules.`,
      migrationLine: `The page keeps the ${freeCount}-game Free shelf stable, stores runtime notes locally, and keeps cloud sync disabled in this archive.`,
      bridgeRefreshLine: "Arcade notes now come from one shared runtime layer instead of scattered page strings.",
    };
  }
  return {
    heroLine: `The arcade route is React/Vite and keeps the ${freeCount}-game Free shelf stable while access finishes syncing across ${reactCount} live modules.`,
    migrationLine: `The page keeps the ${freeCount}-game Free shelf stable, stores runtime notes locally, and keeps cloud sync disabled while access is still syncing.`,
    bridgeRefreshLine: "Arcade notes now come from one shared runtime layer instead of scattered page strings.",
  };
}

export function buildArcadeMigrationPanelState(plan: ArcadeAccessPlan): ArcadeMigrationPanelState {
  const lead = plan === "pro"
    ? "Pro keeps the full premium shelf unlocked while the canvas shelf stays available on the same arcade page."
    : plan === "free"
      ? "Free stays intentionally tight at 5 React games while the canvas shelf stays available on the same arcade page."
      : "The arcade page is still loading access while the current shelf stays stable.";
  return {
    keepBridgeLine: "Keep both public/arcade.js copies aligned until the old canvas path is fully retired.",
    summaryLine: `${lead} This archive keeps arcade progress local-first and leaves cloud sync disabled.`,
    supabaseLine: "Cloud sync stays OFF in this archive. The route runs on the local-first arcade baseline.",
  };
}

export function buildArcadePlanPanelState(plan: ArcadeAccessPlan): ArcadePlanPanelState {
  const freeShelf = "Free shelf: Rift Harvest, Void Drift, Gravity Loop, Drift Relay, Moss Static";
  const topProShelf = "Top Pro shelf: Flare Dock, Signal Cartel, Deep Salvage, Anchor Rift, Echo Verge, Metro Surge";
  if (plan === "pro") {
    return {
      planLabel: "Pro Active",
      accessLine: `${BRIDGE_GAMES.length} canvas games + ${REACT_GAMES.length} React live games · full premium shelf`,
      shelfLine: freeShelf,
      premiumLine: topProShelf,
      summaryLine: "Pro keeps the full depth catalog unlocked, keeps the strongest flagship loops in Top Pro, and leaves cloud sync disabled in this archive.",
    };
  }
  if (plan === "free") {
    return {
      planLabel: "Free Plan",
      accessLine: "1 free canvas title + 5 Free React games · showcase hook: Rift Harvest",
      shelfLine: freeShelf,
      premiumLine: topProShelf,
      summaryLine: "Free stays intentionally tight so the first five games feel strong, while deeper flagship runs stay premium and cloud sync stays off in this archive.",
    };
  }
  return {
    planLabel: "Checking",
    accessLine: "Syncing access gate for the 5-game Free shelf and full Pro catalog",
    shelfLine: freeShelf,
    premiumLine: topProShelf,
    summaryLine: "Catalog positioning is loading from the runtime access layer while cloud sync stays off in this archive.",
  };
}


export function buildArcadeRuntimePanelState(statusOverride?: string): ArcadeRuntimePanelState {
  const weekly = listSeasonRuns(7);
  const monthly = listSeasonRuns(30);
  const latest = String(statusOverride || readRuntimeStatus() || "Ready");
  return {
    layerLine: "Shared local ladders and resume exports stay local-first in this archive while cloud sync remains off.",
    weeklySampleLine: `Weekly top sample: ${weekly.length} runs`,
    monthlySampleLine: `Monthly top sample: ${monthly.length} runs`,
    weeklyLeadersLine: `Weekly leaders: ${formatTopRuns(7)}`,
    monthlyLeadersLine: `Monthly leaders: ${formatTopRuns(30)}`,
    statusLine: `Latest runtime status: ${latest}`,
  };
}


function getReactGameDef(game: ReactArcadeGameKey) {
  return LIVE_REACT_GAMES.find((entry) => entry.key === game) || LIVE_REACT_GAMES[0];
}

function formatReactAccessBadge(game: ReactArcadeGameKey) {
  const def = getReactGameDef(game);
  if (def.highlight === "showcase") return "showcase free";
  if (def.highlight === "top_pro") return "top pro";
  return def.access;
}

export function buildReactSelectionPanelState(plan: ArcadeAccessPlan, game: ReactArcadeGameKey): ReactSelectionPanelState {
  const selected = getReactGameDef(game);
  const planPanel = buildArcadePlanPanelState(plan);
  const best = getBestScore(game);
  return {
    selectedLine: `Selected React game: ${selected.title} · ${formatReactAccessBadge(game)} · best local score ${best}`,
    lockedLead: `${selected.title} is locked behind the premium shelf.`,
    lockedSummary: planPanel.summaryLine,
    lockedShelfLine: planPanel.shelfLine,
    lockedPremiumLine: planPanel.premiumLine,
    fallbackCta: "Open free showcase",
  };
}

export interface BridgeNarrativeState {
  selectionNote: string;
  surfaceNote: string;
  progressNote: string;
  upgradeNote: string;
  overviewNote: string;
  diagnosticsNote: string;
  routeNote: string;
}

export function readBridgeNarrativeState(): BridgeNarrativeState {
  try {
    const raw = window.localStorage.getItem(BRIDGE_NARRATIVE_STATE_KEY);
    if (raw) {
      const parsed = safeParse<Partial<BridgeNarrativeState>>(raw, {});
      if (
        typeof parsed.selectionNote === "string" &&
        typeof parsed.surfaceNote === "string" &&
        typeof parsed.progressNote === "string" &&
        typeof parsed.upgradeNote === "string" &&
        typeof parsed.overviewNote === "string" &&
        typeof parsed.diagnosticsNote === "string" &&
        typeof parsed.routeNote === "string"
      ) {
        return {
          selectionNote: parsed.selectionNote,
          surfaceNote: parsed.surfaceNote,
          progressNote: parsed.progressNote,
          upgradeNote: parsed.upgradeNote,
          overviewNote: parsed.overviewNote,
          diagnosticsNote: parsed.diagnosticsNote,
          routeNote: parsed.routeNote,
        };
      }
    }
  } catch {}
  return {
    selectionNote: readBridgeSelectionNote(),
    surfaceNote: readBridgeSurfaceNote(),
    progressNote: readBridgeProgressNote(),
    upgradeNote: readBridgeUpgradeNote(),
    overviewNote: readBridgeOverviewNote(),
    diagnosticsNote: readBridgeDiagnosticsNote(),
    routeNote: readBridgeRouteNote(),
  };
}

function emitBridgeNarrativeChanged() {
  const detail: BridgeNarrativeState = {
    selectionNote: readBridgeSelectionNote(),
    surfaceNote: readBridgeSurfaceNote(),
    progressNote: readBridgeProgressNote(),
    upgradeNote: readBridgeUpgradeNote(),
    overviewNote: readBridgeOverviewNote(),
    diagnosticsNote: readBridgeDiagnosticsNote(),
    routeNote: readBridgeRouteNote(),
  };
  try {
    window.localStorage.setItem(BRIDGE_NARRATIVE_STATE_KEY, JSON.stringify(detail));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-narrative", { detail }));
  } catch {}
  return detail;
}

export function writeReactSelection(game: ReactArcadeGameKey) {
  const next = isReactGameSelection(game) ? game : "rift";
  try {
    window.localStorage.setItem(REACT_SELECTION_KEY, next);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-react-selection", { detail: { game: next } }));
  } catch {}
  return next;
}

export interface BridgeResumePanelState {
  selectedLine: string;
  progressLine: string;
  detailLine: string;
  bestLine: string;
}

export function buildBridgeResumePanelState(game: BridgeArcadeGameKey): BridgeResumePanelState {
  const checkpoint = getCheckpointSummary(game);
  const best = getBestScore(game);
  return {
    selectedLine: `Selected bridge game: ${game}`,
    progressLine: checkpoint ? `${checkpoint.progressHint} · ${checkpoint.option1} / ${checkpoint.option2}` : "No local checkpoint for the selected bridge game yet",
    detailLine: checkpoint ? `Updated ${new Date(checkpoint.updatedAt).toLocaleString()} · score hint ${checkpoint.scoreHint}` : "Launch a Pro bridge game to seed a local resume snapshot",
    bestLine: `Best for selected bridge game: ${best}`,
  };
}

function writeQueuedBridgeStatus(kind: "selection" | BridgeActionType) {
  const next = kind === "selection"
    ? "Bridge selection queued until the bridge runtime is ready"
    : `Bridge ${kind} queued until the bridge runtime is ready`;
  writeRuntimeStatus(next);
  return next;
}

export function syncBridgeSelection(game: BridgeArcadeGameKey) {
  const next = writeBridgeSelection(game);
  const select = document.getElementById("arcade_game") as HTMLSelectElement | null;
  if (!select) {
    writeQueuedBridgeStatus("selection");
    return { game: next, synced: false };
  }
  if (select.value !== next) select.value = next;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return { game: next, synced: true };
}

export function readBridgeActionRequest(): BridgeActionRequest | null {
  try {
    const parsed = safeParse<BridgeActionRequest | null>(window.localStorage.getItem(BRIDGE_ACTION_KEY), null);
    if (parsed && (parsed.action === "launch" || parsed.action === "restart") && isBridgeGameSelection(parsed.game)) {
      return { action: parsed.action, game: parsed.game, ts: Math.max(0, Number(parsed.ts) || Date.now()) };
    }
  } catch {}
  return null;
}

export function clearBridgeActionRequest() {
  try {
    window.localStorage.removeItem(BRIDGE_ACTION_KEY);
  } catch {}
  const label = writeBridgeQueueText("No queued arcade action");
  syncBridgeControlHint();
  syncBridgeSelectionNote();
  syncBridgeSurfaceNote();
  syncBridgeProgressNote();
  syncBridgeUpgradeNote();
  syncBridgeOverviewNote();
  syncBridgeRouteNote();
  return label;
}

export function writeBridgeActionRequest(action: BridgeActionType, game: BridgeArcadeGameKey) {
  const normalized: BridgeActionRequest = {
    action: action === "restart" ? "restart" : "launch",
    game: writeBridgeSelection(game),
    ts: Date.now(),
  };
  try {
    window.localStorage.setItem(BRIDGE_ACTION_KEY, JSON.stringify(normalized));
  } catch {}
  syncBridgeQueueTextFromPending();
  syncBridgeControlHint();
  syncBridgeSelectionNote();
  syncBridgeSurfaceNote();
  syncBridgeProgressNote();
  syncBridgeUpgradeNote();
  syncBridgeOverviewNote();
  syncBridgeRouteNote();
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-action", { detail: normalized }));
  } catch {}
  return normalized;
}

function clickBridgeButton(action: BridgeActionType) {
  if (!readBridgeBooted() && !syncBridgeBootFromWindow()) return false;
  const id = action === "restart" ? "arcade_restart" : "arcade_launch_neon";
  const button = document.getElementById(id) as HTMLButtonElement | null;
  if (!button) return false;
  button.click();
  return true;
}

export function flushQueuedBridgeAction() {
  const pending = readBridgeActionRequest();
  if (!pending) {
    writeBridgeQueueText("No queued arcade action");
    return { flushed: false, action: null as BridgeActionType | null, game: readBridgeSelection(), label: readBridgeQueueText() };
  }
  const flushed = clickBridgeButton(pending.action);
  const label = flushed
    ? (clearBridgeActionRequest(), writeBridgeQueueText(`sent · ${pending.action} · ${pending.game}`))
    : syncBridgeQueueTextFromPending();
  syncBridgeControlHint();
  syncBridgeSelectionNote();
  syncBridgeSurfaceNote();
  syncBridgeProgressNote();
  syncBridgeUpgradeNote();
  syncBridgeOverviewNote();
  syncBridgeRouteNote();
  return { flushed, action: pending.action, game: pending.game, label };
}

export function requestBridgeAction(action: BridgeActionType, game: BridgeArcadeGameKey) {
  const pending = writeBridgeActionRequest(action, game);
  const result = readBridgeBooted() ? flushQueuedBridgeAction() : { flushed: false, label: readBridgeQueueText() };
  if (!result.flushed) writeQueuedBridgeStatus(action);
  return { ...pending, synced: Boolean(result.flushed), label: String(result.label || readBridgeQueueText()) };
}

export function installBridgeSelectionMirror() {
  const select = document.getElementById("arcade_game") as HTMLSelectElement | null;
  if (!select) return () => {};
  const onChange = () => {
    const value = select.value;
    if (isBridgeGameSelection(value)) writeBridgeSelection(value);
  };
  select.addEventListener("change", onChange);
  onChange();
  return () => select.removeEventListener("change", onChange);
}

export function readBridgeBooted() {
  try {
    return window.localStorage.getItem(BRIDGE_BOOT_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBridgeBooted(booted: boolean) {
  const current = readBridgeBooted();
  const next = booted ? "1" : "0";
  if (current === (next === "1")) {
    syncBridgeRuntimeLabel();
    syncBridgeControlHint();
    syncBridgeSelectionNote();
    syncBridgeSurfaceNote();
    syncBridgeProgressNote();
    syncBridgeUpgradeNote();
    syncBridgeOverviewNote();
  syncBridgeRouteNote();
    return current;
  }
  try {
    window.localStorage.setItem(BRIDGE_BOOT_KEY, next);
  } catch {}
  syncBridgeRuntimeLabel();
  syncBridgeControlHint();
  syncBridgeSelectionNote();
  syncBridgeSurfaceNote();
  syncBridgeProgressNote();
  syncBridgeUpgradeNote();
  syncBridgeOverviewNote();
  syncBridgeRouteNote();
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-bridge-boot", { detail: { booted: next === "1" } }));
  } catch {}
  return next === "1";
}

function syncBridgeBootFromWindow() {
  return writeBridgeBooted(Boolean(window.__GMX_ARCADE_BOOTED));
}

export function installBridgeBootMonitor() {
  syncBridgeBootFromWindow();
  const timer = window.setInterval(() => {
    const booted = syncBridgeBootFromWindow();
    if (booted) window.clearInterval(timer);
  }, 250);
  return () => window.clearInterval(timer);
}

export function installBridgeActionAutoFlush() {
  const flush = () => {
    if (readBridgeBooted()) flushQueuedBridgeAction();
  };
  window.addEventListener("gmx:arcade-bridge-action", flush as EventListener);
  window.addEventListener("gmx:arcade-bridge-boot", flush as EventListener);
  window.setTimeout(flush, 0);
  return () => {
    window.removeEventListener("gmx:arcade-bridge-action", flush as EventListener);
    window.removeEventListener("gmx:arcade-bridge-boot", flush as EventListener);
  };
}

export function installBridgeStatusMirror() {
  let observer: MutationObserver | null = null;
  let timer = 0;

  const attach = () => {
    if (observer) return true;
    const statusEl = document.getElementById("arcade_status");
    if (!statusEl) return false;
    observer = new MutationObserver(() => {
      const next = statusEl.textContent?.trim();
      if (next && next !== readRuntimeStatus()) writeRuntimeStatus(next);
    });
    observer.observe(statusEl, { childList: true, subtree: true, characterData: true });
    return true;
  };

  attach();
  timer = window.setInterval(() => {
    if (attach()) window.clearInterval(timer);
  }, 250);

  return () => {
    observer?.disconnect();
    if (timer) window.clearInterval(timer);
  };
}

export function saveProResume(game: ArcadeGameKey, payload: Record<string, unknown>) {
  return saveCheckpoint(game, payload);
}

export function loadProResume<T = unknown>(game: ArcadeGameKey) {
  return loadCheckpoint<T>(game);
}

export function installArcadeRuntimeBridge() {
  const bridge: ArcadeRuntimeBridge = {
    submitScore(entry) {
      return submitArcadeRun({ ...entry, source: entry.source || "react" });
    },
    setStatus(status) {
      writeRuntimeStatus(status);
    },
    getStatus() {
      return readRuntimeStatus();
    },
  };
  window.__GMX_ARCADE_RUNTIME__ = bridge;
  return bridge;
}

export interface ArcadeRuntimeSnapshot {
  version: string;
  exportedAt: string;
  best: Partial<Record<ArcadeGameKey, number>>;
  allRuns: ArcadeRunEntry[];
  status: string;
}

export function exportArcadeRuntimeSnapshot(): ArcadeRuntimeSnapshot {
  const best: Partial<Record<ArcadeGameKey, number>> = {};
  for (const game of ALL_GAMES) best[game] = getBestScore(game);
  return {
    version: "phase53",
    exportedAt: new Date().toISOString(),
    best,
    allRuns: listAllRuns(),
    status: readRuntimeStatus(),
  };
}

export function importArcadeRuntimeSnapshot(raw: string) {
  let parsed: any = null;
  try {
    parsed = JSON.parse(String(raw || "{}"));
  } catch {
    return { importedRuns: 0, importedBest: 0, statusRestored: false, version: "invalid" };
  }
  const runs = Array.isArray(parsed?.allRuns) ? parsed.allRuns : [];
  let importedRuns = 0;
  for (const run of runs) {
    const game = run?.game;
    if (isArcadeGameKey(game)) {
      submitArcadeRun({ ...run, game, source: normalizeRunSource(run?.source || "bridge") });
      importedRuns += 1;
    }
  }
  let importedBest = 0;
  const best = parsed?.best && typeof parsed.best === "object" ? parsed.best : {};
  for (const game of ALL_GAMES) {
    const value = Math.max(0, Math.round(Number(best?.[game] || 0) || 0));
    if (value > 0) {
      try {
        const current = getBestScore(game);
        if (value > current) {
          window.localStorage.setItem(`${BEST_PREFIX}${game}`, String(value));
          importedBest += 1;
        }
      } catch {}
    }
  }
  let statusRestored = false;
  if (parsed?.status) {
    writeRuntimeStatus(String(parsed.status));
    statusRestored = true;
  }
  try {
    window.dispatchEvent(new CustomEvent("gmx:arcade-run-recorded"));
  } catch {}
  return { importedRuns, importedBest, statusRestored, version: String(parsed?.version || "unknown") };
}
