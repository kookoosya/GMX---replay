export interface DriftRelaySnapshot {
  score: number;
  integrity: number;
  boosts: number;
  sync: number;
  seconds: number;
  status: string;
  zone: string;
}

export interface DriftRelayModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: DriftRelaySnapshot) => void;
}

type RelayKind = "packet" | "jammer" | "cache";

interface RelayDrop {
  lane: number;
  x: number;
  y: number;
  hp: number;
  kind: RelayKind;
  speed: number;
  r: number;
  pulse: number;
}

interface Ping {
  lane: number;
  x: number;
  y: number;
  speed: number;
  ttl: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function zoneForSeconds(seconds: number) {
  if (seconds >= 44) return "Storm lock";
  if (seconds >= 22) return "Crosswind lane";
  return "Outer relay";
}

export function mountDriftRelayCore(host: HTMLElement, options: DriftRelayModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 300;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,0.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(18,30,58,0.98),rgba(7,12,22,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const laneX = [84, 194, 304, 414];
  const drops: RelayDrop[] = [];
  const pings: Ping[] = [];
  const runner = { lane: 1, targetLane: 1, integrity: 100, boosts: 2, flash: 0, sweep: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let sync = 0;
  let drift = 0;
  let spawnCd = 0.84;
  let fireCd = 0.18;
  let boostRegen = 0;
  let crosswindCd = 14;
  let stormCd = 24;
  let stormTime = 0;
  let lastZone = zoneForSeconds(0);
  let status = "Relay stable";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      integrity: Math.max(0, Math.round(runner.integrity)),
      boosts: runner.boosts,
      sync: Math.max(0, Math.round(sync)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
      zone: lastZone,
    });
  }

  function spawnDrop(forcedKind?: RelayKind) {
    const lane = Math.floor(Math.random() * laneX.length);
    const roll = Math.random();
    const kind: RelayKind = forcedKind || (roll < 0.2 ? "cache" : roll < 0.68 ? "packet" : "jammer");
    const fastStorm = stormTime > 0 ? 24 : 0;
    drops.push({
      lane,
      x: laneX[lane],
      y: -26,
      hp: kind === "jammer" ? 2 : 1,
      kind,
      speed: 124 + Math.min(152, seconds * 2.2) + fastStorm + (kind === "jammer" ? 20 : 0) + Math.random() * 18,
      r: kind === "jammer" ? 13 : kind === "cache" ? 9 : 10,
      pulse: 0,
    });
  }

  function setLane(next: number) {
    const lane = clamp(next, 0, laneX.length - 1);
    if (lane !== runner.targetLane) {
      runner.targetLane = lane;
      status = lane > runner.lane ? "Routing right" : "Routing left";
      emit();
    }
  }

  function reset() {
    drops.splice(0, drops.length);
    pings.splice(0, pings.length);
    runner.lane = 1;
    runner.targetLane = 1;
    runner.integrity = 100;
    runner.boosts = 2;
    runner.flash = 0;
    runner.sweep = 0;
    running = true;
    seconds = 0;
    score = 0;
    sync = 0;
    drift = 0;
    spawnCd = 0.84;
    fireCd = 0.18;
    boostRegen = 0;
    crosswindCd = 14;
    stormCd = 24;
    stormTime = 0;
    lastZone = zoneForSeconds(0);
    status = "Relay stable";
    emit();
  }

  function firePing(forceSweep = false) {
    const lanes = forceSweep ? [0, 1, 2, 3] : [runner.lane];
    for (const lane of lanes) {
      pings.push({
        lane,
        x: laneX[lane],
        y: height - 72,
        speed: 338 + (forceSweep ? 32 : 0),
        ttl: 1.2,
      });
    }
  }

  function relayBurst() {
    if (!running) {
      reset();
      return;
    }
    if (runner.boosts <= 0) {
      status = "Boost empty";
      emit();
      return;
    }
    runner.boosts -= 1;
    runner.sweep = 0.32;
    runner.flash = 0.45;
    score += 10;
    status = "Relay burst";
    for (let lane = 0; lane < laneX.length; lane += 1) {
      const target = drops.find((drop) => drop.lane === lane && drop.y > 42);
      if (!target) continue;
      if (target.kind === "cache") {
        runner.boosts = Math.min(4, runner.boosts + 1);
        runner.integrity = Math.min(100, runner.integrity + 4);
        score += 16;
      } else if (target.kind === "jammer") {
        score += 22;
        sync = clamp(sync - 7, 0, 999);
      } else {
        score += 14;
      }
      drops.splice(drops.indexOf(target), 1);
    }
    firePing(true);
    emit();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowleft" || k === "a") setLane(runner.targetLane - 1);
    if (k === "arrowright" || k === "d") setLane(runner.targetLane + 1);
    if (k === " " || k === "space") relayBurst();
    if (!running && k === "enter") reset();
  }

  function update(dt: number) {
    if (!running) return;

    seconds += dt;
    const zone = zoneForSeconds(seconds);
    if (zone !== lastZone) {
      lastZone = zone;
      sync = clamp(sync + 6, 0, 999);
      score += 18;
      status = `${zone} engaged`;
      emit();
    }

    sync = clamp(sync + dt * (3.5 + Math.min(6.8, seconds * 0.08) + (stormTime > 0 ? 1.4 : 0)), 0, 999);
    drift += dt;
    spawnCd -= dt;
    fireCd -= dt;
    crosswindCd -= dt;
    stormCd -= dt;
    stormTime = Math.max(0, stormTime - dt);
    boostRegen += dt * (0.11 + Math.min(0.12, seconds * 0.0032));
    runner.flash = Math.max(0, runner.flash - dt);
    runner.sweep = Math.max(0, runner.sweep - dt);

    if (runner.lane !== runner.targetLane) runner.lane = runner.targetLane;

    if (boostRegen >= 1) {
      const gained = Math.floor(boostRegen);
      boostRegen -= gained;
      const prev = runner.boosts;
      runner.boosts = Math.min(4, runner.boosts + gained);
      if (runner.boosts > prev) {
        status = "Boost recovered";
        emit();
      }
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.2, 0.84 - Math.min(0.5, seconds * 0.0105) - (stormTime > 0 ? 0.1 : 0));
      spawnDrop();
      if (seconds > 18 && Math.random() < (stormTime > 0 ? 0.34 : 0.18)) spawnDrop();
    }

    if (crosswindCd <= 0) {
      crosswindCd = Math.max(8.2, 14 - Math.min(4.4, seconds * 0.04));
      sync = clamp(sync + 10, 0, 999);
      spawnDrop("jammer");
      if (seconds > 26) spawnDrop("packet");
      status = "Crosswind pulse";
      emit();
    }

    if (stormCd <= 0) {
      stormCd = Math.max(15, 24 - Math.min(6, seconds * 0.05));
      stormTime = 4.8;
      spawnDrop("jammer");
      spawnDrop("jammer");
      if (seconds > 28) spawnDrop("cache");
      status = "Storm corridor";
      emit();
    }

    score += dt * (2.2 + sync * 0.02 + Math.max(0, runner.integrity - 20) * 0.01 + (stormTime > 0 ? 0.55 : 0));

    if (fireCd <= 0) {
      fireCd = Math.max(0.11, 0.31 - Math.min(0.14, seconds * 0.0024));
      firePing(false);
    }

    for (let i = pings.length - 1; i >= 0; i -= 1) {
      const ping = pings[i];
      ping.y -= ping.speed * dt;
      ping.ttl -= dt;
      if (ping.y < -24 || ping.ttl <= 0) pings.splice(i, 1);
    }

    for (let i = drops.length - 1; i >= 0; i -= 1) {
      const drop = drops[i];
      drop.pulse = Math.max(0, drop.pulse - dt);
      drop.y += drop.speed * dt;

      for (let j = pings.length - 1; j >= 0; j -= 1) {
        const ping = pings[j];
        if (ping.lane !== drop.lane) continue;
        if (Math.abs(ping.y - drop.y) > drop.r + 10) continue;
        pings.splice(j, 1);
        drop.hp -= 1;
        drop.pulse = 0.22;
        if (drop.hp <= 0) {
          if (drop.kind === "cache") {
            runner.boosts = Math.min(4, runner.boosts + 1);
            runner.integrity = Math.min(100, runner.integrity + 3);
            score += 15;
            status = "Cache recovered";
          } else if (drop.kind === "jammer") {
            score += 24;
            sync = clamp(sync - 6, 0, 999);
            status = "Jammer cut";
          } else {
            score += 12;
            status = "Packet linked";
          }
          drops.splice(i, 1);
          emit();
        }
        break;
      }

      if (!drops[i]) continue;

      if (drop.y >= height - 76) {
        if (drop.lane === runner.lane) {
          if (drop.kind === "cache") {
            runner.boosts = Math.min(4, runner.boosts + 1);
            runner.integrity = Math.min(100, runner.integrity + 2);
            score += 14;
            status = "Cache snagged";
          } else if (drop.kind === "packet") {
            score += 18;
            sync = clamp(sync - 4, 0, 999);
            status = "Relay aligned";
          } else {
            runner.integrity = clamp(runner.integrity - 12, 0, 100);
            sync = clamp(sync + 12, 0, 999);
            runner.flash = 0.3;
            status = "Relay clipped";
          }
          emit();
        } else if (drop.kind === "packet") {
          sync = clamp(sync + 3, 0, 999);
        }
        drops.splice(i, 1);
      }
    }

    if (Math.floor(seconds / 16) > Math.floor((seconds - dt) / 16)) {
      sync = clamp(sync + 8, 0, 999);
      status = "Signal drift";
      emit();
    }

    if (sync >= 100) {
      runner.integrity = clamp(runner.integrity - dt * (7.2 + (stormTime > 0 ? 2.4 : 0)), 0, 100);
      status = stormTime > 0 ? "Storm tearing relay" : "Relay strain";
    }

    if (runner.integrity <= 0) {
      runner.integrity = 0;
      running = false;
      status = "Relay lost";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(18,36,74,1)");
    gradient.addColorStop(1, "rgba(7,10,20,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = stormTime > 0 ? "rgba(160,210,255,0.08)" : "rgba(255,255,255,0.04)";
    for (let i = 0; i < 8; i += 1) {
      const y = ((drift * (stormTime > 0 ? 124 : 96)) + i * 42) % (height + 42) - 22;
      ctx.fillRect(0, y, width, 12);
    }

    for (let i = 0; i < laneX.length; i += 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneX[i], 0);
      ctx.lineTo(laneX[i], height);
      ctx.stroke();
    }

    for (const drop of drops) {
      if (drop.kind === "packet") ctx.fillStyle = "rgba(255,214,120,0.94)";
      else if (drop.kind === "cache") ctx.fillStyle = "rgba(120,230,255,0.94)";
      else ctx.fillStyle = "rgba(255,110,146,0.96)";
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.r + drop.pulse * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(160,230,255,0.8)";
    ctx.lineWidth = 4;
    for (const ping of pings) {
      ctx.beginPath();
      ctx.moveTo(ping.x, ping.y + 12);
      ctx.lineTo(ping.x, ping.y - 12);
      ctx.stroke();
    }

    const rx = laneX[runner.lane];
    ctx.fillStyle = runner.flash > 0 ? "rgba(255,240,160,0.96)" : "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(rx, height - 88);
    ctx.lineTo(rx - 18, height - 54);
    ctx.lineTo(rx + 18, height - 54);
    ctx.closePath();
    ctx.fill();

    if (runner.sweep > 0) {
      ctx.fillStyle = "rgba(140,220,255,0.18)";
      ctx.fillRect(20, height - 118, width - 40, 44);
    }

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(16, 16, 220, 8);
    ctx.fillStyle = "rgba(120,230,255,0.9)";
    ctx.fillRect(16, 16, 220 * (runner.integrity / 100), 8);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(16, 32, 220, 6);
    ctx.fillStyle = stormTime > 0 ? "rgba(255,130,160,0.9)" : "rgba(255,214,120,0.88)";
    ctx.fillRect(16, 32, 220 * clamp(sync / 100, 0, 1), 6);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Integrity ${Math.round(runner.integrity)}`, 246, 24);
    ctx.fillText(`Sync ${Math.round(sync)}`, 246, 38);
    ctx.fillText(`Boosts ${runner.boosts}`, 344, 24);
    ctx.fillText(lastZone, 344, 38);

    if (!running) {
      ctx.fillStyle = "rgba(10,14,24,0.72)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Relay lost", width / 2 - 54, height / 2 - 6);
      ctx.font = "14px sans-serif";
      ctx.fillText("Press Enter or Space to restart", width / 2 - 100, height / 2 + 22);
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKeyDown);
  emit();
  draw();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      host.innerHTML = "";
    },
  };
}
