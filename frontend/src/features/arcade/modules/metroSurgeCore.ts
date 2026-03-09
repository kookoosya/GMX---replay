export interface MetroSurgeSnapshot {
  score: number;
  streak: number;
  waves: number;
  seconds: number;
  overloaded: number;
  reserve: number;
  status: string;
}

export interface MetroSurgeModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: MetroSurgeSnapshot) => void;
}

interface Lane {
  load: number;
  cooldown: number;
  broken: boolean;
}

export function mountMetroSurgeCore(host: HTMLElement, options: MetroSurgeModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(10,14,28,0.98),rgba(7,18,34,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const lanes: Lane[] = [
    { load: 18, cooldown: 0, broken: false },
    { load: 12, cooldown: 0, broken: false },
    { load: 22, cooldown: 0, broken: false },
  ];
  const laneHeight = 72;
  const laneGap = 18;
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let streak = 0;
  let waves = 0;
  let overloaded = 0;
  let reserve = 1;
  let eventCd = 1.15;
  let status = "Dispatching";

  function snapshot() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      streak,
      waves,
      seconds: Math.max(0, Math.round(seconds)),
      overloaded,
      reserve: Math.max(0, Math.round(reserve * 10) / 10),
      status,
    });
  }

  function laneAt(y: number) {
    for (let i = 0; i < 3; i += 1) {
      const top = 42 + i * (laneHeight + laneGap);
      const bottom = top + laneHeight;
      if (y >= top && y <= bottom) return i;
    }
    return -1;
  }

  function onClick(ev: MouseEvent) {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((ev.clientY - rect.top) / rect.height) * height;
    const idx = laneAt(y);
    if (idx < 0) return;
    const lane = lanes[idx];
    if (lane.broken) {
      if (reserve >= 2) {
        reserve = Math.max(0, reserve - 2);
        lane.broken = false;
        lane.load = 46;
        lane.cooldown = 2.2;
        status = `Emergency patch on line ${idx + 1}`;
        score += 28;
        snapshot();
      } else {
        status = "Need 2 reserve to patch";
      }
      return;
    }
    if (lane.cooldown > 0) {
      status = "Dispatch cooling";
      return;
    }
    const relief = 26 + Math.random() * 10 + Math.min(10, reserve * 4);
    lane.load = Math.max(0, lane.load - relief);
    lane.cooldown = 1.5;
    streak += 1;
    score += 12 + streak * 2;
    status = `Line ${idx + 1} relieved`;
    snapshot();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    score += dt * (4 + streak * 0.1);
    eventCd -= dt;
    reserve = Math.min(3, reserve + dt * (0.14 + Math.min(0.06, streak * 0.0025)));

    for (const lane of lanes) {
      if (lane.broken) continue;
      lane.cooldown = Math.max(0, lane.cooldown - dt);
      lane.load = Math.min(120, lane.load + dt * (5.5 + Math.min(5, seconds * 0.06)));
      if (lane.load >= 100) {
        lane.broken = true;
        overloaded += 1;
        streak = 0;
        status = "Line failure";
        snapshot();
      }
    }

    if (eventCd <= 0) {
      eventCd = Math.max(0.28, 1.15 - Math.min(0.82, seconds * 0.01));
      const idx = Math.floor(Math.random() * 3);
      const lane = lanes[idx];
      if (!lane.broken) {
        lane.load = Math.min(120, lane.load + 16 + Math.random() * 18);
        waves += 1;
        status = `Surge on line ${idx + 1}`;
        if (seconds > 38 && Math.random() < 0.32) {
          const idx2 = (idx + 1 + Math.floor(Math.random() * 2)) % 3;
          const lane2 = lanes[idx2];
          if (!lane2.broken) lane2.load = Math.min(120, lane2.load + 10 + Math.random() * 14);
          waves += 1;
          status = "Cross-grid surge";
        }
      }
    }

    if (overloaded >= 4) {
      running = false;
      status = "Network down";
      snapshot();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  STREAK ${streak}  EVENTS ${waves}`, 12, 18);
    ctx.fillText(running ? "Click a lane to dispatch relief" : "Run ended · refresh module to restart", 12, 34);

    for (let i = 0; i < 3; i += 1) {
      const lane = lanes[i];
      const top = 42 + i * (laneHeight + laneGap);
      const left = 18;
      const barW = width - 36;
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(left, top, barW, laneHeight);
      const fillW = Math.max(0, Math.min(barW, (lane.load / 100) * barW));
      ctx.fillStyle = lane.broken ? "rgba(255,90,90,0.85)" : lane.load > 70 ? "rgba(255,185,80,0.88)" : "rgba(90,230,255,0.82)";
      ctx.fillRect(left, top, fillW, laneHeight);
      if (lane.cooldown > 0 && !lane.broken) {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(left, top, barW, laneHeight);
      }
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(`Line ${i + 1} · ${lane.broken ? "Broken" : `${Math.round(lane.load)} load`}`, left + 10, top + 18);
      ctx.fillText(lane.broken ? (reserve >= 2 ? "Click to patch" : "Need 2 reserve") : lane.cooldown > 0 ? `Dispatch cooldown ${lane.cooldown.toFixed(1)}s` : "Click to dispatch", left + 10, top + 40);
    }
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    if (running) snapshot();
    raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener("click", onClick);
  snapshot();
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
      try {
        if (host.contains(canvas)) host.removeChild(canvas);
      } catch {}
    },
  };
}
