export interface WardenPulseSnapshot {
  score: number;
  integrity: number;
  relays: number;
  pulses: number;
  overclock: number;
  seconds: number;
  status: string;
}

export interface WardenPulseModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: WardenPulseSnapshot) => void;
}

type IntruderKind = "packet" | "breaker" | "cache";

interface Intruder {
  lane: number;
  progress: number;
  hp: number;
  speed: number;
  kind: IntruderKind;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountWardenPulseCore(host: HTMLElement, options: WardenPulseModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 320;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,0.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(12,18,36,0.98),rgba(7,10,22,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneY = [64, 126, 188, 250];
  const intruders: Intruder[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let integrity = 100;
  let relays = 0;
  let pulses = 3;
  let overclock = 0;
  let pulseCd = 1.08;
  let spawnCd = 0.86;
  let burstFx = 0;
  let status = "Relay stable";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      integrity: Math.max(0, Math.round(integrity)),
      relays,
      pulses,
      overclock: Math.max(0, Math.round(overclock)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnIntruder(forcedKind?: IntruderKind) {
    const lane = Math.floor(Math.random() * laneY.length);
    const roll = Math.random();
    const kind: IntruderKind = forcedKind || (roll < 0.14 ? "cache" : roll < 0.82 ? "packet" : "breaker");
    intruders.push({
      lane,
      progress: 0,
      hp: kind === "breaker" ? 38 + relays * 2 : kind === "cache" ? 10 : 18 + relays * 0.8,
      speed: kind === "breaker" ? 0.08 + Math.min(0.035, seconds * 0.0008) : kind === "cache" ? 0.12 + Math.min(0.04, seconds * 0.0012) : 0.13 + Math.min(0.05, seconds * 0.0011),
      kind,
    });
  }

  function fireLane(lane: number) {
    if (!running) return;
    if (pulses <= 0) {
      status = "Pulse bank empty";
      emit();
      return;
    }
    pulses -= 1;
    burstFx = 0.18;
    let hit = false;
    for (let i = intruders.length - 1; i >= 0; i -= 1) {
      const enemy = intruders[i];
      if (enemy.lane !== lane) continue;
      enemy.hp -= enemy.kind === "breaker" ? 22 : 18;
      hit = true;
      if (enemy.hp <= 0) {
        intruders.splice(i, 1);
        if (enemy.kind === "cache") {
          pulses = Math.min(5, pulses + 2);
          integrity = clamp(integrity + 4, 0, 100);
          score += 18;
          status = `Lane ${lane + 1} cache rerouted`;
        } else if (enemy.kind === "breaker") {
          overclock = clamp(overclock + 34, 0, 100);
          score += 26;
          status = `Lane ${lane + 1} breaker cut`;
        } else {
          overclock = clamp(overclock + 18, 0, 100);
          score += 12;
          status = `Lane ${lane + 1} cleared`;
        }
      } else {
        status = `Lane ${lane + 1} pulse hit`;
      }
      emit();
      break;
    }
    if (!hit) {
      score = Math.max(0, score - 2);
      status = `Lane ${lane + 1} missed`;
      emit();
    }
  }

  function dischargeOverclock() {
    if (!running) {
      reset();
      return;
    }
    if (overclock < 100) {
      status = "Overclock charging";
      emit();
      return;
    }
    overclock = 0;
    burstFx = 0.42;
    let removed = 0;
    for (let lane = 0; lane < laneY.length; lane += 1) {
      const target = intruders.find((enemy) => enemy.lane === lane);
      if (!target) continue;
      removed += 1;
      if (target.kind === "cache") {
        pulses = Math.min(5, pulses + 1);
        integrity = clamp(integrity + 2, 0, 100);
        score += 14;
      } else {
        score += target.kind === "breaker" ? 18 : 10;
      }
      intruders.splice(intruders.indexOf(target), 1);
    }
    if (!removed) {
      pulses = Math.min(5, pulses + 1);
      status = "Overclock primed";
    } else {
      relays += 1;
      status = "Relay overclock";
    }
    emit();
  }

  function laneAt(y: number) {
    for (let i = 0; i < laneY.length; i += 1) {
      if (Math.abs(y - laneY[i]) <= 22) return i;
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
    if (key === "4") fireLane(3);
    if (key === "f" || key === " ") dischargeOverclock();
    if (!running && key === "enter") reset();
  }

  function reset() {
    intruders.splice(0, intruders.length);
    running = true;
    seconds = 0;
    score = 0;
    integrity = 100;
    relays = 0;
    pulses = 3;
    overclock = 0;
    pulseCd = 1.08;
    spawnCd = 0.86;
    burstFx = 0;
    status = "Relay stable";
    emit();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    pulseCd -= dt;
    spawnCd -= dt;
    burstFx = Math.max(0, burstFx - dt);

    score += dt * (2.4 + relays * 0.16 + Math.max(0, integrity - 30) * 0.01);

    if (pulseCd <= 0) {
      pulseCd = Math.max(0.56, 1.08 - Math.min(0.36, seconds * 0.0036));
      const prev = pulses;
      pulses = Math.min(5, pulses + 1);
      if (pulses > prev && pulses >= 4 && integrity < 55) {
        status = "Pulse bank recovered";
        emit();
      }
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.24, 0.88 - Math.min(0.5, seconds * 0.006));
      spawnIntruder();
      if (seconds > 18 && Math.random() < 0.24) spawnIntruder();
      if (seconds > 28 && Math.random() < 0.14) spawnIntruder("breaker");
      if (seconds > 10 && Math.random() < 0.1) spawnIntruder("cache");
    }

    for (let i = intruders.length - 1; i >= 0; i -= 1) {
      const enemy = intruders[i];
      enemy.progress += enemy.speed * dt * 60;
      if (enemy.progress >= 100) {
        intruders.splice(i, 1);
        if (enemy.kind === "cache") {
          score = Math.max(0, score - 4);
          status = "Cache slipped";
        } else {
          const damage = enemy.kind === "breaker" ? 18 : 9;
          integrity = clamp(integrity - damage, 0, 100);
          relays += 1;
          status = enemy.kind === "breaker" ? "Breaker reached relay" : "Relay packet leaked";
        }
        emit();
      }
    }

    if (integrity <= 0 || relays >= 8) {
      integrity = Math.max(0, integrity);
      running = false;
      status = "Relay lost";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(16,28,56,1)");
    gradient.addColorStop(1, "rgba(8,10,18,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  INTEGRITY ${Math.round(integrity)}  PULSES ${pulses}  OC ${Math.round(overclock)}%`, 12, 18);
    ctx.fillText(running ? "Click a lane or press 1-4 to pulse · F / Space for overclock" : "Run ended · press Enter or Space to restart", 12, 34);

    for (let i = 0; i < laneY.length; i += 1) {
      const y = laneY[i];
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(22, y - 18, width - 104, 36);
      ctx.fillStyle = burstFx > 0 ? "rgba(110,255,235,0.26)" : "rgba(160,230,255,0.18)";
      ctx.fillRect(width - 70, y - 20, 44, 40);
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      ctx.fillText(`Arc ${i + 1}`, 30, y - 24);
    }

    for (const enemy of intruders) {
      const y = laneY[enemy.lane];
      const x = 28 + ((enemy.progress / 100) * (width - 130));
      ctx.fillStyle = enemy.kind === "breaker" ? "rgba(255,120,90,0.92)" : enemy.kind === "cache" ? "rgba(255,220,120,0.92)" : "rgba(120,210,255,0.9)";
      const size = enemy.kind === "breaker" ? 24 : enemy.kind === "cache" ? 14 : 18;
      ctx.fillRect(x, y - size / 2, size, size);
    }

    if (burstFx > 0) {
      ctx.strokeStyle = "rgba(120,255,240,0.7)";
      ctx.lineWidth = 3;
      for (let i = 0; i < laneY.length; i += 1) {
        ctx.beginPath();
        ctx.moveTo(width - 48, laneY[i]);
        ctx.lineTo(width - 96, laneY[i]);
        ctx.stroke();
      }
    }
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    emit();
    raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown);
  emit();
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
