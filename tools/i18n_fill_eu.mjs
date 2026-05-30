#!/usr/bin/env node
/**
 * Fill EU/Asian locales where leaf still equals English (phrase-level map).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localesDir = path.join(root, "shared", "i18n", "locales");
const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

const PHRASES = {
  de: {
    Compare: "Vergleichen",
    Close: "Schließen",
    Loading: "Laden…",
    "Loading…": "Laden…",
    Error: "Fehler",
    "Connect first": "Zuerst verbinden",
    You: "Du",
    Eligible: "Zählt",
    "No data yet.": "Noch keine Daten.",
    "Copy link": "Link kopieren",
    "Load stats": "Statistik laden",
    Referrals: "Empfehlungen",
    Themes: "Themes",
    "Upgrade Pro": "Pro upgraden",
    Home: "Start",
    Locked: "Gesperrt",
    "Repeat guard": "Wiederholungsschutz",
    "Payment verified": "Zahlung bestätigt",
    "Checkout started": "Checkout gestartet",
    "Referral confirmed": "Empfehlung bestätigt",
    "Referral used": "Empfehlung genutzt",
    "Promo code redeemed": "Promo-Code eingelöst",
    "Feature flag changed": "Feature-Flag geändert",
    "Sign in to see activity.": "Anmelden, um Aktivität zu sehen.",
    "No activity yet.": "Noch keine Aktivität.",
    All: "Alle",
    Any: "Beliebig",
    Bullish: "Bullisch",
    Bearish: "Bärisch",
    Neutral: "Neutral",
    "Refresh signals": "Signale aktualisieren",
    "Referral link": "Empfehlungslink",
    Active: "Aktiv",
    Confirmed: "Bestätigt",
    Clicks: "Klicks",
    rules: "Regeln",
    "Unlocks now": "Jetzt freigeschaltet",
    "Next unlock": "Nächste Freischaltung",
    "All listed unlocks reached": "Alle Freischaltungen erreicht",
    "Pack applied": "Paket angewendet",
    "Pack is locked. Upgrade to Pro or unlock via referrals.":
      "Paket gesperrt. Pro oder Empfehlungen nötig.",
  },
  fr: {
    Compare: "Comparer",
    Close: "Fermer",
    "Loading…": "Chargement…",
    Error: "Erreur",
    "Connect first": "Connectez-vous d'abord",
    You: "Vous",
    Eligible: "Éligible",
    "No data yet.": "Pas encore de données.",
    "Copy link": "Copier le lien",
    "Load stats": "Charger les stats",
    Referrals: "Parrainages",
    Themes: "Thèmes",
    "Upgrade Pro": "Passer Pro",
    Home: "Accueil",
    Locked: "Verrouillé",
    "Repeat guard": "Anti-répétition",
    "Payment verified": "Paiement vérifié",
    "Checkout started": "Paiement lancé",
    "Referral confirmed": "Parrainage confirmé",
    "Referral used": "Parrainage utilisé",
    "Promo code redeemed": "Code promo utilisé",
    All: "Tous",
    Any: "Tout",
    Bullish: "Haussier",
    Bearish: "Baissier",
    Neutral: "Neutre",
    "Refresh signals": "Actualiser les signaux",
    "Referral link": "Lien de parrainage",
    Active: "Actifs",
    Confirmed: "Confirmés",
    Clicks: "Clics",
    rules: "règles",
  },
  es: {
    Compare: "Comparar",
    Close: "Cerrar",
    "Loading…": "Cargando…",
    Error: "Error",
    "Connect first": "Conéctate primero",
    You: "Tú",
    Eligible: "Elegible",
    "No data yet.": "Sin datos aún.",
    "Copy link": "Copiar enlace",
    "Load stats": "Cargar estadísticas",
    Referrals: "Referidos",
    Themes: "Temas",
    "Upgrade Pro": "Mejorar a Pro",
    Home: "Inicio",
    Locked: "Bloqueado",
    "Repeat guard": "Anti-repetición",
    All: "Todos",
    Any: "Cualquiera",
    Bullish: "Alcista",
    Bearish: "Bajista",
    Neutral: "Neutral",
    "Referral link": "Enlace de referido",
    Active: "Activos",
    Confirmed: "Confirmados",
    Clicks: "Clics",
  },
  pt: {
    Compare: "Comparar",
    Close: "Fechar",
    "Loading…": "Carregando…",
    Error: "Erro",
    Referrals: "Indicações",
    Themes: "Temas",
    "Upgrade Pro": "Upgrade Pro",
    Home: "Início",
    Locked: "Bloqueado",
    All: "Todos",
    Any: "Qualquer",
  },
  it: {
    Compare: "Confronta",
    Close: "Chiudi",
    "Loading…": "Caricamento…",
    Error: "Errore",
    Referrals: "Referral",
    Themes: "Temi",
    Home: "Home",
    Locked: "Bloccato",
    All: "Tutti",
    Any: "Qualsiasi",
  },
};

function translateLeaf(code, value) {
  const map = PHRASES[code];
  if (!map) return value;
  if (map[value]) return map[value];
  return value;
}

function walkAssign(code, base, loc) {
  let n = 0;
  for (const key of Object.keys(base)) {
    if (Array.isArray(base[key])) {
      if (!Array.isArray(loc[key])) loc[key] = [];
      for (let i = 0; i < base[key].length; i++) {
        const b = base[key][i];
        const cur = loc[key][i];
        if (cur === b || cur === undefined || cur === "") {
          const t = translateLeaf(code, b);
          if (t !== b) {
            loc[key][i] = t;
            n++;
          } else if (cur === undefined || cur === "") {
            loc[key][i] = b;
          }
        }
      }
    } else if (base[key] && typeof base[key] === "object") {
      if (!loc[key] || typeof loc[key] !== "object") loc[key] = {};
      n += walkAssign(code, base[key], loc[key]);
    } else {
      const cur = loc[key];
      if (cur === base[key] || cur === undefined || cur === "") {
        const t = translateLeaf(code, base[key]);
        if (t !== base[key]) {
          loc[key] = t;
          n++;
        } else if (cur === undefined || cur === "") {
          loc[key] = base[key];
          n++;
        }
      }
    }
  }
  return n;
}

for (const code of ["de", "fr", "es", "pt", "it", "nl", "tr", "pl", "id"]) {
  const p = path.join(localesDir, `${code}.json`);
  if (!fs.existsSync(p)) continue;
  const loc = JSON.parse(fs.readFileSync(p, "utf8"));
  const n = walkAssign(code, en, loc);
  fs.writeFileSync(p, JSON.stringify(loc, null, 2) + "\n");
  console.log(code, "updated", n, "leaves");
}
