import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountVoidDriftCore, type VoidDriftSnapshot } from "../../features/arcade/modules/voidDriftCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function VoidDriftModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<VoidDriftSnapshot>({
    score: 0,
    hp: 100,
    speed: 0,
    distance: 0,
    seconds: 0,
    status: "Warmup",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Void Drift ready");
    const mounted = mountVoidDriftCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Void Drift · ${next.status}`);
        if (!submitted && next.hp <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "void",
            gameLabel: "Void Drift",
            option1: "Lane",
            option2: "Route",
            score: next.score,
            durationSec: next.seconds,
            source: "react",
          });
        }
      },
    });
    return () => mounted.destroy();
  }, []);

  const timeText = useMemo(() => {
    const total = Math.max(0, snap.seconds);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, [snap.seconds]);

  return (
    <div style={shellStyle}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div className="h1" style={{ fontSize: 18 }}>Void Drift · React live prototype</div>
          <div className="sub">A lane-runner that gets faster forever. Swap lanes, dodge blocks, grab shards, and hold your nerve once it hits redline.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Speed</strong><span className="mono">{snap.speed}</span></div>
        <div className="pill"><strong>Distance</strong><span className="mono">{snap.distance}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or arrow keys to swap lanes. Collect shards for score and small heals, hit green flux gates to gain a temporary shield, and press Enter after a crash to restart. This is a React-owned game and launches directly from the current arcade page.
      </div>
    </div>
  );
}
