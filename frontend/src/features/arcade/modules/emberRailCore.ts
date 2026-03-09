export interface EmberRailSnapshot {
  score: number;
  cargo: number;
  sectors: number;
  shells: number;
  leaks: number;
  seconds: number;
  status: string;
}

export interface EmberRailModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: EmberRailSnapshot) => void;
}

interface Raider {
  lane: number;
  x: number;
  hp: number;
  speed: number;
  heavy: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountEmberRailCore(host: HTMLElement, options: EmberRailModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(18,10,6,0.98),rgba(30,14,8,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneY = [84, 160, 236];
  const raiders: Raider[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let cargo = 100;
  let sectors = 1;
  let shells = 4;
  let leaks = 0;
  let shellCd = 0.8;
  let spawnCd = 0.95;
  let volleyFlash = 0;
  let selectedLane = 1;
  let status = "Rail stable";
  let trainShift = 0;

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      cargo: Math.max(0, Math.round(cargo)),
      sectors,
      shells,
      leaks,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnRaider(forceHeavy = false) {
    const heavy = forceHeavy || (seconds > 24 && Math.random() < 0.22);
    raiders.push({
      lane: Math.floor(Math.random() * 3),
      x: width + 18,
      hp: heavy ? 28 + sectors * 2 : 12 + sectors,
      speed: heavy ? 54 + Math.min(30, seconds * 1.1) : 78 + Math.min(42, seconds * 1.4),
      heavy,
    });
  }

  function fireLane(lane: number) {
    if (!running) return;
    selectedLane = clamp(lane, 0, 2);
    if (shells <= 0) {
      status = "Guns cycling";
      snapshot();
      return;
    }
    shells -= 1;
    volleyFlash = 0.18;
    let hit = false;
    for (let i = raiders.length - 1; i >= 0; i -= 1) {
      const raider = raiders[i];
      if (raider.lane !== selectedLane) continue;
      raider.hp -= raider.heavy ? 20 : 16;
      hit = true;
      if (raider.hp <= 0) {
        raiders.splice(i, 1);
        score += raider.heavy ? 30 : 14;
        if (raider.heavy) cargo = clamp(cargo + 3, 0, 100);
      }
      break;
    }
    if (!hit) score = Math.max(0, score - 3);
    status = hit ? `Track ${selectedLane + 1} volley` : `Track ${selectedLane + 1} clear`;
    snapshot();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    if (key === "w" || key === "arrowup") selectedLane = clamp(selectedLane - 1, 0, 2);
    if (key === "s" || key === "arrowdown") selectedLane = clamp(selectedLane + 1, 0, 2);
    if (key === "1") fireLane(0);
    if (key === "2") fireLane(1);
    if (key === "3") fireLane(2);
    if (key === " " || key === "spacebar") {
      ev.preventDefault();
      fireLane(selectedLane);
    }
    if (!running && key === "enter") reset();
  }

  function onClick(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const y = ((ev.clientY - rect.top) / rect.height) * height;
    for (let i = 0; i < laneY.length; i += 1) {
      if (Math.abs(y - laneY[i]) <= 26) {
        fireLane(i);
        break;
      }
    }
  }

  function reset() {
    raiders.splice(0, raiders.length);
    running = true;
    seconds = 0;
    score = 0;
    cargo = 100;
    sectors = 1;
    shells = 4;
    leaks = 0;
    shellCd = 0.8;
    spawnCd = 0.95;
    volleyFlash = 0;
    selectedLane = 1;
    status = "Rail stable";
    trainShift = 0;
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    shellCd -= dt;
    spawnCd -= dt;
    volleyFlash = Math.max(0, volleyFlash - dt);
    trainShift += dt * (22 + Math.min(14, sectors * 1.6));

    score += dt * (4 + sectors * 0.25);
    if (shellCd <= 0) {
      shellCd = Math.max(0.42, 0.82 - Math.min(0.25, seconds * 0.003));
      shells = Math.min(6, shells + 1);
    }

    const nextSector = Math.max(1, Math.floor(seconds / 12) + 1);
    if (nextSector !== sectors) {
      sectors = nextSector;
      cargo = clamp(cargo + 4, 0, 100);
      status = sectors % 2 === 0 ? "Station patch" : "Sector clear";
      snapshot();
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.28, 0.96 - Math.min(0.5, seconds * 0.008));
      spawnRaider(false);
      if (sectors >= 3 && Math.random() < 0.2) spawnRaider(true);
    }

    for (let i = raiders.length - 1; i >= 0; i -= 1) {
      const raider = raiders[i];
      raider.x -= raider.speed * dt;
      if (raider.x <= 142) {
        raiders.splice(i, 1);
        leaks += 1;
        cargo -= raider.heavy ? 18 : 10;
        status = raider.heavy ? "Heavy hit the convoy" : "Cargo car breached";
        snapshot();
      }
    }

    if (cargo <= 0 || leaks >= 6) {
      cargo = Math.max(0, cargo);
      running = false;
      status = "Convoy lost";
      snapshot();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  CARGO ${Math.round(cargo)}  SHELLS ${shells}`, 12, 18);
    ctx.fillText(running ? "Click a track or press 1 / 2 / 3. Space fires the armed lane." : "Run ended · press Enter to restart", 12, 34);

    for (let i = 0; i < laneY.length; i += 1) {
      const y = laneY[i];
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(22, y - 18, width - 44, 36);
      ctx.strokeStyle = i === selectedLane ? "rgba(255,210,120,0.75)" : "rgba(255,255,255,0.1)";
      ctx.lineWidth = i === selectedLane ? 3 : 1;
      ctx.strokeRect(20, y - 20, width - 40, 40);
    }

    const sway = Math.sin(trainShift * 0.035) * 8;
    const engineX = 116 + sway;
    for (let i = 0; i < 3; i += 1) {
      const y = laneY[i] - 14;
      ctx.fillStyle = i === selectedLane ? "rgba(255,190,90,0.78)" : "rgba(170,140,255,0.38)";
      ctx.fillRect(engineX, y, 52, 28);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillRect(engineX + 54, y + 4, 28, 20);
      ctx.fillRect(engineX + 86, y + 4, 28, 20);
    }

    if (volleyFlash > 0) {
      ctx.strokeStyle = "rgba(255,250,190,0.75)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(engineX + 112, laneY[selectedLane]);
      ctx.lineTo(width - 28, laneY[selectedLane]);
      ctx.stroke();
    }

    for (const raider of raiders) {
      const y = laneY[raider.lane];
      ctx.fillStyle = raider.heavy ? "rgba(255,110,80,0.92)" : "rgba(255,120,180,0.9)";
      ctx.fillRect(raider.x, y - 13, raider.heavy ? 26 : 18, raider.heavy ? 26 : 18);
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
