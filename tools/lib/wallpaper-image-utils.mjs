/** Image scoring, hashing, and crop helpers for wallpaper pipeline. */
import crypto from "node:crypto";

const BANNED_ALT = [
  /\b(person|people|woman|man|girl|boy|face|portrait|selfie|model|businessman|businesswoman|crowd|wedding|family)\b/i,
  /\b(bitcoin|crypto|ethereum|blockchain|nft|token|coin|marvel|superhero|comic|dc comics|avengers|spiderman|batman)\b/i,
  /\b(logo|watermark|text|signage|billboard|advertisement|brand|mercedes|bmw|audi|ferrari|lamborghini)\b/i,
  /\b(laptop|office desk|meeting|doctor|nurse|teacher|student)\b/i,
];

export function altRejected(alt) {
  const s = String(alt || "");
  return BANNED_ALT.some((re) => re.test(s));
}

export function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

export async function computeDHash(sharp, buffer) {
  const { data } = await sharp(buffer)
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let hash = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      hash += data[y * 9 + x] < data[y * 9 + x + 1] ? "1" : "0";
    }
  }
  return hash;
}

export async function analyzeImage(sharp, buffer, apiDims) {
  const meta = await sharp(buffer).metadata();
  const w = apiDims?.width || meta.width || 0;
  const h = apiDims?.height || meta.height || 0;
  if (w < 1600 || h < 900) return null;

  const resized = await sharp(buffer).resize(320, 180, { fit: "inside" }).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { data, info } = resized;
  const pixels = info.width * info.height;
  let sum = 0;
  let sumSq = 0;
  const cx0 = Math.floor(info.width * 0.35);
  const cx1 = Math.ceil(info.width * 0.65);
  const cy0 = Math.floor(info.height * 0.35);
  const cy1 = Math.ceil(info.height * 0.65);
  let centerSum = 0;
  let centerN = 0;
  let edgeSum = 0;
  let edgeN = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
      const inCenter = x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1;
      if (inCenter) {
        centerSum += lum;
        centerN++;
      } else {
        edgeSum += lum;
        edgeN++;
      }
    }
  }

  const mean = sum / pixels;
  const variance = Math.max(0, sumSq / pixels - mean * mean);
  const contrast = Math.sqrt(variance);
  const centerMean = centerN ? centerSum / centerN : mean;
  const edgeMean = edgeN ? edgeSum / edgeN : mean;
  const centerCalm = Math.max(0, Math.min(5, 5 - Math.max(0, centerMean - edgeMean) / 18));

  const lap = await sharp(buffer)
    .resize(640, 360, { fit: "inside" })
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let lapSum = 0;
  for (let i = 0; i < lap.data.length; i++) lapSum += Math.abs(lap.data[i]);
  const sharpness = lapSum / lap.data.length;

  const dHash = await computeDHash(sharp, buffer);
  const exact = crypto.createHash("sha256").update(buffer).digest("hex");

  return {
    width: w,
    height: h,
    aspect: w / h,
    brightness: mean,
    contrast,
    centerMean,
    edgeMean,
    centerCalm,
    sharpness,
    dHash,
    exact,
  };
}

export function scoreCandidate(analysis, category) {
  if (!analysis) return null;
  const premium = Math.min(5, Math.max(2, 2 + analysis.contrast / 35 + analysis.sharpness / 25));
  const uiRead = Math.min(5, Math.max(2, analysis.centerCalm + 0.5));
  const edgeDetail = Math.min(5, Math.max(2, 2 + analysis.sharpness / 30));
  const landscape =
    analysis.aspect >= 1.45
      ? 4.5
      : analysis.aspect >= 1.25
        ? 4
        : analysis.aspect >= 1.1
          ? 3.5
          : 2.5;
  const portrait = Math.min(5, Math.max(3, analysis.height / analysis.width >= 0.5 ? 4 : 3.5));
  const colorBalance = Math.min(5, Math.max(2.5, 4.5 - Math.abs(analysis.brightness - 75) / 40));
  const originality = 4;
  const categoryFit = 4;
  const impact = Math.min(5, Math.max(2.5, (premium + edgeDetail + colorBalance) / 3));

  const scores = {
    impact,
    premium,
    uiRead,
    centerCalm: Math.min(5, Math.max(2, analysis.centerCalm + 0.75)),
    edgeDetail,
    landscape,
    portrait,
    colorBalance,
    originality,
    categoryFit,
  };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const min = Math.min(...Object.values(scores));
  if (min < 2 || total < 28) return null;
  return { total, min, scores };
}

export async function encodeWebpUnderBudget(sharp, pipeline, maxBytes, startQ = 82) {
  let q = startQ;
  for (let pass = 0; pass < 10; pass++) {
    const buf = await pipeline.clone().webp({ quality: q, effort: 4 }).toBuffer();
    if (buf.length <= maxBytes || q <= 52) return buf;
    q -= 3;
  }
  return pipeline.clone().webp({ quality: 52, effort: 4 }).toBuffer();
}
