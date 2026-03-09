export interface VoidDriftSnapshot {
  score: number;
  hp: number;
  speed: number;
  distance: number;
  seconds: number;
  status: string;
}

export interface VoidDriftModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: VoidDriftSnapshot) => void;
}

interface Obstacle {
  lane: number;
  y: number;
  size: number;
  kind: "block" | "shard" | "gate";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountVoidDriftCore(host: HTMLElement, options: VoidDriftModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(8,8,18,0.98),rgba(12,18,26,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const keys = new Set<string>();
  let running = true;
  let raf = 0;
  let last = performance.now();

  // Lanes are -1, 0, +1.
  const lanes = [-1, 0, 1];
  let laneIndex = 1;
  let laneTarget = 1;
  let laneBlend = 1;

  const player = {
    x: width * 0.5,
    y: height * 0.78,
    r: 12,
    hp: 100,
    invuln: 0,
  };

  const obstacles: Obstacle[] = [];
  let shield = 0;
  let spawnCd = 0.55;
  let seconds = 0;
  let distance = 0;
  let score = 0;
  let speed = 260;
  let status = "Warmup";

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hp: Math.max(0, Math.round(player.hp)),
      speed: Math.max(0, Math.round(speed)),
      distance: Math.max(0, Math.round(distance)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    keys.add(k);
    if (!running && (k === "enter" || k === " ")) reset();
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function spawn() {
    const lane = Math.floor(Math.random() * 3) - 1;
    const roll = Math.random();
    const kind: Obstacle["kind"] = roll < 0.14 ? "gate" : roll < 0.34 ? "shard" : "block";
    obstacles.push({ lane, y: -24, size: kind === "block" ? 22 : kind === "gate" ? 16 : 14, kind });
    if (seconds > 30 && Math.random() < 0.28) {
      const lane2 = clamp(lane + (Math.random() < 0.5 ? -1 : 1), -1, 1);
      obstacles.push({ lane: lane2, y: -64, size: 20, kind: "block" });
    }
  }

  function reset() {
    obstacles.splice(0, obstacles.length);
    running = true;
    seconds = 0;
    distance = 0;
    score = 0;
    speed = 260;
    shield = 0;
    spawnCd = 0.55;
    status = "Warmup";
    player.hp = 100;
    player.invuln = 0;
    laneIndex = 1;
    laneTarget = 1;
    laneBlend = 1;
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;

    seconds += dt;
    speed = 260 + seconds * 3.2;
    distance += speed * dt * 0.08;
    score += dt * 6 + speed * dt * 0.02;
    spawnCd -= dt;
    player.invuln = Math.max(0, player.invuln - dt);
    shield = Math.max(0, shield - dt);

    // lane input
    const left = keys.has("a") || keys.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright");
    if (left && !right) laneTarget = clamp(laneTarget - 1, 0, 2);
    if (right && !left) laneTarget = clamp(laneTarget + 1, 0, 2);
    // smooth move
    laneBlend += (laneTarget - laneBlend) * Math.min(1, dt * 10);
    laneIndex = Math.round(laneBlend);
    const laneValue = lanes[laneIndex];
    player.x = width * 0.5 + laneValue * 120;

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.16, 0.55 - seconds * 0.004);
      spawn();
    }

    // Status
    if (shield > 0.15) status = "Shielded";
    else if (seconds < 10) status = "Warmup";
    else if (seconds < 30) status = "Flow";
    else if (seconds < 60) status = "Overdrive";
    else status = "Redline";

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      const o = obstacles[i];
      o.y += speed * dt;
      if (o.y > height + 40) {
        obstacles.splice(i, 1);
        continue;
      }
      // collision
      const ox = width * 0.5 + o.lane * 120;
      const dx = ox - player.x;
      const dy = o.y - player.y;
      const rr = (o.size + player.r) * (o.size + player.r);
      if (dx * dx + dy * dy <= rr) {
        if (o.kind === "shard") {
          score += 28;
          player.hp = clamp(player.hp + 6, 0, 100);
          obstacles.splice(i, 1);
          continue;
        }
        if (o.kind === "gate") {
          shield = Math.min(1.8, shield + 1.3);
          score += 40;
          status = "Flux gate";
          obstacles.splice(i, 1);
          continue;
        }
        if (player.invuln <= 0) {
          if (shield > 0.1) {
            shield = 0;
            player.invuln = 0.4;
            status = "Shield burned";
            obstacles.splice(i, 1);
            continue;
          }
          player.hp -= 22;
          player.invuln = 0.65;
          score = Math.max(0, score - 18);
          if (player.hp <= 0) {
            player.hp = 0;
            running = false;
            status = "Crashed";
            snapshot();
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // lane guides
    ctx.globalAlpha = 0.9;
    for (const lane of lanes) {
      const x = width * 0.5 + lane * 120;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 2;
      ctx.moveTo(x, 18);
      ctx.lineTo(x, height - 18);
      ctx.stroke();
    }

    // obstacles
    for (const o of obstacles) {
      const x = width * 0.5 + o.lane * 120;
      if (o.kind === "shard") {
        ctx.fillStyle = "rgba(160,240,255,.92)";
        ctx.beginPath();
        ctx.arc(x, o.y, o.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (o.kind === "gate") {
        ctx.strokeStyle = "rgba(120,255,190,.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, o.y, o.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(255,120,180,.22)";
        ctx.strokeStyle = "rgba(255,180,220,.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - o.size, o.y - o.size, o.size * 2, o.size * 2, 8);
        ctx.fill();
        ctx.stroke();
      }
    }

    // player
    if (shield > 0.1) {
      ctx.strokeStyle = "rgba(120,255,200,.35)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = player.invuln > 0 ? 0.55 : 0.95;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = "rgba(255,255,255,.70)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(`HP ${Math.round(player.hp)}`, 14, 18);
    ctx.fillText(`Score ${Math.round(score)}`, 14, 34);
    ctx.fillText(`Speed ${Math.round(speed)}`, 14, 50);
    ctx.fillText(status, width - 14 - ctx.measureText(status).width, 18);

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const title = "Run ended";
      ctx.fillText(title, width * 0.5 - ctx.measureText(title).width * 0.5, height * 0.46);
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      const hint = "Press Enter to restart";
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
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      try {
        host.removeChild(canvas);
      } catch {}
    },
  };
}
