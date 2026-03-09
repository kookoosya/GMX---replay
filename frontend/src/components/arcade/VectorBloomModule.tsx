import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountVectorBloomCore, type VectorBloomSnapshot } from "../../features/arcade/modules/vectorBloomCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function VectorBloomModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<VectorBloomSnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Bloom stable",
    zone: "Seed mesh",
    sector: "Seed mesh",
    canopy: 100,
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Vector Bloom ready");
    const mounted = mountVectorBloomCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Vector Bloom · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "bloom",
            gameLabel: "Vector Bloom",
            option1: next.sector,
            option2: "Bloom",
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
          <div className="h1" style={{ fontSize: 18 }}>Vector Bloom · React live prototype</div>
          <div className="sub">New Free bloom-defense variant for the React layer: slide across four growth lanes, auto-trim seed vectors, catch blue dew caches to refill bloom charge, and burst the canopy before split gusts and blight rushes collapse the mesh.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Sector</strong><span className="mono">{snap.sector}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Canopy</strong><span className="mono">{snap.canopy}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Sync</strong><span className="mono">{snap.sync}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift bloom lanes. Press Space to spend one bloom charge for a full-lane burst. Auto-trims clear seed vectors and blight spikes in your current lane, blue dew caches refill charge, split gusts raise canopy pressure, blight rushes speed up spawns, and Enter or Space restarts after the canopy breaks. This is a React-only Free module.
      </div>
    </div>
  );
}
