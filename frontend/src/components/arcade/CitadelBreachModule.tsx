import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountCitadelBreachCore, type CitadelBreachSnapshot } from "../../features/arcade/modules/citadelBreachCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function CitadelBreachModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<CitadelBreachSnapshot>({
    score: 0,
    wall: 100,
    waves: 0,
    breaches: 0,
    seconds: 0,
    charges: 3,
    status: "Wall steady",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Citadel Breach ready");
    const mounted = mountCitadelBreachCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Citadel Breach · ${next.status}`);
        if (!submitted && next.wall <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "citadel",
            gameLabel: "Citadel Breach",
            option1: "Lane",
            option2: "Volley",
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
          <div className="h1" style={{ fontSize: 18 }}>Citadel Breach · React live prototype</div>
          <div className="sub">A direct lane-defense siege. Spend battery charges, stop breach waves, and hold the wall against rising elite pressure.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Wall</strong><span className="mono">{snap.wall}</span></div>
        <div className="pill"><strong>Waves</strong><span className="mono">{snap.waves}</span></div>
        <div className="pill"><strong>Breaches</strong><span className="mono">{snap.breaches}</span></div>
        <div className="pill"><strong>Charges</strong><span className="mono">{snap.charges}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: mouse click a lane, or press 1 / 2 / 3 to fire. Press Enter after the wall falls to restart. This is a React-only Pro module and launches directly from the current arcade page.
      </div>
    </div>
  );
}
