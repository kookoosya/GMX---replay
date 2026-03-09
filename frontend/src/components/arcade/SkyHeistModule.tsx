import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountSkyHeistCore, type SkyHeistSnapshot } from "../../features/arcade/modules/skyHeistCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function SkyHeistModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<SkyHeistSnapshot>({
    score: 0,
    hull: 100,
    boost: 2,
    alert: 0,
    seconds: 0,
    status: "Route clear",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Sky Heist ready");
    const mounted = mountSkyHeistCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Sky Heist · ${next.status}`);
        if (!submitted && next.hull <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "sky",
            gameLabel: "Sky Heist",
            option1: "Burst",
            option2: "Raid",
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
          <div className="h1" style={{ fontSize: 18 }}>Sky Heist · React live prototype</div>
          <div className="sub">A new Free airlane raid run for the React layer: bank across sky lanes, auto-fire into patrol drones, raid cargo pods for fuel, and burn nitro sweeps when patrol waves start stacking up.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Hull</strong><span className="mono">{snap.hull}</span></div>
        <div className="pill"><strong>Boost</strong><span className="mono">{snap.boost}</span></div>
        <div className="pill"><strong>Alert</strong><span className="mono">{snap.alert}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to switch air lanes. Your ship auto-fires in the active lane. Press Space for a nitro sweep that clears the nearest patrol contacts, and press Enter or Space after the route fails to restart. Blue drones chip hull if they slip through, red aces hit harder, and gold cargo pods refill boost and a little hull. This is a React-only Free module.
      </div>
    </div>
  );
}
