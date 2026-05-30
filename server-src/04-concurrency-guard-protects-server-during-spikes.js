// ---------- Concurrency guard (protects server during spikes) ----------
function createSemaphore(max){
  let active = 0;
  const queue = [];
  return {
    async acquire(timeoutMs=8000){
      if (active < max){ active++; return true; }
      return await new Promise((resolve)=>{
        const started = Date.now();
        const item = ()=>{
          if (active < max){ active++; return resolve(true); }
          if (Date.now() - started >= timeoutMs){ return resolve(false); }
          queue.push(item);
        };
        queue.push(item);
        // tick
        setImmediate(()=>{
          const fn = queue.shift();
          if (fn) fn();
        });
      });
    },
    release(){
      active = Math.max(0, active-1);
      // drain one
      const fn = queue.shift();
      if (fn) setImmediate(fn);
    },
    get active(){ return active; },
    get queued(){ return queue.length; }
  };
}

const GEN_SEMAPHORE = createSemaphore(Math.max(5, Math.min(200, Number(process.env.GMX_MAX_CONCURRENT_GEN || '50') || 50)));

// Atomic daily usage consume (prevents race conditions on parallel requests)
function ensureDailyRow(handle, day, kind) {
  safeDb(() => {
    db.prepare(
      "INSERT OR IGNORE INTO usage_daily(handle, day, kind, used) VALUES(?,?,?,0)"
    ).run(handle, day, kind);
  });
}
function getDailyUsed(handle, day, kind) {
  ensureDailyRow(handle, day, kind);
  return (
    safeDb(() =>
      db
        .prepare("SELECT used FROM usage_daily WHERE handle=? AND day=? AND kind=?")
        .get(handle, day, kind)
    )?.used || 0
  );
}

function consumeDailyAtomic(handle, day, kind, limit, by=1){
  ensureDailyRow(handle, day, kind);
  if (!Number.isFinite(limit) || limit >= 999999){ // unlimited sentinel
    safeDb(() =>
      db.prepare("UPDATE usage_daily SET used=used+? WHERE handle=? AND day=? AND kind=?")
        .run(by, handle, day, kind)
    );
    return { ok:true, used:getDailyUsed(handle, day, kind), limit };
  }
  // Try conditional update
  const res = safeDb(() =>
    db.prepare("UPDATE usage_daily SET used=used+? WHERE handle=? AND day=? AND kind=? AND used+? <= ?")
      .run(by, handle, day, kind, by, limit)
  );
  if (!res || res.changes === 0){
    const used = getDailyUsed(handle, day, kind);
    return { ok:false, used, limit };
  }
  const used = getDailyUsed(handle, day, kind);
  return { ok:true, used, limit };
}

// Back-compat increment (used for non-capped tool counters)
function incDaily(handle, day, kind, by = 1) {
  consumeDailyAtomic(handle, day, kind, 999999, by);
}


function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function clientIp(req){
  // Security note: do NOT trust X-Forwarded-For unless you are behind a proxy
  // that overwrites/sanitizes it. Enable via TRUST_PROXY=1.
  const ua = (req.headers['user-agent'] || '').toString(); // keep read to avoid lint warnings in older builds
  if (TRUST_PROXY){
    const xf = (req.headers['x-forwarded-for'] || '').toString();
    const ip = (xf.split(',')[0] || req.socket.remoteAddress || '').toString().trim();
    return ip || '0.0.0.0';
  }
  const ip = (req.socket.remoteAddress || '').toString().trim();
  return ip || '0.0.0.0';
}

function isLoopbackIp(ip){
  const v = String(ip || '').trim().toLowerCase();
  return v === '127.0.0.1' || v === '::1' || v === '::ffff:127.0.0.1' || v === 'localhost';
}

function canUseDevSessionReset(req){
  if (!DEV_MODE) return false;
  const bodyFlag = req.method === 'GET' ? (req.query?.devReset) : (req.body?.devReset);
  const headerFlag = req.headers['x-dev-reset'];
  const wantsReset = String(bodyFlag || headerFlag || '').trim();
  if (!(wantsReset === '1' || wantsReset.toLowerCase() === 'true')) return false;

  const ip = clientIp(req);
  if (isLoopbackIp(ip)) return true;

  const key = getAdminKey(req);
  if (key && ADMIN_SECRET && ADMIN_SECRET !== 'CHANGE_ME_ADMIN_SECRET' && safeEq(String(key), String(ADMIN_SECRET))) {
    return true;
  }
  return false;
}

function canUseDevAdminSession(req){
  if (!DEV_ADMIN_SESSION_ONLY) return false;
  return isLoopbackIp(clientIp(req));
}

// In-memory cooldowns (per instance). Still protects Render single-instance well.
const LAST_CALL_HANDLE = new Map();
const LAST_CALL_IP = new Map();

async function enforceGenGuard(req, res, kind){
  const h = String(req.user?.handle || '');
  const ip = clientIp(req);
  const now = Date.now();
  const minLat = CONFIG.GEN_MIN_LATENCY_MS;

  // Cooldowns
  const hKey = `${h}:${kind}`;
  const lastH = LAST_CALL_HANDLE.get(hKey) || 0;
  const cdH = (kind === 'bulk') ? CONFIG.BULK_COOLDOWN_MS : CONFIG.GEN_COOLDOWN_MS;
  if (cdH > 0 && now - lastH < cdH){
    const retry = cdH - (now - lastH);
    return { ok:false, status:429, body:{ ok:false, error:'slow_down', retryAfterMs: retry } };
  }
  const lastIp = LAST_CALL_IP.get(ip) || 0;
  if (CONFIG.IP_COOLDOWN_MS > 0 && now - lastIp < CONFIG.IP_COOLDOWN_MS){
    const retry = CONFIG.IP_COOLDOWN_MS - (now - lastIp);
    return { ok:false, status:429, body:{ ok:false, error:'slow_down', retryAfterMs: retry } };
  }

  // Reserve immediately (prevents parallel spam)
  LAST_CALL_HANDLE.set(hKey, now);
  LAST_CALL_IP.set(ip, now);

  // Small artificial latency to smooth bursts and avoid stampedes.
  if (minLat > 0){
    await sleep(minLat);
  }
  return { ok:true };
}
