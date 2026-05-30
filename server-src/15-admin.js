// ---------- ADMIN ----------
function getAdminKey(req){
  return String(req.headers["x-admin-key"] || req.headers["X-Admin-Key"] || "").trim();
}

function getAdminToken(req){
  return String(req.headers["x-admin-token"] || req.headers["X-Admin-Token"] || "").trim();
}

function safeEq(a,b){
  try{
    const aa = Buffer.from(String(a||""), "utf8");
    const bb = Buffer.from(String(b||""), "utf8");
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  }catch{ return false; }
}

function adminSessionCleanup(){
  try{
    const now = new Date().toISOString();
    db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").run(now);
  }catch{}
}

function adminSessionCreate(handle){
  adminSessionCleanup();
  const token = crypto.randomBytes(24).toString("hex");
  const created_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + ADMIN_SESSION_HOURS*60*60*1000).toISOString();
  db.prepare("INSERT INTO admin_sessions(token, handle, created_at, expires_at) VALUES(?,?,?,?)").run(token, handle, created_at, expires_at);
  return { token, created_at, expires_at };
}

function adminSessionGet(token){
  adminSessionCleanup();
  if (!token) return null;
  try{
    const row = db.prepare("SELECT token, handle, created_at, expires_at FROM admin_sessions WHERE token=?").get(token);
    if (!row) return null;
    if (String(row.expires_at) < new Date().toISOString()) return null;
    return row;
  }catch{ return null; }
}

function adminSessionDelete(token){
  if (!token) return;
  try{ db.prepare("DELETE FROM admin_sessions WHERE token=?").run(token); }catch{}
}
