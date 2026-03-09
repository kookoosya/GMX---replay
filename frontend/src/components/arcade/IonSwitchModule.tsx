import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountIonSwitchCore, type IonSwitchSnapshot } from "../../features/arcade/modules/ionSwitchCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function IonSwitchModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<IonSwitchSnapshot>({
    score: 0,
    stability: 100,
    flips: 0,
    overloads: 0,
    charge: 12,
    seconds: 0,
    status: "Grid stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Ion Switch ready");
    const mounted = mountIonSwitchCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Ion Switch · ${next.status}`);
        if (!submitted && (next.stability <= 0 || next.overloads >= 8)) {
          submitted = true;
          submitArcadeRun({
            game: "ion",
            gameLabel: "Ion Switch",
            option1: "Reroute",
            option2: "Purge",
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
          <div className="h1" style={{ fontSize: 18 }}>Ion Switch · React live prototype</div>
          <div className="sub">A new Pro grid reroute module for the React layer. Flip unstable nodes, keep stability up, and fire a purge sweep before the grid collapses.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Stability</strong><span className="mono">{snap.stability}</span></div>
        <div className="pill"><strong>Flips</strong><span className="mono">{snap.flips}</span></div>
        <div className="pill"><strong>Overloads</strong><span className="mono">{snap.overloads}</span></div>
        <div className="pill"><strong>Purge</strong><span className="mono">{snap.charge}%</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: click a node or press 1 / 2 / 3 / 4 to reroute flux. Press F or Space to fire a purge when the meter is full, and press Enter after collapse to restart. This is a React-only Pro module.
      </div>
    </div>
  );
}
