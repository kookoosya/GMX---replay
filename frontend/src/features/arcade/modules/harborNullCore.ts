export interface HarborNullSnapshot {
  score: number;
  hull: number;
  charge: number;
  pressure: number;
  seconds: number;
  status: string;
}

export interface HarborNullModuleOptions {
  width?: number;
  height?: number;
  onSnapshot?: (snapshot: HarborNullSnapshot) => void;
}

type ContactKind = "skiff" | "brute" | "cache";

interface Contact {
  lane: number;
  x: number;
  y: number;
  hp: number;
  kind: ContactKind;
  r: number;
  speed: number;
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

export function mountHarborNullCore(host: HTMLElement, options: HarborNullModuleOptions = {}) {
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
  canvas.style.background = "linear-gradient(180deg,rgba(14,24,44,0.98),rgba(8,14,22,0.98))";
  host.innerHTML = "";
  host.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const laneX = [118, 260, 402];
  const contacts: Contact[] = [];
  const bolts: Bolt[] = [];
  const turret = { lane: 1, targetLane: 1, hull: 100, charge: 3, pulse: 0 };
  let running = true;
  let raf = 0;
  let last = performance.now();
  let seconds = 0;
  let score = 0;
  let pressure = 0;
  let tide = 0;
  let spawnCd = 0.85;
  let chargeRegen = 0;
  let surgeCd = 8;
  let supportCd = 11;
  let status = "Harbor steady";

  function emit() {
    options.onSnapshot?.({
      score: Math.max(0, Math.round(score)),
      hull: Math.max(0, Math.round(turret.hull)),
      charge: turret.charge,
      pressure: Math.max(0, Math.round(pressure)),
      seconds: Math.max(0, Math.round(seconds)),
      status,
    });
  }

  function spawnContact(forcedKind?: ContactKind) {
    const lane = Math.floor(Math.random() * laneX.length);
    const roll = Math.random();
    const kind: ContactKind = forcedKind || (roll < 0.18 ? "cache" : roll < 0.78 ? "skiff" : "brute");
    const hp = kind === "brute" ? 2 : 1;
    contacts.push({
      lane,
      x: laneX[lane],
      y: -24,
      hp,
      kind,
      r: kind === "brute" ? 14 : kind === "cache" ? 10 : 11,
      speed: 105 + Math.min(160, seconds * 2.2) + (kind === "brute" ? 16 : 0) + Math.random() * 14,
      pulse: 0,
    });
  }

  function setLane(next: number) {
    const lane = clamp(next, 0, laneX.length - 1);
    if (lane !== turret.targetLane) {
      turret.targetLane = lane;
      status = lane > turret.lane ? "Dock pivot right" : "Dock pivot left";
      emit();
    }
  }

  function reset() {
    contacts.splice(0, contacts.length);
    bolts.splice(0, bolts.length);
    turret.lane = 1;
    turret.targetLane = 1;
    turret.hull = 100;
    turret.charge = 3;
    turret.pulse = 0;
    running = true;
    seconds = 0;
    score = 0;
    pressure = 0;
    tide = 0;
    spawnCd = 0.85;
    chargeRegen = 0;
    surgeCd = 8;
    supportCd = 11;
    status = "Harbor steady";
    emit();
  }

  function firePulse() {
    if (!running) {
      reset();
      return;
    }
    if (turret.charge <= 0) {
      status = "Pulse offline";
      emit();
      return;
    }
    turret.charge -= 1;
    turret.pulse = 0.22;
    const x = laneX[turret.lane];
    bolts.push({ lane: turret.lane, x, y: height - 72, speed: 320, ttl: 1.1 });
    status = "Pulse fired";
    emit();
  }

  function onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "arrowleft" || k === "a") setLane(turret.targetLane - 1);
    if (k === "arrowright" || k === "d") setLane(turret.targetLane + 1);
    if (k === " " || k === "space") firePulse();
    if (!running && k === "enter") reset();
  }

  function update(dt: number) {
    if (!running) return;

    seconds += dt;
    pressure = clamp(pressure + dt * (3.8 + Math.min(5.6, seconds * 0.08)), 0, 999);
    tide += dt;
    spawnCd -= dt;
    surgeCd -= dt;
    supportCd -= dt;
    chargeRegen += dt * (0.55 + Math.min(0.35, seconds * 0.005));
    turret.pulse = Math.max(0, turret.pulse - dt);

    if (chargeRegen >= 1) {
      const gained = Math.floor(chargeRegen);
      chargeRegen -= gained;
      turret.charge = Math.min(5, turret.charge + gained);
      if (gained > 0 && turret.charge <= 5) {
        status = "Pulse recharged";
      }
    }

    if (turret.lane !== turret.targetLane) turret.lane = turret.targetLane;

    if (spawnCd <= 0) {
      spawnCd = Math.max(0.24, 0.9 - Math.min(0.58, seconds * 0.012));
      spawnContact();
      if (seconds > 18 && Math.random() < 0.22) spawnContact();
    }

    if (surgeCd <= 0) {
      surgeCd = Math.max(5.5, 9.5 - Math.min(3.2, seconds * 0.05));
      spawnContact("brute");
      if (seconds > 24 && Math.random() < 0.35) spawnContact("skiff");
      status = "Storm surge";
      emit();
    }

    if (supportCd <= 0) {
      supportCd = Math.max(8, 12.5 - Math.min(3.2, seconds * 0.03));
      if (turret.hull < 72 || turret.charge <= 1) {
        spawnContact("cache");
        status = "Support cache inbound";
        emit();
      }
    }

    score += dt * (2.4 + pressure * 0.028 + Math.max(0, turret.hull - 30) * 0.012);

    for (let i = bolts.length - 1; i >= 0; i -= 1) {
      const bolt = bolts[i];
      bolt.y -= bolt.speed * dt;
      bolt.ttl -= dt;
      if (bolt.y < -20 || bolt.ttl <= 0) {
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
        if (Math.abs(bolt.y - contact.y) > contact.r + 12) continue;
        bolts.splice(j, 1);
        contact.hp -= 1;
        contact.pulse = 0.22;
        if (contact.hp <= 0) {
          if (contact.kind === "cache") {
            turret.charge = Math.min(5, turret.charge + 2);
            score += 20;
            status = "Battery cache";
          } else if (contact.kind === "brute") {
            score += 34;
            status = "Breaker sunk";
          } else {
            score += 14;
            status = "Skiff sunk";
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
      if (contact.y < height - 68) continue;
      if (contact.kind === "cache") {
        turret.charge = Math.min(5, turret.charge + 1);
        turret.hull = Math.min(100, turret.hull + 4);
        score += 10;
        status = "Recovered crate";
      } else {
        const damage = contact.kind === "brute" ? 16 : 9;
        turret.hull = clamp(turret.hull - damage, 0, 100);
        pressure += damage * 0.8;
        status = contact.kind === "brute" ? "Breaker impact" : "Pier breach";
      }
      contacts.splice(i, 1);
      emit();
    }

    if (turret.hull <= 0) {
      turret.hull = 0;
      running = false;
      status = "Harbor lost";
      emit();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(20,42,72,1)");
    gradient.addColorStop(1, "rgba(10,16,28,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(80,150,220,0.06)";
    for (let i = 0; i < 7; i += 1) {
      const y = ((tide * 90) + i * 48) % (height + 48) - 24;
      ctx.fillRect(0, y, width, 16);
    }

    for (let i = 0; i < laneX.length; i += 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneX[i], 0);
      ctx.lineTo(laneX[i], height);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,240,180,0.08)";
    ctx.fillRect(0, height - 54, width, 54);

    for (const bolt of bolts) {
      ctx.strokeStyle = "rgba(150,230,255,0.96)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bolt.x, bolt.y + 12);
      ctx.lineTo(bolt.x, bolt.y - 12);
      ctx.stroke();
    }

    for (const contact of contacts) {
      if (contact.kind === "cache") ctx.fillStyle = "rgba(255,220,110,0.94)";
      else if (contact.kind === "brute") ctx.fillStyle = contact.pulse > 0 ? "rgba(255,150,150,0.98)" : "rgba(255,110,90,0.96)";
      else ctx.fillStyle = contact.pulse > 0 ? "rgba(170,220,255,0.98)" : "rgba(120,190,255,0.94)";
      ctx.beginPath();
      ctx.arc(contact.x, contact.y, contact.r + contact.pulse * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const turretX = laneX[turret.lane];
    const turretY = height - 62;
    ctx.fillStyle = turret.pulse > 0 ? "rgba(180,235,255,0.98)" : "rgba(230,242,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(turretX, turretY - 18);
    ctx.lineTo(turretX - 18, turretY + 16);
    ctx.lineTo(turretX + 18, turretY + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Hull ${Math.max(0, Math.round(turret.hull))}`, 16, 22);
    ctx.fillText(`Charge ${turret.charge}`, 16, 40);
    ctx.fillText(`Pressure ${Math.max(0, Math.round(pressure))}`, 16, 58);
    ctx.fillText(`Score ${Math.max(0, Math.round(score))}`, width - 120, 22);
    ctx.fillText(`Time ${Math.max(0, Math.round(seconds))}s`, width - 120, 40);
    ctx.fillText(status, width - 168, 58);

    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Harbor lost", width / 2 - 70, height / 2 - 8);
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
