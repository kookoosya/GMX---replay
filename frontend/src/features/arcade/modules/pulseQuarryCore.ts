export interface PulseQuarrySnapshot {
  score: number;
  hull: number;
  charges: number;
  stress: number;
  seconds: number;
  status: string;
}

export interface PulseQuarryModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: PulseQuarrySnapshot) => void;
}

type VeinKind = "ore" | "fault" | "cell";

interface Vein {
  lane: number;
  x: number;
  y: number;
  hp: number;
  kind: VeinKind;
  speed: number;
  r: number;
  pulse: number;
}

interface Cut {
  lane: number;
  x: number;
  y: number;
  speed: number;
  ttl: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountPulseQuarryCore(host: HTMLElement, options: PulseQuarryModuleOptions = {}) {
  const width = options.width ?? 520;
  const height = options.height ?? 300;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.maxWidth = `${width}px`;
  canvas.style.display = "block";
  canvas.style.borderRadius = "16px";
  canvas.style.border = "1px solid rgba(255,255,255,0.08)";
  canvas.style.background = "linear-gradient(180deg,rgba(24,18,42,0.98),rgba(10,12,22,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  const laneX = [82, 192, 302, 412];
  const veins: Vein[] = [];
  const cuts: Cut[] = [];
  const rig = { lane: 1, targetLane: 1, hull: 100, charges: 2, pulse: 0, overdrive: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let stress = 0;
  let drift = 0;
  let spawnCd = 0.86;
  let cutCd = 0.2;
  let chargeRegen = 0;
  let quakeCd = 10.5;
  let status = "Cutting clean";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hull: Math.max(0, Math.round(rig.hull)),
      charges: rig.charges,
      stress: Math.max(0, Math.round(stress)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnVein(forcedKind?: VeinKind) {
    const lane = Math.floor(Math.random() * laneX.length);
    const roll = Math.random();
    const kind: VeinKind = forcedKind || (roll < 0.18 ? "cell" : roll < 0.72 ? "ore" : "fault");
    veins.push({
      lane,
      x: laneX[lane],
      y: -26,
      hp: kind === "fault" ? 2 : 1,
      kind,
      speed: 126 + Math.min(140, seconds * 2.2) + (kind === "fault" ? 24 : 0) + Math.random() * 16,
      r: kind === "fault" ? 13 : kind === "cell" ? 9 : 11,
      pulse: 0,
    });
  }

  function setLane(next: number) {
    const lane = clamp(next, 0, laneX.length - 1);
    if (lane !== rig.targetLane) {
      rig.targetLane = lane;
      status = lane > rig.lane ? "Shifting right" : "Shifting left";
      emit();
    }
  }

  function reset() {
    veins.splice(0, veins.length);
    cuts.splice(0, cuts.length);
    rig.lane = 1;
    rig.targetLane = 1;
    rig.hull = 100;
    rig.charges = 2;
    rig.pulse = 0;
    rig.overdrive = 0;
    running = true;
    seconds = 0;
    score = 0;
    stress = 0;
    drift = 0;
    spawnCd = 0.86;
    cutCd = 0.2;
    chargeRegen = 0;
    quakeCd = 10.5;
    status = "Cutting clean";
    emit();
  }

  function pulseCut() {
    if (!running) {
      reset();
      return;
    }
    if (rig.charges <= 0) {
      status = "Pulse empty";
      emit();
      return;
    }
    rig.charges -= 1;
    rig.overdrive = 0.55;
    rig.pulse = 0.28;
    score += 8;
    status = "Pulse cut";
    for (let lane = 0; lane < laneX.length; lane += 1) {
      const target = veins.find((vein) => vein.lane === lane && vein.y > 48);
      if (!target) continue;
      if (target.kind === "cell") {
        rig.charges = Math.min(4, rig.charges + 1);
        rig.hull = Math.min(100, rig.hull + 4);
        score += 18;
      } else if (target.kind === "fault") {
        score += 24;
        stress = clamp(stress - 7, 0, 999);
      } else {
        score += 14;
      }
      veins.splice(veins.indexOf(target), 1);
    }
    emit();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowleft" || k === "a") setLane(rig.targetLane - 1);
    if (k === "arrowright" || k === "d") setLane(rig.targetLane + 1);
    if (k === " " || k === "space") pulseCut();
    if (!running && k === "enter") reset();
  }

  function update(dt: number) {
    if (!running) return;

    seconds += dt;
    stress = clamp(stress + dt * (3.8 + Math.min(6.2, seconds * 0.08)), 0, 999);
    drift += dt;
    spawnCd -= dt;
    cutCd -= dt;
    quakeCd -= dt;
    chargeRegen += dt * (0.12 + Math.min(0.11, seconds * 0.003));
    rig.pulse = Math.max(0, rig.pulse - dt);
    rig.overdrive = Math.max(0, rig.overdrive - dt);

    if (rig.lane !== rig.targetLane) rig.lane = rig.targetLane;

    if (chargeRegen >= 1) {
      const gained = Math.floor(chargeRegen);
      chargeRegen -= gained;
      const prev = rig.charges;
      rig.charges = Math.min(4, rig.charges + gained);
      if (rig.charges > prev) {
        status = "Charge recovered";
        emit();
      }
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.22, 0.86 - Math.min(0.52, seconds * 0.011));
      spawnVein();
      if (seconds > 18 && Math.random() < 0.22) spawnVein();
    }

    if (quakeCd <= 0) {
      quakeCd = Math.max(5.6, 10.5 - Math.min(4.1, seconds * 0.05));
      spawnVein("fault");
      if (seconds > 22) spawnVein("ore");
      status = "Quake surge";
      emit();
    }

    score += dt * (2.1 + stress * 0.024 + Math.max(0, rig.hull - 20) * 0.009);

    if (cutCd <= 0) {
      cutCd = Math.max(0.12, 0.34 - Math.min(0.14, seconds * 0.0026));
      cuts.push({
        lane: rig.lane,
        x: laneX[rig.lane],
        y: height - 72,
        speed: 334,
        ttl: 1.2,
      });
    }

    for (let i = cuts.length - 1; i >= 0; i -= 1) {
      const cut = cuts[i];
      cut.y -= cut.speed * dt;
      cut.ttl -= dt;
      if (cut.y < -24 || cut.ttl <= 0) cuts.splice(i, 1);
    }

    for (let i = veins.length - 1; i >= 0; i -= 1) {
      const vein = veins[i];
      vein.pulse = Math.max(0, vein.pulse - dt);
      vein.y += vein.speed * dt;

      for (let j = cuts.length - 1; j >= 0; j -= 1) {
        const cut = cuts[j];
        if (cut.lane !== vein.lane) continue;
        if (Math.abs(cut.y - vein.y) > vein.r + 10) continue;
        cuts.splice(j, 1);
        vein.hp -= 1;
        vein.pulse = 0.22;
        if (vein.hp <= 0) {
          if (vein.kind === "cell") {
            rig.charges = Math.min(4, rig.charges + 1);
            rig.hull = Math.min(100, rig.hull + 3);
            score += 16;
            status = "Cell recovered";
          } else if (vein.kind === "fault") {
            score += 26;
            stress = clamp(stress - 6, 0, 999);
            status = "Fault cut";
          } else {
            score += 12;
            status = "Ore mined";
          }
          veins.splice(i, 1);
          emit();
        }
        break;
      }

      if (!veins[i]) continue;

      if (vein.y >= height - 76) {
        if (vein.lane === rig.lane) {
          if (vein.kind === "cell") {
            rig.charges = Math.min(4, rig.charges + 1);
            rig.hull = Math.min(100, rig.hull + 2);
            score += 14;
            status = "Cell snagged";
          } else if (vein.kind === "ore") {
            score += 18;
            status = "Drill contact";
          } else {
            rig.hull = clamp(rig.hull - 12, 0, 100);
            stress = clamp(stress + 12, 0, 999);
            rig.pulse = 0.34;
            status = "Fault impact";
          }
          emit();
        } else if (vein.kind === "ore") {
          stress = clamp(stress + 3, 0, 999);
        }
        veins.splice(i, 1);
      }
    }

    if (Math.floor(seconds / 14) > Math.floor((seconds - dt) / 14)) {
      stress = clamp(stress + 8, 0, 999);
      status = "Vein shift";
      emit();
    }

    if (stress >= 100) {
      rig.hull = clamp(rig.hull - dt * 7.5, 0, 100);
      status = "Rig shaking";
    }

    if (rig.hull <= 0) {
      rig.hull = 0;
      running = false;
      status = "Rig collapsed";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(32,20,62,1)");
    gradient.addColorStop(1, "rgba(8,10,20,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 8; i += 1) {
      const y = ((drift * 92) + i * 44) % (height + 44) - 22;
      ctx.fillRect(0, y, width, 14);
    }

    for (let i = 0; i < laneX.length; i += 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneX[i], 0);
      ctx.lineTo(laneX[i], height);
      ctx.stroke();
    }

    for (const vein of veins) {
      if (vein.kind === "ore") ctx.fillStyle = "rgba(255,208,110,0.94)";
      else if (vein.kind === "cell") ctx.fillStyle = "rgba(120,220,255,0.92)";
      else ctx.fillStyle = "rgba(255,110,132,0.96)";
      ctx.beginPath();
      ctx.arc(vein.x, vein.y, vein.r + vein.pulse * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const cut of cuts) {
      ctx.strokeStyle = "rgba(180,240,255,0.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cut.x, cut.y);
      ctx.lineTo(cut.x, cut.y - 14);
      ctx.stroke();
    }

    const rigX = laneX[rig.lane];
    const rigY = height - 58;
    ctx.fillStyle = rig.pulse > 0 ? "rgba(255,150,160,0.95)" : rig.overdrive > 0 ? "rgba(180,240,255,0.95)" : "rgba(226,232,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(rigX, rigY - 20);
    ctx.lineTo(rigX - 18, rigY + 16);
    ctx.lineTo(rigX + 18, rigY + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Stress ${Math.max(0, Math.round(stress))}`, 16, 22);
    ctx.fillText(`Charges ${rig.charges}`, 16, 40);
    ctx.fillText(`Hull ${Math.max(0, Math.round(rig.hull))}`, 16, 58);
    ctx.fillText(`Score ${Math.max(0, Math.round(score))}`, width - 108, 22);
    ctx.fillText(running ? "Pulse Quarry" : "Rig collapsed · Enter", width - 146, 40);
  }

  function frame(now: number) {
    const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
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
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
