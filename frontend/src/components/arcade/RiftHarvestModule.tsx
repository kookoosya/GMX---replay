import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountRiftHarvestCore, type RiftHarvestSnapshot } from "../../features/arcade/modules/riftHarvestCore";
import { submitArcadeRun, writeRuntimeStatus } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function RiftHarvestModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<RiftHarvestSnapshot>({
    score: 0,
    hp: 100,
    level: 1,
    shards: 0,
    seconds: 0,
    status: "Stabilizing",
    surge: 0,
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    writeRuntimeStatus("Rift Harvest ready");
    const mounted = mountRiftHarvestCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        writeRuntimeStatus(`Rift Harvest · ${next.status}`);
        if (!submitted && next.hp <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "rift",
            gameLabel: "Rift Harvest",
            option1: "Sector",
            option2: "Draft",
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
          <div className="h1" style={{ fontSize: 18 }}>Rift Harvest · React live module</div>
          <div className="sub">New React-only survivor arena. Move, kite, auto-fire bursts, collect shards, and ride short Rift Surge windows that turn the free showcase run into a real power spike.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Level</strong><span className="mono">{snap.level}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Shards</strong><span className="mono">{snap.shards}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
        <div className="pill"><strong>Surge</strong><span className="mono">{snap.surge > 0 ? `${snap.surge}s` : "Idle"}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Controls: WASD or arrows to move. The cannon fires automatically at the nearest threat. Build score and the run triggers short Rift Surge windows that boost fire rate, spread, and movement. This is a React-only live module.
      </div>
    </div>
  );
}
