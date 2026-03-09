export interface IonSwitchSnapshot {
  score: number;
  stability: number;
  flips: number;
  overloads: number;
  charge: number;
  seconds: number;
  status: string;
}

export interface IonSwitchModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: IonSwitchSnapshot) => void;
}

interface NodeCell {
  flux: number;
  cooldown: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function mountIonSwitchCore(host: HTMLElement, options: IonSwitchModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(10,16,32,0.98),rgba(7,10,22,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const cells: NodeCell[] = [
    { flux: 18, cooldown: 0 },
    { flux: 26, cooldown: 0 },
    { flux: 14, cooldown: 0 },
    { flux: 22, cooldown: 0 },
  ];
  const rects = [
    { x: 18, y: 54, w: 228, h: 92 },
    { x: 274, y: 54, w: 228, h: 92 },
    { x: 18, y: 182, w: 228, h: 92 },
    { x: 274, y: 182, w: 228, h: 92 },
  ];

  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let stability = 100;
  let flips = 0;
  let overloads = 0;
  let charge = 12;
  let surgeCd = 1.06;
  let purgeFx = 0;
  let status = "Grid stable";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      stability: Math.max(0, Math.round(stability)),
      flips,
      overloads,
      charge: Math.max(0, Math.round(charge)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function reroute(index: number) {
    if (!running) return;
    const cell = cells[index];
    if (!cell) return;
    if (cell.cooldown > 0) {
      status = `Node ${index + 1} cooling`;
      emit();
      return;
    }
    const relief = 26 + Math.random() * 12 + Math.min(14, charge * 0.08);
    cell.flux = Math.max(0, cell.flux - relief);
    cell.cooldown = 1.28;
    flips += 1;
    charge = clamp(charge + 9, 0, 100);
    score += 12 + flips * 1.6;
    let spill = 0;
    for (let i = 0; i < cells.length; i += 1) {
      if (i === index) continue;
      const offset = 4 + Math.random() * 4;
      cells[i].flux = Math.min(120, cells[i].flux + offset);
      spill += offset;
    }
    if (cell.flux <= 12 && stability < 100) {
      stability = clamp(stability + 2.8, 0, 100);
      status = `Node ${index + 1} clean reroute`;
    } else {
      status = `Node ${index + 1} flipped`;
    }
    score += Math.max(0, 5 - spill * 0.1);
    emit();
  }

  function purge() {
    if (!running) {
      reset();
      return;
    }
    if (charge < 100) {
      status = "Purge charging";
      emit();
      return;
    }
    charge = 0;
    purgeFx = 0.34;
    stability = clamp(stability + 8, 0, 100);
    let cleared = 0;
    for (const cell of cells) {
      if (cell.flux > 18) cleared += 1;
      cell.flux = Math.max(0, cell.flux - (22 + Math.random() * 12));
      cell.cooldown = Math.max(cell.cooldown, 0.45);
    }
    score += 26 + cleared * 8;
    status = cleared ? "Grid purge" : "Purge cycled";
    emit();
  }

  function onClick(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * width;
    const y = ((ev.clientY - rect.top) / rect.height) * height;
    for (let i = 0; i < rects.length; i += 1) {
      const box = rects[i];
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        reroute(i);
        return;
      }
    }
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    if (key === "1") reroute(0);
    if (key === "2") reroute(1);
    if (key === "3") reroute(2);
    if (key === "4") reroute(3);
    if (key === "f" || key === " ") purge();
    if (!running && key === "enter") reset();
  }

  function reset() {
    cells[0].flux = 18;
    cells[1].flux = 26;
    cells[2].flux = 14;
    cells[3].flux = 22;
    for (const cell of cells) cell.cooldown = 0;
    running = true;
    seconds = 0;
    score = 0;
    stability = 100;
    flips = 0;
    overloads = 0;
    charge = 12;
    surgeCd = 1.06;
    purgeFx = 0;
    status = "Grid stable";
    emit();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    score += dt * (4.2 + flips * 0.12 + Math.max(0, stability - 25) * 0.01);
    surgeCd -= dt;
    purgeFx = Math.max(0, purgeFx - dt);

    for (const cell of cells) {
      cell.cooldown = Math.max(0, cell.cooldown - dt);
      cell.flux = Math.min(120, cell.flux + dt * (5.6 + Math.min(4.8, seconds * 0.05)));
    }

    if (surgeCd <= 0) {
      surgeCd = Math.max(0.24, 1.06 - Math.min(0.72, seconds * 0.008));
      const idx = Math.floor(Math.random() * cells.length);
      cells[idx].flux = Math.min(120, cells[idx].flux + 12 + Math.random() * 16);
      if (seconds > 18 && Math.random() < 0.34) {
        const idx2 = (idx + 1 + Math.floor(Math.random() * 3)) % cells.length;
        cells[idx2].flux = Math.min(120, cells[idx2].flux + 9 + Math.random() * 12);
        status = "Split surge";
      } else {
        status = `Surge at node ${idx + 1}`;
      }
      if (seconds > 28 && Math.random() < 0.18) {
        charge = clamp(charge + 6, 0, 100);
        status = "Ion cache recovered";
      }
    }

    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      if (cell.flux < 100) continue;
      overloads += 1;
      stability = clamp(stability - 10.5, 0, 100);
      charge = clamp(charge - 10, 0, 100);
      cell.flux = 48 + Math.random() * 12;
      cell.cooldown = Math.max(cell.cooldown, 0.8);
      status = `Node ${i + 1} overloaded`;
      emit();
    }

    if (stability <= 0 || overloads >= 8) {
      running = false;
      stability = Math.max(0, stability);
      status = "Grid collapse";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SCORE ${Math.round(score)}  FLIPS ${flips}  OVERLOADS ${overloads}`, 12, 18);
    ctx.fillText(running ? "Click a node or press 1-4 to reroute · F to purge" : "Grid collapse · press Enter or F to restart", 12, 34);

    for (let i = 0; i < rects.length; i += 1) {
      const box = rects[i];
      const cell = cells[i];
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      const barW = box.w - 20;
      const fillW = Math.max(0, Math.min(barW, (cell.flux / 100) * barW));
      ctx.fillStyle = cell.flux >= 85 ? "rgba(255,96,96,0.9)" : cell.flux >= 60 ? "rgba(255,194,92,0.9)" : "rgba(92,220,255,0.86)";
      ctx.fillRect(box.x + 10, box.y + 34, fillW, 22);
      if (purgeFx > 0) {
        ctx.strokeStyle = `rgba(120,220,255,${0.18 + purgeFx * 0.8})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
      }
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(`Node ${i + 1}`, box.x + 10, box.y + 18);
      ctx.fillText(`${Math.round(cell.flux)} flux`, box.x + 10, box.y + 74);
      ctx.fillText(cell.cooldown > 0 ? `Cooling ${cell.cooldown.toFixed(1)}s` : "Ready to flip", box.x + 110, box.y + 74);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(18, 292, 484, 12);
    ctx.fillStyle = "rgba(120,220,255,0.86)";
    ctx.fillRect(18, 292, (charge / 100) * 484, 12);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`STABILITY ${Math.round(stability)}   PURGE ${Math.round(charge)}%`, 18, 286);
  }

  function loop(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    if (running) emit();
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
