import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountStarSparkCore, type StarSparkSnapshot } from "../../features/arcade/modules/starSparkCore";
import { loadProResume, saveProResume, submitArcadeRun } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function StarSparkModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<StarSparkSnapshot>({
    timeLeft: 360,
    score: 0,
    combo: 1,
    lives: 3,
    seconds: 0,
    status: "Catch the rhythm",
  });
  const resume = useMemo(() => loadProResume<any>("star"), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const startTimeLeft = Math.max(45, Math.min(540, Number((resume?.payload as any)?.timeLeft || 360) || 360));
    const mounted = mountStarSparkCore(hostRef.current, {
      initialTimeLeft: startTimeLeft,
      onSnapshot: (next) => setSnap(next),
      onCheckpoint: (next) => {
        setSnap(next);
        saveProResume("star", {
          phase: "phase20",
          status: next.status,
          option1: "Rhythm Catch",
          option2: "Star Loop",
          scoreHint: next.score,
          progressHint: `${next.timeLeft}s left · combo x${next.combo}`,
          resumeText: "Star Spark React module can continue from this local checkpoint",
          source: "react-star-module",
          timeLeft: next.timeLeft,
          combo: next.combo,
          lives: next.lives,
          seconds: next.seconds,
        });
      },
      onFinish: (next, reason) => {
        setSnap(next);
        submitArcadeRun({
          game: "star",
          gameLabel: "Star Spark",
          option1: "Rhythm Catch",
          option2: "Star Loop",
          score: next.score,
          durationSec: next.seconds,
          source: "react",
        });
        saveProResume("star", {
          phase: "phase20",
          status: next.status,
          option1: "Rhythm Catch",
          option2: "Star Loop",
          scoreHint: next.score,
          progressHint: reason === "timeout" ? "Run complete · relaunch for a fresh loop" : `${next.timeLeft}s left · combo x${next.combo}`,
          resumeText: "Star Spark keeps the latest local checkpoint ready for the next launch",
          source: "react-star-module",
          timeLeft: reason === "timeout" ? 360 : next.timeLeft,
          combo: next.combo,
          lives: next.lives,
          seconds: next.seconds,
        });
      },
    });
    return () => mounted.destroy();
  }, [resume]);

  const timeText = useMemo(() => {
    const total = Math.max(0, snap.timeLeft);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, [snap.timeLeft]);

  return (
    <div style={shellStyle}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div className="h1" style={{ fontSize: 18 }}>Star Spark · React live module</div>
          <div className="sub">Long Pro rhythm run with shared score tracking and a local checkpoint every 30 seconds.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Time left</strong><span className="mono">{timeText}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Combo</strong><span className="mono">x{snap.combo}</span></div>
        <div className="pill"><strong>Lives</strong><span className="mono">{snap.lives}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Move with A/D or arrows, or drag with the mouse. Catch stars to build the chain, grab clocks for extra time, and avoid bombs if you want a long premium score run.
      </div>
    </div>
  );
}
