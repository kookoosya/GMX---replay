(function (window) {
  if (window.__GMXGenerateFlowFactory) return;

  window.__GMXGenerateFlowFactory = function createGMXGenerateFlow(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const initSession = typeof ctx.initSession === "function" ? ctx.initSession : async () => {};
    const readGenParams =
      typeof ctx.readGenParams === "function" ? ctx.readGenParams : () => ({});
    const getAntiStrength =
      typeof ctx.getAntiStrength === "function" ? ctx.getAntiStrength : () => 1;
    const getCleanFillEnabled =
      typeof ctx.getCleanFillEnabled === "function" ? ctx.getCleanFillEnabled : () => false;
    const getBestMode = typeof ctx.getBestMode === "function" ? ctx.getBestMode : () => false;
    const getGmView = typeof ctx.getGmView === "function" ? ctx.getGmView : () => "saved";
    const getGnView = typeof ctx.getGnView === "function" ? ctx.getGnView : () => "saved";
    const ensureIndexed = typeof ctx.ensureIndexed === "function" ? ctx.ensureIndexed : () => {};
    const activeKey = typeof ctx.activeKey === "function" ? ctx.activeKey : () => "";
    const getGlobalKey = typeof ctx.getGlobalKey === "function" ? ctx.getGlobalKey : () => "";
    const readKey = typeof ctx.readKey === "function" ? ctx.readKey : () => [];
    const writeKey = typeof ctx.writeKey === "function" ? ctx.writeKey : () => {};
    const remainingSlots =
      typeof ctx.remainingSlots === "function" ? ctx.remainingSlots : () => Infinity;
    const saveCap = typeof ctx.saveCap === "function" ? ctx.saveCap : () => 50;
    const renderList = typeof ctx.renderList === "function" ? ctx.renderList : () => {};
    const postEvent = typeof ctx.postEvent === "function" ? ctx.postEvent : () => {};
    const setBusy = typeof ctx.setBusy === "function" ? ctx.setBusy : () => {};
    const inflight = ctx.inflight || { gm: false, gn: false };
    const abort = ctx.abort || { gm: null, gn: null };
    const filterAntiRepeat =
      typeof ctx.filterAntiRepeat === "function" ? ctx.filterAntiRepeat : (_k, _key, lines) => lines;
    const pushRecent = typeof ctx.pushRecent === "function" ? ctx.pushRecent : () => {};
    const repeatKey = typeof ctx.repeatKey === "function" ? ctx.repeatKey : () => "";
    const oneClickCleanup =
      typeof ctx.oneClickCleanup === "function" ? ctx.oneClickCleanup : async () => ({});
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};
    const logEvent = typeof ctx.logEvent === "function" ? ctx.logEvent : () => {};
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const siteTr = typeof ctx.siteTr === "function" ? ctx.siteTr : (_k, fb) => fb;
    const t = typeof ctx.t === "function" ? ctx.t : (key) => key;
    const friendlyUiErrorMessage =
      typeof ctx.friendlyUiErrorMessage === "function" ? ctx.friendlyUiErrorMessage : (m) => m;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const yieldToUiFrame =
      typeof ctx.yieldToUiFrame === "function" ? ctx.yieldToUiFrame : async () => {};
    const cleanFillStrength = Number(ctx.cleanFillStrength || 2) || 2;
    const gen = ctx.gen || {};
    const mergeAppendUnique =
      typeof ctx.mergeAppendUnique === "function" ? ctx.mergeAppendUnique : (_a, b) => b;
    const recordBatchHistory =
      typeof ctx.recordBatchHistory === "function" ? ctx.recordBatchHistory : () => {};
    const renderGenHistory =
      typeof ctx.renderGenHistory === "function" ? ctx.renderGenHistory : () => {};

    async function generate(kind, count) {
      if (!requireConnected(kind === "gm" ? "GM" : "GN")) return;
      const msgElEarly = kind === "gm" ? $("gmMsg") : $("gnMsg");
      if (!getToken() && getHandle()) {
        try {
          await initSession(true);
        } catch (_e) {}
      }
      if (!getToken()) {
        if (msgElEarly)
          msgElEarly.innerHTML = `<span class="warn">${escapeHtml(siteTr("gen_session_expired", "Session expired — reconnect your @handle, then retry."))}</span>`;
        return;
      }

      const packEl = kind === "gm" ? $("gmPack") : $("gnPack");
      const packId = packEl ? packEl.value || "classic" : "classic";
      const { mode, lang, style, antiN } = readGenParams(kind);

      const msgEl = kind === "gm" ? $("gmMsg") : $("gnMsg");
      const strength = getAntiStrength(kind);
      const autoClean = count <= 1 ? getCleanFillEnabled(kind) : false;
      const view = kind === "gm" ? getGmView() : getGnView();

      if (view === "lang") ensureIndexed(kind, lang);

      const keyActive = activeKey(kind);
      const keyGlobal = getGlobalKey(kind);
      void keyGlobal;
      const beforeCount = readKey(keyActive).length;

      const remSlots = remainingSlots(kind);
      const effCount = remSlots === Infinity ? count : Math.max(0, Math.min(count, remSlots));

      if (effCount <= 0) {
        if (msgEl)
          msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()}). You can still copy lines, but no saved line will be replaced automatically.</span>`;
        postEvent("limit_hit", { where: "save_cap", kind });
        renderList(kind);
        didRender = true;
        return;
      }

      if (inflight[kind]) {
        if (msgEl) msgEl.innerHTML = '<span class="muted">Working...</span>';
        return;
      }
      inflight[kind] = true;
      try {
        window.__i18nPause = true;
      } catch (_e) {}
      setBusy(kind, true, count > 1 ? `Adding ${effCount}…` : "Working...");
      try {
        if (abort[kind]) abort[kind].abort();
      } catch (_e) {}
      const ctrl = new AbortController();
      abort[kind] = ctrl;

      let didRender = false;
      try {
        if (count === 1) {
          const tries = Math.max(1, Math.min(4, 1 + Math.floor(strength / 2)));
          let reply = null;

          for (let t0 = 0; t0 < tries; t0++) {
            const j = await api(
              `/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`,
              "GET",
              null,
              { signal: ctrl.signal, timeoutMs: 20000 }
            );
            const candidate = j.reply || "";
            const filtered = filterAntiRepeat(kind, keyActive, [candidate]);
            if (filtered.length) {
              reply = filtered[0];
              break;
            }
          }

          if (!reply) {
            const j = await api(
              `/api/generate?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}`,
              "GET",
              null,
              { signal: ctrl.signal, timeoutMs: 20000 }
            );
            reply = j.reply || "";
          }

          if (!String(reply || "").trim()) {
            if (msgEl)
              msgEl.innerHTML = `<span class="warn">${escapeHtml(t("gen_empty_reply") || "Server returned an empty line. Try another tone or preset.")}</span>`;
            return;
          }

          const cur = readKey(keyActive);
          const r = String(reply || "").trim();
          if (gen.isLineAlreadySaved(cur, r, strength)) {
            renderList(kind);
            didRender = true;
            if (msgEl) msgEl.innerHTML = `<span class="muted">Duplicate ignored.</span>`;
            return;
          }
          if (remainingSlots(kind) <= 0) {
            if (msgEl)
              msgEl.innerHTML = `<span class="warn">Free save limit reached (${saveCap()} lines). You can still copy lines, but no saved line will be replaced automatically.</span>`;
            postEvent("limit_hit", { where: "save_cap", kind });
            renderList(kind);
            didRender = true;
            return;
          }
          cur.push(r);
          writeKey(keyActive, cur);

          pushRecent(kind, [repeatKey(reply, Math.max(1, strength))]);
          if (!autoClean) {
            renderList(kind);
            didRender = true;
          }
          msgEl.innerHTML = `<span class="ok">Added 1</span>`;
          logEvent("gen_one", { kind, lang, style, pack: packId, view });
          try {
            await refreshUsage();
          } catch (_e) {}
        } else {
          const accepted = [];
          const takeLines = (arr) => {
            const chunk = gen.collectBulkUniqueLines(
              [...readKey(keyActive), ...accepted],
              arr,
              effCount - accepted.length
            );
            if (chunk.length) accepted.push(...chunk);
          };

          const buffer = 12;
          const genDeadline = Date.now() + 22000;
          let attempts = 0;
          while (accepted.length < effCount && attempts < 4) {
            if (Date.now() > genDeadline) break;
            attempts++;
            const missing = effCount - accepted.length;
            const reqCount = Math.min(48, missing + buffer);
            const bulk = await api(
              `/api/generate-bulk?kind=${kind}&mode=${encodeURIComponent(mode)}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&anti_last_n=${encodeURIComponent(antiN)}&count=${reqCount}`,
              "GET",
              null,
              { signal: ctrl.signal, timeoutMs: 15000 }
            );
            await yieldToUiFrame();
            takeLines(bulk.list || []);
            if (!Array.isArray(bulk.list) || bulk.list.length === 0) break;
          }

          const incoming = accepted.slice();
          const preferBest = autoClean || getBestMode();
          let selected = [];
          if (preferBest) {
            selected = gen.selectBestByShape(kind, incoming, Math.max(1, strength)).slice(0, effCount);
          } else {
            selected = incoming.slice(0, effCount).sort(() => Math.random() - 0.5);
          }

          const applyToKey = (k, list) => {
            if (!list || !list.length) return;
            const cur = readKey(k);
            const merged = mergeAppendUnique(cur, list);
            writeKey(k, merged);
          };
          applyToKey(keyActive, selected);
          pushRecent(kind, selected.map((x) => repeatKey(x, Math.max(1, cleanFillStrength))));
          renderList(kind);
          didRender = true;

          let added = Math.max(0, readKey(keyActive).length - beforeCount);
          let cleanRes = null;
          if (autoClean) {
            const targetTotal =
              remSlots === Infinity
                ? beforeCount + effCount
                : Math.min(saveCap(), beforeCount + effCount);
            cleanRes = await oneClickCleanup(kind, {
              targetCount: targetTotal,
              silent: true,
              keepMessage: true,
              signal: ctrl.signal,
            });
            renderList(kind);
            didRender = true;
            added = Math.max(0, (cleanRes?.finalCount ?? readKey(keyActive).length) - beforeCount);
          }

          if (autoClean && cleanRes) {
            if (cleanRes.finalCount >= cleanRes.targetCount) {
              msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">(Best pass removed ${cleanRes.removed}, refilled ${cleanRes.refilled})</span>`;
            } else {
              msgEl.innerHTML = `<span class="warn">Added ${added}. Best pass removed ${cleanRes.removed}, refilled ${cleanRes.refilled}, final ${cleanRes.finalCount}/${cleanRes.targetCount}. Try another tone or preset for a wider pool.</span>`;
            }
          } else if (added < effCount) {
            msgEl.innerHTML = `<span class="warn">Added ${added}/${effCount}. Random fill stopped early because the pool got too narrow. Change tone or preset for a wider pull.</span>`;
          } else {
            msgEl.innerHTML = `<span class="ok">Added ${added}</span> <span class="muted small">Run Best pass manually if you want cleanup/refill.</span>`;
          }
          logEvent("gen_bulk", {
            kind,
            lang,
            style,
            pack: packId,
            count: effCount,
            view,
            cleanFill: autoClean,
          });
          if (selected.length) {
            recordBatchHistory(kind, {
              lines: selected,
              count: effCount,
              meta: { mode, lang, style, pack: packId },
            });
            renderGenHistory(kind);
          }
          try {
            await refreshUsage();
          } catch (_e) {}
        }
      } catch (e) {
        const m = e && e.message ? e.message : "failed";
        const friendly = friendlyUiErrorMessage(m, { scope: "generate" });
        if (msgEl) msgEl.innerHTML = `<span class="bad">${escapeHtml(friendly)}</span>`;
        try {
          toast("bad", `<b>Generate failed:</b> ${escapeHtml(friendly)}`);
        } catch (_e) {}
        logEvent("gen_error", { kind, err: m, friendly });
      } finally {
        inflight[kind] = false;
        try {
          window.__i18nPause = false;
        } catch (_e) {}
        try {
          abort[kind] = null;
        } catch (_e) {}
        setBusy(kind, false);
        if (!didRender) {
          try {
            renderList(kind);
          } catch (_e) {}
        }
      }
    }

    return { generate };
  };
})(window);
