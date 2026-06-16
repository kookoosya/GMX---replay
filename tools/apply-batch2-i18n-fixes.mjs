#!/usr/bin/env node
/** One-off batch 2 curated strict-offender fixes (ru, es, fr, pt). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'shared', 'i18n', 'locales');

const FIXES = {
  ru: {
    h_freepro_1: 'HTML:<b>Free:</b> создание и редактирование списков с лимитом сохранённых строк и дневными лимитами генерации.',
    h_freepro_2: 'HTML:<b>Pro:</b> снимает ограничения, открывает премиум-функции и усиленную Best-генерацию.',
    bank_run_best_hint: 'Запускайте Best вручную, если нужна очистка или дозаполнение.',
    themes_wp_section_title: 'Обои сайта',
    themes_wp_hint: 'Фоны для основного сайта. Акцентные цвета следуют сохранённой теме (или значениям по умолчанию).',
    gn_desc: 'Короткие ночные ответы — вы сами редактируете и вставляете. Одна сохранённая база для раздела; в Free есть лимит строк.',
    ref_desc: 'Рефералы: делитесь ссылкой. Подтверждён = подключён, Активен = использовал продукт, Допущен = max(активные, перенос). Бонус: +10/день за каждые 20 допущенных (+12 при 50+).',
    pm_title: 'Рынок прогнозов',
    pm_refresh: 'Обновить сигналы',
    pm_filter_asset_label: 'Актив',
    pm_filter_bias_label: 'Направление',
    pm_filter_conf_label: 'Мин. уверенность',
    pm_status_preview: 'Пока нет живой ленты — внешний источник сигналов не подключён. Обновление только проверяет сервер.',
    pm_headline_cadence: 'План: несколько карточек в день после запуска',
    pm_headline_thesis: 'Только превью: живой бот и внешние фиды данных ещё не подключены.',
    pm_risk_title: 'Раскрытие рисков',
    pm_disclaimer_title: 'Отказ от ответственности',
    wp_apply_prediction: 'Рынок прогнозов',
    r_li2c: 'Промоутеры: дневной лимит генерации Free растёт автоматически с рефералами (бонус добавляется к базовому лимиту).',
    r_li4: 'Допущен = max(активные, перенос). Перенос важен только если он больше.',
  },
  es: {
    ref_def_legacy: 'el arrastre antiguo aún se cuenta en tu total de desbloqueos.',
    ref_desc: 'Referidos: comparte tu enlace. Confirmado = conectado, Activo = usó el producto, Elegible = max(activos, arrastre). Bono: +10/día por cada 20 elegibles (+12 con 50+).',
    pm_headline_cadence: 'Planificado: unas pocas tarjetas al día tras el lanzamiento',
    arcade_search_placeholder: 'Buscar juegos',
    ext_shortcut_hint: 'Atajo opcional: asígnalo en chrome://extensions/shortcuts para «Abrir panel rápido de GMXReply».',
  },
  fr: {
    h_freepro_2: 'HTML:<b>Pro :</b> supprime les limites, débloque les contrôles premium et une génération Best renforcée.',
    themes_wp_section_title: "Fonds d'écran du site",
    pm_filter_asset_label: 'Actif',
    pm_disclaimer_title: 'Avertissement',
    ext_shortcut_hint: 'Raccourci optionnel : assignez-le dans chrome://extensions/shortcuts pour « Ouvrir le panneau rapide GMXReply ».',
  },
  pt: {
    ref_metric_clicks: 'Cliques',
    ref_reward_toolkit: 'Kit de indicações',
    wp_light_detected_light: 'Papel de parede claro — contraste de texto reforçado',
    themes_wp_section_title: 'Papéis de parede do site',
    ref_desc: 'Indicações: compartilhe seu link. Confirmado = conectado, Ativo = usou o produto, Elegível = max(ativos, arraste). Bônus: +10/dia a cada 20 elegíveis (+12 com 50+).',
    pm_status_preview: 'Ainda não há feed ao vivo — a fonte externa de sinais não está conectada. Atualizar só verifica o servidor.',
    pm_headline_cadence: 'Planejado: alguns cards por dia após o lançamento',
    pm_headline_thesis: 'Somente prévia: o bot ao vivo e feeds externos ainda não estão conectados.',
    wp_status_unlocked_html: '<span class="ok">Desbloqueado.</span> Todos os papéis de parede disponíveis.',
    wp_status_locked_html: '<span class="warn">Bloqueado.</span> Primeiros {n} grátis. Próximo em <b>{r} ind.</b>',
    w_trust_list: [
      '<b>Sem seed phrase:</b> nunca pedimos suas palavras secretas ou chaves privadas.',
      '<b>Fundos não podem ser roubados aqui:</b> somos não custodiais — não guardamos seu SOL/USDC/USDT. Você só aprova uma transferência normal para um endereço publicado pelo valor exato mostrado na carteira.',
      '<b>Transferência padrão:</b> você sempre vê o endereço do destinatário e o valor na carteira antes de aprovar.',
      '<b>Verificação on-chain:</b> o Pro só ativa depois que verificamos sua transação na Solana.',
    ],
    ext_shortcut_hint: 'Atalho opcional: defina em chrome://extensions/shortcuts para «Abrir painel rápido do GMXReply».',
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
