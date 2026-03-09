export interface BossVaultSnapshot {
  room: number;
  roomsTotal: number;
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  score: number;
  seconds: number;
  status: string;
}

export interface BossVaultModuleOptions {
  width?: number;
  height?: number;
  initialRoom?: number;
  initialScore?: number;
  onSnapshot?: (snapshot: BossVaultSnapshot) => void;
  onCheckpoint?: (snapshot: BossVaultSnapshot) => void;
  onFinish?: (snapshot: BossVaultSnapshot, reason: "clear" | "down") => void;
}

interface Shot {
  x: number;
  y: number;
  vy: number;
}

interface Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountBossVaultCore(host: HTMLElement, options: BossVaultModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 320;
  const roomsTotal = 21;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(32,14,46,0.98),rgba(10,9,20,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const keys = new Set<string>();
  const shots: Shot[] = [];
  const bolts: Bolt[] = [];
  const player = { x: width * 0.5, y: height - 36, w: 24, h: 16, speed: 340, hp: 100 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let room = clamp(Math.round(Number(options.initialRoom) || 1), 1, roomsTotal);
  let score = Math.max(0, Math.round(Number(options.initialScore) || 0));
  let status = room > 1 ? `Resumed at room ${room}` : "Break the vault";
  let fireCd = 0;
  let bossX = width * 0.5;
  let bossDir = 1;
  let bossCd = 0.85;
  let bossMaxHp = 220 + (room - 1) * 32;
  let bossHp = bossMaxHp;
  let checkpointRoom = room;

  function snapshot(): BossVaultSnapshot {
    return {
      room,
      roomsTotal,
      bossHp: Math.max(0, Math.round(bossHp)),
      bossMaxHp: Math.max(1, Math.round(bossMaxHp)),
      playerHp: Math.max(0, Math.round(player.hp)),
      score: Math.max(0, Math.round(score)),
      seconds: Math.max(0, Math.round(elapsed)),
      status,
    };
  }

  function emitSnapshot() {
    options.onSnapshot?.(snapshot());
  }

  function emitCheckpoint() {
    options.onCheckpoint?.(snapshot());
  }

  function spawnBoss(roomNo: number) {
    bossX = width * 0.5;
    bossDir = roomNo % 2 === 0 ? -1 : 1;
    bossCd = Math.max(0.28, 0.9 - roomNo * 0.02);
    bossMaxHp = 220 + (roomNo - 1) * 32;
    bossHp = bossMaxHp;
    status = roomNo === roomsTotal ? "Final vault chamber" : `Room ${roomNo} breach`;
  }

  function fire() {
    if (fireCd > 0 || !running) return;
    fireCd = 0.14;
    shots.push({ x: player.x, y: player.y - 12, vy: -460 });
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    keys.add(key);
    if (key === " " || key === "spacebar") {
      ev.preventDefault();
      fire();
    }
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function onPointer(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * width;
    player.x = clamp(x, 22, width - 22);
  }

  function onClick() {
    fire();
  }

  function finish(reason: "clear" | "down", nextStatus: string) {
    if (!running) return;
    running = false;
    status = nextStatus;
    const snap = snapshot();
    options.onSnapshot?.(snap);
    options.onFinish?.(snap, reason);
  }

  function nextRoom() {
    score += 240 + room * 60;
    room += 1;
    if (room > roomsTotal) {
      finish("clear", "Vault cleared");
      return;
    }
    spawnBoss(room);
    if (room > checkpointRoom) {
      checkpointRoom = room;
      emitCheckpoint();
    }
  }

  function update(dt: number) {
    if (!running) return;
    elapsed += dt;
    fireCd = Math.max(0, fireCd - dt);

    const dir = (keys.has("a") || keys.has("arrowleft") ? -1 : 0) + (keys.has("d") || keys.has("arrowright") ? 1 : 0);
    player.x = clamp(player.x + dir * player.speed * dt, 22, width - 22);

    bossX += bossDir * (60 + room * 3.8) * dt;
    if (bossX < 54) {
      bossX = 54;
      bossDir = 1;
    }
    if (bossX > width - 54) {
      bossX = width - 54;
      bossDir = -1;
    }

    bossCd -= dt;
    if (bossCd <= 0) {
      bossCd = Math.max(0.24, 0.9 - room * 0.02);
      const spread = Math.min(3, 1 + Math.floor(room / 7));
      for (let i = 0; i < spread; i += 1) {
        const angle = (-0.28 * (spread - 1)) + i * 0.28;
        bolts.push({ x: bossX, y: 64, vx: Math.sin(angle) * 90, vy: 170 + room * 5 + Math.cos(angle) * 24, r: 6 + Math.min(4, room * 0.1) });
      }
    }

    for (let i = shots.length - 1; i >= 0; i -= 1) {
      const shot = shots[i];
      shot.y += shot.vy * dt;
      if (shot.y < -20) {
        shots.splice(i, 1);
        continue;
      }
      if (Math.abs(shot.x - bossX) < 38 && shot.y <= 92) {
        shots.splice(i, 1);
        bossHp -= 18;
        score += 9;
        status = bossHp > 0 ? "Pressure up" : "Chamber cracked";
        if (bossHp <= 0) {
          nextRoom();
          return;
        }
      }
    }

    for (let i = bolts.length - 1; i >= 0; i -= 1) {
      const bolt = bolts[i];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      if (bolt.y > height + 20 || bolt.x < -20 || bolt.x > width + 20) {
        bolts.splice(i, 1);
        continue;
      }
      const hit = Math.abs(bolt.x - player.x) < (player.w * 0.7 + bolt.r) && Math.abs(bolt.y - player.y) < (player.h * 0.8 + bolt.r);
      if (hit) {
        bolts.splice(i, 1);
        player.hp -= 8 + Math.min(12, room * 0.4);
        status = player.hp > 0 ? "Armor clipped" : "Run lost";
        if (player.hp <= 0) {
          player.hp = 0;
          finish("down", "Vault run lost");
          return;
        }
      }
    }

    emitSnapshot();
  }

  function draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(44,18,56,0.98)");
    grad.addColorStop(1, "rgba(11,10,22,0.99)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(18 + i * 32, 28, 18, 6);
      ctx.fillRect(18 + i * 32, 42, 18, 6);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(22, height - 26, width - 44, 4);

    const hpPct = clamp(bossHp / bossMaxHp, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(22, 18, width - 44, 10);
    ctx.fillStyle = room >= roomsTotal ? "rgba(255,160,120,0.92)" : "rgba(184,140,255,0.92)";
    ctx.fillRect(22, 18, (width - 44) * hpPct, 10);

    ctx.fillStyle = room >= roomsTotal ? "rgba(255,180,140,0.96)" : "rgba(190,150,255,0.94)";
    ctx.beginPath();
    ctx.arc(bossX, 64, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(bossX - 8, 56, 4, 4);
    ctx.fillRect(bossX + 4, 56, 4, 4);

    for (const shot of shots) {
      ctx.fillStyle = "rgba(120,232,255,0.95)";
      ctx.fillRect(shot.x - 2, shot.y - 8, 4, 10);
    }

    for (const bolt of bolts) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,120,160,0.9)";
      ctx.arc(bolt.x, bolt.y, bolt.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const playerHpPct = clamp(player.hp / 100, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(player.x - 20, player.y + 16, 40, 4);
    ctx.fillStyle = "rgba(120,255,178,0.92)";
    ctx.fillRect(player.x - 20, player.y + 16, 40 * playerHpPct, 4);

    ctx.fillStyle = "rgba(120,220,255,0.95)";
    ctx.fillRect(player.x - player.w * 0.5, player.y - player.h * 0.5, player.w, player.h);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 13px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText(`Room ${Math.min(room, roomsTotal)}/${roomsTotal}`, 16, height - 14);
    ctx.fillText(`Score ${Math.round(score)}`, 124, height - 14);
    ctx.fillText(`HP ${Math.round(player.hp)}`, 230, height - 14);
    ctx.fillText(status, width - 180, height - 14);
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  spawnBoss(room);
  emitSnapshot();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onPointer);
  canvas.addEventListener("click", onClick);
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onPointer);
      canvas.removeEventListener("click", onClick);
    },
  };
}
