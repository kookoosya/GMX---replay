import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountWardenPulseCore, type WardenPulseSnapshot } from "../../features/arcade/modules/wardenPulseCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function WardenPulseModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<WardenPulseSnapshot>({
    score: 0,
    integrity: 100,
    relays: 0,
    pulses: 3,
    overclock: 0,
    seconds: 0,
    status: "Relay stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Warden Pulse ready");
    const mounted = mountWardenPulseCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Warden Pulse · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "warden",
            gameLabel: "Warden Pulse",
            option1: "Arc",
            option2: "Pulse",
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
          <div className="h1" style={{ fontSize: 18 }}>Warden Pulse · React live prototype</div>
          <div className="sub">A new Pro relay sentry climb for the React layer. Hold four pulse arcs, bank overclock, and stop breaker packets before they chew through the relay wall.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Relays</strong><span className="mono">{snap.relays}</span></div>
        <div className="pill"><strong>Pulses</strong><span className="mono">{snap.pulses}</span></div>
        <div className="pill"><strong>Overclock</strong><span className="mono">{snap.overclock}%</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: click a relay arc or press 1 / 2 / 3 / 4 to fire. Press F or Space to discharge overclock across every lane once the meter is full, and press Enter after the relay falls to restart. This is a React-only Pro module.
      </div>
    </div>
  );
}
