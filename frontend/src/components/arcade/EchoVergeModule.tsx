import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountEchoVergeCore, type EchoVergeSnapshot } from "../../features/arcade/modules/echoVergeCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function EchoVergeModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<EchoVergeSnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Verge stable",
    zone: "Near seam",
    seam: "Near seam",
    echoBand: "Soft",
    phase: "Low pull",
    surgeLevel: "Quiet",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Echo Verge ready");
    const mounted = mountEchoVergeCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Echo Verge · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "echo",
            gameLabel: "Echo Verge",
            option1: `${next.seam} / ${next.phase}`,
            option2: `${next.echoBand} / ${next.surgeLevel}`,
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
          <div className="h1" style={{ fontSize: 18 }}>Echo Verge · React live prototype</div>
          <div className="sub">New Free mirror-lane hold for the React layer: slide across four verge seams, auto-trim echo packets in your active lane, bank blue echo caches for charge, and survive the jump from Near seam into Fracture verge while new phase + surge labels give the run a stronger mid-session identity.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Seam</strong><span className="mono">{snap.seam}</span></div>
        <div className="pill"><strong>Band</strong><span className="mono">{snap.echoBand}</span></div>
        <div className="pill"><strong>Phase</strong><span className="mono">{snap.phase}</span></div>
        <div className="pill"><strong>Surge</strong><span className="mono">{snap.surgeLevel}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Sync</strong><span className="mono">{snap.sync}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift verge seams. Press Space to spend one echo charge for a full-lane sweep. Auto-trims clear echo packets in your current seam, blue caches refill charge, mirror pulses raise sync, new phase + surge labels sharpen the mid-run feel, and Enter or Space restarts after the verge collapses. This is a React-only Free module.
      </div>
    </div>
  );
}
