import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountThermalDropCore, type ThermalDropSnapshot } from "../../features/arcade/modules/thermalDropCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function ThermalDropModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<ThermalDropSnapshot>({
    score: 0,
    hull: 100,
    heat: 22,
    coolant: 2,
    depth: 0,
    seconds: 0,
    status: "Drop stable",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Thermal Drop ready");
    const mounted = mountThermalDropCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Thermal Drop · ${next.status}`);
        if (!submitted && next.hull <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "thermal",
            gameLabel: "Thermal Drop",
            option1: "Coolant",
            option2: "Vent",
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
          <div className="h1" style={{ fontSize: 18 }}>Thermal Drop · React live prototype</div>
          <div className="sub">A new Free descent run built for longer survival: slide across heat lanes, catch cool pockets, bank coolant vents, and hold the hull together as the drop keeps getting hotter.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Hull</strong><span className="mono">{snap.hull}</span></div>
        <div className="pill"><strong>Heat</strong><span className="mono">{snap.heat}</span></div>
        <div className="pill"><strong>Coolant</strong><span className="mono">{snap.coolant}</span></div>
        <div className="pill"><strong>Depth</strong><span className="mono">{snap.depth}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: A/D or left/right to slide lanes. Press Space to vent one coolant charge and cut heat fast. Catch blue pockets to cool down, catch gold caches to refill coolant, avoid red flares, and press Enter after the dive fails to restart. This is a React-only Free module.
      </div>
    </div>
  );
}
