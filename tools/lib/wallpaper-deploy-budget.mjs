/** Static deploy budget helpers for wallpaper rollout RCA. */
import { execSync } from "node:child_process";

export const WALLPAPER_DEPLOY_BUDGET_BYTES = 50 * 1024 * 1024;
export const WALLPAPER_PACK_DEPLOY_BUDGET_BYTES = 25 * 1024 * 1024;

export function sumGitTreeBytes(sha, prefix) {
  const lines = execSync(`git ls-tree -r -l ${sha} -- ${prefix}`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  let bytes = 0;
  let files = 0;
  for (const line of lines) {
    const m = line.match(/\s(\d+)\t/);
    if (!m) continue;
    bytes += Number(m[1]);
    files++;
  }
  return { files, bytes };
}

export function wallpaperDeployFootprint(sha) {
  const wp = sumGitTreeBytes(sha, "assets/wallpapers");
  const extSkins = sumGitTreeBytes(sha, "assets/extskins");
  const extLegacy = sumGitTreeBytes(sha, "assets/extbg");
  const extPkg = sumGitTreeBytes(sha, "extension/extskins");
  const extPkgLegacy = sumGitTreeBytes(sha, "extension/extbg");
  const extActive = extSkins.bytes > 0 ? extSkins : extLegacy;
  const extPkgActive = extPkg.bytes > 0 ? extPkg : extPkgLegacy;
  return {
    wallpapers: wp,
    extskins: extActive,
    extbgLegacy: extLegacy,
    extensionExtskins: extPkgActive,
    totalBytes: wp.bytes + extActive.bytes + extPkgActive.bytes,
  };
}
