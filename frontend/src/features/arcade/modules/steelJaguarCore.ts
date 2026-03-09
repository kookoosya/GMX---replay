export interface SteelJaguarSnapshot {
  distance: number;
  score: number;
  hp: number;
  lane: number;
  seconds: number;
  status: string;
}

export interface SteelJaguarModuleOptions {
  width?: number;
  height?: number;
  initialDistance?: number;
  onSnapshot?: (snapshot: SteelJaguarSnapshot) => void;
  onCheckpoint?: (snapshot: SteelJaguarSnapshot) => void;
  onFinish?: (snapshot: SteelJaguarSnapshot, reason: "clear" | "down") => void;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "crate" | "drone";
  hp?: number;
}

interface Shot {
  x: number;
  y: number;
  vx: number;
  life: number;
  r: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountSteelJaguarCore(host: HTMLElement, options: SteelJaguarModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(10,18,28,0.96),rgba(18,28,42,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const groundY = height - 42;
  const keys = new Set<string>();
  const shots: Shot[] = [];
  const sparks: Shot[] = [];
  const obstacles: Obstacle[] = [];
  const player = { x: 96, y: groundY - 16, vy: 0, hp: 100, cd: 0, onGround: true, r: 12 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let distance = Math.max(0, Math.min(3600, Number(options.initialDistance) || 0));
  let score = Math.round(distance * 0.55);
  let seconds = Math.round(distance * 0.055);
  let pace = 210 + Math.min(170, distance * 0.05);
  let spawnCd = 0.9;
  let checkpointMark = Math.floor(distance / 500) * 500;
  let status = distance > 0 ? `Resumed at ${Math.round(distance)} m` : "Run the lane";

  function getSnapshot(): SteelJaguarSnapshot {
    return {
      distance: Math.round(distance),
      score: Math.round(score),
      hp: Math.max(0, Math.round(player.hp)),
      lane: player.onGround ? 1 : 2,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    };
  }

  function snapshot() {
    options.onSnapshot?.(getSnapshot());
  }

  function emitCheckpoint() {
    options.onCheckpoint?.(getSnapshot());
  }

  function addSpark(x: number, y: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      sparks.push({ x, y, vx: Math.random() * 120 - 60, life: 0.18 + Math.random() * 0.25, r: 2 + Math.random() * 1.4 });
    }
  }

  function fire() {
    if (!running || player.cd > 0) return;
    shots.push({ x: player.x + 16, y: player.y - 4, vx: 520, life: 0.9, r: 4 });
    player.cd = 0.18;
  }

  function jump() {
    if (!running || !player.onGround) return;
    player.onGround = false;
    player.vy = -330;
    status = "Jumping over pressure";
  }

  function spawnObstacle() {
    const drone = distance > 900 && Math.random() < 0.38;
    if (drone) {
      obstacles.push({ x: width + 24, y: groundY - 86 - Math.random() * 42, w: 28, h: 20, kind: "drone", hp: 16 + Math.floor(distance / 500) });
      return;
    }
    const tall = Math.random() < 0.42;
    obstacles.push({ x: width + 16, y: groundY - (tall ? 38 : 24), w: tall ? 26 : 20, h: tall ? 38 : 24, kind: "crate" });
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    keys.add(key);
    if ((key === "w" || key === "arrowup" || key === " ") && !ev.repeat) jump();
    if (key === "f") fire();
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function onClick() {
    fire();
  }

  function finish(reason: "clear" | "down", nextStatus: string) {
    if (!running) return;
    running = false;
    status = nextStatus;
    const snap = getSnapshot();
    options.onSnapshot?.(snap);
    options.onFinish?.(snap, reason);
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    player.cd = Math.max(0, player.cd - dt);
    pace = Math.min(420, pace + dt * 1.8);
    distance = Math.min(4200, distance + dt * (pace * 0.45));
    score += dt * (8 + pace * 0.02);

    if (!player.onGround) {
      player.vy += 760 * dt;
      player.y += player.vy * dt;
      if (player.y >= groundY - 16) {
        player.y = groundY - 16;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (keys.has("f")) fire();

    spawnCd -= dt;
    if (spawnCd <= 0) {
      spawnCd = Math.max(0.26, 0.9 - distance * 0.00008);
      spawnObstacle();
      if (distance > 1800 && Math.random() < 0.24) spawnObstacle();
    }

    for (let i = shots.length - 1; i >= 0; i -= 1) {
      const shot = shots[i];
      shot.x += shot.vx * dt;
      shot.life -= dt;
      if (shot.life <= 0 || shot.x > width + 18) shots.splice(i, 1);
    }

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      const ob = obstacles[i];
      ob.x -= pace * dt;
      if (ob.x + ob.w < -30) {
        obstacles.splice(i, 1);
        score += ob.kind === "drone" ? 4 : 2;
        continue;
      }

      if (ob.kind === "crate") {
        const hitX = player.x + player.r > ob.x && player.x - player.r < ob.x + ob.w;
        const hitY = player.y + player.r > ob.y && player.y - player.r < ob.y + ob.h;
        if (hitX && hitY) {
          player.hp -= 28 * dt;
          status = "Barrier contact";
          if (player.hp <= 0) {
            player.hp = 0;
            finish("down", "Jaguar shut down");
            return;
          }
        }
      } else {
        const dx = Math.abs(ob.x + ob.w * 0.5 - player.x);
        const dy = Math.abs(ob.y + ob.h * 0.5 - player.y);
        if (dx < ob.w * 0.55 + player.r && dy < ob.h * 0.55 + player.r) {
          player.hp -= 34 * dt;
          status = "Drone pressure";
          if (player.hp <= 0) {
            player.hp = 0;
            finish("down", "Jaguar shut down");
            return;
          }
        }
      }

      for (let j = shots.length - 1; j >= 0; j -= 1) {
        const shot = shots[j];
        if (shot.x + shot.r >= ob.x && shot.x - shot.r <= ob.x + ob.w && shot.y + shot.r >= ob.y && shot.y - shot.r <= ob.y + ob.h) {
          shots.splice(j, 1);
          if (ob.kind === "drone") {
            ob.hp = (ob.hp || 12) - 18;
            addSpark(ob.x + ob.w * 0.5, ob.y + ob.h * 0.5, 6);
            if ((ob.hp || 0) <= 0) {
              obstacles.splice(i, 1);
              score += 22;
              status = "Drone cleared";
            }
          } else {
            obstacles.splice(i, 1);
            score += 10;
            addSpark(ob.x + ob.w * 0.5, ob.y + ob.h * 0.5, 4);
            status = "Barrier cracked";
          }
          break;
        }
      }
    }

    const nextMark = Math.floor(distance / 500) * 500;
    if (nextMark >= checkpointMark + 500 && nextMark < 4200) {
      checkpointMark = nextMark;
      status = `Checkpoint ${checkpointMark} m`;
      emitCheckpoint();
    }

    if (distance >= 4200) {
      score += 180;
      finish("clear", "Stage clear");
      return;
    }

    if (player.hp < 28 && running) status = "Critical armor";

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.x += spark.vx * dt;
      spark.life -= dt;
      if (spark.life <= 0) sparks.splice(i, 1);
    }

    snapshot();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "rgba(16,30,44,0.98)");
    sky.addColorStop(1, "rgba(8,14,24,1)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(120,220,255,0.06)";
    for (let x = 0; x < width; x += 42) {
      const offset = (distance * 0.2 + x) % 42;
      ctx.fillRect(width - offset, 24, 12, 2);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, groundY, width, 6);
    ctx.fillStyle = "rgba(88,168,255,0.12)";
    for (let x = -20; x < width + 40; x += 44) {
      const lane = x - ((distance * 0.8) % 44);
      ctx.fillRect(lane, groundY + 10, 24, 4);
    }

    for (const ob of obstacles) {
      ctx.fillStyle = ob.kind === "drone" ? "rgba(255,138,118,0.9)" : "rgba(255,214,136,0.86)";
      if (ob.kind === "drone") {
        ctx.beginPath();
        ctx.ellipse(ob.x + ob.w * 0.5, ob.y + ob.h * 0.5, ob.w * 0.55, ob.h * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      }
    }

    for (const shot of shots) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(132,242,255,0.92)";
      ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const spark of sparks) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(spark.x, groundY - 10, 2, 2);
    }

    ctx.fillStyle = player.hp <= 28 ? "rgba(255,210,120,0.96)" : "rgba(110,255,220,0.9)";
    ctx.fillRect(player.x - 10, player.y - 18, 20, 20);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(12, 12, 210, 58);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText(`Steel Jaguar · ${Math.round(distance)} m / 4200 m`, 20, 30);
    ctx.fillText(`HP ${Math.max(0, Math.round(player.hp))}   Score ${Math.round(score)}`, 20, 48);
  }

  function frame(now: number) {
    const dt = Math.min(0.03, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function onBlur() {
    keys.clear();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("click", onClick);

  snapshot();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("click", onClick);
      host.innerHTML = "";
    },
  };
}
