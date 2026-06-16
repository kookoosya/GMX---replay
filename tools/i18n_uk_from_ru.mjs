#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ru = JSON.parse(fs.readFileSync(path.join(root, "shared/i18n/locales/ru.json"), "utf8"));
const uk = JSON.parse(fs.readFileSync(path.join(root, "shared/i18n/locales/uk.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(root, "shared/i18n/locales/en.json"), "utf8"));

const UK_OVERRIDES = {
  loading: "Завантаження…",
  error: "Помилка",
  connectFirst: "Спочатку підключіться",
  lb_eligible: "Зараховано",
  lb_empty: "Поки немає даних.",
  lb_failed: "Не вдалося завантажити таблицю.",
  err_unauthorized: "Немає доступу",
  err_forbidden: "Заборонено",
  err_not_found: "Не знайдено",
  err_rate_limited: "Занадто часто",
  err_busy: "Зайнято, спробуйте ще",
  err_limit_reached: "Ліміт досягнуто",
  err_upgrade_required: "Потрібен апгрейд",
  err_invalid_handle: "Невірний хендл",
  err_init_failed: "Не вдалося ініціалізувати",
  err_server_error: "Помилка сервера",
  err_unknown: "Невідома помилка",
  connect_toast_html: "Підключено.",
  this_feature: "Ця функція",
  locked: "Заблоковано",
  locked_unlock_at: "Відкриється при {n} рефералах",
  ext_wp_none: "Без шпалер",
  ref_def_legacy: "старий перенос, який ще враховується.",
  ref_def_eligible: "max(активні, перенос).",
  ref_daily_limit_title: "Денний ліміт генерації (GM + GN)",
  ref_bonus_rule: "Бонус: +{per20} до денної генерації за кожні 20 зарахованих рефералів (кроків: {chunks}).",
  ref_desc: "Коротко:",
  r_list: [
    "<b>Підтверджено</b> — хендл підключено за вашим посиланням.",
    "<b>Активний</b> — підтверджений користувач з реальним використанням. <b>Зараховано</b> = max(активні, перенос).",
    "Кожні <b>20 зарахованих</b> дають <b>+10</b> до денної генерації (промоутер 50+ = <b>+12</b> за 20).",
    "Денний ліміт впливає на <b>/api/random</b> у розширенні (не на генератор сайту). Pro знімає ліміти."
  ],
  pm_title: "Ринок прогнозів",
  pm_filter_asset_label: "Актив",
  pm_filter_bias_label: "Ухил",
  pm_filter_conf_label: "Мін. впевненість",
  ref_unlocks_now: "Відкрито зараз",
  ref_next_unlock: "Наступне відкриття",
  ref_all_unlocked: "Усі відкриття отримано",
  ref_clicks: "Кліки",
  ref_rules: "правила",
  locked_pack: "Пак заблоковано. Потрібен Pro або реферали.",
  pack_applied: "Пак застосовано",
  billing_receiver_missing: "Оплата недоступна: гаманець сервера не налаштовано.",
  w_right_list: [
    "<b>Free:</b> до <b>70</b> рядків GM + <b>70</b> GN (редагування без ліміту). Денна генерація: <b>70</b> кожного.",
    "<b>Free косметика:</b> <b>10</b> тем + <b>10</b> шпалер. Більше — реферали або Pro.",
    "<b>Реферали:</b> поступово відкривають косметику. Деталі у вкладці <b>Referrals</b>.",
    "<b>Pro:</b> безлімітна генерація та збереження, усе відкрито (включно з Cloud sync).",
    "<b>Оплата:</b> план → SOL/USDC/USDT → гаманець → підтвердження → авто-перевірка."
  ],
  h_guide: [
    "<b>Крок 1:</b> Підключи X-хендл (один раз).",
    "<b>Крок 2:</b> Збери списки у вкладках <span class=\"kbd\">GM</span> / <span class=\"kbd\">GN</span>.",
    "<b>Крок 3:</b> У розширенні Chrome скопіюй відповідь і встав у X вручну.",
    "<b>Ліміти:</b> Free — до <b>70 збережених рядків</b> для GM. Редагування без ліміту."
  ],
};

function deepAssign(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (Array.isArray(v)) target[k] = v.slice();
    else target[k] = v;
  }
}

// For keys still equal to en, copy from ru if ru differs from en (rough uk via overrides only)
for (const [k, v] of Object.entries(en)) {
  if (uk[k] === v && ru[k] && ru[k] !== v && typeof v === "string" && !UK_OVERRIDES[k]) {
    UK_OVERRIDES[k] = ru[k]; // temporary: better than English for shared cyrillic-adjacent UX
  }
}

deepAssign(uk, UK_OVERRIDES);
fs.writeFileSync(path.join(root, "shared/i18n/locales/uk.json"), JSON.stringify(uk, null, 2) + "\n");
console.log("uk locale updated");
