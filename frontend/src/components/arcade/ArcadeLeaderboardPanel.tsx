import React, { useMemo } from "react";
import type { ArcadeGameKey } from "../../features/arcade/gameRegistry";
import { listGameRuns, listSeasonRuns } from "../../features/arcade/runtimeAdapter";

interface Props {
  selectedGame: ArcadeGameKey;
  tick: number;
}

function fmt(items: ReturnType<typeof listSeasonRuns>, empty: string) {
  if (!items.length) return empty;
  return items.map((entry, idx) => `#${idx + 1} ${entry.score} · ${entry.gameLabel}`).join(" | ");
}

export default function ArcadeLeaderboardPanel({ selectedGame, tick }: Props) {
  const topSelected = useMemo(() => listGameRuns(selectedGame).slice(0, 3), [selectedGame, tick]);
  const weekly = useMemo(() => listSeasonRuns(7).slice(0, 5), [tick]);
  const monthly = useMemo(() => listSeasonRuns(30).slice(0, 5), [tick]);

  return (
    <>
      <div className="h1" style={{ fontSize: 18, marginTop: 16, marginBottom: 10 }}>Shared local ladders</div>
      <div className="hint">Selected game board: <span className="mono">{topSelected.length ? topSelected.map((entry, idx) => `#${idx + 1} ${entry.score}`).join(" | ") : "No local runs yet"}</span></div>
      <div className="hint" style={{ marginTop: 8 }}>Weekly board: <span className="mono">{fmt(weekly, "No weekly runs yet")}</span></div>
      <div className="hint" style={{ marginTop: 8 }}>Monthly board: <span className="mono">{fmt(monthly, "No monthly runs yet")}</span></div>
    </>
  );
}
