import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountNeonStrikeCore, type NeonStrikeSnapshot } from "../../features/arcade/modules/neonStrikeCore";
import { submitArcadeRun } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function NeonStrikeModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<NeonStrikeSnapshot>({
    score: 0,
    wave: 1,
    hp: 100,
    kills: 0,
    seconds: 0,
    status: "Wave 1",
  });

  useEffect(() => {
    if (!hostRef.current) return;
    let submitted = false;
    const mounted = mountNeonStrikeCore(hostRef.current, {
      onSnapshot: (next) => {
        setSnap(next);
        if (!submitted && next.hp <= 0) {
          submitted = true;
          submitArcadeRun({
            game: "neon",
            gameLabel: "Neon Strike",
            option1: "Arena",
            option2: "Loadout",
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
          <div className="h1" style={{ fontSize: 18 }}>Neon Strike · React live module</div>
          <div className="sub">Fast live score run with the current React arcade flow. The module writes into the same shared local ladders used across the approved arcade page.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Wave</strong><span className="mono">{snap.wave}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Kills</strong><span className="mono">{snap.kills}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        This is the first modular gameplay slice. Neon already writes into the shared local ladder layer and previews the cleaner arcade module path.
      </div>
    </div>
  );
}
