import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const frontendDir = path.join(repoRoot, "frontend");

const viteBin = path.join(frontendDir, "node_modules", "vite", "bin", "vite.js");
try { fs.accessSync(viteBin); } catch {
  console.error("[dev:frontend] Vite not found. Run: npm --prefix frontend install");
  process.exit(1);
}

const PORT = process.env.GMX_FRONTEND_PORT || "5173";

const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
  cwd: frontendDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "development",
    GMX_BACKEND_URL: process.env.GMX_BACKEND_URL || "http://127.0.0.1:10000",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
