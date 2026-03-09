export interface RiftHarvestSnapshot {
  score: number;
  hp: number;
  level: number;
  shards: number;
  seconds: number;
  status: string;
  surge: number;
}

export interface RiftHarvestModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: RiftHarvestSnapshot) => void;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  r: number;
  elite?: boolean;
}

interface Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

interface Shard {
  x: number;
  y: number;
  life: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function len(x: number, y: number) {
  return Math.sqrt(x * x + y * y) || 1;
}

export function mountRiftHarvestCore(host: HTMLElement, options: RiftHarvestModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 320;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(6,10,20,0.98),rgba(12,22,18,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const keys = new Set<string>();
  const enemies: Enemy[] = [];
  const bolts: Bolt[] = [];
  const shardsOnGround: Shard[] = [];
  const player = { x: width * 0.5, y: height * 0.5, r: 11, hp: 100, fireCd: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let spawnCd = 0.6;
  let seconds = 0;
  let score = 0;
  let shards = 0;
  let level = 1;
  let status = "Stabilizing";
  let surgeTimer = 0;
  let nextSurgeScore = 120;

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hp: Math.max(0, Math.round(player.hp)),
      level,
      shards,
      seconds: Math.max(0, Math.round(seconds)),
      status,
      surge: Math.max(0, Math.ceil(surgeTimer)),
    });
  }

