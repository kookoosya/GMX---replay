import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountHarborNullCore, type HarborNullSnapshot } from "../../features/arcade/modules/harborNullCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function HarborNullModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<HarborNullSnapshot>({
    score: 0,
    hull: 100,
    charge: 3,
    pressure: 0,
    seconds: 0,
    status: "Harbor steady",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Harbor Null ready");
    const mounted = mountHarborNullCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Harbor Null · ${next.status}`);
        if (!submitted && next.hull <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "harbor",
            gameLabel: "Harbor Null",
            option1: "Pulse",
            option2: "Dock",
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
          <div className="h1" style={{ fontSize: 18 }}>Harbor Null · React live prototype</div>
          <div className="sub">A new Pro dock-defense run built for longer sessions: pivot between harbor lanes, fire pulse shots, crack breaker skiffs, recover battery caches, and hold the pier together while storm pressure keeps climbing.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Hull</strong><span className="mono">{snap.hull}</span></div>
        <div className="pill"><strong>Charge</strong><span className="mono">{snap.charge}</span></div>
        <div className="pill"><strong>Pressure</strong><span className="mono">{snap.pressure}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to switch docks. Press Space to fire a pulse shot down the active lane, and press Enter or Space after the harbor falls to restart. Blue skiffs hit the pier if they slip through, red breakers hit harder, and gold caches restore pulse charge and a little hull. This is a React-only Pro module.
      </div>
    </div>
  );
}
