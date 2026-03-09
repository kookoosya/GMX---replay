export interface PayloadLabSnapshot {
  progress: number;
  score: number;
  hp: number;
  combo: number;
  seconds: number;
  status: string;
}

export interface PayloadLabModuleOptions {
  width?: number;
  height?: number;
  initialProgress?: number;
  onSnapshot?: (snapshot: PayloadLabSnapshot) => void;
  onCheckpoint?: (snapshot: PayloadLabSnapshot) => void;
  onFinish?: (snapshot: PayloadLabSnapshot, reason: "win" | "down") => void;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  r: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function len(x: number, y: number) {
  return Math.sqrt(x * x + y * y) || 1;
}

export function mountPayloadLabCore(host: HTMLElement, options: PayloadLabModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 340;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(25,12,8,0.96),rgba(36,18,12,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const keys = new Set<string>();
  const pointer = { x: width * 0.65, y: height * 0.55 };
  const bullets: Bullet[] = [];
  const enemies: Enemy[] = [];
  const sparks: Bullet[] = [];
  const player = { x: 140, y: 220, hp: 100, cd: 0, r: 10 };
  const cart = { x: 150, y: 230, w: 88, h: 28, progress: clamp(options.initialProgress || 0, 0, 300) };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let spawnCd = 0.7;
  let checkpointMark = Math.floor(cart.progress / 20) * 20;
  let score = Math.round(cart.progress * 3);
  let combo = 1;
  let seconds = Math.round(cart.progress * 0.8);
  let status = cart.progress > 0 ? `Resumed at ${Math.round(cart.progress)}%` : "Push the cart";

  function emit() {
    options.onSnapshot?.({
      progress: Math.round(cart.progress),
      score: Math.round(score),
      hp: Math.max(0, Math.round(player.hp)),
      combo,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function fire() {
    if (player.cd > 0 || !running) return;
    const dx = pointer.x - player.x;
    const dy = pointer.y - player.y;
    const mag = len(dx, dy);
    bullets.push({ x: player.x, y: player.y, vx: (dx / mag) * 520, vy: (dy / mag) * 520, life: 1.2, r: 4 });
    player.cd = 0.14;
  }

  function addSpark(x: number, y: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.2 + Math.random() * 0.3, r: 2 });
    }
  }

  function spawnEnemy() {
    const x = width + 24;
    const y = 120 + Math.random() * 170;
    const targetY = cart.y + (Math.random() * 40 - 20);
    const speed = 55 + Math.min(120, cart.progress * 0.55) + Math.random() * 25;
    const dx = cart.x - x;
    const dy = targetY - y;
    const mag = len(dx, dy);
    enemies.push({ x, y, vx: (dx / mag) * speed, vy: (dy / mag) * speed, hp: 22 + Math.floor(cart.progress / 28), r: 12 });
  }

  function onKeyDown(ev: KeyboardEvent) {
    keys.add(ev.key.toLowerCase());
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function onPointer(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * width;
    pointer.y = ((ev.clientY - rect.top) / rect.height) * height;
  }

  function onClick() {
    fire();
  }

  function finish(reason: "win" | "down", nextStatus: string) {
    if (!running) return;
    running = false;
    status = nextStatus;
    const snap = {
      progress: Math.round(cart.progress),
      score: Math.round(score),
      hp: Math.max(0, Math.round(player.hp)),
      combo,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    };
    emit();
    options.onFinish?.(snap, reason);
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    player.cd = Math.max(0, player.cd - dt);

    let mx = 0;
    let my = 0;
    if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright")) mx += 1;
    if (keys.has("w") || keys.has("arrowup")) my -= 1;
    if (keys.has("s") || keys.has("arrowdown")) my += 1;
    const moveMag = len(mx, my);
    const speed = 210;
    player.x = clamp(player.x + (mx / moveMag) * speed * dt, 24, width - 24);
    player.y = clamp(player.y + (my / moveMag) * speed * dt, 70, height - 28);

    if (keys.has(" ")) fire();

    const nearCart = Math.abs(player.x - cart.x) < 82 && Math.abs(player.y - cart.y) < 70;
    const progressRate = nearCart ? 8.8 : 1.6;
    cart.progress = clamp(cart.progress + dt * progressRate, 0, 300);
    cart.x = 150 + (width - 300) * (cart.progress / 300);

    score += dt * (nearCart ? 8 : 3) * combo;
    if (nearCart) status = `Escort ${Math.round(cart.progress)}%`;
    else status = "Stay on the cart";

    const nextMark = Math.floor(cart.progress / 20) * 20;
    if (nextMark >= checkpointMark + 20 && nextMark < 300) {
      checkpointMark = nextMark;
      status = `Checkpoint ${checkpointMark}%`;
      options.onCheckpoint?.({
        progress: Math.round(cart.progress),
        score: Math.round(score),
        hp: Math.max(0, Math.round(player.hp)),
        combo,
        seconds: Math.max(0, Math.round(seconds)),
        status,
      });
    }

    if (cart.progress >= 300) {
      finish("win", "Payload delivered");
      return;
    }

    spawnCd -= dt;
    if (spawnCd <= 0) {
      spawnCd = Math.max(0.22, 0.8 - cart.progress * 0.0014);
      spawnEnemy();
      if (cart.progress > 130 && Math.random() < 0.24) spawnEnemy();
    }

    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -12 || b.y < -12 || b.x > width + 12 || b.y > height + 12) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (Math.abs(e.x - cart.x) < e.r + cart.w * 0.35 && Math.abs(e.y - cart.y) < e.r + cart.h * 0.55) {
        player.hp -= 12 * dt;
        score = Math.max(0, score - 9 * dt);
        combo = 1;
        status = "Cart under pressure";
      }

      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const pmag = len(pdx, pdy);
      if (pmag < e.r + player.r) {
        player.hp -= 16 * dt;
        status = "Taking hits";
      }

      for (let j = bullets.length - 1; j >= 0; j -= 1) {
        const b = bullets[j];
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (dx * dx + dy * dy <= (b.r + e.r) * (b.r + e.r)) {
          bullets.splice(j, 1);
          e.hp -= 18;
          addSpark(b.x, b.y, 4);
          if (e.hp <= 0) {
            enemies.splice(i, 1);
            score += 15 + combo * 3;
            combo = Math.min(9, combo + 1);
            addSpark(e.x, e.y, 10);
            status = combo >= 5 ? "Momentum climbing" : "Lane clear";
          }
          break;
        }
      }
    }

    if (player.hp <= 0) {
      player.hp = 0;
      finish("down", "Escort broken");
      return;
    }

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }

    emit();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(0, 76 + i * 32, width, 1);
    }

