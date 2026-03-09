export interface StarSparkSnapshot {
  timeLeft: number;
  score: number;
  combo: number;
  lives: number;
  seconds: number;
  status: string;
}

export interface StarSparkModuleOptions {
  width?: number;
  height?: number;
  initialTimeLeft?: number;
  onSnapshot?: (snapshot: StarSparkSnapshot) => void;
  onCheckpoint?: (snapshot: StarSparkSnapshot) => void;
  onFinish?: (snapshot: StarSparkSnapshot, reason: "timeout" | "down") => void;
}

interface Drop {
  x: number;
  y: number;
  vy: number;
  r: number;
  type: "star" | "clock" | "bomb";
  color: string;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountStarSparkCore(host: HTMLElement, options: StarSparkModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(10,18,48,0.96),rgba(18,18,34,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const keys = new Set<string>();
  const drops: Drop[] = [];
  const particles: Drop[] = [];
  const catcher = { x: width * 0.5, y: height - 32, w: 100, h: 18, speed: 420 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let timeLeft = clamp(Number(options.initialTimeLeft) || 360, 30, 540);
  let score = 0;
  let combo = 1;
  let lives = 3;
  let spawnCd = 0.36;
  let checkpointMark = Math.floor(elapsed / 30) * 30;
  let status = timeLeft < 360 ? `Resumed with ${Math.round(timeLeft)}s left` : "Catch the rhythm";
  const mouse = { x: catcher.x, inside: false };

  function getSnapshot(): StarSparkSnapshot {
    return {
      timeLeft: Math.max(0, Math.round(timeLeft)),
      score: Math.max(0, Math.round(score)),
      combo: Math.max(1, Math.round(combo)),
      lives: Math.max(0, Math.round(lives)),
      seconds: Math.max(0, Math.round(elapsed)),
      status,
    };
  }

  function snapshot() {
    options.onSnapshot?.(getSnapshot());
  }

  function emitCheckpoint() {
    options.onCheckpoint?.(getSnapshot());
  }

  function addBurst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i += 1) {
      particles.push({ x, y, vy: 40 + Math.random() * 80, r: 2 + Math.random() * 2, type: "star", color });
    }
  }

  function spawnDrop() {
    const roll = Math.random();
    const type: Drop["type"] = roll > 0.88 ? "bomb" : roll < 0.08 ? "clock" : "star";
    drops.push({
      x: 24 + Math.random() * (width - 48),
      y: -20,
      vy: 120 + Math.random() * 130 + Math.min(100, elapsed * 1.2),
      r: type === "bomb" ? 16 : type === "clock" ? 14 : 12,
      type,
      color: type === "bomb" ? "#5a496c" : type === "clock" ? "#8ff5ff" : (Math.random() > 0.5 ? "#ffd980" : "#a7d8ff"),
    });
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    keys.add(key);
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function onMouseMove(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * width;
    mouse.inside = true;
  }

  function onMouseLeave() {
    mouse.inside = false;
  }

  function finish(reason: "timeout" | "down", nextStatus: string) {
    if (!running) return;
    running = false;
    status = nextStatus;
    const snap = getSnapshot();
    options.onSnapshot?.(snap);
    options.onFinish?.(snap, reason);
  }

  function update(dt: number) {
    if (!running) return;
    elapsed += dt;
    timeLeft = Math.max(0, timeLeft - dt);

    const dir = (keys.has("a") || keys.has("arrowleft") ? -1 : 0) + (keys.has("d") || keys.has("arrowright") ? 1 : 0);
    if (mouse.inside) {
      catcher.x += (mouse.x - catcher.x) * Math.min(1, dt * 10);
    } else {
      catcher.x += dir * catcher.speed * dt;
    }
    catcher.x = clamp(catcher.x, catcher.w * 0.5 + 10, width - catcher.w * 0.5 - 10);

    spawnCd -= dt;
    if (spawnCd <= 0) {
      spawnCd = Math.max(0.12, 0.36 - Math.min(0.14, elapsed * 0.0018));
      spawnDrop();
      if (combo >= 6 && Math.random() > 0.62) spawnDrop();
    }

    for (let i = drops.length - 1; i >= 0; i -= 1) {
      const drop = drops[i];
      drop.y += drop.vy * dt;
      const caught = Math.abs(drop.x - catcher.x) < catcher.w * 0.52 && drop.y + drop.r >= catcher.y - catcher.h * 0.5;
      if (caught) {
        drops.splice(i, 1);
        if (drop.type === "bomb") {
          lives -= 1;
          combo = 1;
          status = lives > 0 ? "Combo broken" : "Hull cracked";
          addBurst(drop.x, catcher.y - 8, "rgba(255,120,160,0.55)", 8);
          if (lives <= 0) {
            lives = 0;
            finish("down", "Spark run lost");
            return;
          }
        } else if (drop.type === "clock") {
          timeLeft = Math.min(540, timeLeft + 10);
          score += 18 * combo;
          combo = Math.min(12, combo + 1);
          status = "Time extension";
          addBurst(drop.x, catcher.y - 8, "rgba(143,245,255,0.6)", 7);
        } else {
          score += 12 * combo;
          combo = Math.min(12, combo + 1);
          status = combo >= 6 ? "Fever chain" : "Chain building";
          addBurst(drop.x, catcher.y - 8, "rgba(255,230,160,0.55)", 6);
        }
        continue;
      }
      if (drop.y - drop.r > height + 12) {
        drops.splice(i, 1);
        if (drop.type === "star") {
          combo = 1;
          status = "Drop missed";
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.y -= p.vy * dt;
      p.r -= dt * 4;
      if (p.r <= 0.3) particles.splice(i, 1);
    }

    const nextMark = Math.floor(elapsed / 30) * 30;
    if (nextMark >= checkpointMark + 30 && timeLeft > 0) {
      checkpointMark = nextMark;
      status = `Checkpoint ${checkpointMark}s`;
      emitCheckpoint();
    }

    if (timeLeft <= 0) {
      score += combo * 25;
      finish("timeout", "Spark loop complete");
      return;
    }

    snapshot();
  }

  function draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(18,30,70,0.98)");
    grad.addColorStop(1, "rgba(16,12,32,0.98)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 28; i += 1) {
      const x = (i * 67 + elapsed * 18) % (width + 40);
      const y = (i * 29) % (height - 70);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(x - 20, y, 2, 2);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(10, catcher.y + 10, width - 20, 4);

    ctx.fillStyle = combo >= 6 ? "rgba(255,214,120,0.95)" : "rgba(140,220,255,0.9)";
    ctx.fillRect(catcher.x - catcher.w * 0.5, catcher.y - catcher.h * 0.5, catcher.w, catcher.h);

    for (const drop of drops) {
      ctx.beginPath();
      ctx.fillStyle = drop.color;
      ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
      ctx.fill();
      if (drop.type === "clock") {
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y - 6);
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 5, drop.y + 2);
        ctx.stroke();
      }
    }

    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 13px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText(`Time ${Math.round(timeLeft)}s`, 16, 22);
    ctx.fillText(`Score ${Math.round(score)}`, 120, 22);
    ctx.fillText(`Combo x${combo}`, 240, 22);
    ctx.fillText(`Lives ${lives}`, 360, 22);
    ctx.fillText(status, 16, 42);

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.font = "700 22px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(status, width * 0.5 - 90, height * 0.5 - 8);
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(`Score ${Math.round(score)} · relaunch to chase a better chain`, width * 0.5 - 138, height * 0.5 + 18);
    }
  }

  function loop(now: number) {
    const dt = Math.min(0.03, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  snapshot();
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    },
  };
}
