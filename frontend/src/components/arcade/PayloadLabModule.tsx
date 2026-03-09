import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountPayloadLabCore, type PayloadLabSnapshot } from "../../features/arcade/modules/payloadLabCore";
import { loadProResume, saveProResume, submitArcadeRun } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function PayloadLabModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<PayloadLabSnapshot>({
    progress: 0,
    score: 0,
    hp: 100,
    combo: 1,
    seconds: 0,
    status: "Push the cart",
  });
  const resume = useMemo(() => loadProResume<any>("payload"), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const startProgress = Math.max(0, Math.min(280, Number((resume?.payload as any)?.progress || 0) || 0));
    const mounted = mountPayloadLabCore(hostRef.current, {
      initialProgress: startProgress,
      onSnapshot: (next) => setSnap(next),
      onCheckpoint: (next) => {
        setSnap(next);
        saveProResume("payload", {
          phase: "phase18",
          status: next.status,
          option1: "Escort",
          option2: "Route A",
          scoreHint: next.score,
          progressHint: `Escort ${next.progress}% ready to resume`,
          resumeText: "Payload Lab React module can continue from this local checkpoint",
          source: "react-payload-module",
          progress: next.progress,
          hp: next.hp,
          combo: next.combo,
          seconds: next.seconds,
        });
      },
      onFinish: (next, reason) => {
        setSnap(next);
        submitArcadeRun({
          game: "payload",
          gameLabel: "Payload Lab",
          option1: "Escort",
          option2: "Route A",
          score: next.score,
          durationSec: next.seconds,
          source: "react",
        });
        if (reason === "win") {
          saveProResume("payload", {
            phase: "phase18",
            status: next.status,
            option1: "Escort",
            option2: "Route A",
            scoreHint: next.score,
            progressHint: "Delivery complete - relaunch for a fresh route or restart here",
            resumeText: "The next launch can still seed from the latest local state until cloud saves arrive",
            source: "react-payload-module",
            progress: 300,
            hp: next.hp,
            combo: next.combo,
            seconds: next.seconds,
          });
        }
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
          <div className="h1" style={{ fontSize: 18 }}>Payload Lab · React live module</div>
          <div className="sub">Escort-focused React module with shared runtime state, shared local ladders, and local Pro resume data.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
        <div className="pill"><strong>Escort</strong><span className="mono">{snap.progress}%</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>HP</strong><span className="mono">{snap.hp}</span></div>
        <div className="pill"><strong>Combo</strong><span className="mono">x{snap.combo}</span></div>
        <div className="pill"><strong>Run</strong><span className="mono">{timeText}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Stay near the cart to push faster. Every 20% the module writes a local Pro checkpoint for the next launch.
      </div>
    </div>
  );
}
