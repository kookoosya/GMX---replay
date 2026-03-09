import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountSignalCartelCore, type SignalCartelSnapshot } from "../../features/arcade/modules/signalCartelCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function SignalCartelModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<SignalCartelSnapshot>({
    score: 0,
    integrity: 100,
    charge: 2,
    chain: 0,
    wave: 1,
    seconds: 0,
    syndicate: 0,
    tier: "Quiet grid",
    status: "Grid online",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Signal Cartel ready");
    const mounted = mountSignalCartelCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Signal Cartel · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "signal",
            gameLabel: "Signal Cartel",
            option1: next.tier,
            option2: next.syndicate > 0 ? "Hot syndicate" : "Cold syndicate",
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
          <div className="h1" style={{ fontSize: 18 }}>Signal Cartel · Top Pro flagship</div>
          <div className="sub">A flagship Pro route-defense run built around lane routing, jammer charges, blackout surges, cartel windows, and a fully React-owned launch flow.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.charge}</span></div>
        <div className="pill"><strong>Chain</strong><span className="mono">{snap.chain}</span></div>
        <div className="pill"><strong>Wave</strong><span className="mono">{snap.wave}</span></div>
        <div className="pill"><strong>Tier</strong><span className="mono">{snap.tier}</span></div>
        <div className="pill"><strong>Syndicate</strong><span className="mono">{snap.syndicate > 0 ? `${snap.syndicate}s` : "cold"}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: W/S or arrows to route between lanes. Press Space to spend a jammer charge and clear the current lane, catch gold charges to refill bursts, and catch green patches to restore relay integrity. Cartel windows spike pressure and scoring for a few seconds at a time, so the best runs push during the hot window instead of playing flat. Press Enter after the grid falls to restart. This is a React-only Pro module.
      </div>
    </div>
  );
}
