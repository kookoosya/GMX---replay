/**
 * Shared loader for client-manifest.json (sync lists, script order).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifestPath = path.join(root, "client-manifest.json");

let cached = null;

export function loadClientManifest() {
  if (cached) return cached;
  if (!fs.existsSync(manifestPath)) {
    throw new Error("client-manifest.json missing — run: node tools/generate-client-manifest.mjs");
  }
  cached = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return cached;
}

export function getSyncFiles() {
  const { syncFiles } = loadClientManifest();
  if (!Array.isArray(syncFiles) || !syncFiles.length) {
    throw new Error("client-manifest.json: syncFiles is empty");
  }
  return syncFiles;
}

export function getScriptOrder() {
  const { scriptOrder } = loadClientManifest();
  return Array.isArray(scriptOrder) ? scriptOrder : [];
}

export const CLIENT_MANIFEST_PATH = manifestPath;
