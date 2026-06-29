#!/usr/bin/env node
/** Referral pending attribution UI copy — 15 locales. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "shared", "i18n", "locales");
const LOCALES = [
  "en",
  "ru",
  "uk",
  "de",
  "fr",
  "es",
  "pt",
  "it",
  "nl",
  "tr",
  "pl",
  "id",
  "hi",
  "ja",
  "zh",
];

const PATCH = {
  en: {
    ref_capture_pending: "Referral link saved — connect your @handle to apply it.",
    ref_capture_expired: "This referral link has expired.",
    ref_connect_retry: "Connect failed. Your referral link is still saved — try again.",
  },
  ru: {
    ref_capture_pending: "Реферальная ссылка сохранена — подключите @handle, чтобы применить её.",
    ref_capture_expired: "Срок действия этой реферальной ссылки истёк.",
    ref_connect_retry: "Не удалось подключиться. Реферальная ссылка сохранена — попробуйте снова.",
  },
  uk: {
    ref_capture_pending: "Реферальне посилання збережено — підключіть @handle, щоб застосувати його.",
    ref_capture_expired: "Термін дії цього реферального посилання минув.",
    ref_connect_retry: "Не вдалося підключитися. Реферальне посилання збережено — спробуйте ще раз.",
  },
  de: {
    ref_capture_pending: "Empfehlungslink gespeichert — verbinde deinen @handle, um ihn anzuwenden.",
    ref_capture_expired: "Dieser Empfehlungslink ist abgelaufen.",
    ref_connect_retry: "Verbindung fehlgeschlagen. Dein Empfehlungslink ist noch gespeichert — versuche es erneut.",
  },
  fr: {
    ref_capture_pending: "Lien de parrainage enregistré — connecte ton @handle pour l'appliquer.",
    ref_capture_expired: "Ce lien de parrainage a expiré.",
    ref_connect_retry: "Échec de la connexion. Ton lien de parrainage est toujours enregistré — réessaie.",
  },
  es: {
    ref_capture_pending: "Enlace de referido guardado — conecta tu @handle para aplicarlo.",
    ref_capture_expired: "Este enlace de referido ha caducado.",
    ref_connect_retry: "Error al conectar. Tu enlace de referido sigue guardado — inténtalo de nuevo.",
  },
  pt: {
    ref_capture_pending: "Link de indicação salvo — conecte seu @handle para aplicá-lo.",
    ref_capture_expired: "Este link de indicação expirou.",
    ref_connect_retry: "Falha na conexão. Seu link de indicação ainda está salvo — tente novamente.",
  },
  it: {
    ref_capture_pending: "Link referral salvato — collega il tuo @handle per applicarlo.",
    ref_capture_expired: "Questo link referral è scaduto.",
    ref_connect_retry: "Connessione non riuscita. Il link referral è ancora salvato — riprova.",
  },
  nl: {
    ref_capture_pending: "Referrallink opgeslagen — koppel je @handle om deze toe te passen.",
    ref_capture_expired: "Deze referrallink is verlopen.",
    ref_connect_retry: "Verbinden mislukt. Je referrallink is nog opgeslagen — probeer opnieuw.",
  },
  tr: {
    ref_capture_pending: "Referans bağlantısı kaydedildi — uygulamak için @handle bağla.",
    ref_capture_expired: "Bu referans bağlantısının süresi doldu.",
    ref_connect_retry: "Bağlantı başarısız. Referans bağlantın hâlâ kayıtlı — tekrar dene.",
  },
  pl: {
    ref_capture_pending: "Link polecający zapisany — podłącz @handle, aby go zastosować.",
    ref_capture_expired: "Ten link polecający wygasł.",
    ref_connect_retry: "Połączenie nie powiodło się. Link polecający nadal zapisany — spróbuj ponownie.",
  },
  id: {
    ref_capture_pending: "Tautan referral disimpan — hubungkan @handle untuk menerapkannya.",
    ref_capture_expired: "Tautan referral ini sudah kedaluwarsa.",
    ref_connect_retry: "Gagal terhubung. Tautan referral masih tersimpan — coba lagi.",
  },
  hi: {
    ref_capture_pending: "रेफ़रल लिंक सेव हो गया — लागू करने के लिए अपना @handle कनेक्ट करें।",
    ref_capture_expired: "यह रेफ़रल लिंक समाप्त हो गया है।",
    ref_connect_retry: "कनेक्ट नहीं हो सका। आपका रेफ़रल लिंक अभी भी सेव है — फिर कोशिश करें।",
  },
  ja: {
    ref_capture_pending: "紹介リンクを保存しました。@handle を接続すると適用されます。",
    ref_capture_expired: "この紹介リンクの有効期限が切れました。",
    ref_connect_retry: "接続に失敗しました。紹介リンクは保存されたままです。もう一度お試しください。",
  },
  zh: {
    ref_capture_pending: "推荐链接已保存 — 连接你的 @handle 即可生效。",
    ref_capture_expired: "此推荐链接已过期。",
    ref_connect_retry: "连接失败。推荐链接仍已保存 — 请重试。",
  },
};

for (const loc of LOCALES) {
  const file = path.join(ROOT, `${loc}.json`);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(j, PATCH[loc] || PATCH.en);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`, "utf8");
  console.log(`patched ${loc}`);
}
