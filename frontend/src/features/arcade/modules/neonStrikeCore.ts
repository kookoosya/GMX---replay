export interface NeonStrikeSnapshot {
  score: number;
  wave: number;
  hp: number;
  kills: number;
  seconds: number;
  status: string;
}

export interface NeonStrikeModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: NeonStrikeSnapshot) => void;
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

interface Player {
  x: number;
  y: number;
  hp: number;
  cd: number;
  r: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function len(x: number, y: number) {
  return Math.sqrt(x * x + y * y) || 1;
}

export function mountNeonStrikeCore(host: HTMLElement, options: NeonStrikeModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(7,11,22,0.96),rgba(8,18,28,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { destroy() {} };
  }

  const keys = new Set<string>();
  const pointer = { x: width * 0.75, y: height * 0.5 };
  const bullets: Bullet[] = [];
  const enemies: Enemy[] = [];
  const particles: Bullet[] = [];
  const player: Player = { x: width * 0.35, y: height * 0.5, hp: 100, cd: 0, r: 11 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let spawnCd = 0.4;
  let score = 0;
  let kills = 0;
  let wave = 1;
  let seconds = 0;
  let status = "Wave 1";
  let waveFlash = 1.2;

  function snapshot() {
    options.onSnapshot?.({
      score: Math.round(score),
      wave,
      hp: Math.max(0, Math.round(player.hp)),
      kills,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
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

  function fire() {
    if (player.cd > 0 || !running) return;
    const dx = pointer.x - player.x;
    const dy = pointer.y - player.y;
    const mag = len(dx, dy);
    bullets.push({
      x: player.x,
      y: player.y,
      vx: (dx / mag) * 520,
      vy: (dy / mag) * 520,
      life: 1.4,
      r: 4,
    });
    player.cd = 0.16;
  }

  function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = -18;
      y = Math.random() * height;
    } else if (edge === 1) {
      x = width + 18;
      y = Math.random() * height;
    } else if (edge === 2) {
      x = Math.random() * width;
      y = -18;
    } else {
      x = Math.random() * width;
      y = height + 18;
    }
    const hp = 12 + wave * 2 + Math.random() * 8;
    const speed = 38 + wave * 3 + Math.random() * 22;
    const dx = player.x - x;
    const dy = player.y - y;
    const mag = len(dx, dy);
    enemies.push({ x, y, vx: (dx / mag) * speed, vy: (dy / mag) * speed, hp, r: 12 + Math.min(8, wave * 0.2) });
  }

  function addBurst(x: number, y: number, amount: number) {
    for (let i = 0; i < amount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.35 + Math.random() * 0.35, r: 2 + Math.random() * 2 });
    }
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    waveFlash = Math.max(0, waveFlash - dt);
    player.cd = Math.max(0, player.cd - dt);

    let mx = 0;
    let my = 0;
    if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright")) mx += 1;
    if (keys.has("w") || keys.has("arrowup")) my -= 1;
    if (keys.has("s") || keys.has("arrowdown")) my += 1;
    const moveMag = len(mx, my);
    const speed = 210;
    player.x = clamp(player.x + (mx / moveMag) * speed * dt, player.r, width - player.r);
    player.y = clamp(player.y + (my / moveMag) * speed * dt, player.r, height - player.r);

    if (keys.has(" ")) fire();

    spawnCd -= dt;
    const spawnRate = Math.max(0.1, 0.7 - wave * 0.03);
    if (spawnCd <= 0) {
      spawnCd = spawnRate;
      spawnEnemy();
      if (wave >= 4 && Math.random() < 0.18) spawnEnemy();
    }

    const nextWave = 1 + Math.floor(kills / 14);
    if (nextWave !== wave) {
      wave = nextWave;
      status = `Wave ${wave}`;
      waveFlash = 1.2;
      snapshot();
    }

    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -10 || b.y < -10 || b.x > width + 10 || b.y > height + 10) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const mag = len(dx, dy);
      e.vx = (dx / mag) * (34 + wave * 3);
      e.vy = (dy / mag) * (34 + wave * 3);
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (mag < e.r + player.r) {
        player.hp -= 18 * dt;
        status = "Taking hits";
        if (player.hp <= 0) {
          player.hp = 0;
          running = false;
          status = "Module run down";
          snapshot();
        }
      }

      for (let j = bullets.length - 1; j >= 0; j -= 1) {
        const b = bullets[j];
        const bx = b.x - e.x;
        const by = b.y - e.y;
        if (bx * bx + by * by <= (b.r + e.r) * (b.r + e.r)) {
          bullets.splice(j, 1);
          e.hp -= 18;
          addBurst(b.x, b.y, 4);
          if (e.hp <= 0) {
            enemies.splice(i, 1);
            score += 12 + wave * 2;
            kills += 1;
            addBurst(e.x, e.y, 10);
            if (kills % 10 === 0) status = "Pace climbing";
            snapshot();
          }
          break;
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawGrid() {
    ctx.strokeStyle = "rgba(110,190,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawGrid();

    ctx.fillStyle = "rgba(70,160,255,0.22)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(145,245,255,0.95)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,222,120,0.96)";
    for (const b of bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of enemies) {
      ctx.fillStyle = `rgba(255,${80 + Math.min(120, wave * 8)},120,0.92)`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0.15, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(12, 12, 210, 64);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`Neon Strike Module · ${status}`, 20, 30);
    ctx.fillText(`HP ${Math.round(player.hp)} · Score ${Math.round(score)} · Kills ${kills}`, 20, 48);
    ctx.fillText(`WASD / Arrows move · click or Space shoots`, 20, 66);

    if (waveFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.12 + waveFlash * 0.18})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 26px system-ui, sans-serif";
      ctx.fillText(`Wave ${wave}`, width * 0.5 - 42, height * 0.5);
    }

    if (!running) {
      ctx.fillStyle = "rgba(7,8,16,0.68)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 24px system-ui, sans-serif";
      ctx.fillText("Module run down", width * 0.5 - 88, height * 0.5 - 6);
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText("Reload the page or remount this module to try again", width * 0.5 - 150, height * 0.5 + 18);
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
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onPointer);
  canvas.addEventListener("click", onClick);
  snapshot();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onPointer);
      canvas.removeEventListener("click", onClick);
      host.innerHTML = "";
    },
  };
}
