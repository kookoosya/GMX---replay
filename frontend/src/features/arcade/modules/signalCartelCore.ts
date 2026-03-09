export interface SignalCartelSnapshot {
  score: number;
  integrity: number;
  charge: number;
  chain: number;
  wave: number;
  seconds: number;
  syndicate: number;
  tier: string;
  status: string;
}

export interface SignalCartelModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: SignalCartelSnapshot) => void;
}

interface RelayEnemy {
  x: number;
  lane: number;
  hp: number;
  speed: number;
  kind: "relay" | "jammer";
  pulse: number;
}

interface CachePickup {
  x: number;
  lane: number;
  r: number;
  kind: "charge" | "patch";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountSignalCartelCore(host: HTMLElement, options: SignalCartelModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 300;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(12,12,28,0.98),rgba(18,22,42,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneY = [64, 118, 172, 226];
  const keys = new Set<string>();
  const enemies: RelayEnemy[] = [];
  const pickups: CachePickup[] = [];
  const tower = { lane: 1, targetLane: 1, integrity: 100, charge: 2, chain: 0, pulse: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let wave = 1;
  let shotCd = 0.12;
  let enemyCd = 0.9;
  let pickupCd = 3.4;
  let blackout = 0;
  let syndicate = 0;
  let status = "Grid online";

  function resolveTier() {
    if (!running && tower.integrity <= 0) return "Grid down";
    if (syndicate > 0) return "Cartel rush";
    if (blackout > 0) return "Blackout war";
    if (seconds >= 42) return "Relay fracture";
    if (seconds >= 18) return "Cartel pressure";
    return "Quiet grid";
  }

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      integrity: Math.max(0, Math.round(tower.integrity)),
      charge: tower.charge,
      chain: tower.chain,
      wave,
      seconds: Math.max(0, Math.round(seconds)),
      syndicate: Math.max(0, Math.round(syndicate)),
      tier: resolveTier(),
      status,
    });
  }

  function spawnEnemy() {
    const lane = Math.floor(Math.random() * laneY.length);
    const jammer = seconds > 20 && Math.random() < 0.2 + Math.min(0.14, seconds * 0.002) + (syndicate > 0 ? 0.16 : 0);
    enemies.push({
      x: width + 18,
      lane,
      hp: jammer ? 3 : 2,
      speed: (jammer ? 70 : 92) + Math.min(110, seconds * 1.8) + Math.random() * 18,
      kind: jammer ? "jammer" : "relay",
      pulse: 0,
    });
  }

  function spawnPickup() {
    const lane = Math.floor(Math.random() * laneY.length);
    const kind = Math.random() < 0.4 ? "patch" : "charge";
    pickups.push({ x: width + 24, lane, r: kind === "patch" ? 10 : 8, kind });
  }

  function setLane(delta: number) {
    const next = clamp(tower.targetLane + delta, 0, laneY.length - 1);
    if (next !== tower.targetLane) {
      tower.targetLane = next;
      status = next > tower.lane ? "Routing down" : "Routing up";
    }
  }

