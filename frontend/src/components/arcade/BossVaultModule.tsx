import React, { useEffect, useMemo, useRef, useState } from "react";
import { mountBossVaultCore, type BossVaultSnapshot } from "../../features/arcade/modules/bossVaultCore";
import { loadProResume, saveProResume, submitArcadeRun } from "../../features/arcade/runtimeAdapter";

const shellStyle = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.02)",
};

export default function BossVaultModule() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<BossVaultSnapshot>({
    room: 1,
    roomsTotal: 21,
    bossHp: 220,
    bossMaxHp: 220,
    playerHp: 100,
    score: 0,
    seconds: 0,
    status: "Break the vault",
  });
  const resume = useMemo(() => loadProResume<any>("boss"), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const startRoom = Math.max(1, Math.min(21, Number((resume?.payload as any)?.room || 1) || 1));
    const startScore = Math.max(0, Number((resume?.payload as any)?.scoreHint || 0) || 0);
    const mounted = mountBossVaultCore(hostRef.current, {
      initialRoom: startRoom,
      initialScore: startScore,
      onSnapshot: (next) => setSnap(next),
      onCheckpoint: (next) => {
        setSnap(next);
        saveProResume("boss", {
          phase: "phase21",
          status: next.status,
          option1: "Vault Route",
          option2: "Boss Ladder",
          scoreHint: next.score,
          progressHint: `Room ${next.room}/${next.roomsTotal}`,
          resumeText: "Boss Vault React module can continue from this local room checkpoint",
          source: "react-boss-module",
          room: next.room,
          roomsTotal: next.roomsTotal,
          playerHp: next.playerHp,
          seconds: next.seconds,
        });
      },
      onFinish: (next, reason) => {
        setSnap(next);
        submitArcadeRun({
          game: "boss",
          gameLabel: "Boss Vault",
          option1: "Vault Route",
          option2: "Boss Ladder",
          score: next.score,
          durationSec: next.seconds,
          source: "react",
        });
        saveProResume("boss", {
          phase: "phase21",
          status: next.status,
          option1: "Vault Route",
          option2: "Boss Ladder",
          scoreHint: next.score,
          progressHint: reason === "clear" ? "Vault cleared · relaunch for a fresh gauntlet" : `Room ${next.room}/${next.roomsTotal}`,
          resumeText: "Boss Vault keeps the latest local gauntlet checkpoint ready for the next launch",
          source: "react-boss-module",
          room: reason === "clear" ? 1 : next.room,
          roomsTotal: next.roomsTotal,
          playerHp: next.playerHp,
          seconds: next.seconds,
        });
      },
    });
    return () => mounted.destroy();
  }, [resume]);

  const hpPct = useMemo(() => {
    if (!snap.bossMaxHp) return 0;
    return Math.max(0, Math.min(100, Math.round((snap.bossHp / snap.bossMaxHp) * 100)));
  }, [snap.bossHp, snap.bossMaxHp]);

  return (
    <div style={shellStyle}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div className="h1" style={{ fontSize: 18 }}>Boss Vault · React live module</div>
          <div className="sub">Boss gauntlet module for longer Pro runs. It keeps room checkpoints and a stronger local resume path between launches.</div>
        </div>
        <div className="pill">English-only</div>
      </div>

      <div className="row" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div className="pill"><strong>Room</strong><span className="mono">{snap.room}/{snap.roomsTotal}</span></div>
        <div className="pill"><strong>Boss HP</strong><span className="mono">{hpPct}%</span></div>
        <div className="pill"><strong>Player HP</strong><span className="mono">{snap.playerHp}</span></div>
        <div className="pill"><strong>Score</strong><span className="mono">{snap.score}</span></div>
        <div className="pill"><strong>Status</strong><span className="mono">{snap.status}</span></div>
      </div>

      <div ref={hostRef} />

      <div className="hint" style={{ marginTop: 10 }}>
        Move with A/D or arrows, track the boss lane with the mouse, and fire with click or Space. Every cleared room seeds a stronger local resume point for long Pro runs.
      </div>
    </div>
  );
}
