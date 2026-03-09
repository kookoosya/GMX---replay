import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountMetroSurgeCore, type MetroSurgeSnapshot } from "../../features/arcade/modules/metroSurgeCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function MetroSurgeModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<MetroSurgeSnapshot>({
    score: 0,
    streak: 0,
    waves: 0,
    seconds: 0,
    overloaded: 0,
    reserve: 1,
    status: "Dispatching",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Metro Surge ready");
    const mounted = mountMetroSurgeCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Metro Surge · ${next.status}`);
        if (!submitted && next.overloaded >= 4) {
          submitted = true;
          submitArcadeRun({
            game: "metro",
            gameLabel: "Metro Surge",
            option1: "Grid",
            option2: "Dispatch",
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
          <div className="h1" style={{ fontSize: 18 }}>Metro Surge · React live prototype</div>
          <div className="sub">New React-only management run. Click the hottest line to relieve overload before the network breaks across all three lanes.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Streak</strong><span className="mono">{snap.streak}</span></div>
        <div className="pill"><strong>Events</strong><span className="mono">{snap.waves}</span></div>
        <div className="pill"><strong>Broken lines</strong><span className="mono">{snap.overloaded}</span></div>
        <div className="pill"><strong>Reserve</strong><span className="mono">{snap.reserve}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: mouse only. Click a lane to dispatch relief. Broken lines can now be patched if you save 2 reserve, which stretches runs and adds a stronger recovery loop on the React side.
      </div>
    </div>
  );
}