  function reset() {
    enemies.splice(0, enemies.length);
    pickups.splice(0, pickups.length);
    running = true;
    seconds = 0;
    score = 0;
    wave = 1;
    shotCd = 0.12;
    enemyCd = 0.9;
    pickupCd = 3.4;
    blackout = 0;
    syndicate = 0;
    status = "Grid online";
    tower.lane = 1;
    tower.targetLane = 1;
    tower.integrity = 100;
    tower.charge = 2;
    tower.chain = 0;
    tower.pulse = 0;
    snapshot();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowup" || k === "w") setLane(-1);
    if (k === "arrowdown" || k === "s") setLane(1);
    if (k === " " || k === "space") {
      if (running && tower.charge > 0) {
        const kills: RelayEnemy[] = [];
        for (const enemy of enemies) {
          if (enemy.lane === tower.lane && enemy.x < width - 40) {
            kills.push(enemy);
          }
        }
        if (kills.length) {
          tower.charge -= 1;
          tower.pulse = 0.45;
          tower.chain += kills.length;
          score += 26 * kills.length + tower.chain * 2;
          status = kills.length > 1 ? "Jammer sweep" : "Jammer burst";
          for (const kill of kills) {
            const idx = enemies.indexOf(kill);
            if (idx >= 0) enemies.splice(idx, 1);
          }
          snapshot();
        }
      } else if (!running) {
        reset();
      }
    }
    if (!running && k === "enter") reset();
    keys.add(k);
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    wave = 1 + Math.floor(seconds / 14);
    tower.pulse = Math.max(0, tower.pulse - dt);
    blackout = Math.max(0, blackout - dt);
    syndicate = Math.max(0, syndicate - dt);
    shotCd -= dt;
    enemyCd -= dt;
    pickupCd -= dt;

    if (tower.lane !== tower.targetLane) tower.lane = tower.targetLane;

    if (Math.floor(seconds / 18) > Math.floor((seconds - dt) / 18)) {
      blackout = 5.5;
      status = "Blackout surge";
    }

    if (Math.floor(seconds / 24) > Math.floor((seconds - dt) / 24)) {
      syndicate = 7;
      tower.charge = Math.min(3, tower.charge + 1);
      status = "Cartel spike";
      snapshot();
    }

    if (enemyCd <= 0) {
      enemyCd = Math.max(0.22, 0.92 - Math.min(0.5, seconds * 0.012) - (blackout > 0 ? 0.16 : 0) - (syndicate > 0 ? 0.18 : 0));
      spawnEnemy();
      if (blackout > 0 && Math.random() < 0.35) spawnEnemy();
      if (syndicate > 0 && Math.random() < 0.42) spawnEnemy();
      if (seconds > 55 && Math.random() < 0.16) spawnEnemy();
    }

    if (pickupCd <= 0) {
      pickupCd = Math.max(1.6, 3.5 - Math.min(1.4, seconds * 0.016));
      if (pickups.length < 3) spawnPickup();
    }

    if (shotCd <= 0) {
      const target = enemies.find((enemy) => enemy.lane === tower.lane && enemy.x < width - 32);
      shotCd = Math.max(0.07, 0.16 - Math.min(0.05, tower.chain * 0.004));
      if (target) {
        target.hp -= 1;
        target.pulse = 0.16;
        if (target.hp <= 0) {
          const bonus = target.kind === "jammer" ? 30 : 18;
          score += bonus + tower.chain * 2 + (syndicate > 0 ? 16 : 0);
          tower.chain = Math.min(12, tower.chain + 1);
          status = tower.chain >= 5 ? "Signal chain" : "Relay cut";
          const idx = enemies.indexOf(target);
          if (idx >= 0) enemies.splice(idx, 1);
        }
      } else {
        tower.chain = Math.max(0, tower.chain - 1);
      }
    }

    score += dt * (1.6 + wave * 0.22 + tower.chain * 0.08 + (syndicate > 0 ? 0.8 : 0));

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.pulse = Math.max(0, enemy.pulse - dt);
      enemy.x -= enemy.speed * (blackout > 0 ? 1.18 : 1) * (syndicate > 0 ? 1.14 : 1) * dt;
      if (enemy.x <= 86) {
        const damage = enemy.kind === "jammer" ? 18 : 10;
        tower.integrity = clamp(tower.integrity - damage, 0, 100);
        tower.chain = 0;
        status = enemy.kind === "jammer" ? "Jammer breach" : "Relay breach";
        enemies.splice(i, 1);
        snapshot();
        continue;
      }
    }

    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const pickup = pickups[i];
      pickup.x -= (108 + wave * 4) * dt;
      if (pickup.x < 70) {
        if (pickup.lane === tower.lane) {
          if (pickup.kind === "patch") {
            tower.integrity = clamp(tower.integrity + 14, 0, 100);
            score += 20;
            status = "Relay patch";
          } else {
            tower.charge = Math.min(3, tower.charge + 1);
            score += 16;
            status = "Charge cached";
          }
          snapshot();
        }
        pickups.splice(i, 1);
      }
    }

    if (tower.integrity <= 0) {
      tower.integrity = 0;
      running = false;
      status = "Grid lost";
      snapshot();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, blackout > 0 ? "rgba(140,70,220,0.16)" : "rgba(60,110,220,0.08)");
    grad.addColorStop(1, "rgba(10,14,26,0.08)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`INT ${Math.round(tower.integrity)}  CHARGE ${tower.charge}  CHAIN ${tower.chain}  WAVE ${wave}  SCORE ${Math.round(score)}`, 12, 18);
    if (syndicate > 0) {
      ctx.fillStyle = "rgba(255,170,120,0.82)";
      ctx.fillText(`SYNDICATE ${Math.ceil(syndicate)}s`, width - 126, 18);
      ctx.fillStyle = "rgba(255,255,255,0.72)";
    }
    ctx.fillText(status, 12, 34);

    for (const y of laneY) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(74, y);
      ctx.lineTo(width - 18, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(120,220,255,0.12)";
    ctx.fillRect(52, 44, 26, height - 88);
    ctx.fillStyle = tower.pulse > 0 ? "rgba(255,220,150,0.9)" : "rgba(150,235,255,0.92)";
    ctx.fillRect(62, laneY[tower.lane] - 14, 18, 28);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(80, laneY[tower.lane] - 3, 14, 6);

    for (const pickup of pickups) {
      ctx.fillStyle = pickup.kind === "patch" ? "rgba(120,255,180,0.9)" : "rgba(255,220,120,0.92)";
      ctx.beginPath();
      ctx.arc(pickup.x, laneY[pickup.lane], pickup.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const enemy of enemies) {
      ctx.fillStyle = enemy.kind === "jammer" ? "rgba(255,120,160,0.88)" : "rgba(255,165,90,0.84)";
      ctx.fillRect(enemy.x - 10, laneY[enemy.lane] - 10, 20, 20);
      if (enemy.pulse > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x - 13, laneY[enemy.lane] - 13, 26, 26);
      }
    }

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,.46)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const title = "Signal lost";
      ctx.fillText(title, width * 0.5 - ctx.measureText(title).width * 0.5, height * 0.46);
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      const hint = "Press Enter to re-route";
      ctx.fillText(hint, width * 0.5 - ctx.measureText(hint).width * 0.5, height * 0.56);
    }
  }

  function loop(now: number) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    draw();
    snapshot();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  snapshot();
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (canvas.parentElement === host) host.removeChild(canvas);
    },
  };
}
