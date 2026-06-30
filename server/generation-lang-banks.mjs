/**
 * Localized GM/GN template pools for supported reply languages.
 * Placeholders: {greet}, {voc}, {emoji}
 */

export const SUPPORTED_REPLY_LANGS = [
  "en", "es", "pt", "fr", "de", "it", "nl", "tr", "pl", "id", "ru", "uk", "hi", "ja", "zh",
];

const VOC = {
  en: {
    ordinary: ["bro", "homie", "friend"],
    crypto: ["bro", "degen", "homie"],
    warm: ["friend", "bro"],
    calmer: ["friend", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "homie"],
  },
  es: {
    ordinary: ["bro", "amigo", "crack"],
    crypto: ["bro", "degen", "amigo"],
    warm: ["amigo", "bro"],
    calmer: ["amigo", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "crack"],
  },
  pt: {
    ordinary: ["mano", "bro", "amigo"],
    crypto: ["bro", "degen", "mano"],
    warm: ["amigo", "mano"],
    calmer: ["amigo", "bro"],
    builder: ["degen", "mano"],
    meme: ["mano", "bro"],
  },
  fr: {
    ordinary: ["bro", "ami", "pote"],
    crypto: ["bro", "degen", "ami"],
    warm: ["ami", "bro"],
    calmer: ["ami", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "pote"],
  },
  de: {
    ordinary: ["bro", "freund", "kollege"],
    crypto: ["bro", "degen", "freund"],
    warm: ["freund", "bro"],
    calmer: ["freund", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "kollege"],
  },
  it: {
    ordinary: ["bro", "amico", "fra"],
    crypto: ["bro", "degen", "amico"],
    warm: ["amico", "bro"],
    calmer: ["amico", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "fra"],
  },
  nl: {
    ordinary: ["bro", "maat", "vriend"],
    crypto: ["bro", "degen", "maat"],
    warm: ["vriend", "bro"],
    calmer: ["vriend", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "maat"],
  },
  tr: {
    ordinary: ["kanka", "dost", "bro"],
    crypto: ["kanka", "degen", "bro"],
    warm: ["dost", "kanka"],
    calmer: ["dost", "bro"],
    builder: ["degen", "kanka"],
    meme: ["kanka", "bro"],
  },
  pl: {
    ordinary: ["bro", "ziom", "kolego"],
    crypto: ["bro", "degen", "ziom"],
    warm: ["ziom", "bro"],
    calmer: ["ziom", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "ziom"],
  },
  id: {
    ordinary: ["bro", "teman", "gan"],
    crypto: ["bro", "degen", "gan"],
    warm: ["teman", "bro"],
    calmer: ["teman", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "gan"],
  },
  ru: {
    ordinary: ["бро", "друг", "чел"],
    crypto: ["бро", "деген", "друг"],
    warm: ["друг", "бро"],
    calmer: ["друг", "бро"],
    builder: ["деген", "бро"],
    meme: ["бро", "чел"],
  },
  uk: {
    ordinary: ["бро", "друже", "чувак"],
    crypto: ["бро", "деген", "друже"],
    warm: ["друже", "бро"],
    calmer: ["друже", "бро"],
    builder: ["деген", "бро"],
    meme: ["бро", "чувак"],
  },
  hi: {
    ordinary: ["यार", "दोस्त", "भाई"],
    crypto: ["यार", "degen", "भाई"],
    warm: ["दोस्त", "यार"],
    calmer: ["दोस्त", "यार"],
    builder: ["degen", "भाई"],
    meme: ["यार", "भाई"],
  },
  ja: {
    ordinary: ["bro", "友達", "みんな"],
    crypto: ["bro", "degen", "友達"],
    warm: ["友達", "bro"],
    calmer: ["友達", "bro"],
    builder: ["degen", "bro"],
    meme: ["bro", "みんな"],
  },
  zh: {
    ordinary: ["兄弟", "朋友", "bro"],
    crypto: ["bro", "degen", "兄弟"],
    warm: ["朋友", "兄弟"],
    calmer: ["朋友", "bro"],
    builder: ["degen", "兄弟"],
    meme: ["bro", "兄弟"],
  },
};