  function addEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = -22;
      y = Math.random() * height;
    } else if (edge === 1) {
      x = width + 22;
      y = Math.random() * height;
    } else if (edge === 2) {
      x = Math.random() * width;
      y = -22;
    } else {
      x = Math.random() * width;
      y = height + 22;
    }
    const elite = seconds > 45 && Math.random() < 0.22;
    const hp = (elite ? 34 : 14) + level * (elite ? 4 : 2);
    const speed = (elite ? 44 : 56) + level * 2 + Math.random() * 16;
    const dx = player.x - x;
    const dy = player.y - y;
    const mag = len(dx, dy);
    enemies.push({ x, y, vx: (dx / mag) * speed, vy: (dy / mag) * speed, hp, r: elite ? 15 : 11, elite });
  }

  function autoFire() {
    if (player.fireCd > 0 || !running || !enemies.length) return;
    let target = enemies[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const enemy of enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        target = enemy;
      }
    }
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const mag = len(dx, dy);
    const surgeLive = surgeTimer > 0;
    const spread = surgeLive ? 0.34 : level >= 4 ? 0.18 : 0;
    const shots = surgeLive ? 3 : level >= 7 ? 2 : 1;
    for (let i = 0; i < shots; i += 1) {
      const angle = Math.atan2(dy, dx) + (i === 0 ? -spread : spread);
      bolts.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 420,
        vy: Math.sin(angle) * 420,
        life: 1.1,
        r: 4,
      });
    }
    player.fireCd = surgeTimer > 0 ? Math.max(0.06, 0.18 - level * 0.008) : Math.max(0.1, 0.28 - level * 0.01);
  }

  function onKeyDown(ev: KeyboardEvent) {
    keys.add(ev.key.toLowerCase());
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    score += dt * (surgeTimer > 0 ? 3.4 : 2);
    player.fireCd = Math.max(0, player.fireCd - dt);
    if (surgeTimer > 0) surgeTimer = Math.max(0, surgeTimer - dt);
    spawnCd -= dt;

    const nextLevel = 1 + Math.floor(seconds / 18) + Math.floor(shards / 10);
    if (nextLevel !== level) {
      level = nextLevel;
      status = `Draft ${level}`;
      snapshot();
    }

    let mx = 0;
    let my = 0;
    if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright")) mx += 1;
    if (keys.has("w") || keys.has("arrowup")) my -= 1;
    if (keys.has("s") || keys.has("arrowdown")) my += 1;
    const moveMag = len(mx, my);
    const moveSpeed = 190 + Math.min(70, level * 4) + (surgeTimer > 0 ? 36 : 0);
    player.x = clamp(player.x + (mx / moveMag) * moveSpeed * dt, player.r, width - player.r);
    player.y = clamp(player.y + (my / moveMag) * moveSpeed * dt, player.r, height - player.r);

    if (score >= nextSurgeScore && surgeTimer <= 0) {
      surgeTimer = 5;
      nextSurgeScore += 140 + level * 12;
      status = "Rift surge";
      snapshot();
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.18, 0.58 - level * 0.02);
      addEnemy();
      if (level >= 4 && Math.random() < 0.35) addEnemy();
    }

    autoFire();

    for (let i = bolts.length - 1; i >= 0; i -= 1) {
      const bolt = bolts[i];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;
      if (bolt.life <= 0 || bolt.x < -8 || bolt.y < -8 || bolt.x > width + 8 || bolt.y > height + 8) bolts.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const mag = len(dx, dy);
      const chase = enemy.elite ? 42 + level * 2 : 56 + level * 2;
      enemy.vx = (dx / mag) * chase;
      enemy.vy = (dy / mag) * chase;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      if (mag < enemy.r + player.r) {
        player.hp -= enemy.elite ? 26 * dt : 15 * dt;
        status = enemy.elite ? "Elite pressure" : "Kiting";
        if (player.hp <= 0) {
          player.hp = 0;
          running = false;
          status = "Field collapsed";
          snapshot();
        }
      }

      for (let j = bolts.length - 1; j >= 0; j -= 1) {
        const bolt = bolts[j];
        const dxh = bolt.x - enemy.x;
        const dyh = bolt.y - enemy.y;
        if (dxh * dxh + dyh * dyh <= (bolt.r + enemy.r) * (bolt.r + enemy.r)) {
          bolts.splice(j, 1);
          enemy.hp -= surgeTimer > 0 ? (level >= 6 ? 26 : 20) : (level >= 6 ? 18 : 14);
          if (enemy.hp <= 0) {
            enemies.splice(i, 1);
            score += (enemy.elite ? 26 : 12) + (surgeTimer > 0 ? 4 : 0);
            if (Math.random() < 0.6) shardsOnGround.push({ x: enemy.x, y: enemy.y, life: 8 });
            if (score > 0 && Math.round(score) % 80 < 12) status = "Harvesting";
          }
          break;
        }
      }
    }

    for (let i = shardsOnGround.length - 1; i >= 0; i -= 1) {
      const shard = shardsOnGround[i];
      shard.life -= dt;
      if (shard.life <= 0) {
        shardsOnGround.splice(i, 1);
        continue;
      }
      const dx = shard.x - player.x;
      const dy = shard.y - player.y;
      if (dx * dx + dy * dy < 20 * 20) {
        shards += 1;
        score += 8;
        player.hp = clamp(player.hp + 4, 0, 100);
        shardsOnGround.splice(i, 1);
        if (shards % 6 === 0) status = "Draft gained";
        snapshot();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(20,50,34,0.15)";
    for (let x = 0; x < width; x += 28) ctx.fillRect(x, 0, 1, height);
    for (let y = 0; y < height; y += 28) ctx.fillRect(0, y, width, 1);

    for (const shard of shardsOnGround) {
      ctx.fillStyle = "rgba(120,255,180,0.9)";
      ctx.beginPath();
      ctx.arc(shard.x, shard.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bolt of bolts) {
      ctx.fillStyle = "rgba(140,240,255,0.95)";
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, bolt.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const enemy of enemies) {
      ctx.fillStyle = enemy.elite ? "rgba(255,135,85,0.95)" : "rgba(255,95,150,0.9)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(110,245,200,0.95)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`HP ${Math.round(player.hp)}  SCORE ${Math.round(score)}  SHARDS ${shards}  LEVEL ${level}`, 12, 18);
    if (!running) ctx.fillText("Run ended · refresh module to restart", 12, 36);
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    if (running) snapshot();
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
