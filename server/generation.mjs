/**
 * GM/GN reply generation engine (extracted from index.js).
 */
import { normLang, getLocalizedBank, SUPPORTED_REPLY_LANGS } from "./generation-lang.mjs";

export function createGenerator(deps) {
  const { safeDb, db, nowIso, safeOptionalHistoryDb, sha256 } = deps;

function pick(arr) {
  const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (!list.length) return "";
  return list[Math.floor(Math.random() * list.length)];
}

const E = (...codes) => String.fromCodePoint(...codes);

const MORNING_EMOJI = [E(0x2600, 0xFE0F), E(0x2615), E(0x2728), E(0x1F305)];
const NIGHT_EMOJI = [E(0x1F319), E(0x1F634), E(0x1F4A4), E(0x2728)];

const SAFE_VOCATIVE = {
  ordinary: ["bro", "homie", "friend", "degen"],
  crypto: ["bro", "degen", "homie", "friend"],
  warm: ["friend", "bro", "homie", "degen"],
  calmer: ["friend", "bro", "homie", "degen"],
  builder: ["degen", "bro", "homie", "friend"],
};

const FAMILY_BY_STYLE = {
  classic: "ordinary",
  classy: "warm",
  emoji: "ordinary",
  noemoji: "ordinary",
  minimal: "ordinary",
  meme: "meme",
  degen: "crypto",
  alpha: "crypto",
  cheer: "warm",
  calm: "calmer",
  builder: "builder",
  focus: "builder",
};

const BANKS = {
  ordinary: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet}! {emoji}",
        "{greet} {voc} {emoji}",
        "{greet}, good one {emoji}",
        "{greet}, nice post {emoji}",
        "{greet}, clean one {emoji}",
        "{greet} {voc}, good one {emoji}",
        "{greet} {voc}, nice gm {emoji}",
        "{greet}, coffee first {emoji}",
        "{greet} {voc}, morning back {emoji}",
        "{greet}, good looks {emoji}",
        "{greet}, easy start {emoji}",
        "{greet}, smooth start {emoji}",
        "{greet}, steady start {emoji}",
        "{greet}, morning reset {emoji}",
        "{greet}, clean read {emoji}",
        "{greet}, good thread {emoji}",
        "{greet}, rise easy {emoji}",
        "{greet} {voc}, quick gm {emoji}",
        "{greet}, here for it {emoji}",
        "{greet}, light start {emoji}",
        "{greet} {voc}, back at it {emoji}",
      ],
      mid: [
        "{greet} {voc}, strong gm from you {emoji}",
        "{greet} {voc}, good energy on this one {emoji}",
        "{greet}, hope the day starts easy {emoji}",
        "{greet} {voc}, wishing you a smooth one {emoji}",
        "{greet}, hope the coffee hits early {emoji}",
        "{greet} {voc}, solid way to start the day {emoji}",
        "{greet}, good post to start the day {emoji}",
        "{greet} {voc}, hope today treats you well {emoji}",
        "{greet}, strong post for the morning {emoji}",
        "{greet} {voc}, this one lands nicely {emoji}",
        "{greet}, good morning energy on this one {emoji}",
        "{greet} {voc}, hope the day opens kind {emoji}",
        "{greet}, nice way to open the day {emoji}",
        "{greet} {voc}, good vibes on this one {emoji}",
        "{greet}, clean morning post {emoji}",
      ],
      max: [
        "{greet} {voc}, strong post and even better morning energy {emoji}",
        "{greet}, good way to start the day, hope it stays kind {emoji}",
        "{greet} {voc}, hope the coffee hits and the day goes easy {emoji}",
        "{greet}, solid post to wake the timeline up a bit {emoji}",
        "{greet} {voc}, good energy here, hope today treats you well {emoji}",
        "{greet}, clean morning reply, hope the rest of the day follows {emoji}",
        "{greet} {voc}, strong gm and a good start to the day {emoji}",
        "{greet}, this is the kind of post the morning needed {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet}! {emoji}",
        "{greet} {voc} {emoji}",
        "{greet}, sleep well {emoji}",
        "{greet}, rest easy {emoji}",
        "{greet} {voc}, good rest {emoji}",
        "{greet}, easy night {emoji}",
        "{greet} {voc}, sleep easy {emoji}",
        "{greet}, calm close {emoji}",
        "{greet}, soft close {emoji}",
        "{greet}, quiet close {emoji}",
        "{greet}, night reset {emoji}",
        "{greet}, proper rest {emoji}",
        "{greet}, see you tomorrow {emoji}",
        "{greet} {voc}, logging off {emoji}",
        "{greet}, good night back {emoji}",
        "{greet}, off to rest {emoji}",
      ],
      mid: [
        "{greet} {voc}, sleep easy tonight {emoji}",
        "{greet}, rest well and come back strong {emoji}",
        "{greet} {voc}, calm close tonight {emoji}",
        "{greet}, good night and good rest {emoji}",
        "{greet} {voc}, hope the night is kind {emoji}",
        "{greet}, easy close and better morning tomorrow {emoji}",
        "{greet} {voc}, good rest on your side {emoji}",
        "{greet}, soft landing tonight {emoji}",
        "{greet} {voc}, sleep well and reset {emoji}",
        "{greet}, good post to end the day with {emoji}",
      ],
      max: [
        "{greet} {voc}, good rest tonight and a better morning tomorrow {emoji}",
        "{greet}, calm close and good sleep on your side {emoji}",
        "{greet} {voc}, rest well and come back fresh in the morning {emoji}",
        "{greet}, soft end to the day, hope you sleep easy {emoji}",
        "{greet} {voc}, good night energy here, now get some real rest {emoji}",
        "{greet}, this is a good way to close the timeline for the night {emoji}",
        "{greet} {voc}, rest well and let the day go quiet {emoji}",
        "{greet}, sleep easy tonight and wake up good tomorrow {emoji}",
      ],
    },
  },
  crypto: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet} {voc} {emoji}",
        "{greet}, good alpha {emoji}",
        "{greet}, strong post {emoji}",
        "{greet} {voc}, nice call {emoji}",
        "{greet}, clean setup {emoji}",
        "{greet} {voc}, good read {emoji}",
        "{greet}, solid take {emoji}",
        "{greet}, clean tape {emoji}",
        "{greet}, sharp read {emoji}",
        "{greet}, calm session {emoji}",
        "{greet}, good chart {emoji}",
        "{greet} {voc}, steady open {emoji}",
        "{greet}, sharp setup {emoji}",
        "{greet} {voc}, clean conviction {emoji}",
        "{greet}, good session open {emoji}",
        "{greet}, nice read here {emoji}",
      ],
      mid: [
        "{greet} {voc}, good alpha on this one {emoji}",
        "{greet}, strong post for the open {emoji}",
        "{greet} {voc}, clean read here {emoji}",
        "{greet}, good take to start the session {emoji}",
        "{greet} {voc}, hoping the market stays kind today {emoji}",
        "{greet}, solid setup and calm energy here {emoji}",
        "{greet} {voc}, this is a clean call {emoji}",
        "{greet}, good morning to a strong chart read {emoji}",
        "{greet} {voc}, this one reads sharp {emoji}",
        "{greet}, clean post and steady start {emoji}",
      ],
      max: [
        "{greet} {voc}, clean read here and a strong way to start the session {emoji}",
        "{greet}, good alpha on this one, hope the market stays calm today {emoji}",
        "{greet} {voc}, solid post and a nice way to open the day {emoji}",
        "{greet}, strong take here, hoping the setup follows through {emoji}",
        "{greet} {voc}, this is the kind of post that makes the open look better {emoji}",
        "{greet}, clean setup and good energy for the day ahead {emoji}",
        "{greet} {voc}, sharp read and a steady start to the timeline {emoji}",
        "{greet}, solid call here, hope the session treats you well {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet} {voc} {emoji}",
        "{greet}, rest easy {emoji}",
        "{greet}, solid close {emoji}",
        "{greet} {voc}, sleep well {emoji}",
        "{greet}, calm close {emoji}",
        "{greet} {voc}, good rest {emoji}",
        "{greet}, easy reset {emoji}",
        "{greet}, charts can wait {emoji}",
        "{greet}, soft reset {emoji}",
        "{greet}, proper close {emoji}",
        "{greet}, clean day done {emoji}",
        "{greet} {voc}, log off easy {emoji}",
        "{greet}, session closed {emoji}",
      ],
      mid: [
        "{greet} {voc}, good rest before the next session {emoji}",
        "{greet}, calm close after a solid day {emoji}",
        "{greet} {voc}, sleep well and reset {emoji}",
        "{greet}, rest easy and come back fresh tomorrow {emoji}",
        "{greet} {voc}, good night after a clean post {emoji}",
        "{greet}, soft close and real rest tonight {emoji}",
        "{greet} {voc}, steady night on your side {emoji}",
        "{greet}, let the charts wait till morning {emoji}",
        "{greet} {voc}, get some proper rest tonight {emoji}",
        "{greet}, good close and a clean reset {emoji}",
      ],
      max: [
        "{greet} {voc}, good rest tonight and a calmer session tomorrow {emoji}",
        "{greet}, solid close here, now let the charts wait till morning {emoji}",
        "{greet} {voc}, sleep well and come back fresh for the next move {emoji}",
        "{greet}, calm night on your side after a strong day {emoji}",
        "{greet} {voc}, good night and a proper reset before tomorrow opens {emoji}",
        "{greet}, this is a clean way to close the day, rest easy {emoji}",
        "{greet} {voc}, soft close tonight and better energy tomorrow {emoji}",
        "{greet}, good rest first, the market can wait a few hours {emoji}",
      ],
    },
  },
  warm: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet} {voc} {emoji}",
        "{greet}, kind energy {emoji}",
        "{greet} {voc}, good energy {emoji}",
        "{greet} {voc}, nice one {emoji}",
        "{greet}, warm one {emoji}",
        "{greet}, gentle start {emoji}",
        "{greet} {voc}, soft morning {emoji}",
        "{greet}, kind one {emoji}",
        "{greet} {voc}, good morning back {emoji}",
        "{greet}, light and warm {emoji}",
      ],
      mid: [
        "{greet} {voc}, hope today is kind to you {emoji}",
        "{greet} {voc}, sending good energy your way {emoji}",
        "{greet}, warm start on this one {emoji}",
        "{greet} {voc}, hope the day lands easy {emoji}",
        "{greet} {voc}, good energy here and I hope it stays with you {emoji}",
        "{greet}, gentle morning energy on this one {emoji}",
        "{greet} {voc}, hope the day opens soft for you {emoji}",
        "{greet}, warm read and a nice way to start {emoji}",
      ],
      max: [
        "{greet} {voc}, good energy on this one and I hope the day stays kind to you {emoji}",
        "{greet} {voc}, warm morning here, hope the rest of your day follows {emoji}",
        "{greet}, this is a nice way to start the day, sending good energy back {emoji}",
        "{greet} {voc}, hope the morning feels easy and the day treats you well {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet} {voc} {emoji}",
        "{greet}, rest easy {emoji}",
        "{greet} {voc}, sleep well {emoji}",
        "{greet}, soft night {emoji}",
        "{greet}, calm one {emoji}",
        "{greet}, gentle close {emoji}",
        "{greet} {voc}, soft landing {emoji}",
        "{greet}, warm night {emoji}",
      ],
      mid: [
        "{greet} {voc}, sleep easy tonight {emoji}",
        "{greet} {voc}, hope the night is kind {emoji}",
        "{greet}, soft close and good rest {emoji}",
        "{greet} {voc}, wishing you a calm night {emoji}",
        "{greet}, warm night energy on this one {emoji}",
        "{greet} {voc}, hope you get a gentle close tonight {emoji}",
        "{greet}, calm energy here, rest well {emoji}",
      ],
      max: [
        "{greet} {voc}, good rest tonight and a softer morning tomorrow {emoji}",
        "{greet} {voc}, warm close here, hope you sleep really well {emoji}",
        "{greet}, this is a lovely way to end the day, rest easy tonight {emoji}",
        "{greet} {voc}, calm sleep on your side and good energy tomorrow {emoji}",
      ],
    },
  },
  calmer: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet}, easy start {emoji}",
        "{greet} {voc}, calm one {emoji}",
        "{greet}, quiet good one {emoji}",
        "{greet} {voc}, easy morning {emoji}",
        "{greet}, nice and simple {emoji}",
        "{greet}, light start {emoji}",
        "{greet} {voc}, slow morning {emoji}",
        "{greet}, unhurried one {emoji}",
        "{greet}, soft open {emoji}",
      ],
      mid: [
        "{greet}, easy start on this one {emoji}",
        "{greet} {voc}, calm morning energy here {emoji}",
        "{greet}, quiet good post for the morning {emoji}",
        "{greet} {voc}, hoping for an easy day on your side {emoji}",
        "{greet}, simple morning energy and I like it {emoji}",
        "{greet}, light start and a clean read {emoji}",
        "{greet} {voc}, hope the morning stays unhurried {emoji}",
      ],
      max: [
        "{greet}, calm way to start the day, hope it stays easy for you {emoji}",
        "{greet} {voc}, quiet good energy here and a nice way to open the morning {emoji}",
        "{greet}, simple start and the kind of post the morning needed {emoji}",
        "{greet} {voc}, hope the day lands easy and stays light on your side {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet}, easy night {emoji}",
        "{greet} {voc}, calm one {emoji}",
        "{greet}, quiet close {emoji}",
        "{greet} {voc}, sleep easy {emoji}",
        "{greet}, soft one tonight {emoji}",
        "{greet}, gentle close {emoji}",
        "{greet} {voc}, slow night {emoji}",
        "{greet}, light close {emoji}",
      ],
      mid: [
        "{greet}, easy night on your side {emoji}",
        "{greet} {voc}, calm close tonight {emoji}",
        "{greet}, quiet good way to end the day {emoji}",
        "{greet} {voc}, hope you sleep easy tonight {emoji}",
        "{greet}, simple night energy and good rest {emoji}",
        "{greet}, soft landing tonight {emoji}",
        "{greet} {voc}, hope the night stays quiet {emoji}",
      ],
      max: [
        "{greet}, calm close tonight and a good reset for tomorrow {emoji}",
        "{greet} {voc}, quiet good energy here, hope you sleep easy {emoji}",
        "{greet}, simple end to the day and a good one to log off on {emoji}",
        "{greet} {voc}, hope the night stays light and the sleep comes easy {emoji}",
      ],
    },
  },
  builder: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet} {voc} {emoji}",
        "{greet}, clean ship day {emoji}",
        "{greet} {voc}, good luck building {emoji}",
        "{greet} {voc}, good build energy {emoji}",
        "{greet}, ship something good {emoji}",
        "{greet}, good work day {emoji}",
        "{greet} {voc}, useful morning {emoji}",
        "{greet}, clean session ahead {emoji}",
        "{greet} {voc}, solid start {emoji}",
      ],
      mid: [
        "{greet} {voc}, hope the build flows today {emoji}",
        "{greet}, clean ship day ahead {emoji}",
        "{greet} {voc}, good energy for a solid build day {emoji}",
        "{greet} {voc}, hope you ship something good today {emoji}",
        "{greet}, strong start for a builder morning {emoji}",
        "{greet} {voc}, useful morning and a clean work session {emoji}",
        "{greet}, good post to start building from {emoji}",
      ],
      max: [
        "{greet} {voc}, hope the build flows and the ship goes clean today {emoji}",
        "{greet}, strong morning for a solid build day, hope it lands well {emoji}",
        "{greet} {voc}, good energy here for useful work and a clean ship {emoji}",
        "{greet} {voc}, good post and a nice way to start a work session {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet} {voc} {emoji}",
        "{greet}, ship more tomorrow {emoji}",
        "{greet} {voc}, good rest first {emoji}",
        "{greet} {voc}, build can wait {emoji}",
        "{greet}, rest before the next ship {emoji}",
      ],
      mid: [
        "{greet} {voc}, good rest before the next ship {emoji}",
        "{greet}, build can wait till tomorrow {emoji}",
        "{greet} {voc}, sleep first and ship more tomorrow {emoji}",
        "{greet} {voc}, calm close before the next work session {emoji}",
        "{greet}, good night and a proper reset for the build {emoji}",
      ],
      max: [
        "{greet} {voc}, get some real rest tonight and ship again tomorrow {emoji}",
        "{greet}, good close for the day, now let the build wait till morning {emoji}",
        "{greet} {voc}, proper rest first and better work tomorrow {emoji}",
        "{greet} {voc}, calm night on your side before the next session starts {emoji}",
      ],
    },
  },
  meme: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet}! {emoji}",
        "{greet} {emoji}",
        "{greet}, we move {emoji}",
        "{greet}, still here {emoji}",
        "{greet}, good vibes {emoji}",
        "{greet}, locked in {emoji}",
        "{greet}, here early {emoji}",
        "{greet}, same energy {emoji}",
        "{greet}, back again {emoji}",
      ],
      mid: [
        "{greet}, we move — good energy on this one {emoji}",
        "{greet}, still here, still building {emoji}",
        "{greet}, clean post, good vibes back {emoji}",
        "{greet}, the timeline needed this energy {emoji}",
        "{greet}, hope your day stays kind {emoji}",
        "{greet}, good post, same energy back {emoji}",
        "{greet}, early and locked in on this one {emoji}",
        "{greet}, timeline approved, good read {emoji}",
      ],
      max: [
        "{greet}, clean post — good vibes back and a smooth day ahead {emoji}",
        "{greet}, this is the kind of energy that makes the morning better {emoji}",
        "{greet}, still here, still building — hope today treats you well {emoji}",
        "{greet}, good read — keep that energy, we move {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet}! {emoji}",
        "{greet} {emoji}",
        "{greet}, we rest {emoji}",
        "{greet}, log off time {emoji}",
        "{greet}, sleep easy {emoji}",
        "{greet}, offline mode {emoji}",
        "{greet}, reset time {emoji}",
        "{greet}, close the tab {emoji}",
      ],
      mid: [
        "{greet}, log off time — rest easy tonight {emoji}",
        "{greet}, we rest — calm close on this one {emoji}",
        "{greet}, good night and a clean reset {emoji}",
        "{greet}, sleep easy and come back fresh {emoji}",
        "{greet}, soft close — the rest can wait {emoji}",
        "{greet}, good close, now log off for real {emoji}",
        "{greet}, reset time — rest easy tonight {emoji}",
      ],
      max: [
        "{greet}, calm close — rest easy tonight and come back fresh tomorrow {emoji}",
        "{greet}, good night — log off, reset, and let the day go quiet {emoji}",
        "{greet}, this is a good way to end the day — sleep easy tonight {emoji}",
        "{greet}, we rest — the timeline can wait, get some real sleep {emoji}",
      ],
    },
  },
};

