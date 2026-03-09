export interface GlassFrontierSnapshot {
  score: number;
  integrity: number;
  breaches: number;
  cells: number;
  mirror: number;
  focusLane: number;
  seconds: number;
  status: string;
}

export interface GlassFrontierModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: GlassFrontierSnapshot) => void;
}

type ThreatKind = "shard" | "breacher" | "cell";

interface Threat {
  lane: number;
  progress: number;
  hp: number;
  speed: number;
  kind: ThreatKind;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountGlassFrontierCore(host: HTMLElement, options: GlassFrontierModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(10,20,38,0.98),rgba(6,10,24,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneY = [78, 160, 242];
  const threats: Threat[] = [];
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let integrity = 100;
  let breaches = 0;
  let cells = 0;
  let mirror = 0;
  let focusLane = 1;
  let beamCd = 0.2;
  let spawnCd = 0.84;
  let flash = 0;
  let status = "Glass shield stable";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      integrity: Math.max(0, Math.round(integrity)),
      breaches,
      cells,
      mirror: Math.max(0, Math.round(mirror)),
      focusLane,
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnThreat(forcedKind?: ThreatKind) {
    const lane = Math.floor(Math.random() * laneY.length);
    const roll = Math.random();
    const kind: ThreatKind = forcedKind || (roll < 0.14 ? "cell" : roll < 0.82 ? "shard" : "breacher");
    threats.push({
      lane,
      progress: 0,
      hp: kind === "breacher" ? 36 + breaches * 2 : kind === "cell" ? 10 : 16 + breaches,
      speed: kind === "breacher" ? 0.07 + Math.min(0.04, seconds * 0.0009) : kind === "cell" ? 0.11 + Math.min(0.04, seconds * 0.0013) : 0.12 + Math.min(0.05, seconds * 0.0012),
      kind,
    });
  }

  function setFocus(nextLane: number) {
    if (!running) return;
    focusLane = clamp(Math.round(nextLane), 0, laneY.length - 1);
    status = `Focus lane ${focusLane + 1}`;
    emit();
  }

  function fireMirrorSurge() {
    if (!running) {
      reset();
      return;
    }
    if (mirror < 100) {
      status = "Mirror charge low";
      emit();
      return;
    }
    mirror = 0;
    flash = 0.4;
    let removed = 0;
    for (let lane = 0; lane < laneY.length; lane += 1) {
      const target = threats.find((threat) => threat.lane === lane);
      if (!target) continue;
      threats.splice(threats.indexOf(target), 1);
      removed += 1;
      if (target.kind === "cell") {
        cells += 1;
        integrity = clamp(integrity + 3, 0, 100);
        score += 14;
      } else {
        score += target.kind === "breacher" ? 18 : 10;
      }
    }
    if (!removed) {
      status = "Mirror surge spent";
    } else {
      status = "Mirror surge";
    }
    emit();
  }

  function laneAt(y: number) {
    for (let i = 0; i < laneY.length; i += 1) {
      if (Math.abs(y - laneY[i]) <= 28) return i;
    }
    return -1;
  }

  function onClick(ev: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const y = ((ev.clientY - rect.top) / rect.height) * height;
    const lane = laneAt(y);
    if (lane >= 0) setFocus(lane);
  }

  function onKeyDown(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    if (key === "1") setFocus(0);
    if (key === "2") setFocus(1);
    if (key === "3") setFocus(2);
    if (key === "f" || key === " ") fireMirrorSurge();
    if (!running && key === "enter") reset();
  }

  function reset() {
    threats.splice(0, threats.length);
    running = true;
    seconds = 0;
    score = 0;
    integrity = 100;
    breaches = 0;
    cells = 0;
    mirror = 0;
    focusLane = 1;
    beamCd = 0.2;
    spawnCd = 0.84;
    flash = 0;
    status = "Glass shield stable";
    emit();
  }

  function update(dt: number) {
    if (!running) return;
    seconds += dt;
    beamCd -= dt;
    spawnCd -= dt;
    flash = Math.max(0, flash - dt);

    score += dt * (2 + cells * 0.18 + Math.max(0, integrity - 25) * 0.008);

    if (beamCd <= 0) {
      beamCd = Math.max(0.1, 0.22 - Math.min(0.08, seconds * 0.0014));
      const target = threats.find((threat) => threat.lane === focusLane);
      if (target) {
        target.hp -= target.kind === "breacher" ? 10 : target.kind === "cell" ? 9 : 8;
        flash = Math.max(flash, 0.1);
        if (target.hp <= 0) {
          threats.splice(threats.indexOf(target), 1);
          if (target.kind === "cell") {
            cells += 1;
            integrity = clamp(integrity + 2, 0, 100);
            mirror = clamp(mirror + 18, 0, 100);
            score += 16;
            status = `Lane ${focusLane + 1} cell recovered`;
          } else if (target.kind === "breacher") {
            mirror = clamp(mirror + 28, 0, 100);
            score += 22;
            status = `Lane ${focusLane + 1} breacher cut`;
          } else {
            mirror = clamp(mirror + 12, 0, 100);
            score += 10;
            status = `Lane ${focusLane + 1} sealed`;
          }
          emit();
        }
      } else if (Math.random() < 0.2) {
        mirror = clamp(mirror + 2, 0, 100);
      }
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.22, 0.84 - Math.min(0.52, seconds * 0.006));
      spawnThreat();
      if (seconds > 16 && Math.random() < 0.22) spawnThreat();
      if (seconds > 26 && Math.random() < 0.14) spawnThreat("breacher");
      if (seconds > 12 && Math.random() < 0.11) spawnThreat("cell");
    }

    for (let i = threats.length - 1; i >= 0; i -= 1) {
      const threat = threats[i];
      threat.progress += threat.speed * dt * 60;
      if (threat.progress >= 100) {
        threats.splice(i, 1);
        if (threat.kind === "cell") {
          score = Math.max(0, score - 4);
          status = "Charge cell lost";
        } else {
          const damage = threat.kind === "breacher" ? 18 : 8;
          integrity = clamp(integrity - damage, 0, 100);
          breaches += 1;
          status = threat.kind === "breacher" ? "Breacher cracked the shield" : "Shield shard slipped";
        }
        emit();
      }
    }

    if (integrity <= 0 || breaches >= 8) {
      integrity = Math.max(0, integrity);
      running = false;
      status = "Glass wall shattered";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "rgba(15,26,52,1)");
    bg.addColorStop(1, "rgba(8,12,26,1)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(110,170,255,0.08)";
    ctx.fillRect(64, 34, width - 128, height - 68);

    for (let lane = 0; lane < laneY.length; lane += 1) {
      const y = laneY[lane];
      const active = lane === focusLane;
      ctx.strokeStyle = active ? "rgba(120,220,255,0.85)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = active ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(86, y);
      ctx.lineTo(width - 92, y);
      ctx.stroke();

      if (active) {
        ctx.fillStyle = `rgba(120,220,255,${0.12 + flash * 0.5})`;
        ctx.fillRect(86, y - 14, width - 178, 28);
      }

      ctx.fillStyle = active ? "rgba(120,220,255,0.95)" : "rgba(180,190,220,0.6)";
      ctx.beginPath();
      ctx.arc(66, y, active ? 12 : 9, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const threat of threats) {
      const x = 102 + (threat.progress / 100) * (width - 196);
      const y = laneY[threat.lane];
      if (threat.kind === "cell") {
        ctx.fillStyle = "rgba(90,255,200,0.95)";
        ctx.beginPath();
        ctx.rect(x - 8, y - 8, 16, 16);
        ctx.fill();
      } else if (threat.kind === "breacher") {
        ctx.fillStyle = "rgba(255,120,120,0.95)";
        ctx.beginPath();
        ctx.moveTo(x - 12, y + 10);
        ctx.lineTo(x, y - 12);
        ctx.lineTo(x + 12, y + 10);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(255,210,120,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(`Integrity ${Math.max(0, Math.round(integrity))}`, 18, 24);
    ctx.fillText(`Breaches ${breaches}`, 166, 24);
    ctx.fillText(`Cells ${cells}`, 278, 24);
    ctx.fillText(`Mirror ${Math.max(0, Math.round(mirror))}%`, 356, 24);

    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "rgba(210,220,255,0.82)";
    ctx.fillText(status, 18, height - 16);

    if (!running) {
      ctx.fillStyle = "rgba(6,10,24,0.72)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.font = "bold 26px system-ui, sans-serif";
      ctx.fillText("Glass wall shattered", width / 2 - 118, height / 2 - 8);
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "rgba(210,220,255,0.86)";
      ctx.fillText("Press Enter or F to restart", width / 2 - 92, height / 2 + 20);
    }
  }

  function frame(now: number) {
    const dt = clamp((now - last) / 1000, 0, 0.033);
    last = now;
    update(dt);
    draw();
    raf = window.requestAnimationFrame(frame);
  }

  canvas.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown);
  emit();
  draw();
  raf = window.requestAnimationFrame(frame);

  return {
    destroy() {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      host.innerHTML = "";
    },
  };
}
