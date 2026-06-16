// ---------- CLOUD SYNC (Pro; server-side gated) ----------
function requirePro(req, res, next){
  const handle = req.user?.handle || null;
  const u0 = req.user && req.user.handle ? req.user : null;
  const u = u0 || userByHandle(handle);
  const sub = subscriptionInfo({ ...(u||{}), handle });
  if (sub?.active) return next();
  return res.status(402).json({ ok:false, error:"upgrade_required", feature:"cloud_sync" });
}


app.get("/api/cloud/lists", requireAuth, requirePro, async (req, res) => {
  try{
    const handle = req.user?.handle || null;

    const sb = getSupabaseAdmin();
    if (sb){
      const r = await sbCloudListsGet(handle);
      return res.json({ ok:true, handle, rows: r.rows });
    }

    // sqlite fallback
    const rows = safeDb(() => db.prepare(`
      SELECT kind, scope, lang, content, updated_at
      FROM cloud_lists
      WHERE handle=?
      ORDER BY updated_at DESC
    `).all(handle));
    res.json({ ok:true, handle, rows });
  }catch(e){
    console.error("CLOUD_LISTS_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/cloud/lists", requireAuth, requirePro, async (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok:false, error:"no_items" });

    const sb = getSupabaseAdmin();
    if (sb){
      const r = await sbCloudListsUpsert(handle, items);
      return res.json({ ok:true, handle, saved: r.saved, updated_at: r.updated_at });
    }

    // sqlite fallback
    const now = nowIso();
    safeDb(() => {
      const st = db.prepare(`
        INSERT INTO cloud_lists(handle, kind, scope, lang, content, updated_at)
        VALUES(?,?,?,?,?,?)
        ON CONFLICT(handle, kind, scope, lang)
        DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at
      `);
      const tx = db.transaction((arr) => {
        for (const it of arr){
          const kind = String(it?.kind||"").toLowerCase();
          const scope = String(it?.scope||"").toLowerCase();
          const lang = String(it?.lang||"*").toLowerCase();
          const content = String(it?.content||"");
          if (kind!=="gm" && kind!=="gn") continue;
          if (scope!=="global" && scope!=="lang") continue;
          if (content.length > 200000) continue; // hard cap
          st.run(handle, kind, scope, lang, content, now);
        }
      });
      tx(items);
    });

    res.json({ ok:true, handle, saved: items.length, updated_at: now });
  }catch(e){
    console.error("CLOUD_LISTS_POST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});
