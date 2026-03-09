import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountPulseValeCore, type PulseValeSnapshot } from "../../features/arcade/modules/pulseValeCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function PulseValeModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<PulseValeSnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Vale stable",
    zone: "Low basin",
    seam: "Near seam",
    echoBand: "Soft",
    phase: "Low tide",
    surgeLevel: "Held",
    basin: "Low basin",
    pulseTier: "Calm",
    crestState: "Sealed",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Pulse Vale ready");
    const mounted = mountPulseValeCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Pulse Vale · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "vale",
            gameLabel: "Pulse Vale",
            option1: `${next.basin} / ${next.phase}`,
            option2: `${next.echoBand} / ${next.crestState}`,
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
          <div className="h1" style={{ fontSize: 18 }}>Pulse Vale · React live prototype</div>
          <div className="sub">New Free soft-lane pulse hold for the React layer: slide across four basin lanes, auto-trim pulse packets in your active lane, bank blue caches for charge, and survive the climb from Low basin into Crest basin while the valley rhythm keeps a longer run identity than the bridge layer ever needed.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Basin</strong><span className="mono">{snap.basin}</span></div>
        <div className="pill"><strong>Phase</strong><span className="mono">{snap.phase}</span></div>
        <div className="pill"><strong>Band</strong><span className="mono">{snap.echoBand}</span></div>
        <div className="pill"><strong>Tier</strong><span className="mono">{snap.pulseTier}</span></div>
        <div className="pill"><strong>Crest</strong><span className="mono">{snap.crestState}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift basin lanes. Press Space to spend one pulse charge for a full-lane sweep. Auto-trims clear pulse packets in your current lane, blue caches refill charge, pulse rises into new basin phases over time, the crest shifts from sealed to cracked as the run stretches, and Enter or Space restarts after the vale collapses. This is a React-only Free module.
      </div>
    </div>
  );
}
