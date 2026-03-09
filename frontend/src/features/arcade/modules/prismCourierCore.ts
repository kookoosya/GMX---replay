export interface PrismCourierSnapshot {
  score: number;
  integrity: number;
  boost: number;
  streak: number;
  sector: number;
  seconds: number;
  status: string;
}

export interface PrismCourierModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: PrismCourierSnapshot) => void;
}

interface Obstacle {
  x: number;
  lane: number;
  w: number;
  kind: "wall" | "drone";
}

interface Pickup {
  x: number;
  lane: number;
  r: number;
  kind: "prism" | "stabilizer";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountPrismCourierCore(host: HTMLElement, options: PrismCourierModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(12,14,32,0.98),rgba(22,10,36,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneY = [78, height * 0.5, height - 78];
  const player = {
    x: 118,
    y: laneY[1],
    lane: 1,
    targetLane: 1,
    integrity: 100,
    boost: 100,
    pulse: 0,
  };
  const keys = new Set<string>();
  const obstacles: Obstacle[] = [];
  const pickups: Pickup[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let streak = 0;
  let sector = 1;
  let obstacleCd = 1.05;
  let pickupCd = 0.9;
  let status = "Dock clear";

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      integrity: Math.max(0, Math.round(player.integrity)),
      boost: Math.max(0, Math.round(player.boost)),
      streak,
      sector,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneY.length);
    const kind = Math.random() < 0.36 + Math.min(0.18, seconds * 0.004) ? "wall" : "drone";
    obstacles.push({ x: width + 22, lane, w: kind === "wall" ? 26 : 18, kind });
  }

  function spawnPickup() {
    const lane = Math.floor(Math.random() * laneY.length);
    const kind = Math.random() < 0.22 + Math.min(0.14, seconds * 0.003) ? "stabilizer" : "prism";
    pickups.push({ x: width + 18, lane, r: kind === "stabilizer" ? 11 : 8, kind });
  }

  function setLane(delta: number) {
    const next = clamp(player.targetLane + delta, 0, laneY.length - 1);
    if (next !== player.targetLane) {
      player.targetLane = next;
      status = next > player.lane ? "Dropping lane" : "Climbing lane";
    }
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowup" || k === "w") setLane(-1);
    if (k === "arrowdown" || k === "s") setLane(1);
    if (!running && (k === "enter" || k === " ")) reset();
    keys.add(k);
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function reset() {
    obstacles.splice(0, obstacles.length);
    pickups.splice(0, pickups.length);
    running = true;
    seconds = 0;
    score = 0;
    streak = 0;
    sector = 1;
    obstacleCd = 1.05;
    pickupCd = 0.9;
    status = "Dock clear";
    player.lane = 1;
    player.targetLane = 1;
    player.y = laneY[1];
    player.integrity = 100;
    player.boost = 100;
    player.pulse = 0;
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    sector = 1 + Math.floor(seconds / 12);
    player.pulse = Math.max(0, player.pulse - dt);

    const burstActive = (keys.has(" ") || keys.has("space")) && player.boost > 8;
    if (burstActive) {
      player.boost = clamp(player.boost - dt * 32, 0, 100);
      score += dt * (9 + streak * 0.45);
      status = streak >= 4 ? "Burst chain" : "Burst running";
    } else {
      player.boost = clamp(player.boost + dt * (12 + Math.min(8, sector)), 0, 100);
      score += dt * (4 + streak * 0.18 + sector * 0.1);
    }

    const targetY = laneY[player.targetLane];
    const gap = targetY - player.y;
    if (Math.abs(gap) > 0.5) {
      player.y += gap * Math.min(1, dt * 11);
    } else {
      player.y = targetY;
      player.lane = player.targetLane;
    }

    obstacleCd -= dt;
    pickupCd -= dt;
    const speed = 178 + Math.min(150, seconds * 3.1) + sector * 6;

    if (obstacleCd <= 0) {
      obstacleCd = Math.max(0.34, 1.02 - Math.min(0.5, seconds * 0.011));
      spawnObstacle();
      if (seconds > 34 && Math.random() < 0.24) spawnObstacle();
      if (seconds > 60 && Math.random() < 0.18) spawnObstacle();
    }

    if (pickupCd <= 0) {
      pickupCd = Math.max(0.42, 0.95 - Math.min(0.36, seconds * 0.007));
      if (pickups.length < 4) spawnPickup();
    }

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = obstacles[i];
      obstacle.x -= speed * dt;
      if (obstacle.x < -40) {
        obstacles.splice(i, 1);
        continue;
      }
      const sameLane = obstacle.lane === player.lane;
      const closeX = Math.abs(obstacle.x - player.x) <= obstacle.w + (burstActive ? 8 : 14);
      if (sameLane && closeX) {
        const damage = obstacle.kind === "wall" ? 18 : 12;
        player.integrity = clamp(player.integrity - (burstActive ? Math.round(damage * 0.5) : damage), 0, 100);
        player.pulse = 0.4;
        streak = 0;
        status = burstActive ? "Glancing hit" : "Cargo hit";
        obstacles.splice(i, 1);
        snapshot();
      }
    }

    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const pickup = pickups[i];
      pickup.x -= speed * dt * 0.92;
      if (pickup.x < -28) {
        pickups.splice(i, 1);
        continue;
      }
      const sameLane = pickup.lane === player.lane;
      const closeX = Math.abs(pickup.x - player.x) <= pickup.r + 15;
      if (sameLane && closeX) {
        if (pickup.kind === "stabilizer") {
          player.integrity = clamp(player.integrity + 12, 0, 100);
          player.boost = clamp(player.boost + 24, 0, 100);
          score += 52;
          streak += 1;
          status = "Stabilizer secured";
        } else {
          score += 34 + streak * 4;
          player.boost = clamp(player.boost + 8, 0, 100);
          streak += 1;
          status = streak >= 5 ? "Prism chain" : "Prism secured";
        }
        pickups.splice(i, 1);
        snapshot();
      }
    }

    if (player.integrity <= 0) {
      player.integrity = 0;
      running = false;
      status = "Route lost";
      snapshot();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(140,120,255,0.08)");
    grad.addColorStop(0.45, "rgba(80,210,255,0.05)");
    grad.addColorStop(1, "rgba(255,120,220,0.06)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`INTEGRITY ${Math.round(player.integrity)}  BOOST ${Math.round(player.boost)}  STREAK ${streak}  SCORE ${Math.round(score)}`, 12, 18);
    ctx.fillText(`SECTOR ${sector}  ${status}`, 12, 34);

    for (let i = 0; i < laneY.length; i += 1) {
      const y = laneY[i];
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      for (let x = -40; x < width + 40; x += 64) {
        const dash = (x - (seconds * (78 + sector * 2)) % 64);
        ctx.fillStyle = "rgba(120,230,255,0.12)";
        ctx.fillRect(dash, y - 2, 28, 4);
      }
    }

    for (const obstacle of obstacles) {
      ctx.fillStyle = obstacle.kind === "wall" ? "rgba(255,110,120,0.82)" : "rgba(255,190,90,0.84)";
      ctx.fillRect(obstacle.x - obstacle.w, laneY[obstacle.lane] - 16, obstacle.w * 2, 32);
      if (obstacle.kind === "drone") {
        ctx.fillStyle = "rgba(255,245,200,0.58)";
        ctx.fillRect(obstacle.x - 5, laneY[obstacle.lane] - 4, 10, 8);
      }
    }

    for (const pickup of pickups) {
      ctx.fillStyle = pickup.kind === "stabilizer" ? "rgba(120,255,205,0.88)" : "rgba(150,180,255,0.92)";
      ctx.beginPath();
      ctx.arc(pickup.x, laneY[pickup.lane], pickup.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.pulse > 0) {
      ctx.strokeStyle = "rgba(255,180,180,0.34)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    const burstActive = (keys.has(" ") || keys.has("space")) && player.boost > 8 && running;
    ctx.fillStyle = burstActive ? "rgba(255,245,170,0.96)" : "rgba(180,240,255,0.94)";
    ctx.beginPath();
    ctx.moveTo(player.x - 16, player.y);
    ctx.lineTo(player.x + 12, player.y - 12);
    ctx.lineTo(player.x + 20, player.y);
    ctx.lineTo(player.x + 12, player.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(24,30,52,0.92)";
    ctx.fillRect(player.x - 4, player.y - 4, 12, 8);

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,.48)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const title = "Courier down";
      ctx.fillText(title, width * 0.5 - ctx.measureText(title).width * 0.5, height * 0.46);
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      const hint = "Press Enter to reroute";
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
      try {
        if (host.contains(canvas)) host.removeChild(canvas);
      } catch {}
    },
  };
}
