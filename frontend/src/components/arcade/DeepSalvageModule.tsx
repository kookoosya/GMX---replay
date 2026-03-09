import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountDeepSalvageCore, type DeepSalvageSnapshot } from "../../features/arcade/modules/deepSalvageCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function DeepSalvageModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<DeepSalvageSnapshot>({
    score: 0,
    hp: 100,
    oxygen: 100,
    depth: 0,
    salvage: 0,
    shield: 0,
    seconds: 0,
    abyss: 0,
    pressureBand: "Surface band",
    status: "Launch bay",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Deep Salvage ready");
    const mounted = mountDeepSalvageCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Deep Salvage · ${next.status}`);
        if (!submitted && next.hp <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "deep",
            gameLabel: "Deep Salvage",
            option1: next.pressureBand,
            option2: next.abyss > 0 ? "Hot abyss" : "Cold abyss",
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
          <div className="h1" style={{ fontSize: 18 }}>Deep Salvage · Top Pro pressure dive</div>
          <div className="sub">A heavier flagship Pro extraction dive. Go deeper for stronger score flow, survive abyss-current windows, bank beacon surges into extra shield, and surface before oxygen debt and hull stress collapse the hull.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Oxygen</strong><span className="mono">{snap.oxygen}</span></div>
        <div className="pill"><strong>Depth</strong><span className="mono">{snap.depth}m</span></div>
        <div className="pill"><strong>Salvage</strong><span className="mono">{snap.salvage}</span></div>
        <div className="pill"><strong>Shield</strong><span className="mono">{snap.shield}</span></div>
        <div className="pill"><strong>Pressure</strong><span className="mono">{snap.pressureBand}</span></div>
        <div className="pill"><strong>Abyss</strong><span className="mono">{snap.abyss}s</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: WASD or arrows to move. Stay near the surface to recover oxygen, dive for scrap and gold cores, ride deep enough to trigger abyss-current score windows, grab blue beacons to bank up to three shield charges and cool the abyss timer, and press Enter after a hull loss to restart. This is a React-only Top Pro module.
      </div>
    </div>
  );
}
