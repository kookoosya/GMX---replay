import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountAnchorRiftCore, type AnchorRiftSnapshot } from "../../features/arcade/modules/anchorRiftCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function AnchorRiftModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<AnchorRiftSnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Anchor stable",
    zone: "Near anchor",
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
    riftPulse: "Idle",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Anchor Rift ready");
    const mounted = mountAnchorRiftCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Anchor Rift · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "anchor",
            gameLabel: "Anchor Rift",
            option1: `${next.anchorState} / ${next.basin}`,
            option2: `${next.surgeWindow} / ${next.sealBand} / ${next.riftPulse}`,
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
          <div className="h1" style={{ fontSize: 18 }}>Anchor Rift · React live prototype</div>
          <div className="sub">Top-tier Pro anchor-pressure run for the React layer: slide across four anchor lanes, auto-trim fracture packets in your active lane, bank blue caches for charge, time vent windows, and ride rift-pulse spikes so the anchor stays locked long enough to survive the climb.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Anchor</strong><span className="mono">{snap.anchorState}</span></div>
        <div className="pill"><strong>Window</strong><span className="mono">{snap.surgeWindow}</span></div>
        <div className="pill"><strong>Seal</strong><span className="mono">{snap.sealBand}</span></div>
        <div className="pill"><strong>Pulse</strong><span className="mono">{snap.riftPulse}</span></div>
        <div className="pill"><strong>Basin</strong><span className="mono">{snap.basin}</span></div>
        <div className="pill"><strong>Crest</strong><span className="mono">{snap.crestState}</span></div>
        <div className="pill"><strong>Tier</strong><span className="mono">{snap.pulseTier}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift anchor lanes. Press Space to spend one charge for a full-lane vent sweep. Auto-trims clear fracture packets in your current lane, blue caches refill charge, anchor windows open and close as the run stretches, the seal band hardens mid-run, rift-pulse spikes add a sharper premium timing layer, and Enter or Space restarts after the anchor collapses. This is a React-only Top Pro module.
      </div>
    </div>
  );
}