// Words that tend to create low-quality / spammy vibes in short GM/GN replies.
// IMPORTANT: do not include "safe vocatives" used by the template banks (ser/legend/mate/dear/builder),
// otherwise we generate them and immediately delete them, which degrades quality.
const RE_BANNED_WORDS = /\b(?:captain|sunshine|anon|my\s+g|goat|boss|chief|soldier|army|frens|friends|everyone|everybody|y['’]all|gang|pepe|wojak|champ|queen|babe|cutie|baby|love|darling|warrior|kings|queens|fam|team|chads?)\b/gi;
const RE_BANNED_CRYPTO_HYPE = /\b(?:wagmi|lfg|hodl|ath|moon|ape|aping|bags?)\b|diamond\s+hands?/gi;
const RE_BANNED_MARKET_EMOJI = /[\u{1F4C8}\u{1F4C9}\u{1F4CA}\u{1F4B0}\u{1F48E}\u{1F680}\u{26A1}\u{1F438}\u{1F410}]/gu;
const RE_ANY_EMOJI = /[\p{Extended_Pictographic}]/gu;
const RE_GM_BAD_EMOJI = /[\u{1F319}\u{1F634}\u{1F4A4}\u{1F6CC}]/gu;
const RE_GN_BAD_EMOJI = /[\u{2600}\u{FE0F}\u{2615}\u{1F305}]/gu;

function renderTemplate(template, bank, kind) {
  const greet = pick(bank.greet || [kind === "gm" ? "Gm" : "Gn"]);
  const familyKey = bank.familyKey || "ordinary";
  const familyVoc =
    (bank.vocatives && bank.vocatives[familyKey]) ||
    SAFE_VOCATIVE[familyKey] ||
    SAFE_VOCATIVE.ordinary;
  const emoji = kind === "gm" ? pick(MORNING_EMOJI) : pick(NIGHT_EMOJI);
  return String(template || "")
    .replace(/\{greet\}/g, greet)
    .replace(/\{voc\}/g, pick(familyVoc))
    .replace(/\{emoji\}/g, emoji)
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCaseGreeting(text, kind) {
  let out = String(text || "").trim();
  if (!out) return kind === "gm" ? "Gm" : "Gn";
  out = out.replace(/^(gm|good morning|morning|gn|good night|night)/i, (m) => {
    const low = m.toLowerCase();
    if (low === "gm") return "Gm";
    if (low === "gn") return "Gn";
    if (low === "morning") return "Morning";
    if (low === "night") return "Night";
    if (low === "good morning") return "Good morning";
    if (low === "good night") return "Good night";
    return m;
  });
  return out;
}

function tightenMinimal(text, kind, lang = "en") {
  const raw = String(text || "").trim();
  const firstEmoji = (raw.match(RE_ANY_EMOJI) || [""])[0] || "";
  let out = raw.replace(RE_ANY_EMOJI, " ").replace(/[!,]/g, " ").replace(/\s+/g, " ").trim();
  let words = out.split(/\s+/).filter(Boolean);
  const cap = kind === "gm" ? 4 : 5;
  if (words.length > cap) words = words.slice(0, cap);
  out = words.join(" ").trim();
  if (lang === "en") out = sentenceCaseGreeting(out, kind);
  if (firstEmoji) out = `${out} ${firstEmoji}`.trim();
  return out.trim();
}

function diversifyGreetingLead(text, kind, mode) {
  const src = String(text || "").trim();
  if (!src) return src;

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const gmMin = [
    "GM",
    "Big GM",
    "Grand rising",
    "G to the M",
    "Morning"
  ];

  const gmFull = [
    "Good morning",
    "GM",
    "Big GM",
    "Grand rising",
    "G to the M",
    "Morning",
    "Easy morning",
    "Fresh morning",
    "Morning start"
  ];

  const gnMin = [
    "GN",
    "Night",
    "Sleep easy",
    "Rest easy"
  ];

  const gnFull = [
    "Good night",
    "GN",
    "Sleep easy",
    "Rest easy tonight",
    "Easy night",
    "Quiet night",
    "Soft landing tonight",
    "Calm close tonight",
    "Night reset"
  ];

  if (kind === "gm") {
    const list = mode === "min" ? gmMin : gmFull;
    if (/^(good morning|morning|gm)\b/i.test(src)) {
      return src.replace(/^(good morning|morning|gm)\b/i, pick(list));
    }
  }

  if (kind === "gn") {
    const list = mode === "min" ? gnMin : gnFull;
    if (/^(good night|night|gn)\b/i.test(src)) {
      return src.replace(/^(good night|night|gn)\b/i, pick(list));
    }
  }

  return src;
}
function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function rotateGreetingLead(text, kind) {
  const src = String(text || "").trim();
  if (!src) return src;

  if (kind === "gm" && /^(good morning|gm)\b/i.test(src)) {
    const rest = src.replace(/^(good morning|gm)\b/i, "").trim();
    const lead = rest
      ? pickOne(["Good morning", "GM", "Big GM", "Grand rising", "G to the M"])
      : pickOne(["Good morning", "GM", "Big GM", "Grand rising", "G to the M", "Morning"]);
    return rest ? `${lead} ${rest}` : lead;
  }

  if (kind === "gn" && /^(good night|gn)\b/i.test(src)) {
    const rest = src.replace(/^(good night|gn)\b/i, "").trim();
    const lead = rest
      ? pickOne(["Good night", "GN", "Sleep easy", "Rest easy tonight", "Easy night"])
      : pickOne(["Good night", "GN", "Sleep easy", "Rest easy", "Easy night", "Soft night"]);
    return rest ? `${lead} ${rest}` : lead;
  }

  return src;
}

function normalizeHumanReply(text, kind, mode) {
  let out = String(text || "").trim();
  if (!out) return out;

  out = rotateGreetingLead(out, kind);

  out = out.replace(/\bGm\b/g, "GM");
  out = out.replace(/\bGn\b/g, "GN");

  out = out.replace(/\b(morning|night|bro|homie|friend|degen|boss)\s+\1\b/gi, "$1");
  out = out.replace(/\b(gm|gn)\s+\1\b/gi, "$1");
  out = out.replace(/\bgood\s+morning\s+good\s+morning\b/gi, "Good morning");
  out = out.replace(/\bgood\s+night\s+good\s+night\b/gi, "Good night");

  out = out.replace(/\b(big\s+gm|grand\s+rising|g\s+to\s+the\s+m)\s+(friend|bro|homie|degen)\b/gi, "$1");

  out = out.replace(/\s{2,}/g, " ").trim();
  out = out.replace(/\s+([,.!?])/g, "$1");

  if (/\b(big\s+gm|grand\s+rising|g\s+to\s+the\s+m)\s+(friend|bro|homie|degen)\b/i.test(out)) return "";

  return out;
}

function normalizeVocatives(text) {
  let out = String(text || "");
  if (!out) return out;
  // Hard switch away from old vocatives that feel outdated/off-brand.
  out = out.replace(/\bser\b/gi, "bro");
  out = out.replace(/\bmate\b/gi, "homie");
  out = out.replace(/\bbuilder\b/gi, "degen");
  out = out.replace(/\bdear\b/gi, "friend");
  out = out.replace(/\blegend\b/gi, "bro");
  out = out.replace(/\bking\b/gi, "bro");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

function diversifySoftEmoji(text, kind) {
  const src = String(text || "").trim();
  if (!src) return src;

  const gmEmoji = [
    "\u2600\uFE0F",
    "\uD83C\uDF1E",
    "\u2728",
    "\uD83D\uDC9B",
    "\uD83E\uDDE1",
    "\uD83D\uDC9A",
    "\uD83E\uDD0D"
  ];

  const gnEmoji = [
    "\uD83C\uDF19",
    "\u2B50",
    "\u2728",
    "\uD83D\uDC9C",
    "\uD83D\uDC99",
    "\uD83E\uDD0D",
    "\uD83D\uDC9B"
  ];

  const list = kind === "gn" ? gnEmoji : gmEmoji;

  if (/[\p{Extended_Pictographic}]$/u.test(src)) {
    return src.replace(/[\p{Extended_Pictographic}]$/u, pickOne(list));
  }

  if (Math.random() < 0.35) {
    return src + " " + pickOne(list);
  }

  return src;
}
function sanitizeSingle(text, mode, kind, lang = "en") {
  let out = String(text || "");
  out = out.replace(/[—–]/g, " ");
  out = out.replace(RE_BANNED_WORDS, " ");
  out = out.replace(RE_BANNED_CRYPTO_HYPE, " ");
  out = out.replace(RE_BANNED_MARKET_EMOJI, " ");
  out = out.replace(/\b(fr|wagmi|lfg)\s+(fr|wagmi|lfg)\b/gi, "$1");
  out = out.replace(/\s{2,}/g, " ").trim();
  out = out.replace(/\s+([,!?])/g, "$1");
  out = out.replace(/,{2,}/g, ",").replace(/!{2,}/g, "!");
  if (lang === "en") {
    out = sentenceCaseGreeting(out, kind);
    out = normalizeVocatives(out);
    out = normalizeHumanReply(out, kind, mode);
  }

  if (kind === "gm") out = out.replace(RE_GM_BAD_EMOJI, " ");
  if (kind === "gn") out = out.replace(RE_GN_BAD_EMOJI, " ");

  const emojiHits = out.match(RE_ANY_EMOJI) || [];
  if (emojiHits.length > 1) {
    const keep = emojiHits[0];
    out = out.replace(RE_ANY_EMOJI, " ").replace(/\s+/g, " ").trim();
    out = `${out} ${keep}`.trim();
  }

  if (mode === "min") {
    const parts = out.split(",").map((x) => String(x || "").trim()).filter(Boolean);
    if (parts.length > 1) out = parts.slice(0, 1).join(", ");
  }

  if (lang === "en") {
    out = out.replace(/\b(gm|gn)\s+(gm|gn)\b/gi, "$1");
    out = out.replace(/\b(morning)\s+(morning)\b/gi, "$1");
    out = out.replace(/\b(night)\s+(night)\b/gi, "$1");
  }
  out = out.replace(/\s{2,}/g, " ").trim();
  out = out.replace(/^[,\s]+|[,\s]+$/g, "");
  out = diversifySoftEmoji(out, kind);
  if (!out) return "";
  return out;
}

function applyStyle(base, style, kind, mode, lang = "en") {
  const s = String(style || "classic").toLowerCase().trim();
  let out = sanitizeSingle(base, mode, kind, lang);
  if (!out) out = kind === "gm" ? (lang === "en" ? "Gm" : pick(LANG_PACK_FALLBACK_GREET(lang, "gm"))) : pick(LANG_PACK_FALLBACK_GREET(lang, "gn"));
  if (s === "noemoji") {
    out = out.replace(RE_ANY_EMOJI, " ").replace(/\s+/g, " ").trim();
    if (mode === "min") out = tightenMinimal(out, kind, lang).replace(RE_ANY_EMOJI, "").replace(/\s+/g, " ").trim();
    return lang === "en" ? sentenceCaseGreeting(out, kind) : out;
  }
  if (s === "emoji") {
    if (!(out.match(RE_ANY_EMOJI) || []).length) {
      out = `${out} ${kind === "gm" ? pick(MORNING_EMOJI) : pick(NIGHT_EMOJI)}`.trim();
    }
    const hits = out.match(RE_ANY_EMOJI) || [];
    if (hits.length > 1) {
      const keep = hits[0];
      out = out.replace(RE_ANY_EMOJI, " ").replace(/\s+/g, " ").trim();
      out = `${out} ${keep}`.trim();
    }
    return out;
  }
  if (s === "minimal" || mode === "min") return tightenMinimal(out, kind, lang);
  return out;
}

function LANG_PACK_FALLBACK_GREET(lang, kind) {
  const bank = getLocalizedBank(lang, kind, "ordinary");
  if (bank?.greet?.length) return bank.greet[0];
  return kind === "gm" ? "Gm" : "Gn";
}

function bankFor(kind, style, lang = "en") {
  const familyKey = FAMILY_BY_STYLE[String(style || "classic").toLowerCase().trim()] || "ordinary";
  const code = String(lang || "en").toLowerCase();
  if (code !== "en") {
    const localized = getLocalizedBank(code, kind, familyKey);
    if (localized) return localized;
  }
  const family = BANKS[familyKey] || BANKS.ordinary;
  const bank = family[kind] || BANKS.ordinary[kind];
  return { ...bank, familyKey, vocatives: SAFE_VOCATIVE };
}

function composeReply(kind, mode, lang, style) {
  const code = normLang(lang) || "en";
  const bank = bankFor(kind, style, code);
  const modeKey = ["min", "mid", "max"].includes(String(mode || "").toLowerCase()) ? String(mode).toLowerCase() : "mid";
  const templates = Array.isArray(bank[modeKey]) && bank[modeKey].length ? bank[modeKey] : bank.mid;
  const template = pick(templates);
  const rendered = renderTemplate(template, bank, kind);
  return applyStyle(rendered, style, kind, modeKey, code);
}

function shapeFingerprint(text, kind) {
  return String(text || "")
    .toLowerCase()
    .replace(RE_ANY_EMOJI, " ")
    .replace(/\b(gm|good morning|morning)\b/g, "gm")
    .replace(/\b(gn|good night|night)\b/g, "gn")
    .replace(/\b(legend|ser|mate|bro|brother|dear|degen|builder|homie|friend|king)\b/g, "@voc")
    .replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice gm)\b/g, "@post")
    .replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close")
    .replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase")
    .replace(/\b(good|nice|solid|strong|clean|calm|soft|easy|quiet|smooth|kind|warm|steady|proper|real)\b/g, "@adj")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\b(a|an|the|and|to|your|you|on|this|that|here|today|tonight|tomorrow|back|really|just|one|side)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function modeProfile(text) {
  const t = String(text || "").trim();
  if (!t) return { chars: 0, words: 0 };
  const chars = Array.from(t).length;
  const words = t
    .replace(RE_ANY_EMOJI, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return { chars, words };
}

function passesModeProfile(text, mode) {
  const { chars, words } = modeProfile(text);
  if (!chars || !words) return false;
  if (mode === "min") return chars <= 40 && words >= 1 && words <= 6;
  if (mode === "mid") return chars >= 18 && chars <= 84 && words >= 4 && words <= 12;
  return chars >= 28 && chars <= 116 && words >= 6 && words <= 18;
}

function isNearDuplicateShape(a, b) {
  const left = String(a || "").trim();
  const right = String(b || "").trim();
  if (!left || !right) return false;
  if (left === right) return true;
  const la = left.split(/\s+/).filter(Boolean);
  const lb = right.split(/\s+/).filter(Boolean);
  if (!la.length || !lb.length) return false;
  const sa = new Set(la);
  const sb = new Set(lb);
  let inter = 0;
  for (const token of sa) if (sb.has(token)) inter++;
  const minSize = Math.min(sa.size, sb.size);
  const unionSize = new Set([...sa, ...sb]).size;
  if (!minSize || !unionSize) return false;
  const containment = inter / minSize;
  const jaccard = inter / unionSize;
  if (minSize <= 2) return containment === 1;
  if (minSize <= 4) return containment >= 0.85;
  return containment >= 0.8 || jaccard >= 0.7;
}

function replyQualityScore(text, kind, mode) {
  const t = String(text || "").trim();
  if (!t) return -1e9;
  const chars = Array.from(t).length;
  const words = t.replace(RE_ANY_EMOJI, " ").replace(/[^A-Za-z0-9\s']+/g, " ").split(/\s+/).filter(Boolean);
  const emojiHits = t.match(RE_ANY_EMOJI) || [];
  let score = 0;

  if (mode === "min") {
    if (chars >= 6 && chars <= 34) score += 16;
    else if (chars <= 42) score += 8;
    else score -= 16;
    if (words.length >= 2 && words.length <= 6) score += 12;
    else if (words.length <= 7) score += 5;
    else score -= 12;
  } else if (mode === "mid") {
    if (chars >= 16 && chars <= 72) score += 12;
    else if (chars <= 84) score += 5;
    else score -= 10;
    if (words.length >= 4 && words.length <= 11) score += 10;
    else if (words.length <= 13) score += 4;
    else score -= 8;
  } else {
    if (chars >= 24 && chars <= 96) score += 10;
    else if (chars <= 112) score += 4;
    else score -= 10;
    if (words.length >= 6 && words.length <= 15) score += 9;
    else if (words.length <= 17) score += 3;
    else score -= 8;
  }

  if (new RegExp(`^(gm|good morning|morning)\\b`, "i").test(t) && kind === "gm") score += 10;
  if (new RegExp(`^(gn|good night|night)\\b`, "i").test(t) && kind === "gn") score += 10;
  if (emojiHits.length === 1) score += 6;
  else if (emojiHits.length === 0) score += 1;
  else score -= 4 * (emojiHits.length - 1);

  RE_BANNED_WORDS.lastIndex = 0;
  RE_BANNED_CRYPTO_HYPE.lastIndex = 0;
  RE_BANNED_MARKET_EMOJI.lastIndex = 0;
  if (RE_BANNED_WORDS.test(t)) score -= 50;
  if (RE_BANNED_CRYPTO_HYPE.test(t)) score -= 24;
  if (RE_BANNED_MARKET_EMOJI.test(t)) score -= 25;
  if (/\b(feed|open|room|brain|lane|soldier|army|frens|goat|boss|pepe|wojak)\b/i.test(t)) score -= 20;
  if (/\b(king\s+dear|dear\s+king|king\s+king|morning\s+king\s+king)\b/i.test(t)) score -= 80;
  if (/\b(big\s+gm|grand\s+rising|g\s+to\s+the\s+m)\s+(dear|lovely|mate|ser|legend)\b/i.test(t)) score -= 45;
  if (/\b(keeping the|calling it a little|closing it out|mood slips|worth forcing tonight|natural start|open light today)\b/i.test(t)) score -= 35;
  if (/\bwe move\b/gi.test(t) && (t.match(/\bwe move\b/gi) || []).length > 1) score -= 12;

  const uniq = new Set(words.map((w) => w.toLowerCase()));
  score += Math.min(8, uniq.size);
  return score;
}

const GLOBAL_RECENT = {
  gm: [],
  gn: [],
};

function getRecentRows(handle, kind, limit = 20) {
  const rows = safeOptionalHistoryDb(
    () => db
      .prepare(
        "SELECT reply FROM recent_replies WHERE handle=? AND kind=? ORDER BY created_at DESC LIMIT ?"
      )
      .all(handle, kind, limit),
    [],
    "recent_rows"
  );
  return Array.isArray(rows) ? rows : [];
}

function getRecentSet(handle, kind, limit = 20) {
  const rows = getRecentRows(handle, kind, limit);
  const list = Array.isArray(rows) ? rows : [];
  return new Set(list.map((r) => String(r.reply || "").trim()).filter(Boolean));
}

function rememberGlobal(kind, reply) {
  const k = kind === "gn" ? "gn" : "gm";
  const list = GLOBAL_RECENT[k];
  const txt = String(reply || "").trim();
  if (!txt) return;
  list.unshift(txt);
  if (list.length > 400) list.length = 400;
}

function getGlobalShapeRows(kind, mode, family, limit = 1200) {
  return safeOptionalHistoryDb(
    () => db
      .prepare(
        "SELECT reply_hash, shape FROM recent_reply_shapes WHERE kind=? AND mode=? AND family=? ORDER BY created_at DESC LIMIT ?"
      )
      .all(kind, mode, family, limit),
    [],
    "global_shape_rows"
  );
}

function rememberGlobalShape(kind, mode, style, reply) {
  const txt = String(reply || "").trim();
  if (!txt) return;
  const safeKind = kind === "gn" ? "gn" : "gm";
  const safeMode = ["min", "mid", "max"].includes(String(mode || "").toLowerCase()) ? String(mode).toLowerCase() : "mid";
  const family = bankFor(safeKind, style).familyKey || "ordinary";
  const shape = shapeFingerprint(txt, safeKind);
  if (!shape) return;
  const replyHash = sha256(`${safeKind}|${safeMode}|${family}|${txt}`).slice(0, 32);
  safeOptionalHistoryDb(() => {
    safeDb(() => {
      db.prepare(
        "INSERT INTO recent_reply_shapes(kind, mode, family, reply_hash, shape, created_at) VALUES(?,?,?,?,?,?)"
      ).run(safeKind, safeMode, family, replyHash, shape, nowIso());

      db.prepare(`
        DELETE FROM recent_reply_shapes
        WHERE rowid NOT IN (
          SELECT rowid FROM recent_reply_shapes
          WHERE kind=? AND mode=? AND family=?
          ORDER BY created_at DESC
          LIMIT 8000
        ) AND kind=? AND mode=? AND family=?
      `).run(safeKind, safeMode, family, safeKind, safeMode, family);
    });
    return true;
  }, false, "remember_global_shape");
}

function saveRecent(handle, kind, reply, mode = "mid", style = "classic") {
  safeOptionalHistoryDb(() => {
    safeDb(() => {
      db.prepare(
        "INSERT INTO recent_replies(handle, kind, reply, created_at) VALUES(?,?,?,?)"
      ).run(handle, kind, reply, nowIso());

      db.prepare(`
        DELETE FROM recent_replies
        WHERE rowid NOT IN (
          SELECT rowid FROM recent_replies
          WHERE handle=? AND kind=?
          ORDER BY created_at DESC
          LIMIT 120
        ) AND handle=? AND kind=?
      `).run(handle, kind, handle, kind);
    });
    return true;
  }, false, "save_recent");
  rememberGlobal(kind, reply);
  rememberGlobalShape(kind, mode, style, reply);
}

function generateRankedCandidates(handle, kind, mode, lang, style, count = 1, antiLastN = 20, allowRecent = false) {
  const recent = handle ? getRecentSet(handle, kind, antiLastN) : new Set();
  const recentShapes = new Set(Array.from(recent).map((x) => shapeFingerprint(x, kind)).filter(Boolean));
  const recentShapeList = Array.from(recentShapes).slice(0, 240);
  const { familyKey } = bankFor(kind, style);
  const globalRecent = new Set((GLOBAL_RECENT[kind] || []).slice(0, 160));
  const globalShapeRows = getGlobalShapeRows(kind, mode, familyKey, 1600);
  const globalShapes = new Set([
    ...Array.from(globalRecent).map((x) => shapeFingerprint(x, kind)).filter(Boolean),
    ...globalShapeRows.map((row) => String(row?.shape || "").trim()).filter(Boolean),
  ]);
  const globalShapeList = Array.from(globalShapes).slice(0, 480);
  const seenText = new Set();
  const seenShape = new Set();
  const seenShapeList = [];
  const pool = [];
  let tries = 0;
  const wantPool = Math.max(count * (mode === "min" ? 20 : 16), mode === "min" ? 64 : 48);
  const maxTries = Math.max(3200, count * (mode === "min" ? 760 : 520));

  const collect = ({ allowHistory = false, relaxGlobalShape = false, relaxGlobalExact = false, relaxHistoryShape = false, relaxSeenShape = false } = {}) => {
    while (pool.length < wantPool && tries < maxTries) {
      tries++;
      const candidate = composeReply(kind, mode, lang, style);
      if (!candidate || !passesModeProfile(candidate, mode)) continue;
      const fp = shapeFingerprint(candidate, kind);
      if (!fp) continue;
      if (!allowHistory && (recent.has(candidate) || (!relaxHistoryShape && (recentShapes.has(fp) || recentShapeList.some((shape) => isNearDuplicateShape(shape, fp)))))) continue;
      if (!relaxGlobalExact && globalRecent.has(candidate)) continue;
      if (!relaxGlobalShape && (globalShapes.has(fp) || globalShapeList.some((shape) => isNearDuplicateShape(shape, fp)))) continue;
      if (seenText.has(candidate) || (!relaxSeenShape && (seenShape.has(fp) || seenShapeList.some((shape) => isNearDuplicateShape(shape, fp))))) continue;
      seenText.add(candidate);
      seenShape.add(fp);
      seenShapeList.push(fp);
      pool.push({
        text: candidate,
        fp,
        score: replyQualityScore(candidate, kind, mode),
      });
    }
  };

  collect({ allowHistory: Boolean(allowRecent), relaxGlobalShape: false });
  if (pool.length < Math.max(6, Math.min(count, Math.ceil(count * 0.65)))) {
    collect({ allowHistory: Boolean(allowRecent), relaxGlobalShape: true });
  }
  if (!allowRecent && pool.length < count) {
    collect({ allowHistory: true, relaxGlobalShape: false });
  }
  if (pool.length < count) {
    collect({ allowHistory: true, relaxGlobalShape: true });
  }
  if (pool.length < count) {
    collect({ allowHistory: true, relaxGlobalShape: true, relaxGlobalExact: true });
  }
  if (pool.length < count) {
    collect({
      allowHistory: true,
      relaxGlobalShape: true,
      relaxGlobalExact: true,
      relaxHistoryShape: true,
      relaxSeenShape: true
    });
  }


  if (pool.length < count) {
    const emergencyMaxTries = Math.max(600, count * 120);
    let emergencyTries = 0;
    while (pool.length < count && emergencyTries < emergencyMaxTries) {
      emergencyTries++;
      const candidate = composeReply(kind, mode, lang, style);
      if (!candidate) continue;
      const fp = shapeFingerprint(candidate, kind) || candidate.toLowerCase();
      if (seenText.has(candidate)) continue;
      seenText.add(candidate);
      seenShape.add(fp);
      seenShapeList.push(fp);
      pool.push({
        text: candidate,
        fp,
        score: replyQualityScore(candidate, kind, mode) - 0.25,
      });
    }
  }

  pool.sort((a, b) => b.score - a.score);
  if (!pool.length) return [];
  if (count <= 1) return [pool[0].text];

  const out = [];
  const usedShape = new Set();
  const usedText = new Set();
  for (const item of pool) {
    if (!item || !item.text || !item.fp) continue;
    if (usedShape.has(item.fp) || usedText.has(item.text)) continue;
    usedShape.add(item.fp);
    usedText.add(item.text);
    out.push(item.text);
    if (out.length >= count) break;
  }

  if (out.length < count) {
    for (const item of pool) {
      if (!item || !item.text) continue;
      if (usedText.has(item.text)) continue;
      usedText.add(item.text);
      out.push(item.text);
      if (out.length >= count) break;
    }
  }

  return out.slice(0, count);
}

function generateUnique(handle, kind, mode, lang, style, antiLastN = 20) {
  const list = generateRankedCandidates(handle, kind, mode, lang, style, 1, antiLastN, false);
  if (Array.isArray(list) && list.length) return String(list[0] || "").trim();
  return composeReply(kind, mode, lang, style);
}

  return {
    normLang,
    SUPPORTED_REPLY_LANGS,
    pick,
    composeReply,
    sanitizeSingle,
    getRecentSet,
    shapeFingerprint,
    generateRankedCandidates,
    generateUnique,
    saveRecent,
    replyQualityScore,
    passesModeProfile,
    bankFor,
  };
}
