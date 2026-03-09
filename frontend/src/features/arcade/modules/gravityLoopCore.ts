export interface GravityLoopSnapshot {
  score: number;
  hp: number;
  laps: number;
  ring: number;
  seconds: number;
  status: string;
}

export interface GravityLoopModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: GravityLoopSnapshot) => void;
}

interface Hazard {
  ring: number;
  angle: number;
  width: number;
  speed: number;
  pulse: number;
}

interface Gate {
  ring: number;
  angle: number;
  width: number;
  speed: number;
  life: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function wrapAngle(angle: number) {
  const two = Math.PI * 2;
  let next = angle;
  while (next < 0) next += two;
  while (next >= two) next -= two;
  return next;
}

function angleDelta(a: number, b: number) {
  const two = Math.PI * 2;
  let diff = Math.abs(a - b) % two;
  if (diff > Math.PI) diff = two - diff;
  return diff;
}

function angularOverlap(a: number, b: number, widthA: number, widthB: number) {
  return angleDelta(a, b) <= (widthA + widthB) * 0.5;
}

export function mountGravityLoopCore(host: HTMLElement, options: GravityLoopModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(6,10,28,0.98),rgba(14,10,34,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const centerX = width * 0.5;
  const centerY = height * 0.52;
  const ringRadii = [56, 92, 128];
  const keys = new Set<string>();
  const hazards: Hazard[] = [];
  const gates: Gate[] = [];
  const player = { ring: 1, angle: -Math.PI / 2, hp: 100 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let laps = 0;
  let rotationSpeed = 1.45;
  let spawnCd = 0.95;
  let gateCd = 1.6;
  let phaseAccum = 0;
  let immunity = 0;
  let status = "Orbit stable";

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hp: Math.max(0, Math.round(player.hp)),
      laps,
      ring: player.ring + 1,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnHazard() {
    hazards.push({
      ring: Math.floor(Math.random() * 3),
      angle: wrapAngle(player.angle + Math.PI + (Math.random() - 0.5) * 0.9),
      width: 0.28 + Math.random() * 0.2,
      speed: 0.45 + Math.random() * 0.4 + Math.min(0.55, seconds * 0.01),
      pulse: Math.random() * Math.PI * 2,
    });
  }

  function spawnGate() {
    gates.push({
      ring: Math.floor(Math.random() * 3),
      angle: Math.random() * Math.PI * 2,
      width: 0.18,
      speed: 0.22 + Math.random() * 0.18,
      life: 10,
    });
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    keys.add(key);
    if (!running && key === "enter") reset();
  }

  function onKeyUp(ev: KeyboardEvent) {
    keys.delete(ev.key.toLowerCase());
  }

  function reset() {
    hazards.splice(0, hazards.length);
    gates.splice(0, gates.length);
    player.ring = 1;
    player.angle = -Math.PI / 2;
    player.hp = 100;
    running = true;
    seconds = 0;
    score = 0;
    laps = 0;
    rotationSpeed = 1.45;
    spawnCd = 0.95;
    gateCd = 1.6;
    phaseAccum = 0;
    immunity = 0;
    status = "Orbit stable";
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    immunity = Math.max(0, immunity - dt);

    rotationSpeed = 1.45 + Math.min(1.8, seconds * 0.02) + Math.min(0.35, laps * 0.03);
    if (keys.has("w") || keys.has("arrowup")) player.ring = clamp(player.ring + 1, 0, 2);
    if (keys.has("s") || keys.has("arrowdown")) player.ring = clamp(player.ring - 1, 0, 2);
    if (keys.has("a") || keys.has("arrowleft")) player.angle -= dt * 0.95;
    if (keys.has("d") || keys.has("arrowright")) player.angle += dt * 0.95;

    player.angle = wrapAngle(player.angle + rotationSpeed * dt);
    phaseAccum += rotationSpeed * dt;
    while (phaseAccum >= Math.PI * 2) {
      phaseAccum -= Math.PI * 2;
      laps += 1;
      score += 28 + laps * 2;
      status = laps % 3 === 0 ? "Sector mutating" : "Loop clear";
      snapshot();
    }

    score += dt * (5 + player.ring * 0.8 + laps * 0.1);
    spawnCd -= dt;
    gateCd -= dt;
    if (spawnCd <= 0) {
      spawnCd = Math.max(0.34, 0.95 - Math.min(0.45, seconds * 0.01));
      spawnHazard();
      if (laps >= 2 && Math.random() < 0.28) spawnHazard();
    }
    if (gateCd <= 0) {
      gateCd = Math.max(0.8, 1.8 - Math.min(0.6, seconds * 0.01));
      spawnGate();
    }

    for (let i = hazards.length - 1; i >= 0; i -= 1) {
      const hazard = hazards[i];
      hazard.angle = wrapAngle(hazard.angle - hazard.speed * dt);
      hazard.pulse += dt * 4;
      if (hazard.ring === player.ring && immunity <= 0 && angularOverlap(hazard.angle, player.angle, hazard.width, 0.12)) {
        player.hp -= 14 + laps * 0.8;
        immunity = 0.55;
        status = "Gravity hit";
        if (player.hp <= 0) {
          player.hp = 0;
          running = false;
          status = "Orbit collapsed";
        }
        snapshot();
      }
    }

    for (let i = gates.length - 1; i >= 0; i -= 1) {
      const gate = gates[i];
      gate.angle = wrapAngle(gate.angle - gate.speed * dt);
      gate.life -= dt;
      if (gate.life <= 0) {
        gates.splice(i, 1);
        continue;
      }
      if (gate.ring === player.ring && angularOverlap(gate.angle, player.angle, gate.width, 0.1)) {
        score += 22;
        player.hp = clamp(player.hp + 6, 0, 100);
        status = "Gate captured";
        gates.splice(i, 1);
        snapshot();
      }
    }
  }

  function drawArc(radius: number, angle: number, widthRad: number, lineWidth: number, stroke: string) {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.arc(centerX, centerY, radius, angle - widthRad * 0.5, angle + widthRad * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  HP ${Math.round(player.hp)}  LAPS ${laps}`, 12, 18);
    ctx.fillText(running ? "Orbit rises every lap" : "Run ended · press Enter to restart", 12, 34);

    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.lineWidth = i === player.ring ? 5 : 2;
      ctx.strokeStyle = i === player.ring ? "rgba(130,235,255,0.45)" : "rgba(255,255,255,0.12)";
      ctx.arc(centerX, centerY, ringRadii[i], 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const hazard of hazards) {
      const radius = ringRadii[hazard.ring];
      drawArc(radius, hazard.angle, hazard.width, 12, `rgba(255,110,170,${0.45 + Math.abs(Math.sin(hazard.pulse)) * 0.25})`);
    }

    for (const gate of gates) {
      drawArc(ringRadii[gate.ring], gate.angle, gate.width, 8, "rgba(150,255,190,0.78)");
    }

    const radius = ringRadii[player.ring];
    const px = centerX + Math.cos(player.angle) * radius;
    const py = centerY + Math.sin(player.angle) * radius;
    ctx.fillStyle = immunity > 0 ? "rgba(255,230,120,0.95)" : "rgba(120,225,255,0.95)";
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`Ring ${player.ring + 1}`, centerX - 20, centerY + 4);
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
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
