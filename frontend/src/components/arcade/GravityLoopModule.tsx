import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountGravityLoopCore, type GravityLoopSnapshot } from "../../features/arcade/modules/gravityLoopCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function GravityLoopModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<GravityLoopSnapshot>({
    score: 0,
    hp: 100,
    laps: 0,
    ring: 2,
    seconds: 0,
    status: "Orbit stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Gravity Loop ready");
    const mounted = mountGravityLoopCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Gravity Loop · ${next.status}`);
        if (!submitted && next.hp <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "gravity",
            gameLabel: "Gravity Loop",
            option1: "Ring",
            option2: "Sector",
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
          <div className="h1" style={{ fontSize: 18 }}>Gravity Loop · React live prototype</div>
          <div className="sub">A lightweight orbital survival run. Hold the ring, shift altitude, grab green gates, and survive longer as the loop accelerates.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Laps</strong><span className="mono">{snap.laps}</span></div>
        <div className="pill"><strong>Ring</strong><span className="mono">{snap.ring}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: W/S or arrows to move between rings. A/D or arrows to nudge the orbit. Press Enter after a collapse to restart. This module is fully React-owned and launches from the new React panel.
      </div>
    </div>
  );
}
