(function (window) {
  if (window.__GMXSiteI18nDynamicFactory) return;

  window.__GMXSiteI18nDynamicFactory = function createGMXSiteI18nDynamic(ctx) {
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const siteTr = typeof ctx.siteTr === "function" ? ctx.siteTr : (k, fb) => fb || k;
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml =
      typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s ?? "");
    const syncPredictionFilterCopy =
      typeof ctx.syncPredictionFilterCopy === "function" ? ctx.syncPredictionFilterCopy : () => {};
    const syncCleanFillUi =
      typeof ctx.syncCleanFillUi === "function" ? ctx.syncCleanFillUi : () => {};
    const syncReferralCardCopy =
      typeof ctx.syncReferralCardCopy === "function" ? ctx.syncReferralCardCopy : () => {};
    const initReferralPromoDetailsState =
      typeof ctx.initReferralPromoDetailsState === "function"
        ? ctx.initReferralPromoDetailsState
        : () => {};
    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const scheduleRefStatsRefresh =
      typeof ctx.scheduleRefStatsRefresh === "function" ? ctx.scheduleRefStatsRefresh : () => {};
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;

    function getReferralUiCopy(_lang) {
      const fallback = {
        title: "How it works",
        note: "Referrals unlock perks only after real product usage (not just signups).",
        desc: "What actually unlocks perks:",
        items: [
          "Share your link. Only real usage moves unlocks.",
          "<b>Confirmed</b> = a handle connected through your link.",
          "<b>Active</b> = that confirmed user actually used GM or GN.",
          "<b>Eligible</b> = max(active, carry-over).",
        ],
        promoterTitle: "Promoter details",
        baseDaily: "Base daily",
        unlocksNow: "Unlocks now",
        nextUnlock: "Next unlock",
        allUnlocked: "All listed unlocks reached",
        antiAbuse: "Only eligible referrals count. Signups alone do not unlock perks.",
        confirmed: "Confirmed",
        active: "Active",
        eligible: "Eligible",
        legacy: "Carry-over",
        clicks: "Clicks",
        bgSlots: "BG slots",
        saveCap: "Save cap",
        unlimited: "Unlimited",
        onePack: "1 cosmetics pack",
        allPacks: "All cosmetics packs",
        proTrial: "Pro Trial 7d",
        discount: "50% off 1 month",
        toolkit: "Referral Toolkit",
        copied: "Copied.",
        leaderboardLoading: "Loading...",
        leaderboardEmpty: "No data yet",
        youLabel: "You",
        rulesLabel: "rules",
        invitedNote:
          "This list shows real usage only. Fraud-flagged or empty signups do not stay here.",
      };
      const items = [
        t("r_li1") || fallback.items[0],
        t("r_li2c") || t("r_li2") || fallback.items[1],
        t("r_li3") || fallback.items[2],
        t("r_li4") || fallback.items[3],
      ];
      return {
        title: t("r_how") || fallback.title,
        note: t("r_note") || fallback.note,
        desc: t("r_desc") || fallback.desc,
        items,
        promoterTitle: t("ref_promoter_details") || fallback.promoterTitle,
        baseDaily: t("ref_daily_limit_title") || fallback.baseDaily,
        unlocksNow: t("ref_unlocks_now") || fallback.unlocksNow,
        nextUnlock: t("ref_next_unlock") || fallback.nextUnlock,
        allUnlocked: t("ref_all_unlocked") || fallback.allUnlocked,
        antiAbuse: t("ref_abuse_note") || fallback.antiAbuse,
        confirmed: t("ref_k_confirmed") || fallback.confirmed,
        active: t("ref_k_active") || fallback.active,
        eligible: t("ref_k_eligible") || fallback.eligible,
        legacy: t("ref_k_legacy") || fallback.legacy,
        clicks: fallback.clicks,
        bgSlots: fallback.bgSlots,
        saveCap: fallback.saveCap,
        unlimited: fallback.unlimited,
        onePack: fallback.onePack,
        allPacks: fallback.allPacks,
        proTrial: fallback.proTrial,
        discount: fallback.discount,
        toolkit: fallback.toolkit,
        copied: t("toast_copied") || fallback.copied,
        leaderboardLoading: t("r_loading") || fallback.leaderboardLoading,
        leaderboardEmpty: t("lb_empty") || fallback.leaderboardEmpty,
        youLabel: t("lb_you") || fallback.youLabel,
        rulesLabel: fallback.rulesLabel,
        invitedNote: t("r_invited_note") || fallback.invitedNote,
      };
    }

    function getGuideUiCopy(_lang) {
      const toList = (val, fallback) => (Array.isArray(val) && val.length ? val : fallback);
      return {
        gm: {
          title: t("gm_right") || "How to use GM",
          desc:
            t("gm_right_desc") ||
            "Build short English morning replies that are natural, direct, and easy to paste.",
          items: toList(t("gm_right_list"), [
            "Use Random 1/10/70 to add fresh lines.",
            "Use Repeat guard to avoid near-duplicates in batches.",
            "Use Filter to search inside saved lines.",
          ]),
        },
        gn: {
          title: t("gn_right") || "How to use GN",
          desc:
            t("gn_right_desc") ||
            "Build short English night replies that are calm, human, and easy to paste.",
          items: toList(t("gn_right_list"), [
            "Use Random 1/10/70 to add fresh lines.",
            "Use Repeat guard to avoid near-duplicates in batches.",
            "Use Filter to search inside saved lines.",
          ]),
        },
        ext: {
          title: t("extthemes_right_title") || "How unlocks work",
          desc:
            t("extthemes_right_desc") || "Extension skins and wallpapers sync from the site.",
          items: toList(t("extthemes_right_list"), [
            "Skins and wallpapers are applied from the site.",
            "Only one skin is active at a time.",
            "Pro unlocks all cosmetics.",
          ]),
        },
      };
    }

    function renderGuideRightCopy(lang) {
      const ui = getGuideUiCopy(lang);
      if ($("gm_right")) $("gm_right").textContent = ui.gm.title;
      if ($("gm_right_desc")) $("gm_right_desc").textContent = ui.gm.desc;
      if ($("gm_right_list")) {
        $("gm_right_list").innerHTML = ui.gm.items.map((x) => `<li>${x}</li>`).join("");
      }
      if ($("gn_right")) $("gn_right").textContent = ui.gn.title;
      if ($("gn_right_desc")) $("gn_right_desc").textContent = ui.gn.desc;
      if ($("gn_right_list")) {
        $("gn_right_list").innerHTML = ui.gn.items.map((x) => `<li>${x}</li>`).join("");
      }
      if ($("extthemes_right_title")) $("extthemes_right_title").textContent = ui.ext.title;
      if ($("extthemes_right_desc")) $("extthemes_right_desc").textContent = ui.ext.desc;
      if ($("extthemes_right_list")) {
        $("extthemes_right_list").innerHTML = ui.ext.items
          .map((x) => `<li>${x}</li>`)
          .join("");
      }
    }

    function deriveReferralUnlocks(eligible, rawUnlocks) {
      const raw = rawUnlocks && typeof rawUnlocks === "object" ? rawUnlocks : null;
      if (raw) {
        const bgSlotsRaw = Number(raw.bgSlots ?? raw.bg_slots ?? 0) || 0;
        const saveCapBonus = Number(raw.saveCapBonus ?? raw.save_cap_bonus ?? 0) || 0;
        return {
          bgSlots: bgSlotsRaw > 0 ? bgSlotsRaw : 3,
          unlimitedBg: !!raw.unlimitedBg || bgSlotsRaw >= 9999,
          saveCapBonus,
          onePack: !!raw.onePack,
          allPacks: !!raw.allPacks,
          proTrial: !!raw.proTrial,
          discount: !!raw.discount,
          toolkit: !!raw.toolkit,
        };
      }
      const e = Number(eligible || 0) || 0;
      return {
        bgSlots: e >= 15 ? 9999 : e >= 7 ? 12 : e >= 3 ? 8 : e >= 1 ? 5 : 3,
        unlimitedBg: e >= 15,
        saveCapBonus: e >= 7 ? 50 : 0,
        onePack: e >= 3,
        allPacks: e >= 15,
        proTrial: e >= 30,
        discount: e >= 50,
        toolkit: e >= 100,
      };
    }

    const refProgressCore = globalThis.GMXReferralProgressCore || null;
    const refBadgeCore = globalThis.GMXReferralBadgeCore || null;
    const REF_BADGE_SEEN_KEY = "gmx_ref_badge_tier_v1";

    function nextReferralUnlockAt(eligible) {
      if (refProgressCore) return refProgressCore.nextReferralUnlockAt(eligible);
      const e = Number(eligible || 0) || 0;
      const steps = [1, 3, 7, 15, 30, 50, 100];
      for (const step of steps) {
        if (e < step) return step;
      }
      return 0;
    }

    function nextReferralUnlockLabel(lang, step) {
      const ui = getReferralUiCopy(lang);
      const s = Number(step || 0) || 0;
      if (s === 1) return `1 -> ${ui.bgSlots}: 5`;
      if (s === 3) return `3 -> ${ui.bgSlots}: 8 + ${ui.onePack}`;
      if (s === 7) return `7 -> ${ui.bgSlots}: 12 + ${ui.saveCap}: 120`;
      if (s === 15) return `15 -> ${ui.unlimited} ${String(ui.bgSlots).toLowerCase()} + ${ui.allPacks}`;
      if (s === 30) return `30 -> ${ui.proTrial}`;
      if (s === 50) return `50 -> ${ui.discount}`;
      if (s === 100) return `100 -> ${ui.toolkit}`;
      return ui.allUnlocked;
    }

    function syncRefProgressMeter(lang, eligible) {
      const wrap = $("refProgressWrap");
      const label = $("refProgressLabel");
      const fillEl = $("refProgressFill");
      const pctEl = $("refProgressPct");
      const needEl = $("refProgressNeed");
      if (!wrap || !label || !fillEl) return;
      const state = refProgressCore
        ? refProgressCore.referralProgressState(eligible)
        : (() => {
            const e = Number(eligible || 0) || 0;
            const nextStep = nextReferralUnlockAt(e);
            return {
              eligible: e,
              nextStep,
              prevStep: 0,
              needed: Math.max(0, nextStep - e),
              pct: nextStep > 0 ? Math.min(100, Math.round((e / nextStep) * 100)) : 100,
              complete: nextStep <= 0,
            };
          })();
      if (state.complete) {
        wrap.classList.add("hidden");
        return;
      }
      wrap.classList.remove("hidden");
      const reward = nextReferralUnlockLabel(lang, state.nextStep);
      const tpl = siteTr(
        "ref_progress_meter_html",
        "Next unlock at <b>{n}</b> eligible — {reward}"
      );
      label.innerHTML = tpl
        .replace(/\{n\}/g, String(state.nextStep))
        .replace(/\{reward\}/g, escapeHtml(reward));
      fillEl.style.width = String(state.pct) + "%";
      if (pctEl) pctEl.textContent = String(state.pct) + "%";
      if (needEl) {
        const needTpl = siteTr(
          "ref_progress_need_html",
          "Need <b>{n}</b> more eligible"
        );
        needEl.innerHTML =
          state.needed > 0
            ? needTpl.replace(/\{n\}/g, String(state.needed))
            : siteTr("ref_progress_ready", "Ready to unlock on next eligible referral");
      }
    }

    function badgeTierLabel(lang, tierId) {
      const key = `ref_badge_${tierId}`;
      return siteTr(key, tierId);
    }

    function renderBadgePill(tier, lang, { compact = false } = {}) {
      if (!tier || !refBadgeCore) return "";
      const label = badgeTierLabel(lang, tier.id);
      return refBadgeCore.referralBadgePillHtml(tier, { label: escapeHtml(label), compact });
    }

    function syncRefBadgeUi(lang, eligible, { isPro = false, toast = null, announce = false } = {}) {
      if (!refBadgeCore) return;
      const state = refBadgeCore.referralBadgeState(eligible, { isPro });
      const earned = refBadgeCore.earnedReferralBadgeTier(eligible);

      const setPill = (id, compact) => {
        const el = $(id);
        if (!el) return;
        if (!getHandle() || !state.current) {
          el.classList.add("hidden");
          el.innerHTML = "";
          return;
        }
        el.classList.remove("hidden");
        el.innerHTML = renderBadgePill(state.current, lang, { compact });
      };

      setPill("headerRefBadge", true);
      setPill("homeRefBadge", false);

      const shelf = $("refBadgeShelf");
      const shelfTitle = $("refBadgeShelfTitle");
      const shelfRow = $("refBadgeRow");
      const nextHint = $("refBadgeNextHint");
      if (shelfTitle) shelfTitle.textContent = siteTr("ref_badge_title", "Promoter badges");
      if (shelfRow) {
        shelfRow.innerHTML = refBadgeCore.REF_BADGE_TIERS.map((tier) => {
          const unlocked = (earned && refBadgeCore.badgeTierRank(earned) >= refBadgeCore.badgeTierRank(tier));
          const label = badgeTierLabel(lang, tier.id);
          return `<div class="refBadgeTile ${tier.cls}${unlocked ? " refBadgeTileUnlocked" : ""}">
            <span class="refBadgeIcon" aria-hidden="true">${tier.icon}</span>
            <span class="refBadgeName">${escapeHtml(label)}</span>
            <span class="refBadgeReq muted small">${tier.minEligible}+</span>
          </div>`;
        }).join("");
      }
      if (nextHint) {
        if (state.complete) {
          nextHint.textContent = siteTr("ref_badge_all_unlocked", "All promoter badges unlocked");
        } else if (state.next) {
          const tpl = siteTr("ref_badge_next_html", "Next badge at <b>{n}</b> eligible — {tier}");
          const tierName = badgeTierLabel(lang, state.next.id);
          nextHint.innerHTML = tpl
            .replace(/\{n\}/g, String(state.next.minEligible))
            .replace(/\{tier\}/g, escapeHtml(tierName));
        } else {
          nextHint.textContent = "";
        }
      }
      if (shelf) shelf.classList.toggle("hidden", !getHandle());

      if (!announce || !toast || typeof toast !== "function" || !state.current) return;
      let seenId = "";
      try {
        seenId = String(localStorage.getItem(REF_BADGE_SEEN_KEY) || "");
      } catch {}
      const currentId = state.current.id;
      if (refBadgeCore.badgeTierRank(currentId) <= refBadgeCore.badgeTierRank(seenId)) return;
      try {
        localStorage.setItem(REF_BADGE_SEEN_KEY, currentId);
      } catch {}
      const tierName = badgeTierLabel(lang, currentId);
      const tpl = siteTr("ref_badge_toast_html", "New badge unlocked: <b>{tier}</b>");
      toast("ok", tpl.replace(/\{tier\}/g, escapeHtml(tierName)), 5500);
    }

    function renderReferralRightCopy(lang) {
      const ui = getReferralUiCopy(lang);
      const title = $("r_how");
      if (title) title.textContent = ui.title;
      const desc = $("r_desc");
      if (desc) desc.textContent = ui.desc;
      const invited = $("r_invited_note");
      if (invited) invited.textContent = ui.invitedNote;
      const list = $("r_list");
      if (list) {
        list.innerHTML = ui.items
          .map((line, i) => `<li id="r_li${i + 1}">${line}</li>`)
          .join("");
      }
    }

    function syncModePanelCopy() {
      const bind = (kind) => {
        const sizeLbl = $(kind === "gm" ? "gm_size" : "gn_size");
        const sel = $(kind === "gm" ? "gmMode" : "gnMode");
        const fallbacks = {
          min: "Fast · short",
          mid: "Balanced · default",
          max: "Full · richer",
        };
        if (sizeLbl) {
          const k = kind === "gm" ? "gm_size_label" : "gn_size_label";
          sizeLbl.textContent = siteTr(k, "Size");
        }
        if (!sel) return;
        const labels = {
          min: siteTr(kind === "gm" ? "gm_mode_min" : "gn_mode_min", fallbacks.min),
          mid: siteTr(kind === "gm" ? "gm_mode_mid" : "gn_mode_mid", fallbacks.mid),
          max: siteTr(kind === "gm" ? "gm_mode_max" : "gn_mode_max", fallbacks.max),
        };
        for (const opt of sel.options) {
          const v = String(opt.value || "").toLowerCase();
          const label = labels[v];
          if (label) opt.textContent = label;
        }
      };
      bind("gm");
      bind("gn");
    }

    function patchDynamicCopy(lang, _merged) {
      try {
        const msg = $("refMsg");
        if (msg && msg.textContent && msg.textContent.trim() === "Loaded.") {
          msg.innerHTML = '<span class="ok">' + escapeHtml(t("ref_loaded")) + "</span>";
        }
      } catch (_e) {}
      try {
        renderReferralRightCopy(lang);
      } catch (_e) {}
      try {
        syncPredictionFilterCopy();
      } catch (_e) {}
      try {
        syncModePanelCopy();
      } catch (_e) {}
      try {
        syncCleanFillUi();
      } catch (_e) {}
      try {
        syncReferralCardCopy();
      } catch (_e) {}
      try {
        initReferralPromoDetailsState();
      } catch (_e) {}
      try {
        const eligible = Number($("refEligibleInline")?.textContent || 0) || 0;
        syncRefProgressMeter(lang, eligible);
      } catch (_e) {}
      try {
        const eligible = Number($("refEligibleInline")?.textContent || 0) || 0;
        syncRefBadgeUi(lang, eligible, { isPro: isPro() });
      } catch (_e) {}
      try {
        if (getCurrentTab() === "referrals" && getHandle()) {
          scheduleRefStatsRefresh(220);
        }
      } catch (_e) {}
    }

    return {
      getReferralUiCopy,
      getGuideUiCopy,
      renderGuideRightCopy,
      deriveReferralUnlocks,
      nextReferralUnlockAt,
      nextReferralUnlockLabel,
      syncRefProgressMeter,
      syncRefBadgeUi,
      renderReferralRightCopy,
      syncModePanelCopy,
      patchDynamicCopy,
    };
  };
})(window);
