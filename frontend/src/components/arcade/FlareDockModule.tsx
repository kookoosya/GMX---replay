import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountFlareDockCore, type FlareDockSnapshot } from "../../features/arcade/modules/flareDockCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function FlareDockModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<FlareDockSnapshot>({
    score: 0,
    hull: 100,
    charges: 2,
    stress: 0,
    seconds: 0,
    status: "Holding dock line",
    stage: "First shift",
    heatBand: "Stable",
    surgeTier: "Loaded",
    overdriveBand: "Armed",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Flare Dock ready");
    const mounted = mountFlareDockCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Flare Dock · ${next.status}`);
        if (!submitted && next.hull <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "flare",
            gameLabel: "Flare Dock",
            option1: next.stage,
            option2: `${next.heatBand} / ${next.surgeTier} / ${next.overdriveBand}`,
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
          <div className="h1" style={{ fontSize: 18 }}>Flare Dock · React live prototype</div>
          <div className="sub">Top-tier Pro dock-pressure module for the React layer: slide across dock lanes, auto-secure coolant barges, catch blue tanks to refill flare charge, and survive clearer stage bands from First shift into Night vent while overdrive bands now make the premium burn-grid identity hit harder.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Stage</strong><span className="mono">{snap.stage}</span></div>
        <div className="pill"><strong>Hull</strong><span className="mono">{snap.hull}</span></div>
        <div className="pill"><strong>Charges</strong><span className="mono">{snap.charges}</span></div>
        <div className="pill"><strong>Heat</strong><span className="mono">{snap.stress}</span></div>
        <div className="pill"><strong>Band</strong><span className="mono">{snap.heatBand}</span></div>
        <div className="pill"><strong>Tier</strong><span className="mono">{snap.surgeTier}</span></div>
        <div className="pill"><strong>Overdrive</strong><span className="mono">{snap.overdriveBand}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to slide across dock lanes. Press Space to spend one flare charge for a wide vent sweep. Catch blue coolant tanks to refill charge, let the rig secure barges for score, vent red flare walls before heat spikes, watch surge tier shift into armed, primed, or overdrive bands with your reserves, and press Enter after the dock line collapses to restart. This is a React-only Pro module.
      </div>
    </div>
  );
}
