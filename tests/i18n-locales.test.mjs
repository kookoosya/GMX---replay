import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, "..", "shared", "i18n", "locales");
const enPath = path.join(localesDir, "en.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("all locales include every EN top-level key", () => {
  const en = readJson(enPath);
  const enKeys = Object.keys(en);
  const localeFiles = fs
    .readdirSync(localesDir)
    .filter((name) => name.endsWith(".json") && name !== "en.json");

  for (const localeFile of localeFiles) {
    const locale = readJson(path.join(localesDir, localeFile));
    const missingKeys = enKeys.filter((key) => !(key in locale));
    assert.deepEqual(
      missingKeys,
      [],
      `${localeFile} is missing keys: ${missingKeys.join(", ")}`
    );
  }
});
