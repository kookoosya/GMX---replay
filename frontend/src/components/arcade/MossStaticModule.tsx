import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountMossStaticCore, type MossStaticSnapshot } from "../../features/arcade/modules/mossStaticCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function MossStaticModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<MossStaticSnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Moss seeded",
    zone: "Moss fringe",
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
    mossState: "Fresh",
    staticField: "Thin",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Moss Static ready");
    const mounted = mountMossStaticCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Moss Static · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "moss",
            gameLabel: "Moss Static",
            option1: `${next.mossState} / ${next.canopyState}`,
            option2: `${next.staticField} / ${next.routeBloom}`,
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
          <div className="h1" style={{ fontSize: 18 }}>Moss Static · React live prototype</div>
          <div className="sub">New Free canopy-static run for the React layer: shift across four hedge lanes, auto-trim drifting static knots in your active lane, bank blue caches for charge, and hold the routed moss canopy together long enough to clear the field cleanly.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Moss</strong><span className="mono">{snap.mossState}</span></div>
        <div className="pill"><strong>Static</strong><span className="mono">{snap.staticField}</span></div>
        <div className="pill"><strong>Canopy</strong><span className="mono">{snap.canopyState}</span></div>
        <div className="pill"><strong>Bloom</strong><span className="mono">{snap.routeBloom}</span></div>
        <div className="pill"><strong>Anchor</strong><span className="mono">{snap.anchorState}</span></div>
        <div className="pill"><strong>Seal</strong><span className="mono">{snap.sealBand}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift hedge lanes. Press Space to spend one charge for a full-lane trim sweep. Auto-trims clear static knots in your current lane, blue caches refill charge, moss state and static field keep changing as the run stretches, and Enter or Space restarts after collapse. This is a React-only Free module.
      </div>
    </div>
  );
}
