import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountShuntGardenCore, type ShuntGardenSnapshot } from "../../features/arcade/modules/shuntGardenCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function ShuntGardenModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<ShuntGardenSnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Garden seeded",
    zone: "Seed lattice",
    seam: "Near seam",
    echoBand: "Soft",
    phase: "Low pull",
    surgeLevel: "Quiet",
    basin: "Low basin",
    pulseTier: "Calm",
    crestState: "Sealed",
    anchorState: "Locked",
    surgeWindow: "Closed",
    sealBand: "Raw",
    canopyState: "Seeded",
    routeBloom: "Narrow",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Shunt Garden ready");
    const mounted = mountShuntGardenCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Shunt Garden · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "shunt",
            gameLabel: "Shunt Garden",
            option1: `${next.canopyState} / ${next.anchorState}`,
            option2: `${next.routeBloom} / ${next.sealBand}`,
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
          <div className="h1" style={{ fontSize: 18 }}>Shunt Garden · React live prototype</div>
          <div className="sub">New Free signal-garden run for the React layer: shift across four lattice lanes, auto-trim fracture packets in your active lane, bank blue caches for charge, and stretch the canopy long enough for a full bloom route while the bridge keeps losing page-owned surface.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Canopy</strong><span className="mono">{snap.canopyState}</span></div>
        <div className="pill"><strong>Bloom</strong><span className="mono">{snap.routeBloom}</span></div>
        <div className="pill"><strong>Anchor</strong><span className="mono">{snap.anchorState}</span></div>
        <div className="pill"><strong>Seal</strong><span className="mono">{snap.sealBand}</span></div>
        <div className="pill"><strong>Window</strong><span className="mono">{snap.surgeWindow}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift lattice lanes. Press Space to spend one charge for a full-lane shunt sweep. Auto-trims clear fracture packets in your current lane, blue caches refill charge, canopy state and route bloom keep changing as the run stretches, and Enter or Space restarts after collapse. This is a React-only Free module.
      </div>
    </div>
  );
}
