#!/usr/bin/env node
/**
 * Import user wallpapers as preset replacements (free01, free02, w01-w58).
 *
 * Usage:
 *   node tools/import-preset-wallpapers.mjs [source-dir]
 *
 * Default source: assets/wallpapers-import/
 *
 * Put up to 160 images (PNG, JPG, WEBP) in the source folder.
 * Order: 1=free01, 2=free02, 3=w01, 4=w02, ... 160=w158.
 * They will be copied to assets/wallpapers/ with matching ids.
 *
 * Keeps original extension; renames to .png for consistency if needed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;
const DEST_DIR = path.join(ROOT, "assets", "wallpapers");
const DEFAULT_SOURCE = path.join(ROOT, "обои");

const PRESET_IDS = ["free01", "free02", ...Array.from({ length: 158 }, (_, i) => `w${String(i + 1).padStart(2, "0")}`)];

function findImages(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...findImages(full).map((f) => path.join(e.name, f)));
    } else if (IMAGE_EXT.test(e.name)) {
      files.push(e.name);
    }
  }
  return files.sort();
}

function main() {
  const useSelection = process.argv.includes("--from-selection");
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  let sourceDir = args[0] ? path.resolve(args[0]) : DEFAULT_SOURCE;
  sourceDir = path.isAbsolute(sourceDir) ? sourceDir : path.join(process.cwd(), sourceDir);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    fs.mkdirSync(sourceDir, { recursive: true });
    const readme = path.join(sourceDir, "README.txt");
    fs.writeFileSync(readme, `Put wallpaper images here (.png, .jpg, .webp).
Order: 1=free01, 2=free02, 3=w01, ... up to 160=w158.
Then run: node tools/audit-wallpapers.mjs  (audit)
         node tools/import-preset-wallpapers.mjs --from-selection  (import selection)
`, "utf8");
    console.log("Created folder:", sourceDir);
    console.log("Put your wallpaper images there. Run audit then import.");
    process.exit(0);
  }

  let images;
  if (useSelection) {
    const selPath = path.join(__dirname, "wallpaper-selection.json");
    if (!fs.existsSync(selPath)) {
      console.error("Run audit first: node tools/audit-wallpapers.mjs");
      process.exit(1);
    }
    images = JSON.parse(fs.readFileSync(selPath, "utf8"));
    const allInDir = new Set(findImages(sourceDir));
    images = images.filter((f) => allInDir.has(f));
    if (images.length < 160) console.warn("Warning: selection has", images.length, "files (need 160 for full pack)");
    console.log("Using selection:", images.length, "images");
  } else {
    images = findImages(sourceDir);
  }
  if (!images.length) {
    console.log("No images found in", sourceDir);
    process.exit(1);
  }

  if (images.length < 160) {
    console.warn("Warning: found", images.length, "images (full pack = 160). Will use as many as available.");
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const NAME_MAP = {
    "1": "Wall 1", "2": "Wall 2", "3": "Wall 3", "4": "Wall 4", "5": "Wall 5", "6": "Wall 6", "7": "Wall 7", "8": "Wall 8", "9": "Wall 9",
    "10": "Wall 10", "11": "Wall 11", "12": "Wall 12", "13": "Wall 13", "14": "Wall 14", "15": "Wall 15", "16": "Wall 16", "17": "Wall 17", "18": "Wall 18", "19": "Wall 19",
    "20": "Wall 20", "21": "Wall 21", "22": "Wall 22", "23": "Wall 23", "24": "Wall 24", "25": "Wall 25", "26": "Wall 26", "27": "Wall 27", "28": "Wall 28", "29": "Wall 29",
    "30": "Wall 30", "31": "Wall 31", "32": "Wall 32", "33": "Wall 33", "34": "Wall 34", "35": "Wall 35", "36": "Wall 36", "37": "Wall 37", "38": "Wall 38", "39": "Wall 39",
    "40": "Wall 40", "41": "Wall 41", "42": "Wall 42", "43": "Wall 43", "44": "Wall 44", "45": "Wall 45", "46": "Wall 46", "47": "Wall 47", "48": "Wall 48", "49": "Wall 49",
    "50": "Wall 50", "51": "Wall 51", "52": "Wall 52", "53": "Wall 53", "54": "Wall 54", "55": "Wall 55",
    "114776-teplo-apelsin-plamya-ogon-bitkoin-1920x1080": "Bitcoin Flame",
    "149410-hvojnymi_lesami-prirodnyj_landshaft-starovozrastnye_lesa-kriptovalyuta-doroga-2560x1440": "Forest Road",
    "1678820770_bogatyr-club-p-kripto-fon-foni-pinterest-4": "Crypto",
    "1678820779_bogatyr-club-p-kripto-fon-foni-pinterest-24": "Crypto 2",
    "1678820787_bogatyr-club-p-kripto-fon-foni-pinterest-34": "Crypto 3",
    "1678820794_bogatyr-club-p-kripto-fon-foni-pinterest-1": "Crypto 4",
    "1678820811_bogatyr-club-p-kripto-fon-foni-pinterest-59": "Crypto 5",
    "1678820817_bogatyr-club-p-kripto-fon-foni-pinterest-8": "Crypto 6",
    "1678820825_bogatyr-club-p-kripto-fon-foni-pinterest-38": "Crypto 7",
    "1744137072_bart_simpson_25-20250408212415-ffffffc367272707": "Bart Simpson",
    "1777-adob_fotoshop-gorizont-arktika-noch-more-1920x1080": "Arctic Night",
    "20842-blokchejn-tor-proekt-zemlya-astronomicheskij_obekt-1920x1080": "Blockchain Space",
    "86813-blokchejn-gorod-noch-stolica-gorodok-1920x1080": "Blockchain City",
    "88625-noch-otrazhenie-gorodskoj_rajon-orientir-gorizont-2560x1440": "City Night",
    "1424963": "Abstract", "3412756": "Tech", "4578700": "Digital", "4578724": "Neon", "4578739": "Glow", "4578760": "Blue", "4578834": "Purple",
    "img1.akspic.ru-gorodskoj_pejzazh-iskusstvennyj_ostrov-liniya_gorizonta-metropoliya-s_vysoty_ptichego_poleta-2560x1440": "City Skyline",
    "img2.akspic.ru-bitkoin-efiriuma-temnota-biznes-voda-3000x1750": "Bitcoin Ethereum",
    "img3.akspic.ru-sinij_cvet-lazer-informaciya-liniya-biznes-2560x1600": "Laser Blue",
    "panorama_3519309": "Panorama",
    "pexels_brandon_james": "Nature",
    "pexels_tal_molcho": "Landscape",
    "svoya_priroda01": "Nature 1", "svoya_priroda02": "Nature 2", "svoya_priroda03": "Nature 3", "svoya_priroda04": "Nature 4", "svoya_priroda05": "Nature 5",
    "svoya_priroda06": "Nature 6", "svoya_priroda07": "Nature 7", "svoya_priroda08": "Nature 8", "svoya_priroda09": "Nature 9", "svoya_priroda10": "Nature 10",
    "svoya_priroda11": "Nature 11", "svoya_priroda12": "Nature 12", "svoya_priroda13": "Nature 13", "svoya_priroda14": "Nature 14", "svoya_priroda15": "Nature 15",
    "svoya_priroda16": "Nature 16", "svoya_priroda17": "Nature 17", "svoya_priroda18": "Nature 18",
    "svoya_priroda_19": "Nature 19", "svoya_priroda_20": "Nature 20",
    "wallhaven-rqyw7q": "Abstract",
    "Bitcoin_биткойн_BTC": "Bitcoin", "бизнес_биткойн_валюта": "Business", "деньги_биткойн_криптовалюта": "Crypto", "деньги_экономика_финансы_доллар": "Finance",
    "мопс_собака_порода_собаки": "Dog",
    "100-abundance-achievement-bank": "Abundance", "10141-3000x2001-desktop-hd-metaverse-wallpaper-image": "Metaverse",
    "10222-1920x1080-desktop-1080p-metaverse-wallpaper": "Metaverse City", "102610-3840x2160-desktop-4k-nft-background": "NFT 4K",
    "102665-1920x1080-desktop-full-hd-nft-wallpaper-photo": "NFT", "10269-3840x2160-desktop-4k-metaverse-background-photo": "Metaverse 4K",
    "103124-3840x2160-desktop-4k-nft-wallpaper-photo": "NFT Wallpaper", "10329-3240x2160-desktop-hd-metaverse-background": "Metaverse HD",
    "10386-1920x1080-desktop-full-hd-cryptovoxels-background-photo": "Cryptovoxels", "10470-1920x1080-desktop-1080p-cryptovoxels-background": "Cryptovoxels City",
    "1302168-3840x2160-desktop-4k-anime-wallpaper-image": "Anime 4K", "1302353-3840x2160-desktop-4k-anime-background-image": "Anime",
    "1302511-3840x2160-desktop-4k-anime-background": "Anime BG", "140909-3840x2160-desktop-4k-naruto-wallpaper": "Naruto",
    "141742-3840x2160-desktop-4k-naruto-wallpaper-photo": "Naruto 4K", "142813-2560x1350-desktop-hd-dragon-ball-z-wallpaper-image": "Dragon Ball Z",
    "143520-3840x2160-desktop-4k-dragon-ball-z-wallpaper-photo": "Dragon Ball", "143566-3840x2160-desktop-4k-dragon-ball-z-wallpaper": "Goku",
    "182832-2339x1654-desktop-hd-demon-slayer-kimetsu-no-yaiba-wallpaper-photo": "Demon Slayer", "182991-2560x1440-desktop-hd-demon-slayer-kimetsu-no-yaiba-background-image": "Demon Slayer HD",
    "3d-rendering-bitcoin-sign-purple-background": "Bitcoin 3D", "41913-3840x2160-desktop-4k-lego-background-photo": "Lego 4K",
    "44464-3840x2160-desktop-4k-bitcoin-wallpaper-image": "Bitcoin 4K", "44869-1920x1080-desktop-full-hd-nft-background": "NFT Full HD",
    "44880-2560x1493-desktop-hd-nft-wallpaper": "NFT HD", "66306-3072x1920-desktop-hd-lego-background-image": "Lego",
    "84803-2000x1333-desktop-hd-metaverse-background": "Metaverse", "anime-anime-girls-mask-simple-background-hd-wallpaper-thumb": "Anime Mask",
    "anime-sharingan-red-eyes-naruto-shippuuden-wallpaper-thumb": "Sharingan", "artwork-landscape-sky-mountains-wallpaper-thumb": "Landscape",
    "astronaut-space-black-background-artwork-hd-wallpaper-thumb": "Astronaut", "baby-groot-4k-hd-superheroes-wallpaper-thumb": "Baby Groot",
    "bitcoin-cash-coins-computer-wallpaper-preview": "Bitcoin Cash", "bitcoin-cryptocurrency-blockchain-technology-background_115579-826": "Bitcoin",
    "bleach-anime-uzumaki-naruto-gon-cs-rurouni-kennshin-hd-wallpaper-thumb": "Bleach", "blockchain-technology-smart-bitcoin": "Blockchain",
    "blogger-icon-line-connection-circuit-board": "Network", "breaking-bad-walter-white-heisenberg-bryan-cranston-wallpaper-preview": "Breaking Bad",
    "business-cafe-coffee-drinking": "Cafe", "cat-glasses-space-abstract-wallpaper-thumb": "Cat Space",
    "closeup-golden-bitcoin-pink-blue-reflective-surface-histogram": "Bitcoin Gold", "coins-disney-scrooge-mcduck-ducktales-wallpaper-preview": "Scrooge McDuck",
    "digital-art-neon-mountains-lake-wallpaper-thumb": "Neon Mountains", "digital-art-son-goku-dragon-ball-dragon-ball-z-island-hd-wallpaper-thumb": "Goku Island",
    "digital-digital-art-artwork-city-lights-hd-wallpaper-thumb": "City Lights", "digital-digital-art-artwork-fantasy-art-drawing-hd-wallpaper-thumb": "Fantasy",
    "digital-digital-art-artwork-illustration-drawing-hd-wallpaper-thumb": "Digital Art", "fantasy-art-warrior-dark-souls-iii-dark-souls-wallpaper-thumb": "Dark Souls",
    "financial-chart-with-moving-up-arrow-graph-bitcoin-cryptocurrency-technology-background-vector_116849-2692": "Financial Chart",
    "futuristic-crypto-currency-technology-concept-handdrawn-illustration_1332465-35837": "Crypto Future",
    "joaquin-phoenix-joker-batman-joker-2019-movie-dark-hd-wallpaper-thumb": "Joker", "joker-black-dc-comics-batman-joaquin-phoenix-hd-wallpaper-thumb": "Joker Dark",
    "k81776": "Abstract", "landscape-anime-digital-art-fantasy-art-wallpaper-thumb": "Anime Landscape",
    "man-trading-browsing-online-stock-investments-night": "Trading", "mlzoy1": "Abstract 2",
    "movie-avengers-infinity-war-black-panther-movie-black-widow-wallpaper-thumb": "Avengers",
    "night-artwork-futuristic-city-cyberpunk-wallpaper-thumb": "Cyberpunk", "one-piece-monkey-d-luffy-hd-wallpaper-thumb": "One Piece",
    "rick-and-morty-vector-graphics-car-rainbows-wallpaper-preview": "Rick and Morty",
    "—Pngtree—tether or usdt black gold_8925508": "USDT",
  };
  function filenameToName(f) {
    const base = path.basename(f, path.extname(f));
    if (NAME_MAP[base]) return NAME_MAP[base];
    const clean = base.replace(/^\d+[-_]/g, "").replace(/-?\d+x\d+$/i, "").replace(/[-_]+/g, " ");
    const words = clean.split(/\s+/).filter(Boolean).slice(0, 2);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || base || "Wall";
  }

  const manifest = {};
  const names = {};
  let n = 0;
  const used = Math.min(images.length, PRESET_IDS.length);
  for (let i = 0; i < used; i++) {
    const id = PRESET_IDS[i];
    const srcPath = path.join(sourceDir, images[i]);
    const ext = path.extname(images[i]).toLowerCase();
    const destName = id + (ext === ".png" ? ".png" : ext === ".webp" ? ".webp" : ".jpg");
    const destPath = path.join(DEST_DIR, destName);
    try {
      fs.copyFileSync(srcPath, destPath);
      manifest[id] = destName;
      names[id] = filenameToName(images[i]);
      n++;
      console.log(n, images[i], "->", destName, "(" + names[id] + ")");
    } catch (err) {
      console.error("Failed:", images[i], err.message);
    }
  }
  const manifestPath = path.join(DEST_DIR, "preset-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0), "utf8");
  const namesPath = path.join(DEST_DIR, "preset-names.json");
  fs.writeFileSync(namesPath, JSON.stringify(names, null, 0), "utf8");
  console.log("Done. Imported", n, "preset wallpapers. Manifest:", manifestPath);
  spawnSync(process.execPath, [path.join(__dirname, "generate-wallpaper-thumbs.mjs")], { stdio: "inherit", cwd: ROOT });
  spawnSync(process.execPath, [path.join(__dirname, "prune-wallpaper-assets.mjs")], { stdio: "inherit", cwd: ROOT });
  spawnSync(process.execPath, [path.join(__dirname, "sync-ext-wallpapers.mjs")], { stdio: "inherit", cwd: ROOT });
}

main();
