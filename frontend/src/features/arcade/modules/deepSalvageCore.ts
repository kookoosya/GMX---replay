export interface DeepSalvageSnapshot {
  score: number;
  hp: number;
  oxygen: number;
  depth: number;
  salvage: number;
  shield: number;
  seconds: number;
  abyss: number;
  pressureBand: string;
  status: string;
}

export interface DeepSalvageModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: DeepSalvageSnapshot) => void;
}

interface SalvageNode {
  x: number;
  y: number;
  r: number;
  value: number;
  kind: "scrap" | "core" | "beacon";
}

interface Hazard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function len(x: number, y: number) {
  return Math.sqrt(x * x + y * y) || 1;
}

export function mountDeepSalvageCore(host: HTMLElement, options: DeepSalvageModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(5,16,28,0.98),rgba(4,22,34,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const keys = new Set<string>();
  const player = {
    x: width * 0.5,
    y: 72,
    r: 12,
    hp: 100,
    oxygen: 100,
    pulse: 0,
  };
  const salvageNodes: SalvageNode[] = [];
  const hazards: Hazard[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let salvage = 0;
  let shield = 0;
  let surfaceBuffer = 2.5;
  let abyss = 0;
  let salvageCd = 0.8;
  let hazardCd = 3.2;
  let status = "Launch bay";

  function resolvePressureBand() {
    if (!running && player.hp <= 0) return "Hull break";
    if (player.oxygen <= 15) return "Oxygen redline";
    const depthRatio = clamp((player.y - 82) / Math.max(1, height - 100), 0, 1.2);
    if (abyss > 0 || depthRatio > 0.82) return "Abyss hold";
    if (depthRatio > 0.66) return "Crush band";
    if (depthRatio > 0.4) return "Deep band";
    return "Surface band";
  }

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hp: Math.max(0, Math.round(player.hp)),
      oxygen: Math.max(0, Math.round(player.oxygen)),
      depth: Math.max(0, Math.round(((player.y - 50) / Math.max(1, height - 92)) * 1000)),
      salvage,
      shield,
      seconds: Math.max(0, Math.round(seconds)),
      abyss: Math.max(0, Math.round(abyss)),
      pressureBand: resolvePressureBand(),
      status,
    });
  }

  function spawnSalvage() {
    const deepBias = 0.35 + Math.min(0.35, seconds * 0.004);
    const y = 86 + Math.random() * (height - 116);
    const x = 42 + Math.random() * (width - 84);
    const beaconChance = seconds > 24 && Math.random() < 0.12 + Math.min(0.08, seconds * 0.0015);
    const coreChance = !beaconChance && Math.random() < 0.14 + deepBias * 0.08;
    salvageNodes.push({
      x,
      y,
      r: beaconChance ? 9 : coreChance ? 11 : 8,
      value: beaconChance ? 32 : coreChance ? 56 : 24,
      kind: beaconChance ? "beacon" : coreChance ? "core" : "scrap",
    });
  }

  function spawnHazard() {
    const fromLeft = Math.random() < 0.5;
    const y = 92 + Math.random() * (height - 130);
    const x = fromLeft ? -20 : width + 20;
    const targetX = player.x + (Math.random() * 80 - 40);
    const targetY = player.y + (Math.random() * 40 - 20);
    const dx = targetX - x;
    const dy = targetY - y;
    const mag = len(dx, dy);
    const speed = 88 + Math.min(80, seconds * 1.8) + Math.random() * 24;
    hazards.push({ x, y, vx: (dx / mag) * speed, vy: (dy / mag) * speed, r: 10, life: 7.5 });
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    keys.add(k);
    if (!running && (k === "enter" || k === " ")) reset();
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function reset() {
    salvageNodes.splice(0, salvageNodes.length);
    hazards.splice(0, hazards.length);
    running = true;
    seconds = 0;
    score = 0;
    salvage = 0;
    shield = 0;
    surfaceBuffer = 2.5;
    abyss = 0;
    salvageCd = 0.8;
    hazardCd = 3.2;
    status = "Launch bay";
    player.x = width * 0.5;
    player.y = 72;
    player.hp = 100;
    player.oxygen = 100;
    player.pulse = 0;
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    player.pulse = Math.max(0, player.pulse - dt);
    abyss = Math.max(0, abyss - dt);
    salvageCd -= dt;
    hazardCd -= dt;

    let mx = 0;
    let my = 0;
    if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright")) mx += 1;
    if (keys.has("w") || keys.has("arrowup")) my -= 1;
    if (keys.has("s") || keys.has("arrowdown")) my += 1;
    const moveMag = len(mx, my);
    const moveSpeed = 150 + Math.min(55, salvage * 0.8);
    player.x = clamp(player.x + (mx / moveMag) * moveSpeed * dt, 18, width - 18);
    player.y = clamp(player.y + (my / moveMag) * moveSpeed * dt, 54, height - 18);

    const atSurface = player.y <= 82;
    if (atSurface) {
      player.oxygen = clamp(player.oxygen + dt * 30, 0, 100);
      player.hp = clamp(player.hp + dt * 5, 0, 100);
      surfaceBuffer = Math.min(3.5, surfaceBuffer + dt * 1.2);
      if (surfaceBuffer > 1.2) status = "Surfacing";
      score += dt * (1 + salvage * 0.05);
    } else {
      const depthRatio = clamp((player.y - 82) / Math.max(1, height - 100), 0, 1.2);
      const oxygenDrain = 5 + depthRatio * 13 + Math.max(0, salvage - 4) * 0.22 + (abyss > 0 ? 3.5 : 0);
      player.oxygen = clamp(player.oxygen - dt * oxygenDrain, 0, 100);
      surfaceBuffer = Math.max(0, surfaceBuffer - dt * (0.8 + depthRatio));
      score += dt * (3 + depthRatio * 6 + salvage * 0.07 + (abyss > 0 ? 1.8 : 0));
      if (depthRatio > 0.8 && seconds > 28) {
        abyss = Math.max(abyss, 5.5);
        status = "Abyss current";
      } else if (depthRatio > 0.66) status = "Deep pressure";
      else status = "Salvage run";
      if (player.oxygen <= 0) {
        player.hp = clamp(player.hp - dt * (10 + depthRatio * 14), 0, 100);
        status = "Oxygen debt";
      }
      if (depthRatio > 0.78 && surfaceBuffer <= 0) {
        player.hp = clamp(player.hp - dt * (5 + depthRatio * 9), 0, 100);
        status = "Hull stress";
      }
    }

    if (salvageCd <= 0) {
      salvageCd = Math.max(0.38, 0.9 - Math.min(0.4, seconds * 0.01));
      if (salvageNodes.length < 7) spawnSalvage();
    }

    if (hazardCd <= 0) {
      hazardCd = Math.max(0.9, 3.2 - Math.min(1.8, seconds * 0.025));
      if (seconds > 14) {
        spawnHazard();
        if (seconds > 45 && Math.random() < 0.35) spawnHazard();
        if (abyss > 0 && Math.random() < 0.45) spawnHazard();
        status = abyss > 0 ? "Abyss contact" : "Echo contact";
      }
    }

    for (let i = salvageNodes.length - 1; i >= 0; i -= 1) {
      const node = salvageNodes[i];
      const dx = node.x - player.x;
      const dy = node.y - player.y;
      if (dx * dx + dy * dy <= (node.r + player.r) * (node.r + player.r)) {
        salvage += node.kind === "core" ? 2 : 1;
        score += node.value;
        if (node.kind === "beacon") {
          shield = Math.min(3, shield + 1 + (abyss > 0 ? 1 : 0));
          player.oxygen = clamp(player.oxygen + 10, 0, 100);
          player.hp = clamp(player.hp + 4, 0, 100);
          abyss = Math.max(0, abyss - 1.25);
          status = abyss > 0 ? "Beacon surge" : "Beacon charge";
        } else {
          player.oxygen = clamp(player.oxygen + (node.kind === "core" ? 14 : 6), 0, 100);
          player.hp = clamp(player.hp + (node.kind === "core" ? 8 : 3), 0, 100);
          status = node.kind === "core" ? "Core secured" : "Scrap secured";
        }
        salvageNodes.splice(i, 1);
        snapshot();
      }
    }

    for (let i = hazards.length - 1; i >= 0; i -= 1) {
      const hazard = hazards[i];
      hazard.life -= dt;
      if (hazard.life <= 0) {
        hazards.splice(i, 1);
        continue;
      }
      const dx = player.x - hazard.x;
      const dy = player.y - hazard.y;
      const mag = len(dx, dy);
      const drift = 0.7 + Math.min(0.6, seconds * 0.01);
      hazard.vx += (dx / mag) * 12 * dt;
      hazard.vy += (dy / mag) * 12 * dt;
      hazard.x += hazard.vx * drift * dt;
      hazard.y += hazard.vy * drift * dt;
      if (dx * dx + dy * dy <= (hazard.r + player.r) * (hazard.r + player.r)) {
        if (shield > 0) {
          shield -= 1;
          player.pulse = 0.45;
          abyss = Math.max(0, abyss - 0.75);
          status = abyss > 0 ? "Shield burned in abyss" : "Shield burned";
          hazards.splice(i, 1);
          snapshot();
          continue;
        }
        player.hp = clamp(player.hp - (abyss > 0 ? 24 : 18), 0, 100);
        player.oxygen = clamp(player.oxygen - (abyss > 0 ? 15 : 10), 0, 100);
        player.pulse = 0.45;
        status = abyss > 0 ? "Abyss hit" : "Contact hit";
        hazards.splice(i, 1);
        snapshot();
      }
    }

    if (player.hp <= 0) {
      player.hp = 0;
      running = false;
      status = "Hull lost";
      snapshot();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(120,220,255,0.08)");
    grad.addColorStop(0.25, "rgba(90,180,255,0.05)");
    grad.addColorStop(1, "rgba(20,40,60,0.24)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(160,235,255,0.08)";
    ctx.fillRect(0, 48, width, 8);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`HP ${Math.round(player.hp)}  O2 ${Math.round(player.oxygen)}  SHIELD ${shield}  SALVAGE ${salvage}  SCORE ${Math.round(score)}`, 12, 18);
    ctx.fillText(status, 12, 34);

    for (let y = 92; y < height; y += 42) {
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(0, y, width, 1);
    }

    for (const node of salvageNodes) {
      ctx.fillStyle = node.kind === "core" ? "rgba(255,205,120,0.92)" : node.kind === "beacon" ? "rgba(145,180,255,0.9)" : "rgba(120,255,220,0.88)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
      if (node.kind === "core" || node.kind === "beacon") {
        ctx.strokeStyle = node.kind === "core" ? "rgba(255,245,190,0.75)" : "rgba(205,225,255,0.78)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (const hazard of hazards) {
      ctx.fillStyle = "rgba(255,110,110,0.82)";
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.pulse > 0) {
      ctx.strokeStyle = "rgba(255,190,160,0.35)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(190,245,255,0.96)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20,40,60,0.9)";
    ctx.fillRect(player.x + 2, player.y - 3, 7, 6);

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const title = "Dive lost";
      ctx.fillText(title, width * 0.5 - ctx.measureText(title).width * 0.5, height * 0.46);
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      const hint = "Press Enter to launch again";
      ctx.fillText(hint, width * 0.5 - ctx.measureText(hint).width * 0.5, height * 0.56);
    }
  }

  function loop(now: number) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    draw();
    snapshot();
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