function side(greet, min, mid, max) {
  return { greet, min, mid, max };
}

/** @type {Record<string, { voc: object, gm: object, gn: object }>} */
export const LANG_PACKS = {
  en: {
    voc: VOC.en,
    gm: side(
      ["Gm", "Good morning", "Morning"],
      ["{greet} {voc}, hope today starts easy {emoji}", "{greet}, coffee first and a calm day {emoji}", "{greet} {voc}, good vibes on this one {emoji}", "{greet}, wishing you a smooth morning {emoji}", "{greet} {voc}, solid way to start the day {emoji}", "{greet}, hope the coffee hits early {emoji}"],
      ["{greet} {voc}, good energy on this one {emoji}", "{greet}, hope the day starts easy {emoji}", "{greet} {voc}, solid start {emoji}"],
      ["{greet} {voc}, strong post and good morning energy {emoji}", "{greet}, hope today stays kind {emoji}"]
    ),
    gn: side(
      ["Gn", "Good night", "Night"],
      ["{greet} {voc}, sleep easy tonight {emoji}", "{greet}, rest well and reset {emoji}", "{greet} {voc}, calm close tonight {emoji}", "{greet}, hope the night is kind {emoji}", "{greet} {voc}, good rest on your side {emoji}", "{greet}, soft landing tonight {emoji}"],
      ["{greet} {voc}, sleep easy tonight {emoji}", "{greet}, calm close tonight {emoji}", "{greet}, good rest {emoji}"],
      ["{greet} {voc}, rest well and come back strong {emoji}", "{greet}, soft landing tonight {emoji}"]
    ),
  },
  ru: {
    voc: VOC.ru,
    gm: side(
      ["GM", "Доброе утро", "Утро"],
      ["{greet} {voc}, пусть день начнётся легко {emoji}", "{greet}, хороший пост на утро {emoji}", "{greet} {voc}, желаю хорошего дня {emoji}", "{greet}, спокойного утра {emoji}", "{greet} {voc}, удачного начала дня {emoji}", "{greet}, приятного утра {emoji}"],
      ["{greet} {voc}, хороший пост {emoji}", "{greet}, пусть день начнётся легко {emoji}", "{greet} {voc}, удачного дня {emoji}"],
      ["{greet} {voc}, сильный пост и доброе утро {emoji}", "{greet}, пусть день будет добрым {emoji}"]
    ),
    gn: side(
      ["GN", "Спокойной ночи", "Ночь"],
      ["{greet} {voc}, спокойной ночи {emoji}", "{greet}, хорошего отдыха {emoji}", "{greet} {voc}, пусть ночь будет тихой {emoji}", "{greet}, отдыхай хорошо {emoji}", "{greet} {voc}, мягкого завершения дня {emoji}", "{greet}, выспись и наберись сил {emoji}"],
      ["{greet} {voc}, хорошего отдыха {emoji}", "{greet}, пусть ночь будет спокойной {emoji}", "{greet}, отдыхай {emoji}"],
      ["{greet} {voc}, выспись и наберись сил {emoji}", "{greet}, мягкого завершения дня {emoji}"]
    ),
  },
  uk: {
    voc: VOC.uk,
    gm: side(
      ["GM", "Доброго ранку", "Ранок"],
      ["{greet} {voc}, нехай день почнеться легко {emoji}", "{greet}, гарний пост на ранок {emoji}", "{greet} {voc}, бажаю гарного дня {emoji}", "{greet}, спокійного ранку {emoji}", "{greet} {voc}, вдалого початку дня {emoji}", "{greet}, приємного ранку {emoji}"],
      ["{greet} {voc}, гарний пост {emoji}", "{greet}, нехай день почнеться легко {emoji}", "{greet} {voc}, вдалого дня {emoji}"],
      ["{greet} {voc}, сильний пост і доброго ранку {emoji}", "{greet}, нехай день буде добрим {emoji}"]
    ),
    gn: side(
      ["GN", "Добраніч", "Ніч"],
      ["{greet} {voc}, спокійної ночі {emoji}", "{greet}, гарного відпочинку {emoji}", "{greet} {voc}, нехай ніч буде тихою {emoji}", "{greet}, відпочивай добре {emoji}", "{greet} {voc}, м'якого завершення дня {emoji}", "{greet}, виспись і наберись сил {emoji}"],
      ["{greet} {voc}, гарного відпочинку {emoji}", "{greet}, нехай ніч буде спокійною {emoji}", "{greet}, відпочивай {emoji}"],
      ["{greet} {voc}, виспись і наберись сил {emoji}", "{greet}, м'якого завершення дня {emoji}"]
    ),
  },
  tr: {
    voc: VOC.tr,
    gm: side(
      ["Günaydın", "GM", "Sabah"],
      ["{greet} {voc}, gün hafif başlasın {emoji}", "{greet}, güzel bir paylaşım {emoji}", "{greet} {voc}, iyi günler dilerim {emoji}", "{greet}, sakin bir sabah olsun {emoji}", "{greet} {voc}, güzel bir gün olsun {emoji}", "{greet}, keyifli bir sabah {emoji}"],
      ["{greet} {voc}, iyi bir paylaşım {emoji}", "{greet}, gün hafif başlasın {emoji}", "{greet} {voc}, iyi günler {emoji}"],
      ["{greet} {voc}, güçlü bir paylaşım ve iyi sabahlar {emoji}", "{greet}, bugün yumuşak geçsin {emoji}"]
    ),
    gn: side(
      ["İyi geceler", "GN", "Gece"],
      ["{greet} {voc}, rahat uyu {emoji}", "{greet}, iyi dinlen {emoji}", "{greet} {voc}, gece sakin olsun {emoji}", "{greet}, huzurlu bir gece {emoji}", "{greet} {voc}, iyi uykular {emoji}", "{greet}, günü yumuşak kapat {emoji}"],
      ["{greet} {voc}, rahat uyu {emoji}", "{greet}, gece sakin olsun {emoji}", "{greet}, iyi dinlen {emoji}"],
      ["{greet} {voc}, dinlen ve güç topla {emoji}", "{greet}, günü yumuşak kapat {emoji}"]
    ),
  },
  es: {
    voc: VOC.es,
    gm: side(
      ["Buenos días", "GM", "Mañana"],
      ["{greet} {voc}, que el día arranque fácil {emoji}", "{greet}, buen post para la mañana {emoji}", "{greet} {voc}, te deseo un buen día {emoji}", "{greet}, mañana tranquila {emoji}", "{greet} {voc}, buen inicio de día {emoji}", "{greet}, que tengas buena mañana {emoji}"],
      ["{greet} {voc}, buena energía aquí {emoji}", "{greet}, que el día arranque fácil {emoji}", "{greet} {voc}, buen día {emoji}"],
      ["{greet} {voc}, buen post y buenos días {emoji}", "{greet}, que hoy sea amable {emoji}"]
    ),
    gn: side(
      ["Buenas noches", "GN", "Noche"],
      ["{greet} {voc}, descansa bien {emoji}", "{greet}, que descanses {emoji}", "{greet} {voc}, noche tranquila {emoji}", "{greet}, buen descanso {emoji}", "{greet} {voc}, cierre suave del día {emoji}", "{greet}, que la noche sea amable {emoji}"],
      ["{greet} {voc}, descansa bien {emoji}", "{greet}, que la noche sea suave {emoji}", "{greet}, buen descanso {emoji}"],
      ["{greet} {voc}, descansa y vuelve fuerte {emoji}", "{greet}, cierre suave del día {emoji}"]
    ),
  },
  pt: {
    voc: VOC.pt,
    gm: side(
      ["Bom dia", "GM", "Manhã"],
      ["{greet} {voc}, que o dia comece leve {emoji}", "{greet}, bom post para a manhã {emoji}", "{greet} {voc}, te desejo um bom dia {emoji}", "{greet}, manhã tranquila {emoji}", "{greet} {voc}, bom começo de dia {emoji}", "{greet}, tenha uma boa manhã {emoji}"],
      ["{greet} {voc}, boa energia aqui {emoji}", "{greet}, que o dia comece leve {emoji}", "{greet} {voc}, bom dia {emoji}"],
      ["{greet} {voc}, post forte e bom dia {emoji}", "{greet}, que hoje seja leve {emoji}"]
    ),
    gn: side(
      ["Boa noite", "GN", "Noite"],
      ["{greet} {voc}, descanse bem {emoji}", "{greet}, durma bem {emoji}", "{greet} {voc}, noite tranquila {emoji}", "{greet}, bom descanso {emoji}", "{greet} {voc}, fechamento suave do dia {emoji}", "{greet}, que a noite seja calma {emoji}"],
      ["{greet} {voc}, descanse bem {emoji}", "{greet}, noite tranquila {emoji}", "{greet}, bom descanso {emoji}"],
      ["{greet} {voc}, descanse e volte forte {emoji}", "{greet}, fechamento suave do dia {emoji}"]
    ),
  },
  fr: {
    voc: VOC.fr,
    gm: side(
      ["Bonjour", "GM", "Matin"],
      ["{greet} {voc}, que la journée démarre doucement {emoji}", "{greet}, beau post pour le matin {emoji}", "{greet} {voc}, je te souhaite une bonne journée {emoji}", "{greet}, matin tranquille {emoji}", "{greet} {voc}, bon début de journée {emoji}", "{greet}, passe une belle matinée {emoji}"],
      ["{greet} {voc}, bonne énergie ici {emoji}", "{greet}, que la journée démarre doucement {emoji}", "{greet} {voc}, bonne journée {emoji}"],
      ["{greet} {voc}, beau post et bon matin {emoji}", "{greet}, que la journée soit douce {emoji}"]
    ),
    gn: side(
      ["Bonne nuit", "GN", "Nuit"],
      ["{greet} {voc}, repose-toi bien {emoji}", "{greet}, dors bien {emoji}", "{greet} {voc}, nuit tranquille {emoji}", "{greet}, bon repos {emoji}", "{greet} {voc}, fin de journée en douceur {emoji}", "{greet}, que la nuit soit calme {emoji}"],
      ["{greet} {voc}, repose-toi bien {emoji}", "{greet}, nuit tranquille {emoji}", "{greet}, bon repos {emoji}"],
      ["{greet} {voc}, repose-toi et reviens fort {emoji}", "{greet}, fin de journée en douceur {emoji}"]
    ),
  },
  de: {
    voc: VOC.de,
    gm: side(
      ["Guten Morgen", "GM", "Morgen"],
      ["{greet} {voc}, möge der Tag leicht starten {emoji}", "{greet}, guter Post für den Morgen {emoji}", "{greet} {voc}, wünsche dir einen guten Tag {emoji}", "{greet}, ruhiger Morgen {emoji}", "{greet} {voc}, guter Tagesstart {emoji}", "{greet}, hab einen schönen Morgen {emoji}"],
      ["{greet} {voc}, gute Energie hier {emoji}", "{greet}, möge der Tag leicht starten {emoji}", "{greet} {voc}, guten Tag {emoji}"],
      ["{greet} {voc}, starker Post und guten Morgen {emoji}", "{greet}, möge heute freundlich sein {emoji}"]
    ),
    gn: side(
      ["Gute Nacht", "GN", "Nacht"],
      ["{greet} {voc}, ruh dich aus {emoji}", "{greet}, schlaf gut {emoji}", "{greet} {voc}, ruhige Nacht {emoji}", "{greet}, gute Erholung {emoji}", "{greet} {voc}, sanfter Tagesabschluss {emoji}", "{greet}, möge die Nacht ruhig sein {emoji}"],
      ["{greet} {voc}, ruh dich aus {emoji}", "{greet}, sanfte Nacht {emoji}", "{greet}, gute Erholung {emoji}"],
      ["{greet} {voc}, erhol dich und komm stark zurück {emoji}", "{greet}, sanfter Tagesabschluss {emoji}"]
    ),
  },
  it: {
    voc: VOC.it,
    gm: side(
      ["Buongiorno", "GM", "Mattina"],
      ["{greet} {voc}, che la giornata parta leggera {emoji}", "{greet}, bel post per la mattina {emoji}", "{greet} {voc}, ti auguro una buona giornata {emoji}", "{greet}, mattina tranquilla {emoji}", "{greet} {voc}, buon inizio di giornata {emoji}", "{greet}, passa una bella mattinata {emoji}"],
      ["{greet} {voc}, bella energia qui {emoji}", "{greet}, che la giornata parta leggera {emoji}", "{greet} {voc}, buona giornata {emoji}"],
      ["{greet} {voc}, bel post e buongiorno {emoji}", "{greet}, che oggi sia gentile {emoji}"]
    ),
    gn: side(
      ["Buonanotte", "GN", "Notte"],
      ["{greet} {voc}, riposa bene {emoji}", "{greet}, dormi bene {emoji}", "{greet} {voc}, notte tranquilla {emoji}", "{greet}, buon riposo {emoji}", "{greet} {voc}, chiusura dolce della giornata {emoji}", "{greet}, che la notte sia calma {emoji}"],
      ["{greet} {voc}, riposa bene {emoji}", "{greet}, notte tranquilla {emoji}", "{greet}, buon riposo {emoji}"],
      ["{greet} {voc}, riposa e torna forte {emoji}", "{greet}, chiusura dolce della giornata {emoji}"]
    ),
  },
  nl: {
    voc: VOC.nl,
    gm: side(
      ["Goedemorgen", "GM", "Ochtend"],
      ["{greet} {voc}, moge de dag rustig beginnen {emoji}", "{greet}, mooie post voor de ochtend {emoji}", "{greet} {voc}, wens je een fijne dag {emoji}", "{greet}, rustige ochtend {emoji}", "{greet} {voc}, goede start van de dag {emoji}", "{greet}, fijne ochtend {emoji}"],
      ["{greet} {voc}, goede energie hier {emoji}", "{greet}, moge de dag rustig beginnen {emoji}", "{greet} {voc}, fijne dag {emoji}"],
      ["{greet} {voc}, sterke post en goedemorgen {emoji}", "{greet}, moge vandaag zacht zijn {emoji}"]
    ),
    gn: side(
      ["Goedenacht", "GN", "Nacht"],
      ["{greet} {voc}, rust goed uit {emoji}", "{greet}, slaap lekker {emoji}", "{greet} {voc}, rustige nacht {emoji}", "{greet}, goede rust {emoji}", "{greet} {voc}, zachte dagafsluiting {emoji}", "{greet}, moge de nacht rustig zijn {emoji}"],
      ["{greet} {voc}, rust goed uit {emoji}", "{greet}, zachte nacht {emoji}", "{greet}, goede rust {emoji}"],
      ["{greet} {voc}, rust uit en kom sterk terug {emoji}", "{greet}, zachte dagafsluiting {emoji}"]
    ),
  },
  pl: {
    voc: VOC.pl,
    gm: side(
      ["Dzień dobry", "GM", "Ranek"],
      ["{greet} {voc}, niech dzień zacznie się lekko {emoji}", "{greet}, dobry post na poranek {emoji}", "{greet} {voc}, życzę dobrego dnia {emoji}", "{greet}, spokojnego poranka {emoji}", "{greet} {voc}, dobry początek dnia {emoji}", "{greet}, miłego poranka {emoji}"],
      ["{greet} {voc}, dobra energia tutaj {emoji}", "{greet}, niech dzień zacznie się lekko {emoji}", "{greet} {voc}, dobrego dnia {emoji}"],
      ["{greet} {voc}, mocny post i dzień dobry {emoji}", "{greet}, niech dziś będzie łagodnie {emoji}"]
    ),
    gn: side(
      ["Dobranoc", "GN", "Noc"],
      ["{greet} {voc}, odpocznij dobrze {emoji}", "{greet}, śpij dobrze {emoji}", "{greet} {voc}, spokojna noc {emoji}", "{greet}, dobry odpoczynek {emoji}", "{greet} {voc}, łagodne zamknięcie dnia {emoji}", "{greet}, niech noc będzie spokojna {emoji}"],
      ["{greet} {voc}, odpocznij dobrze {emoji}", "{greet}, spokojna noc {emoji}", "{greet}, dobry odpoczynek {emoji}"],
      ["{greet} {voc}, odpocznij i wróć mocny {emoji}", "{greet}, łagodne zamknięcie dnia {emoji}"]
    ),
  },
  id: {
    voc: VOC.id,
    gm: side(
      ["Selamat pagi", "GM", "Pagi"],
      ["{greet} {voc}, semoga hari mulai ringan {emoji}", "{greet}, posting bagus untuk pagi {emoji}", "{greet} {voc}, semoga harimu baik {emoji}", "{greet}, pagi yang tenang {emoji}", "{greet} {voc}, awal hari yang baik {emoji}", "{greet}, selamat pagi yang menyenangkan {emoji}"],
      ["{greet} {voc}, energi bagus di sini {emoji}", "{greet}, semoga hari mulai ringan {emoji}", "{greet} {voc}, semoga harimu baik {emoji}"],
      ["{greet} {voc}, posting kuat dan selamat pagi {emoji}", "{greet}, semoga hari ini lembut {emoji}"]
    ),
    gn: side(
      ["Selamat malam", "GN", "Malam"],
      ["{greet} {voc}, istirahat yang baik {emoji}", "{greet}, tidur nyenyak {emoji}", "{greet} {voc}, malam yang tenang {emoji}", "{greet}, semoga istirahatmu nyaman {emoji}", "{greet} {voc}, penutup hari yang lembut {emoji}", "{greet}, semoga malam ini tenang {emoji}"],
      ["{greet} {voc}, istirahat yang baik {emoji}", "{greet}, malam yang tenang {emoji}", "{greet}, semoga istirahatmu nyaman {emoji}"],
      ["{greet} {voc}, istirahat dan kembali kuat {emoji}", "{greet}, penutup hari yang lembut {emoji}"]
    ),
  },
  hi: {
    voc: VOC.hi,
    gm: side(
      ["सुप्रभात", "GM", "सुबह"],
      ["{greet} {voc}, दिन आसानी से शुरू हो {emoji}", "{greet}, सुबह के लिए अच्छा पोस्ट {emoji}", "{greet} {voc}, शुभ दिन की कामना {emoji}", "{greet}, शांत सुबह {emoji}", "{greet} {voc}, अच्छी शुरुआत {emoji}", "{greet}, सुप्रभात की शुभकामनाएँ {emoji}"],
      ["{greet} {voc}, अच्छी एनर्जी {emoji}", "{greet}, दिन आसानी से शुरू हो {emoji}", "{greet} {voc}, अच्छा दिन {emoji}"],
      ["{greet} {voc}, मजबूत पोस्ट और सुप्रभात {emoji}", "{greet}, आज का दिन सौम्य रहे {emoji}"]
    ),
    gn: side(
      ["शुभ रात्रि", "GN", "रात"],
      ["{greet} {voc}, अच्छे से आराम करो {emoji}", "{greet}, अच्छी नींद {emoji}", "{greet} {voc}, शांत रात {emoji}", "{greet}, आराम की रात {emoji}", "{greet} {voc}, दिन का हल्का अंत {emoji}", "{greet}, रात शांत रहे {emoji}"],
      ["{greet} {voc}, अच्छे से आराम करो {emoji}", "{greet}, रात शांत रहे {emoji}", "{greet}, आराम की रात {emoji}"],
      ["{greet} {voc}, आराम करो और ताज़गी से लौटो {emoji}", "{greet}, दिन का हल्का अंत {emoji}"]
    ),
  },
  ja: {
    voc: VOC.ja,
    gm: side(
      ["おはよう", "GM", "朝"],
      ["{greet} {voc}、穏やかな一日になりますように {emoji}", "{greet}、朝にぴったりのいい投稿 {emoji}", "{greet} {voc}、良い一日を {emoji}", "{greet}、静かな朝を {emoji}", "{greet} {voc}、いい一日の始まりを {emoji}", "{greet}、素敵な朝を {emoji}"],
      ["{greet} {voc}、いい感じの投稿 {emoji}", "{greet}、穏やかな一日になりますように {emoji}", "{greet} {voc}、良い一日を {emoji}"],
      ["{greet} {voc}、いい投稿とおはよう {emoji}", "{greet}、今日もやさしい一日を {emoji}"]
    ),
    gn: side(
      ["おやすみ", "GN", "夜"],
      ["{greet} {voc}、ゆっくり休んで {emoji}", "{greet}、ぐっすり休んで {emoji}", "{greet} {voc}、静かな夜を {emoji}", "{greet}、良い休息を {emoji}", "{greet} {voc}、やさしく一日を閉じて {emoji}", "{greet}、穏やかな夜を {emoji}"],
      ["{greet} {voc}、ゆっくり休んで {emoji}", "{greet}、静かな夜を {emoji}", "{greet}、良い休息を {emoji}"],
      ["{greet} {voc}、休んで元気に戻って {emoji}", "{greet}、やさしく一日を閉じて {emoji}"]
    ),
  },
  zh: {
    voc: VOC.zh,
    gm: side(
      ["早上好", "GM", "早安"],
      ["{greet} {voc}，愿今天轻松开始 {emoji}", "{greet}，早晨的好帖 {emoji}", "{greet} {voc}，祝你有美好一天 {emoji}", "{greet}，安静的早晨 {emoji}", "{greet} {voc}，顺利开启今天 {emoji}", "{greet}，愿你有个好早晨 {emoji}"],
      ["{greet} {voc}，这条很有感觉 {emoji}", "{greet}，愿今天轻松开始 {emoji}", "{greet} {voc}，祝你有美好一天 {emoji}"],
      ["{greet} {voc}，好帖配好早晨 {emoji}", "{greet}，愿今天温柔一点 {emoji}"]
    ),
    gn: side(
      ["晚安", "GN", "夜里"],
      ["{greet} {voc}，好好休息 {emoji}", "{greet}，好梦 {emoji}", "{greet} {voc}，愿你今夜安稳 {emoji}", "{greet}，晚安好眠 {emoji}", "{greet} {voc}，温柔结束今天 {emoji}", "{greet}，平静的夜晚 {emoji}"],
      ["{greet} {voc}，好好休息 {emoji}", "{greet}，愿你今夜安稳 {emoji}", "{greet}，晚安好眠 {emoji}"],
      ["{greet} {voc}，休息好再精神回来 {emoji}", "{greet}，温柔结束今天 {emoji}"]
    ),
  },
};

export function getLocalizedBank(lang, kind, familyKey) {
  const pack = LANG_PACKS[lang];
  if (!pack) return null;
  const sidePack = pack[kind];
  if (!sidePack) return null;
  return {
    greet: sidePack.greet,
    min: sidePack.min,
    mid: sidePack.mid,
    max: sidePack.max,
    vocatives: pack.voc,
    familyKey,
  };
}
