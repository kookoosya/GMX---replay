#!/usr/bin/env node
/** Wallet checkout flow copy — 15 locales. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");

const PATCH = {
  ru: {
    wallet_plan_unlock_days: "Pro на {days} дн.",
    wallet_plans_load_failed: "Не удалось загрузить планы. Обновите страницу.",
    pay_creating_checkout: "Создаём checkout…",
    pay_creating_payment: "Создаём платёж…",
    pay_binding_wallet: "Привязка кошелька…",
    pay_sign_bind_message: "Подпишите сообщение кошелька для checkout…",
    pay_building_tx: "Сборка транзакции…",
    pay_approve_wallet: "Подтвердите в кошельке…",
    pay_approve_wallet_hint: "Подтвердите перевод в кошельке…",
    pay_confirming: "Подтверждение on-chain…",
    pay_confirming_verify: "Проверяем on-chain…",
    pay_verified_pro: "Проверено. Pro активирован.",
  },
  uk: {
    wallet_plan_unlock_days: "Pro на {days} дн.",
    wallet_plans_load_failed: "Не вдалося завантажити плани. Оновіть сторінку.",
    pay_creating_checkout: "Створюємо checkout…",
    pay_creating_payment: "Створюємо платіж…",
    pay_binding_wallet: "Прив’язка гаманця…",
    pay_sign_bind_message: "Підпишіть повідомлення гаманця для checkout…",
    pay_building_tx: "Збірка транзакції…",
    pay_approve_wallet: "Підтвердіть у гаманці…",
    pay_approve_wallet_hint: "Підтвердіть переказ у гаманці…",
    pay_confirming: "Підтвердження on-chain…",
    pay_confirming_verify: "Перевіряємо on-chain…",
    pay_verified_pro: "Перевірено. Pro активовано.",
  },
  de: {
    wallet_plan_unlock_days: "Pro für {days} Tage",
    wallet_plans_load_failed: "Pläne konnten nicht geladen werden. Seite neu laden.",
    pay_creating_checkout: "Checkout wird erstellt…",
    pay_creating_payment: "Zahlung wird erstellt…",
    pay_binding_wallet: "Wallet wird gebunden…",
    pay_sign_bind_message: "Wallet-Nachricht signieren…",
    pay_building_tx: "Transaktion wird erstellt…",
    pay_approve_wallet: "In Wallet bestätigen…",
    pay_approve_wallet_hint: "Transaktion in der Wallet bestätigen…",
    pay_confirming: "On-chain bestätigen…",
    pay_confirming_verify: "On-chain prüfen…",
    pay_verified_pro: "Verifiziert. Pro aktiviert.",
  },
  fr: {
    wallet_plan_unlock_days: "Pro pendant {days} jours",
    wallet_plans_load_failed: "Impossible de charger les plans. Actualisez la page.",
    pay_creating_checkout: "Création du checkout…",
    pay_creating_payment: "Création du paiement…",
    pay_binding_wallet: "Liaison du wallet…",
    pay_sign_bind_message: "Signez le message wallet…",
    pay_building_tx: "Construction de la transaction…",
    pay_approve_wallet: "Approuver dans le wallet…",
    pay_approve_wallet_hint: "Approuvez la transaction dans votre wallet…",
    pay_confirming: "Confirmation on-chain…",
    pay_confirming_verify: "Vérification on-chain…",
    pay_verified_pro: "Vérifié. Pro activé.",
  },
  es: {
    wallet_plan_unlock_days: "Pro por {days} días",
    wallet_plans_load_failed: "No se pudieron cargar los planes. Actualiza la página.",
    pay_creating_checkout: "Creando checkout…",
    pay_creating_payment: "Creando pago…",
    pay_binding_wallet: "Vinculando wallet…",
    pay_sign_bind_message: "Firma el mensaje del wallet…",
    pay_building_tx: "Construyendo transacción…",
    pay_approve_wallet: "Aprueba en el wallet…",
    pay_approve_wallet_hint: "Aprueba la transacción en tu wallet…",
    pay_confirming: "Confirmando on-chain…",
    pay_confirming_verify: "Verificando on-chain…",
    pay_verified_pro: "Verificado. Pro activado.",
  },
  pt: {
    wallet_plan_unlock_days: "Pro por {days} dias",
    wallet_plans_load_failed: "Não foi possível carregar planos. Atualize a página.",
    pay_creating_checkout: "Criando checkout…",
    pay_creating_payment: "Criando pagamento…",
    pay_binding_wallet: "Vinculando wallet…",
    pay_sign_bind_message: "Assine a mensagem da wallet…",
    pay_building_tx: "Montando transação…",
    pay_approve_wallet: "Aprove na wallet…",
    pay_approve_wallet_hint: "Aprove a transação na wallet…",
    pay_confirming: "Confirmando on-chain…",
    pay_confirming_verify: "Verificando on-chain…",
    pay_verified_pro: "Verificado. Pro ativado.",
  },
  it: {
    wallet_plan_unlock_days: "Pro per {days} giorni",
    wallet_plans_load_failed: "Impossibile caricare i piani. Aggiorna la pagina.",
    pay_creating_checkout: "Creazione checkout…",
    pay_creating_payment: "Creazione pagamento…",
    pay_binding_wallet: "Collegamento wallet…",
    pay_sign_bind_message: "Firma il messaggio wallet…",
    pay_building_tx: "Creazione transazione…",
    pay_approve_wallet: "Approva nel wallet…",
    pay_approve_wallet_hint: "Approva la transazione nel wallet…",
    pay_confirming: "Conferma on-chain…",
    pay_confirming_verify: "Verifica on-chain…",
    pay_verified_pro: "Verificato. Pro attivato.",
  },
  nl: {
    wallet_plan_unlock_days: "Pro voor {days} dagen",
    wallet_plans_load_failed: "Plannen laden mislukt. Vernieuw de pagina.",
    pay_creating_checkout: "Checkout aanmaken…",
    pay_creating_payment: "Betaling aanmaken…",
    pay_binding_wallet: "Wallet koppelen…",
    pay_sign_bind_message: "Wallet-bericht ondertekenen…",
    pay_building_tx: "Transactie bouwen…",
    pay_approve_wallet: "Goedkeuren in wallet…",
    pay_approve_wallet_hint: "Keur de transactie goed in je wallet…",
    pay_confirming: "On-chain bevestigen…",
    pay_confirming_verify: "On-chain verifiëren…",
    pay_verified_pro: "Geverifieerd. Pro geactiveerd.",
  },
  pl: {
    wallet_plan_unlock_days: "Pro na {days} dni",
    wallet_plans_load_failed: "Nie udało się załadować planów. Odśwież stronę.",
    pay_creating_checkout: "Tworzenie checkout…",
    pay_creating_payment: "Tworzenie płatności…",
    pay_binding_wallet: "Powiązanie portfela…",
    pay_sign_bind_message: "Podpisz wiadomość portfela…",
    pay_building_tx: "Budowanie transakcji…",
    pay_approve_wallet: "Zatwierdź w portfelu…",
    pay_approve_wallet_hint: "Zatwierdź transakcję w portfelu…",
    pay_confirming: "Potwierdzanie on-chain…",
    pay_confirming_verify: "Weryfikacja on-chain…",
    pay_verified_pro: "Zweryfikowano. Pro aktywne.",
  },
  tr: {
    wallet_plan_unlock_days: "{days} gün Pro",
    wallet_plans_load_failed: "Planlar yüklenemedi. Sayfayı yenileyin.",
    pay_creating_checkout: "Checkout oluşturuluyor…",
    pay_creating_payment: "Ödeme oluşturuluyor…",
    pay_binding_wallet: "Cüzdan bağlanıyor…",
    pay_sign_bind_message: "Cüzdan mesajını imzalayın…",
    pay_building_tx: "İşlem oluşturuluyor…",
    pay_approve_wallet: "Cüzdanda onaylayın…",
    pay_approve_wallet_hint: "İşlemi cüzdanınızda onaylayın…",
    pay_confirming: "On-chain onay…",
    pay_confirming_verify: "On-chain doğrulanıyor…",
    pay_verified_pro: "Doğrulandı. Pro etkin.",
  },
  id: {
    wallet_plan_unlock_days: "Pro {days} hari",
    wallet_plans_load_failed: "Gagal memuat paket. Muat ulang halaman.",
    pay_creating_checkout: "Membuat checkout…",
    pay_creating_payment: "Membuat pembayaran…",
    pay_binding_wallet: "Menghubungkan wallet…",
    pay_sign_bind_message: "Tandatangani pesan wallet…",
    pay_building_tx: "Membangun transaksi…",
    pay_approve_wallet: "Setujui di wallet…",
    pay_approve_wallet_hint: "Setujui transaksi di wallet…",
    pay_confirming: "Konfirmasi on-chain…",
    pay_confirming_verify: "Memverifikasi on-chain…",
    pay_verified_pro: "Terverifikasi. Pro aktif.",
  },
  hi: {
    wallet_plan_unlock_days: "{days} दिन Pro",
    wallet_plans_load_failed: "Plans load नहीं हुए। Page refresh करें।",
    pay_creating_checkout: "Checkout बन रहा है…",
    pay_creating_payment: "Payment बन रहा है…",
    pay_binding_wallet: "Wallet bind हो रहा है…",
    pay_sign_bind_message: "Wallet message sign करें…",
    pay_building_tx: "Transaction बन रहा है…",
    pay_approve_wallet: "Wallet में approve करें…",
    pay_approve_wallet_hint: "Wallet में transaction approve करें…",
    pay_confirming: "On-chain confirm…",
    pay_confirming_verify: "On-chain verify…",
    pay_verified_pro: "Verified. Pro active.",
  },
  ja: {
    wallet_plan_unlock_days: "Pro {days}日",
    wallet_plans_load_failed: "プランを読み込めませんでした。ページを更新してください。",
    pay_creating_checkout: "チェックアウト作成中…",
    pay_creating_payment: "支払い作成中…",
    pay_binding_wallet: "ウォレット連携中…",
    pay_sign_bind_message: "ウォレットメッセージに署名…",
    pay_building_tx: "トランザクション作成中…",
    pay_approve_wallet: "ウォレットで承認…",
    pay_approve_wallet_hint: "ウォレットで取引を承認…",
    pay_confirming: "オンチェーン確認中…",
    pay_confirming_verify: "オンチェーン検証中…",
    pay_verified_pro: "検証完了。Pro有効。",
  },
  zh: {
    wallet_plan_unlock_days: "Pro {days} 天",
    wallet_plans_load_failed: "无法加载方案。请刷新页面。",
    pay_creating_checkout: "正在创建 checkout…",
    pay_creating_payment: "正在创建支付…",
    pay_binding_wallet: "正在绑定钱包…",
    pay_sign_bind_message: "请在钱包中签名…",
    pay_building_tx: "正在构建交易…",
    pay_approve_wallet: "请在钱包中批准…",
    pay_approve_wallet_hint: "请在钱包中批准交易…",
    pay_confirming: "链上确认中…",
    pay_confirming_verify: "链上验证中…",
    pay_verified_pro: "已验证。Pro 已激活。",
  },
};

let total = 0;
for (const [lang, keys] of Object.entries(PATCH)) {
  const file = path.join(ROOT, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, keys);
  total += Object.keys(keys).length;
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}

const en = JSON.parse(fs.readFileSync(path.join(ROOT, "en.json"), "utf8"));
for (const lang of fs.readdirSync(ROOT).map((f) => f.replace(/\.json$/, "")).filter((c) => c !== "en")) {
  const file = path.join(ROOT, `${lang}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const key of Object.keys(en)) {
    if (!(key in j)) {
      j[key] = en[key];
      total++;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
}

console.log(`[i18n_wallet_flow_patches] updated keys=${total}`);
