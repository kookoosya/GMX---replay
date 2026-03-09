import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountTowerHexCore, type TowerHexSnapshot } from "../../features/arcade/modules/towerHexCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function TowerHexModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<TowerHexSnapshot>({
    score: 0,
    core: 100,
    floors: 1,
    sectors: 1,
    charges: 3,
    seconds: 0,
    status: "Hex stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Tower Hex ready");
    const mounted = mountTowerHexCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Tower Hex · ${next.status}`);
        if (!submitted && next.core <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "tower",
            gameLabel: "Tower Hex",
            option1: "Sector",
            option2: "Floor",
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
          <div className="h1" style={{ fontSize: 18 }}>Tower Hex · React live prototype</div>
          <div className="sub">A rotating hex defense climb. Sweep sectors, pulse invading lanes, and keep the core alive while new tower floors unlock harder pressure.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Core</strong><span className="mono">{snap.core}</span></div>
        <div className="pill"><strong>Floors</strong><span className="mono">{snap.floors}</span></div>
        <div className="pill"><strong>Sector</strong><span className="mono">{snap.sectors + 1}</span></div>
        <div className="pill"><strong>Charges</strong><span className="mono">{snap.charges}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A / D rotate the active sector, Q / E skip wider angles, click a sector to snap and fire, and Space pulses the current lane. Enter or Space restarts after a wipe. This is a React-only Pro module.
      </div>
    </div>
  );
}
