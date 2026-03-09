export interface SkyHeistSnapshot {
  score: number;
  hull: number;
  boost: number;
  alert: number;
  seconds: number;
  status: string;
}

export interface SkyHeistModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: SkyHeistSnapshot) => void;
}

type ContactKind = "drone" | "ace" | "cargo";

interface Contact {
  lane: number;
  x: number;
  y: number;
  hp: number;
  kind: ContactKind;
  speed: number;
  r: number;
  pulse: number;
}

interface Bolt {
  lane: number;
  x: number;
  y: number;
  speed: number;
  ttl: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountSkyHeistCore(host: HTMLElement, options: SkyHeistModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(12,20,42,0.98),rgba(6,10,20,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneX = [86, 196, 306, 416];
  const contacts: Contact[] = [];
  const bolts: Bolt[] = [];
  const runner = { lane: 1, targetLane: 1, hull: 100, boost: 2, burst: 0, pulse: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let alert = 0;
  let skyline = 0;
  let spawnCd = 0.78;
  let fireCd = 0.18;
  let boostRegen = 0;
  let patrolCd = 9.5;
  let status = "Route clear";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hull: Math.max(0, Math.round(runner.hull)),
      boost: runner.boost,
      alert: Math.max(0, Math.round(alert)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnContact(forcedKind?: ContactKind) {
    const lane = Math.floor(Math.random() * laneX.length);
    const roll = Math.random();
    const kind: ContactKind = forcedKind || (roll < 0.18 ? "cargo" : roll < 0.82 ? "drone" : "ace");
    contacts.push({
      lane,
      x: laneX[lane],
      y: -24,
      hp: kind === "ace" ? 2 : 1,
      kind,
      speed: 118 + Math.min(150, seconds * 2.4) + (kind === "ace" ? 20 : 0) + Math.random() * 18,
      r: kind === "ace" ? 13 : kind === "cargo" ? 10 : 11,
      pulse: 0,
    });
  }

  function setLane(next: number) {
    const lane = clamp(next, 0, laneX.length - 1);
    if (lane !== runner.targetLane) {
      runner.targetLane = lane;
      status = lane > runner.lane ? "Banking starboard" : "Banking port";
      emit();
    }
  }

  function reset() {
    contacts.splice(0, contacts.length);
    bolts.splice(0, bolts.length);
    runner.lane = 1;
    runner.targetLane = 1;
    runner.hull = 100;
    runner.boost = 2;
    runner.burst = 0;
    runner.pulse = 0;
    running = true;
    seconds = 0;
    score = 0;
    alert = 0;
    skyline = 0;
    spawnCd = 0.78;
    fireCd = 0.18;
    boostRegen = 0;
    patrolCd = 9.5;
    status = "Route clear";
    emit();
  }

  function fireBurst() {
    if (!running) {
      reset();
      return;
    }
    if (runner.boost <= 0) {
      status = "Boost empty";
      emit();
      return;
    }
    runner.boost -= 1;
    runner.burst = 0.55;
    runner.pulse = 0.28;
    score += 8;
    status = "Nitro sweep";
    for (let lane = 0; lane < laneX.length; lane += 1) {
      const target = contacts.find((contact) => contact.lane === lane && contact.y > 56);
      if (!target) continue;
      if (target.kind === "cargo") {
        runner.boost = Math.min(4, runner.boost + 1);
        score += 16;
      } else if (target.kind === "ace") {
        score += 26;
      } else {
        score += 12;
      }
      contacts.splice(contacts.indexOf(target), 1);
    }
    emit();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowleft" || k === "a") setLane(runner.targetLane - 1);
    if (k === "arrowright" || k === "d") setLane(runner.targetLane + 1);
    if (k === " " || k === "space") fireBurst();
    if (!running && k === "enter") reset();
  }

  function update(dt: number) {
    if (!running) return;

    seconds += dt;
    alert = clamp(alert + dt * (4.1 + Math.min(5.8, seconds * 0.09)), 0, 999);
    skyline += dt;
    spawnCd -= dt;
    fireCd -= dt;
    patrolCd -= dt;
    boostRegen += dt * (0.14 + Math.min(0.12, seconds * 0.0035));
    runner.burst = Math.max(0, runner.burst - dt);
    runner.pulse = Math.max(0, runner.pulse - dt);

    if (runner.lane !== runner.targetLane) runner.lane = runner.targetLane;

    if (boostRegen >= 1) {
      const gained = Math.floor(boostRegen);
      boostRegen -= gained;
      const prev = runner.boost;
      runner.boost = Math.min(4, runner.boost + gained);
      if (runner.boost > prev) {
        status = "Fuel topped";
        emit();
      }
    }

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.22, 0.82 - Math.min(0.56, seconds * 0.011));
      spawnContact();
      if (seconds > 16 && Math.random() < 0.24) spawnContact();
    }

    if (patrolCd <= 0) {
      patrolCd = Math.max(5.2, 9.5 - Math.min(3.6, seconds * 0.05));
      spawnContact("ace");
      if (seconds > 22) spawnContact("drone");
      status = "Patrol wave";
      emit();
    }

    score += dt * (2.2 + alert * 0.026 + Math.max(0, runner.hull - 25) * 0.01);

    if (fireCd <= 0) {
      fireCd = Math.max(0.12, 0.36 - Math.min(0.15, seconds * 0.0028));
      bolts.push({
        lane: runner.lane,
        x: laneX[runner.lane],
        y: height - 72,
        speed: 340,
        ttl: 1.2,
      });
    }

    for (let i = bolts.length - 1; i >= 0; i -= 1) {
      const bolt = bolts[i];
      bolt.y -= bolt.speed * dt;
      bolt.ttl -= dt;
      if (bolt.y < -24 || bolt.ttl <= 0) {
        bolts.splice(i, 1);
      }
    }

    for (let i = contacts.length - 1; i >= 0; i -= 1) {
      const contact = contacts[i];
      contact.pulse = Math.max(0, contact.pulse - dt);
      contact.y += contact.speed * dt;

      for (let j = bolts.length - 1; j >= 0; j -= 1) {
        const bolt = bolts[j];
        if (bolt.lane !== contact.lane) continue;
        if (Math.abs(bolt.y - contact.y) > contact.r + 10) continue;
        bolts.splice(j, 1);
        contact.hp -= 1;
        contact.pulse = 0.22;
        if (contact.hp <= 0) {
          if (contact.kind === "cargo") {
            runner.boost = Math.min(4, runner.boost + 1);
            runner.hull = Math.min(100, runner.hull + 3);
            score += 18;
            status = "Cargo raided";
          } else if (contact.kind === "ace") {
            score += 30;
            status = "Ace clipped";
          } else {
            score += 14;
            status = "Drone cleared";
          }
          contacts.splice(i, 1);
          emit();
        } else {
          status = "Armor cracked";
          emit();
        }
        break;
      }
    }

    for (let i = contacts.length - 1; i >= 0; i -= 1) {
      const contact = contacts[i];
      if (contact.y < height - 62) continue;
      if (contact.kind === "cargo") {
        score = Math.max(0, score - 4);
        status = "Cargo missed";
      } else if (runner.burst > 0) {
        score += contact.kind === "ace" ? 18 : 10;
        status = "Burst pass";
      } else {
        const damage = contact.kind === "ace" ? 18 : 10;
        runner.hull = clamp(runner.hull - damage, 0, 100);
        alert += damage * 0.9;
        status = contact.kind === "ace" ? "Ace clipped the wing" : "Drone slipped through";
      }
      contacts.splice(i, 1);
      emit();
    }

    if (runner.hull <= 0) {
      runner.hull = 0;
      running = false;
      status = "Route lost";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(18,34,68,1)");
    gradient.addColorStop(1, "rgba(8,12,24,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 8; i += 1) {
      const y = ((skyline * 100) + i * 44) % (height + 44) - 22;
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

    for (const bolt of bolts) {
      ctx.strokeStyle = "rgba(150,230,255,0.96)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bolt.x, bolt.y + 10);
      ctx.lineTo(bolt.x, bolt.y - 10);
      ctx.stroke();
    }

    for (const contact of contacts) {
      if (contact.kind === "cargo") ctx.fillStyle = "rgba(255,214,102,0.96)";
      else if (contact.kind === "ace") ctx.fillStyle = contact.pulse > 0 ? "rgba(255,150,150,0.98)" : "rgba(255,110,92,0.96)";
      else ctx.fillStyle = contact.pulse > 0 ? "rgba(170,220,255,0.98)" : "rgba(116,188,255,0.94)";
      ctx.beginPath();
      ctx.arc(contact.x, contact.y, contact.r + contact.pulse * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const runnerX = laneX[runner.lane];
    const runnerY = height - 54;
    ctx.fillStyle = runner.burst > 0 ? "rgba(255,242,180,0.98)" : "rgba(232,244,255,0.96)";
    ctx.beginPath();
    ctx.moveTo(runnerX, runnerY - 18);
    ctx.lineTo(runnerX - 16, runnerY + 16);
    ctx.lineTo(runnerX + 16, runnerY + 16);
    ctx.closePath();
    ctx.fill();

    if (runner.pulse > 0) {
      ctx.strokeStyle = "rgba(255,222,120,0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(runnerX, runnerY + 2, 22 + runner.pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Hull ${Math.max(0, Math.round(runner.hull))}`, 16, 22);
    ctx.fillText(`Boost ${runner.boost}`, 16, 40);
    ctx.fillText(`Alert ${Math.max(0, Math.round(alert))}`, 16, 58);
    ctx.fillText(`Score ${Math.max(0, Math.round(score))}`, width - 120, 22);
    ctx.fillText(`Time ${Math.max(0, Math.round(seconds))}s`, width - 120, 40);
    ctx.fillText(status, width - 150, 58);

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Route lost", width / 2 - 58, height / 2 - 8);
      ctx.font = "14px sans-serif";
      ctx.fillText("Press Enter or Space to restart", width / 2 - 96, height / 2 + 20);
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
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
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
    },
  };
}
