import type { ArcadeGameKey } from "./gameRegistry";

const CHECKPOINT_PREFIX = "gmx_arcade_checkpoint_v1_";

export interface ArcadeCheckpointEnvelope<T = unknown> {
  game: ArcadeGameKey;
  updatedAt: number;
  option1: string;
  option2: string;
  progressHint: string;
  scoreHint: number;
  payload: T;
}

export interface ArcadeCheckpointSummary {
  updatedAt: number;
  option1: string;
  option2: string;
  progressHint: string;
  scoreHint: number;
}

function keyFor(game: ArcadeGameKey) {
  return `${CHECKPOINT_PREFIX}${game}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeEnvelope<T>(game: ArcadeGameKey, payload: T, updatedAt?: number): ArcadeCheckpointEnvelope<T> {
  const source = (payload && typeof payload === "object") ? (payload as Record<string, unknown>) : {};
  return {
    game,
    updatedAt: Math.max(0, Number(updatedAt || source.updatedAt || Date.now()) || Date.now()),
    option1: String(source.option1 || "Default"),
    option2: String(source.option2 || "Default"),
    progressHint: String(source.progressHint || "Resume ready"),
    scoreHint: Math.max(0, Number(source.scoreHint || 0) || 0),
    payload,
  };
}

export function loadCheckpoint<T = unknown>(game: ArcadeGameKey): ArcadeCheckpointEnvelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = safeParse<ArcadeCheckpointEnvelope<T>>(window.localStorage.getItem(keyFor(game)));
    if (!parsed || parsed.game !== game) return null;
    return normalizeEnvelope(game, parsed.payload, parsed.updatedAt);
  } catch {
    return null;
  }
}

export function saveCheckpoint<T = Record<string, unknown>>(game: ArcadeGameKey, payload: T): ArcadeCheckpointEnvelope<T> {
  const envelope = normalizeEnvelope(game, payload);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(keyFor(game), JSON.stringify(envelope));
    } catch {}
  }
  return envelope;
}

export function getCheckpointSummary(game: ArcadeGameKey): ArcadeCheckpointSummary | null {
  const checkpoint = loadCheckpoint(game);
  if (!checkpoint) return null;
  return {
    updatedAt: checkpoint.updatedAt,
    option1: checkpoint.option1,
    option2: checkpoint.option2,
    progressHint: checkpoint.progressHint,
    scoreHint: checkpoint.scoreHint,
  };
}
