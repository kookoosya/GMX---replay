import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountPrismCourierCore, type PrismCourierSnapshot } from "../../features/arcade/modules/prismCourierCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function PrismCourierModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<PrismCourierSnapshot>({
    score: 0,
    integrity: 100,
    boost: 100,
    streak: 0,
    sector: 1,
    seconds: 0,
    status: "Dock clear",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Prism Courier ready");
    const mounted = mountPrismCourierCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Prism Courier · ${next.status}`);
        if (!submitted && next.integrity <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "prism",
            gameLabel: "Prism Courier",
            option1: "Courier",
            option2: "Burst",
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
          <div className="h1" style={{ fontSize: 18 }}>Prism Courier · React live prototype</div>
          <div className="sub">A free route-runner built around clean lane swaps, burst windows, stabilizer pickups, and longer chain scoring inside the current arcade flow.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Integrity</strong><span className="mono">{snap.integrity}</span></div>
        <div className="pill"><strong>Boost</strong><span className="mono">{snap.boost}</span></div>
        <div className="pill"><strong>Streak</strong><span className="mono">{snap.streak}</span></div>
        <div className="pill"><strong>Sector</strong><span className="mono">{snap.sector}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: W/S or arrows to swap lanes. Hold Space to burn boost for a faster scoring line, take blue prisms to stack a chain, and grab green stabilizers to patch cargo integrity. Press Enter after a route loss to restart. This is a React-only free module.
      </div>
    </div>
  );
}
