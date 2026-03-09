import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountSteelJaguarCore, type SteelJaguarSnapshot } from "../../features/arcade/modules/steelJaguarCore";
import { loadProResume, saveProResume, submitArcadeRun } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function SteelJaguarModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<SteelJaguarSnapshot>({
    distance: 0,
    score: 0,
    hp: 100,
    lane: 1,
    seconds: 0,
    status: "Run the lane",
  });
  const resume = useMemo(() => loadProResume<any>("steel"), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const startDistance = Math.max(0, Math.min(3800, Number((resume?.payload as any)?.distance || 0) || 0));
    const mounted = mountSteelJaguarCore(hostRef.current, {
      initialDistance: startDistance,
      onSnapshot: (next) => setSnap(next),
      onCheckpoint: (next) => {
        setSnap(next);
        saveProResume("steel", {
          phase: "phase19",
          status: next.status,
          option1: "Lane Run",
          option2: "Jaguar Frame",
          scoreHint: next.score,
          progressHint: `${next.distance} m ready to resume`,
          resumeText: "Steel Jaguar React module can continue from this local checkpoint",
          source: "react-steel-module",
          distance: next.distance,
          hp: next.hp,
          lane: next.lane,
          seconds: next.seconds,
        });
      },
      onFinish: (next, reason) => {
        setSnap(next);
        submitArcadeRun({
          game: "steel",
          gameLabel: "Steel Jaguar",
          option1: "Lane Run",
          option2: "Jaguar Frame",
          score: next.score,
          durationSec: next.seconds,
          source: "react",
        });
        saveProResume("steel", {
          phase: "phase19",
          status: next.status,
          option1: "Lane Run",
          option2: "Jaguar Frame",
          scoreHint: next.score,
          progressHint: reason === "clear" ? "Stage clear - restart for a fresh route" : `${next.distance} m ready to relaunch`,
          resumeText: "Steel Jaguar keeps the latest local checkpoint ready for the next launch",
          source: "react-steel-module",
          distance: reason === "clear" ? 4200 : next.distance,
          hp: next.hp,
          lane: next.lane,
          seconds: next.seconds,
        });
      },
    });
    return () => mounted.destroy();
  }, [resume]);

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
          <div className="h1" style={{ fontSize: 18 }}>Steel Jaguar · React live module</div>
          <div className="sub">Long-run premium lane runner with shared runtime state and local Pro checkpoints.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Distance</strong><span className="mono">{snap.distance} m</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Lane</strong><span className="mono">{snap.lane}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Jump with W, Up, or Space. Fire with click or F. Every 500 meters the module writes a local Pro checkpoint for the next launch.
      </div>
    </div>
  );
}
