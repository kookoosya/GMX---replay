#!/usr/bin/env node
/** Curated strict-offender fixes: uk, tr, pl, ja (batch 2b manual). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'shared', 'i18n', 'locales');

const TRUST_LIST_UK = [
  '<b>Без seed phrase:</b> ми ніколи не просимо секретні слова чи приватні ключі.',
  '<b>Кошти тут не вкрасти:</b> ми некастодіальні — не зберігаємо ваш SOL/USDC/USDT. Ви лише підтверджуєте звичайний переказ на опубліковану адресу на точну суму з гаманця.',
  '<b>Звичайний переказ:</b> ви завжди бачите адресу отримувача та суму в гаманці перед підтвердженням.',
  '<b>Ончейн-верифікація:</b> Pro активується лише після перевірки транзакції в Solana.',
];

const TRUST_LIST_TR = [
  '<b>Seed phrase yok:</b> gizli kelimelerinizi veya özel anahtarlarınızı asla istemeyiz.',
  '<b>Burada fon çalınamaz:</b> saklamıyoruz — SOL/USDC/USDT tutmuyoruz. Yalnızca cüzdanınızda gösterilen tam tutar için yayınlanmış adrese normal transfer onaylarsınız.',
  '<b>Standart transfer:</b> onaylamadan önce alıcı adresini ve tutarı her zaman cüzdanınızda görürsünüz.',
  '<b>Zincir üstü doğrulama:</b> Pro yalnızca Solana üzerindeki işleminizi doğruladıktan sonra açılır.',
];

const TRUST_LIST_PL = [
  '<b>Bez seed phrase:</b> nigdy nie prosimy o tajne słowa ani klucze prywatne.',
  '<b>Środków tu nie ukradniesz:</b> jesteśmy non-custodial — nie przechowujemy SOL/USDC/USDT. Zatwierdzasz tylko zwykły transfer na opublikowany adres na dokładną kwotę z portfela.',
  '<b>Standardowy transfer:</b> przed zatwierdzeniem zawsze widzisz adres odbiorcy i kwotę w portfelu.',
  '<b>Weryfikacja on-chain:</b> Pro aktywuje się dopiero po weryfikacji transakcji w Solana.',
];

const TRUST_LIST_JA = [
  '<b>シードフレーズ不要:</b> 秘密の復元語や秘密鍵は一切お願いしません。',
  '<b>ここで資金は盗めません:</b> 非カストディアル — SOL/USDC/USDT を預かりません。ウォレットに表示された正確な金額で公開アドレスへの通常送金のみ承認します。',
  '<b>通常の送金:</b> 承認前にウォレットで受取アドレスと金額を必ず確認できます。',
  '<b>オンチェーン検証:</b> Pro は Solana 上の取引を検証した後にのみ有効化されます。',
];

const FIXES = {
  uk: {
    h_what_2: 'HTML:Безпечний copy-first у розширенні: згенеруйте, скопіюйте, вставте на X вручну.',
    h_freepro_1: 'HTML:<b>Free:</b> створення та редагування списків з лімітом збережених рядків і денними лімітами генерації.',
    h_freepro_2: 'HTML:<b>Pro:</b> знімає обмеження, відкриває преміум-функції та посилену Best-генерацію.',
    gm_daily_label: 'Денна генерація (розширення)',
    gn_daily_label: 'Денна генерація (розширення)',
    ref_unlocks_now: 'Відкривається зараз',
    ref_next_unlock: 'Наступне відкриття',
    ref_all_unlocked: 'Усі перелічені відкриття досягнуті',
    ref_metric_clicks: 'Кліки',
    ref_metric_bg_slots: 'Слоти фону',
    ref_metric_save_cap: 'Ліміт збереження',
    ref_reward_one_pack: '1 косметичний пак',
    ref_reward_all_packs: 'Усі косметичні паки',
    ref_reward_discount: '−50% на 1 місяць',
    ref_reward_toolkit: 'Набір рефералів',
    ref_rules_word: 'правила',
    wp_light_label: 'Автоконтраст',
    wp_light_detected_light: 'Світлі шпалери — посилений контраст тексту',
    wp_light_detected_dark: 'Темні шпалери — стандартний контраст',
    wp_light_manual_status: 'Ручне перевизначення (скидається при зміні шпалер)',
    bank_run_best_hint: 'Запускайте Best вручну для очищення або дозаповнення.',
    themes_wp_section_title: 'Шпалери сайту',
    themes_wp_hint: 'Фони для основного сайту. Акцентні кольори слідують збереженій темі (або стандартним).',
    gn_desc: 'Короткі нічні відповіді — ви самі редагуєте та вставляєте. Одна збережена база; у Free є ліміт рядків.',
    ref_desc: 'Реферали: діліться посиланням. Підтверджено = підключено, Активний = використав продукт, Допущений = max(активні, перенос). Бонус: +10/день за кожні 20 допущених (+12 при 50+).',
    pm_title: 'Ринок прогнозів',
    pm_refresh: 'Оновити сигнали',
    pm_filter_asset_label: 'Актив',
    pm_filter_bias_label: 'Напрям',
    pm_filter_conf_label: 'Мін. впевненість',
    pm_status_preview: 'Ще немає живої стрічки — зовнішнє джерело сигналів не підключене. Оновлення лише перевіряє сервер.',
    pm_headline_cadence: 'План: кілька карток на день після запуску',
    pm_headline_thesis: 'Лише превʼю: живий бот і зовнішні фіди ще не підключені.',
    pm_risk_title: 'Розкриття ризиків',
    pm_disclaimer_title: 'Відмова від відповідальності',
    wp_apply_prediction: 'Ринок прогнозів',
    wp_status_unlocked_html: '<span class="ok">Відкрито.</span> Усі шпалери доступні.',
    wp_status_locked_html: '<span class="warn">Заблоковано.</span> Перші {n} безкоштовно. Далі при <b>{r} реф.</b>',
    w_trust_list: TRUST_LIST_UK,
  },
  tr: {
    h_freepro_1: 'HTML:<b>Ücretsiz:</b> kayıtlı satır limiti ve günlük üretim sınırlarıyla liste oluşturma ve düzenleme.',
    h_freepro_2: 'HTML:<b>Pro:</b> limitleri kaldırır, premium kontrolleri ve güçlü Best üretimini açar.',
    wp_light_label: 'Otomatik kontrast',
    wp_light_detected_light: 'Açık duvar kağıdı — artırılmış metin kontrastı',
    wp_light_detected_dark: 'Koyu duvar kağıdı — standart kontrast',
    wp_light_manual_status: 'Manuel geçersiz kılma (duvar kağıdını değiştirince sıfırlanır)',
    bank_run_best_hint: 'Temizlik veya yeniden doldurma için Best geçişini manuel çalıştırın.',
    themes_wp_section_title: 'Site duvar kağıtları',
    themes_wp_hint: 'Ana site için arka planlar. Vurgu renkleri kayıtlı tema ön ayarınızı (veya varsayılanları) izler.',
    gn_right_desc: 'Başkasının gönderisine kısa İngilizce gece yanıtları oluşturun. Sakin, doğal ve yapıştırmaya uygun tutun.',
    gn_desc: 'Kısa gece yanıtları — kendiniz düzenleyip yapıştırırsınız. Bu bölüm için tek kayıtlı banka; Free’de satır limiti vardır.',
    ref_desc: 'Referanslar: bağlantınızı paylaşın. Onaylı = bağlı, Aktif = kullandı, Uygun = max(aktif, devir). Bonus: 20 uygun başına +10/gün (50+ için +12).',
    pm_refresh: 'Sinyalleri yenile',
    pm_filter_asset_label: 'Varlık',
    pm_filter_bias_label: 'Eğilim',
    pm_filter_conf_label: 'Min. güven',
    pm_status_preview: 'Henüz canlı akış yok — harici sinyal kaynağı bağlı değil. Yenile yalnızca sunucuyu kontrol eder.',
    pm_headline_cadence: 'Plan: lansman sonrası günde birkaç kart',
    pm_headline_thesis: 'Yalnızca önizleme: canlı bot ve harici veri akışları henüz bağlı değil.',
    pm_risk_title: 'Risk açıklaması',
    wp_status_unlocked_html: '<span class="ok">Açık.</span> Tüm duvar kağıtları kullanılabilir.',
    wp_status_locked_html: '<span class="warn">Kilitli.</span> İlk {n} ücretsiz. Sonraki <b>{r} ref</b> ile.',
    w_trust_list: TRUST_LIST_TR,
    arcade_search_placeholder: 'Oyun ara',
    ext_shortcut_hint: 'İsteğe bağlı kısayol: chrome://extensions/shortcuts içinde «GMXReply hızlı panelini aç» için kendiniz atayın.',
  },
  pl: {
    h_freepro_1: 'HTML:<b>Free:</b> tworzenie i edycja list z limitem zapisanych wierszy i dziennymi limitami generacji.',
    h_freepro_2: 'HTML:<b>Pro:</b> usuwa limity, odblokowuje kontrolki premium i mocniejszą generację Best.',
    wp_light_label: 'Automatyczny kontrast',
    wp_light_detected_light: 'Jasna tapeta — wzmocniony kontrast tekstu',
    wp_light_detected_dark: 'Ciemna tapeta — standardowy kontrast',
    wp_light_manual_status: 'Ręczne nadpisanie (reset przy zmianie tapety)',
    bank_run_best_hint: 'Uruchom Best ręcznie, jeśli chcesz wyczyścić lub uzupełnić.',
    themes_wp_section_title: 'Tapety witryny',
    themes_wp_hint: 'Tła głównej witryny. Kolory akcentów zgodne z zapisaną predefinicją motywu (lub domyślnymi).',
    gn_right_desc: 'Krótkie wieczorne odpowiedzi po angielsku do cudzego posta. Spokojne, naturalne, łatwe do wklejenia.',
    gn_desc: 'Krótkie nocne odpowiedzi — edytujesz i wklejasz sam. Jedna zapisana baza; Free ma limit wierszy.',
    ref_desc: 'Polecenia: udostępnij link. Potwierdzony = połączony, Aktywny = użył produktu, Uprawniony = max(aktywni, przeniesienie). Bonus: +10/dzień na 20 uprawnionych (+12 przy 50+).',
    pm_title: 'Rynek predykcji',
    pm_refresh: 'Odśwież sygnały',
    pm_filter_asset_label: 'Aktywo',
    pm_filter_bias_label: 'Tendencja',
    pm_filter_conf_label: 'Min. pewność',
    pm_status_preview: 'Brak żywego feedu — zewnętrzne źródło sygnałów nie jest podłączone. Odśwież tylko sprawdza serwer.',
    pm_headline_cadence: 'Plan: kilka kart dziennie po uruchomieniu',
    pm_headline_thesis: 'Tylko podgląd: żywy bot i zewnętrzne feedy nie są jeszcze podłączone.',
    pm_risk_title: 'Ujawnienie ryzyka',
    pm_disclaimer_title: 'Zastrzeżenie',
    wp_apply_prediction: 'Rynek predykcji',
    r_li2c: 'Promotorzy: dzienny limit generacji Free rośnie automatycznie z poleceniami (bonus dodawany do limitu bazowego).',
    r_li4: 'Uprawniony = max(aktywni, przeniesienie). Przeniesienie liczy się tylko gdy jest większe.',
    wp_loading: 'Ładowanie tapet…',
    wp_status_unlocked_html: '<span class="ok">Odblokowano.</span> Wszystkie tapety dostępne.',
    wp_status_locked_html: '<span class="warn">Zablokowano.</span> Pierwsze {n} za darmo. Następne przy <b>{r} ref</b>.',
    w_trust_list: TRUST_LIST_PL,
    ext_shortcut_hint: 'Opcjonalny skrót: przypisz w chrome://extensions/shortcuts dla „Otwórz szybki panel GMXReply”.',
  },
  ja: {
    h_what_1: 'HTML:自然な多様性のある人間らしい <b>GM</b> / <b>GN</b> 返信。',
    h_freepro_1: 'HTML:<b>Free:</b> 保存行上限と日次生成制限付きでリストを作成・編集。',
    h_freepro_2: 'HTML:<b>Pro:</b> 制限を解除し、プレミアム機能と強化された Best 生成を解放。',
    wp_light_label: '自動コントラスト',
    wp_light_detected_light: '明るい壁紙 — テキストコントラストを強化',
    wp_light_detected_dark: '暗い壁紙 — 標準コントラスト',
    wp_light_manual_status: '手動上書き（壁紙変更でリセット）',
    bank_run_best_hint: 'クリーンアップや補充が必要なら Best を手動で実行してください。',
    themes_wp_section_title: 'サイトの壁紙',
    themes_wp_hint: 'メインサイトの背景。アクセント色は保存したテーマプリセット（またはデフォルト）に従います。',
    gn_desc: '短い夜の返信 — 自分で編集して貼り付けます。このセクション用の保存バンクは1つ。Free には保存行上限があります。',
    ref_desc: '紹介: リンクを共有。確認済み = 接続、アクティブ = 利用、対象 = max(アクティブ, 繰越)。ボーナス: 対象20人ごとに +10/日（50+ で +12）。',
    pm_title: '予測マーケット',
    pm_refresh: 'シグナルを更新',
    pm_filter_asset_label: '資産',
    pm_filter_bias_label: 'バイアス',
    pm_filter_conf_label: '最小信頼度',
    pm_status_preview: 'ライブフィードはまだありません — 外部シグナルソースは未接続。更新はサーバー確認のみです。',
    pm_headline_cadence: '予定: ローンチ後は1日数枚のカード',
    pm_headline_thesis: 'プレビューのみ: ライブボットと外部データフィードは未接続です。',
    pm_risk_title: 'リスク開示',
    pm_disclaimer_title: '免責事項',
    wp_apply_prediction: '予測マーケット',
    r_li2c: 'プロモーター: 紹介に応じて Free の日次生成上限が自動で増加（ボーナスは基本上限に加算）。',
    r_li4: '対象 = max(アクティブ, 繰越)。繰越はそれが大きい場合のみ意味があります。',
    wp_loading: '壁紙を読み込み中…',
    wp_status_unlocked_html: '<span class="ok">解除済み。</span> すべての壁紙が利用可能です。',
    wp_status_locked_html: '<span class="warn">ロック中。</span> 最初の {n} 枚は無料。次は <b>{r} 紹介</b> で。',
    w_trust_list: TRUST_LIST_JA,
    ext_shortcut_hint: '任意のショートカット: chrome://extensions/shortcuts で「GMXReply クイックパネルを開く」に割り当てできます。',
  },
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n', 'utf8');
}

let total = 0;
for (const [code, patch] of Object.entries(FIXES)) {
  const p = path.join(LOCALES_DIR, `${code}.json`);
  const loc = readJson(p);
  for (const [k, v] of Object.entries(patch)) loc[k] = v;
  writeJson(p, loc);
  total += Object.keys(patch).length;
  console.log(`[${code}] ${Object.keys(patch).length} fixes`);
}
console.log(`Applied ${total} fixes`);