    ctx.fillStyle = "rgba(255,178,120,0.10)";
    ctx.fillRect(70, cart.y - 38, width - 140, 76);

    ctx.fillStyle = "rgba(255,196,120,0.18)";
    ctx.fillRect(76, cart.y - 4, width - 152, 8);

    ctx.fillStyle = "rgba(255,155,86,0.92)";
    ctx.fillRect(cart.x - cart.w / 2, cart.y - cart.h / 2, cart.w, cart.h);
    ctx.fillStyle = "rgba(255,232,185,0.95)";
    ctx.fillRect(cart.x - 8, cart.y - 18, 16, 6);

    ctx.fillStyle = "rgba(123,226,255,0.95)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(123,226,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(pointer.x, pointer.y);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,233,188,0.96)";
    bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    enemies.forEach((e) => {
      ctx.fillStyle = "rgba(255,104,94,0.92)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(e.x - 16, e.y - e.r - 10, 32, 4);
      ctx.fillStyle = "rgba(255,214,132,0.85)";
      ctx.fillRect(e.x - 16, e.y - e.r - 10, clamp((e.hp / (22 + Math.floor(cart.progress / 28))) * 32, 0, 32), 4);
    });

    ctx.fillStyle = "rgba(255,200,130,0.75)";
    sparks.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(8,10,16,0.55)";
    ctx.fillRect(10, 10, 220, 72);
    ctx.fillStyle = "#fff";
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    ctx.fillText(`Escort ${Math.round(cart.progress)}%`, 20, 32);
    ctx.fillText(`HP ${Math.round(player.hp)}`, 20, 52);
    ctx.fillText(`Score ${Math.round(score)}`, 20, 72);

    if (!running) {
      ctx.fillStyle = "rgba(8,10,16,0.66)";
      ctx.fillRect(90, 90, width - 180, height - 180);
      ctx.fillStyle = "#fff";
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(status, 140, 154);
      ctx.font = "500 14px Inter, system-ui, sans-serif";
      ctx.fillText("Space / click to shoot · stay close to the cart for max pace", 140, 182);
      ctx.fillText("Leave and relaunch later to continue from the latest local checkpoint", 140, 204);
      ctx.fillText(`Final score ${Math.round(score)}`, 140, 228);
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onPointer);
  canvas.addEventListener("mousedown", onClick);

  emit();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onPointer);
      canvas.removeEventListener("mousedown", onClick);
      host.innerHTML = "";
    },
  };
}
