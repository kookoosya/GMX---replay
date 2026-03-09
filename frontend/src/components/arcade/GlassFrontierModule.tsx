import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountGlassFrontierCore, type GlassFrontierSnapshot } from "../../features/arcade/modules/glassFrontierCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function GlassFrontierModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<GlassFrontierSnapshot>({
    score: 0,
    integrity: 100,
    breaches: 0,
    cells: 0,
    mirror: 0,
    focusLane: 1,
    seconds: 0,
    status: "Glass shield stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Glass Frontier ready");
    const mounted = mountGlassFrontierCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Glass Frontier · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "glass",
            gameLabel: "Glass Frontier",
            option1: "Shield",
            option2: "Mirror",
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
          <div className="h1" style={{ fontSize: 18 }}>Glass Frontier · React live prototype</div>
          <div className="sub">A new free shield corridor run for the React layer. Shift the glass focus lane, harvest charge cells, and fire a mirror surge before the wall breaks.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Breaches</strong><span className="mono">{snap.breaches}</span></div>
        <div className="pill"><strong>Cells</strong><span className="mono">{snap.cells}</span></div>
        <div className="pill"><strong>Mirror</strong><span className="mono">{snap.mirror}%</span></div>
        <div className="pill"><strong>Focus</strong><span className="mono">L{snap.focusLane + 1}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: click a lane or press 1 / 2 / 3 to move the glass focus. Press F or Space to fire a mirror surge once the meter is full, and press Enter after the wall breaks to restart. This is a React-only Free module.
      </div>
    </div>
  );
}
