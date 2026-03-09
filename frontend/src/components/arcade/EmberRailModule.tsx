import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountEmberRailCore, type EmberRailSnapshot } from "../../features/arcade/modules/emberRailCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function EmberRailModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<EmberRailSnapshot>({
    score: 0,
    cargo: 100,
    sectors: 1,
    shells: 4,
    leaks: 0,
    seconds: 0,
    status: "Rail stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Ember Rail ready");
    const mounted = mountEmberRailCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Ember Rail · ${next.status}`);
        if (!submitted && next.cargo <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "ember",
            gameLabel: "Ember Rail",
            option1: "Track",
            option2: "Sector",
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
          <div className="h1" style={{ fontSize: 18 }}>Ember Rail · React live prototype</div>
          <div className="sub">A convoy defense sprint. Arm a track, stop raiders before they hit the train, and patch cargo integrity as sectors get hotter.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Cargo</strong><span className="mono">{snap.cargo}</span></div>
        <div className="pill"><strong>Sectors</strong><span className="mono">{snap.sectors}</span></div>
        <div className="pill"><strong>Shells</strong><span className="mono">{snap.shells}</span></div>
        <div className="pill"><strong>Leaks</strong><span className="mono">{snap.leaks}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: click a track or press 1 / 2 / 3 to fire. W / S changes the armed track, Space fires the current lane, and Enter restarts after a collapse. This is a React-only free module.
      </div>
    </div>
  );
}
