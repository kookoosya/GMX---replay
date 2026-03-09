export interface ThermalDropSnapshot {
  score: number;
  hull: number;
  heat: number;
  coolant: number;
  depth: number;
  seconds: number;
  status: string;
}

export interface ThermalDropModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: ThermalDropSnapshot) => void;
}

type PocketKind = "cool" | "cache" | "flare";

interface Pocket {
  x: number;
  y: number;
  lane: number;
  kind: PocketKind;
  r: number;
  speed: number;
  pulse: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountThermalDropCore(host: HTMLElement, options: ThermalDropModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 300;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(24,10,10,0.98),rgba(10,18,32,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneX = [118, 260, 402];
  const pockets: Pocket[] = [];
  const diver = { lane: 1, targetLane: 1, hull: 100, heat: 22, coolant: 2, pulse: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let depth = 0;
  let drift = 0;
  let pocketCd = 0.8;
  let meltTick = 0;
  let ventGlow = 0;
  let status = "Drop stable";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hull: Math.max(0, Math.round(diver.hull)),
      heat: Math.max(0, Math.round(diver.heat)),
      coolant: diver.coolant,
      depth: Math.max(0, Math.round(depth)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnPocket() {
    const lane = Math.floor(Math.random() * laneX.length);
    const roll = Math.random();
    const kind: PocketKind = roll < 0.22 ? "flare" : roll < 0.58 ? "cache" : "cool";
    pockets.push({
      x: laneX[lane],
      y: -24,
      lane,
      kind,
      r: kind === "flare" ? 11 : kind === "cache" ? 9 : 10,
      speed: 150 + Math.min(160, seconds * 1.8) + Math.random() * 20,
      pulse: 0,
    });
  }

  function setLane(next: number) {
    const lane = clamp(next, 0, laneX.length - 1);
    if (lane !== diver.targetLane) {
      diver.targetLane = lane;
      status = lane > diver.lane ? "Sliding right" : "Sliding left";
      emit();
    }
  }

  function reset() {
    pockets.splice(0, pockets.length);
    running = true;
    seconds = 0;
    score = 0;
    depth = 0;
    drift = 0;
    pocketCd = 0.8;
    meltTick = 0;
    ventGlow = 0;
    status = "Drop stable";
    diver.lane = 1;
    diver.targetLane = 1;
    diver.hull = 100;
    diver.heat = 22;
    diver.coolant = 2;
    diver.pulse = 0;
    emit();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowleft" || k === "a") setLane(diver.targetLane - 1);
    if (k === "arrowright" || k === "d") setLane(diver.targetLane + 1);
    if (k === " " || k === "space") {
      if (running && diver.coolant > 0) {
        diver.coolant -= 1;
        diver.heat = clamp(diver.heat - 26, 0, 100);
        ventGlow = 0.6;
        status = "Coolant vent";
        emit();
      } else if (!running) {
        reset();
      }
    }
    if (!running && k === "enter") reset();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    depth += dt * (42 + Math.min(28, seconds * 0.4));
    drift += dt;
    pocketCd -= dt;
    ventGlow = Math.max(0, ventGlow - dt);
    diver.pulse = Math.max(0, diver.pulse - dt);

    if (diver.lane !== diver.targetLane) diver.lane = diver.targetLane;

    diver.heat = clamp(diver.heat + dt * (4.2 + Math.min(6.6, seconds * 0.12)), 0, 100);
    if (Math.floor(seconds / 12) > Math.floor((seconds - dt) / 12)) {
      status = "Thermal wall";
      diver.heat = clamp(diver.heat + 10, 0, 100);
      emit();
    }

    if (pocketCd <= 0) {
      pocketCd = Math.max(0.22, 0.88 - Math.min(0.5, seconds * 0.012));
      spawnPocket();
      if (seconds > 28 && Math.random() < 0.24) spawnPocket();
    }

    score += dt * (2.2 + Math.max(0, 100 - diver.heat) * 0.04);

    for (let i = pockets.length - 1; i >= 0; i -= 1) {
      const pocket = pockets[i];
      pocket.pulse = Math.max(0, pocket.pulse - dt);
      pocket.y += pocket.speed * dt;
      if (pocket.y >= height - 76) {
        const hitLane = pocket.lane === diver.lane;
        if (hitLane) {
          if (pocket.kind === "cool") {
            diver.heat = clamp(diver.heat - 18, 0, 100);
            score += 18;
            status = "Cool pocket";
          } else if (pocket.kind === "cache") {
            diver.coolant = Math.min(4, diver.coolant + 1);
            score += 22;
            status = "Coolant cache";
          } else {
            diver.heat = clamp(diver.heat + 20, 0, 100);
            diver.hull = clamp(diver.hull - 14, 0, 100);
            diver.pulse = 0.35;
            status = "Flare impact";
          }
          emit();
        }
        pockets.splice(i, 1);
      }
    }

    if (diver.heat >= 100) {
      meltTick += dt;
      if (meltTick >= 0.35) {
        meltTick = 0;
        diver.hull = clamp(diver.hull - 5, 0, 100);
        status = "Hull cooking";
        emit();
      }
    } else {
      meltTick = 0;
    }

    if (diver.hull <= 0) {
      diver.hull = 0;
      running = false;
      status = "Dive lost";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(44,18,12,1)");
    gradient.addColorStop(1, "rgba(8,16,34,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < laneX.length; i += 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneX[i], 0);
      ctx.lineTo(laneX[i], height);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,120,80,0.06)";
    for (let i = 0; i < 7; i += 1) {
      const y = ((drift * 110) + i * 52) % (height + 52) - 26;
      ctx.fillRect(0, y, width, 18);
    }

    for (const pocket of pockets) {
      if (pocket.kind === "cool") ctx.fillStyle = "rgba(90,210,255,0.92)";
      else if (pocket.kind === "cache") ctx.fillStyle = "rgba(255,222,120,0.92)";
      else ctx.fillStyle = "rgba(255,110,90,0.96)";
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.r + pocket.pulse * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const diverX = laneX[diver.lane];
    const diverY = height - 62;
    ctx.fillStyle = ventGlow > 0 ? "rgba(140,230,255,0.95)" : diver.pulse > 0 ? "rgba(255,120,90,0.95)" : "rgba(220,235,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(diverX, diverY - 18);
    ctx.lineTo(diverX - 16, diverY + 16);
    ctx.lineTo(diverX + 16, diverY + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Depth ${Math.max(0, Math.round(depth))}m`, 16, 22);
    ctx.fillText(`Heat ${Math.max(0, Math.round(diver.heat))}`, 16, 40);
    ctx.fillText(`Coolant ${diver.coolant}`, 16, 58);
    ctx.fillText(`Hull ${Math.max(0, Math.round(diver.hull))}`, 16, 76);
    ctx.fillText(`Score ${Math.max(0, Math.round(score))}`, width - 118, 22);

    if (!running) {
      ctx.fillStyle = "rgba(6,8,14,0.72)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("Dive lost", width / 2 - 52, height / 2 - 8);
      ctx.font = "14px sans-serif";
      ctx.fillText("Press Enter or Space to drop again", width / 2 - 108, height / 2 + 22);
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    draw();
    raf = window.requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", onKeyDown);
  emit();
  raf = window.requestAnimationFrame(frame);

  return {
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(raf);
      host.innerHTML = "";
    },
  };
}
