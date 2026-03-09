export interface CitadelBreachSnapshot {
  score: number;
  wall: number;
  waves: number;
  breaches: number;
  seconds: number;
  charges: number;
  status: string;
}

export interface CitadelBreachModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: CitadelBreachSnapshot) => void;
}

interface LaneEnemy {
  lane: number;
  progress: number;
  hp: number;
  speed: number;
  elite: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountCitadelBreachCore(host: HTMLElement, options: CitadelBreachModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(18,12,8,0.98),rgba(20,10,18,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneY = [78, 160, 242];
  const enemies: LaneEnemy[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let wall = 100;
  let waves = 0;
  let breaches = 0;
  let charges = 3;
  let chargeCd = 1.2;
  let spawnCd = 0.9;
  let volleyCd = 0;
  let status = "Wall steady";

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      wall: Math.max(0, Math.round(wall)),
      waves,
      breaches,
      seconds: Math.max(0, Math.round(seconds)),
      charges,
      status,
    });
  }

  function spawnEnemy(forceElite = false) {
    const elite = forceElite || (seconds > 30 && Math.random() < 0.24);
    enemies.push({
      lane: Math.floor(Math.random() * 3),
      progress: 0,
      hp: elite ? 42 + waves * 1.5 : 18 + waves * 0.7,
      speed: elite ? 0.095 + Math.min(0.04, seconds * 0.0007) : 0.14 + Math.min(0.05, seconds * 0.001),
      elite,
    });
  }

  function fireLane(lane: number) {
    if (!running) return;
    if (charges <= 0) {
      status = "Battery dry";
      return;
    }
    charges -= 1;
    volleyCd = 0.25;
    let hit = false;
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      if (enemy.lane !== lane) continue;
      enemy.hp -= enemy.elite ? 22 : 18;
      hit = true;
      if (enemy.hp <= 0) {
        enemies.splice(i, 1);
        score += enemy.elite ? 28 : 14;
        if (enemy.elite) wall = clamp(wall + 2, 0, 100);
      }
      break;
    }
    if (!hit) score = Math.max(0, score - 2);
    status = hit ? `Lane ${lane + 1} volley` : `Lane ${lane + 1} missed`;
    snapshot();
  }

  function laneAt(y: number) {
    for (let i = 0; i < laneY.length; i += 1) {
      if (Math.abs(y - laneY[i]) <= 26) return i;
    }
    return -1;
  }

  function onClick(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const y = ((ev.clientY - rect.top) / rect.height) * height;
    const lane = laneAt(y);
    if (lane >= 0) fireLane(lane);
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    if (key === "1") fireLane(0);
    if (key === "2") fireLane(1);
    if (key === "3") fireLane(2);
    if (!running && key === "enter") reset();
  }

  function reset() {
    enemies.splice(0, enemies.length);
    running = true;
    seconds = 0;
    score = 0;
    wall = 100;
    waves = 0;
    breaches = 0;
    charges = 3;
    chargeCd = 1.2;
    spawnCd = 0.9;
    volleyCd = 0;
    status = "Wall steady";
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    chargeCd -= dt;
    spawnCd -= dt;
    volleyCd = Math.max(0, volleyCd - dt);

    score += dt * (3 + Math.min(3, waves * 0.08));
    if (chargeCd <= 0) {
      chargeCd = Math.max(0.65, 1.2 - Math.min(0.35, seconds * 0.003));
      charges = Math.min(5, charges + 1);
      if (charges >= 4 && wall < 55) status = "Battery recovered";
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.28, 0.92 - Math.min(0.45, seconds * 0.006));
      spawnEnemy(false);
      waves += 1;
      if (waves % 7 === 0) {
        spawnEnemy(true);
        status = "Elite breach wave";
      }
    }

    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.progress += enemy.speed * dt * 60;
      if (enemy.progress >= 100) {
        enemies.splice(i, 1);
        breaches += 1;
        wall -= enemy.elite ? 24 : 12;
        status = enemy.elite ? "Elite reached wall" : "Outer line pierced";
        snapshot();
      }
    }

    if (wall <= 0 || breaches >= 5) {
      wall = Math.max(0, wall);
      running = false;
      status = "Citadel lost";
      snapshot();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  WALL ${Math.round(wall)}  CHARGES ${charges}`, 12, 18);
    ctx.fillText(running ? "Click a lane or press 1 / 2 / 3 to fire" : "Run ended · press Enter to restart", 12, 34);

    for (let i = 0; i < laneY.length; i += 1) {
      const y = laneY[i];
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(18, y - 22, width - 80, 44);
      ctx.fillStyle = "rgba(255,220,140,0.22)";
      ctx.fillRect(width - 66, y - 24, 40, 48);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(`Lane ${i + 1}`, 28, y - 28);
    }

    for (const enemy of enemies) {
      const y = laneY[enemy.lane];
      const x = 24 + ((enemy.progress / 100) * (width - 110));
      ctx.fillStyle = enemy.elite ? "rgba(255,130,90,0.92)" : "rgba(255,110,180,0.88)";
      ctx.fillRect(x, y - 14, enemy.elite ? 24 : 18, enemy.elite ? 28 : 22);
    }

    if (volleyCd > 0) {
      ctx.strokeStyle = "rgba(150,255,220,0.65)";
      ctx.lineWidth = 3;
      for (let i = 0; i < laneY.length; i += 1) {
        ctx.beginPath();
        ctx.moveTo(width - 48, laneY[i]);
        ctx.lineTo(width - 88, laneY[i]);
        ctx.stroke();
      }
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
