export interface TowerHexSnapshot {
  score: number;
  core: number;
  floors: number;
  sectors: number;
  charges: number;
  seconds: number;
  status: string;
}

export interface TowerHexModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: TowerHexSnapshot) => void;
}

interface HexEnemy {
  lane: number;
  dist: number;
  hp: number;
  speed: number;
  elite: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountTowerHexCore(host: HTMLElement, options: TowerHexModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(10,8,26,0.98),rgba(18,12,34,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const centerX = width * 0.5;
  const centerY = height * 0.55;
  const enemies: HexEnemy[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let core = 100;
  let floors = 1;
  let sectors = 0;
  let charges = 3;
  let chargeCd = 1.0;
  let spawnCd = 0.82;
  let pulseCd = 0;
  let status = "Hex stable";

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      core: Math.max(0, Math.round(core)),
      floors,
      sectors,
      charges,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnEnemy(forceElite = false) {
    const elite = forceElite || (seconds > 26 && Math.random() < 0.22);
    enemies.push({
      lane: Math.floor(Math.random() * 6),
      dist: 124,
      hp: elite ? 34 + floors * 2 : 15 + floors,
      speed: elite ? 0.92 + Math.min(0.45, seconds * 0.02) : 1.35 + Math.min(0.55, seconds * 0.024),
      elite,
    });
  }

  function firePulse() {
    if (!running) return;
    if (charges <= 0) {
      status = "Pulse recharging";
      snapshot();
      return;
    }
    charges -= 1;
    pulseCd = 0.22;
    let hit = false;
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      if (enemy.lane !== sectors) continue;
      enemy.hp -= enemy.elite ? 24 : 18;
      hit = true;
      if (enemy.hp <= 0) {
        enemies.splice(i, 1);
        score += enemy.elite ? 34 : 15;
        if (enemy.elite) core = clamp(core + 2, 0, 100);
      }
      break;
    }
    if (!hit) score = Math.max(0, score - 2);
    status = hit ? `Sector ${sectors + 1} pulse` : `Sector ${sectors + 1} empty`;
    snapshot();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    if (key === "a" || key === "arrowleft") sectors = (sectors + 5) % 6;
    if (key === "d" || key === "arrowright") sectors = (sectors + 1) % 6;
    if (key === "q") sectors = (sectors + 4) % 6;
    if (key === "e") sectors = (sectors + 2) % 6;
    if (key === " " || key === "spacebar" || key === "enter") {
      ev.preventDefault();
      if (running) firePulse();
      else reset();
    }
  }

  function onClick(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * width - centerX;
    const y = ((ev.clientY - rect.top) / rect.height) * height - centerY;
    const angle = Math.atan2(y, x);
    const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
    sectors = Math.floor((normalized / (Math.PI * 2)) * 6) % 6;
    firePulse();
  }

  function reset() {
    enemies.splice(0, enemies.length);
    running = true;
    seconds = 0;
    score = 0;
    core = 100;
    floors = 1;
    sectors = 0;
    charges = 3;
    chargeCd = 1.0;
    spawnCd = 0.82;
    pulseCd = 0;
    status = "Hex stable";
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    chargeCd -= dt;
    spawnCd -= dt;
    pulseCd = Math.max(0, pulseCd - dt);

    score += dt * (4 + floors * 0.35);
    if (chargeCd <= 0) {
      chargeCd = Math.max(0.42, 1.0 - Math.min(0.35, seconds * 0.004));
      charges = Math.min(5, charges + 1);
    }

    const nextFloor = Math.max(1, Math.floor(seconds / 14) + 1);
    if (nextFloor !== floors) {
      floors = nextFloor;
      core = clamp(core + 4, 0, 100);
      status = floors % 2 === 0 ? "Floor sealed" : "Hex rising";
      snapshot();
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.24, 0.84 - Math.min(0.48, seconds * 0.009));
      spawnEnemy(false);
      if (floors >= 3 && Math.random() < 0.18) spawnEnemy(true);
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.dist -= enemy.speed * dt * 36;
      if (enemy.dist <= 26) {
        enemies.splice(i, 1);
        core -= enemy.elite ? 18 : 10;
        status = enemy.elite ? "Elite pierced the core" : "Outer shield cracked";
        snapshot();
      }
    }

    if (core <= 0) {
      core = 0;
      running = false;
      status = "Tower overrun";
      snapshot();
    }
  }

  function drawHex(radius: number, stroke: string, lineWidth: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (-Math.PI / 2) + i * ((Math.PI * 2) / 6);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  CORE ${Math.round(core)}  CHARGES ${charges}`, 12, 18);
    ctx.fillText(running ? "A / D rotate, click a sector or press Space to pulse" : "Run ended · press Enter or Space to restart", 12, 34);

    drawHex(112, "rgba(255,255,255,0.1)", 1);
    drawHex(78, "rgba(120,220,255,0.16)", 2);
    drawHex(38, "rgba(255,210,120,0.35)", 3);

    for (let i = 0; i < 6; i += 1) {
      const start = (-Math.PI / 2) + i * ((Math.PI * 2) / 6);
      const end = start + ((Math.PI * 2) / 6);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, 120, start, end);
      ctx.closePath();
      ctx.fillStyle = i === sectors ? "rgba(255,210,120,0.09)" : "rgba(255,255,255,0.02)";
      ctx.fill();
    }

    if (pulseCd > 0) {
      ctx.beginPath();
      const angle = (-Math.PI / 2) + sectors * ((Math.PI * 2) / 6) + ((Math.PI * 2) / 12);
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * 132, centerY + Math.sin(angle) * 132);
      ctx.strokeStyle = "rgba(180,255,230,0.8)";
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    for (const enemy of enemies) {
      const angle = (-Math.PI / 2) + enemy.lane * ((Math.PI * 2) / 6) + ((Math.PI * 2) / 12);
      const x = centerX + Math.cos(angle) * enemy.dist;
      const y = centerY + Math.sin(angle) * enemy.dist;
      ctx.fillStyle = enemy.elite ? "rgba(255,110,160,0.92)" : "rgba(130,170,255,0.92)";
      ctx.beginPath();
      ctx.arc(x, y, enemy.elite ? 10 : 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    snapshot();
    raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown);
  snapshot();
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      try {
        if (host.contains(canvas)) host.removeChild(canvas);
      } catch {}
    },
  };
}
