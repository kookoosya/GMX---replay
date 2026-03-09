import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountDriftRelayCore, type DriftRelaySnapshot } from "../../features/arcade/modules/driftRelayCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function DriftRelayModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<DriftRelaySnapshot>({
    score: 0,
    integrity: 100,
    boosts: 2,
    sync: 0,
    seconds: 0,
    status: "Relay stable",
    zone: "Outer relay",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Drift Relay ready");
    const mounted = mountDriftRelayCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Drift Relay · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "drift",
            gameLabel: "Drift Relay",
            option1: next.zone,
            option2: "Relay",
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
          <div className="h1" style={{ fontSize: 18 }}>Drift Relay · React live prototype</div>
          <div className="sub">New Free relay-escort run for the React layer: shift across four signal lanes, auto-link relay packets, catch blue cache drops to refill burst charge, and burn relay bursts when crosswind pulses and storm corridors start stacking jammers.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Zone</strong><span className="mono">{snap.zone}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Boosts</strong><span className="mono">{snap.boosts}</span></div>
        <div className="pill"><strong>Sync</strong><span className="mono">{snap.sync}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to shift relay lanes. Press Space to spend one boost for a full-lane relay burst. Auto-pings clear packets and jammers in your current lane, blue caches refill boosts, crosswind pulses raise sync pressure, storm corridors speed up spawns, and Enter or Space restarts after the relay breaks. This is a React-only Free module.
      </div>
    </div>
  );
}
