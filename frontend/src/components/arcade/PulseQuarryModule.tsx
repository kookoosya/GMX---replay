import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountPulseQuarryCore, type PulseQuarrySnapshot } from "../../features/arcade/modules/pulseQuarryCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function PulseQuarryModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<PulseQuarrySnapshot>({
    score: 0,
    hull: 100,
    charges: 2,
    stress: 0,
    seconds: 0,
    status: "Cutting clean",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Pulse Quarry ready");
    const mounted = mountPulseQuarryCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Pulse Quarry · ${next.status}`);
        if (!submitted && next.hull <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "quarry",
            gameLabel: "Pulse Quarry",
            option1: "Pulse",
            option2: "Mine",
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
          <div className="h1" style={{ fontSize: 18 }}>Pulse Quarry · React live prototype</div>
          <div className="sub">A new Free pulse-mining run for the React layer: shift between quarry lanes, auto-cut ore veins, catch blue cells for charge recovery, and burn pulse sweeps when quake surges start stacking fault veins.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Hull</strong><span className="mono">{snap.hull}</span></div>
        <div className="pill"><strong>Charges</strong><span className="mono">{snap.charges}</span></div>
        <div className="pill"><strong>Stress</strong><span className="mono">{snap.stress}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift quarry lanes. Press Space to spend one pulse charge for a wide cut sweep. Catch blue cells to refill charges, let the drill touch ore for score, cut red fault veins before stress spikes, and press Enter after the rig collapses to restart. This is a React-only Free module.
      </div>
    </div>
  );
}
