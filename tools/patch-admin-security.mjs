import fs from "node:fs";

const file = "index.js";
let s = fs.readFileSync(file, "utf8");

function replaceOnce(find, repl, label) {
  const i = s.indexOf(find);
  if (i < 0) throw new Error("Missing pattern: " + label);
  const j = s.indexOf(find, i + 1);
  if (j >= 0) throw new Error("Ambiguous pattern (multiple matches): " + label);
  s = s.replace(find, repl);
}

// 1) Admin password fallback: ONLY in DEV_MODE (never in production)
replaceOnce(
  'const ADMIN_PASSWORD = RAW_ADMIN_PASSWORD || (!IS_RENDER\n  ? ((RAW_ADMIN_SECRET && RAW_ADMIN_SECRET !== "CHANGE_ME_ADMIN_SECRET") ? RAW_ADMIN_SECRET : "admin")\n  : ""\n);\n',
  '// In production (NODE_ENV=production) we REQUIRE explicit ADMIN_PASSWORD.\nconst ADMIN_PASSWORD = RAW_ADMIN_PASSWORD || (DEV_MODE\n  ? ((RAW_ADMIN_SECRET && RAW_ADMIN_SECRET !== "CHANGE_ME_ADMIN_SECRET") ? RAW_ADMIN_SECRET : "admin")\n  : ""\n);\n',
  "ADMIN_PASSWORD block"
);

// 2) Admin login: only the configured admin handle can login
replaceOnce(
  '    const handle = req.user?.handle || null;\n    \n    const pw = String(req.body?.password || "").trim();\n',
  '    const handle = req.user?.handle || null;\n    if (!handle || !isAdminHandle(handle)) {\n      return res.status(403).json({ ok:false, error:"forbidden" });\n    }\n\n    const pw = String(req.body?.password || "").trim();\n',
  "admin login handle gate"
);

// 3) requireAdmin: allow X-Admin-Token without user auth ONLY in DEV_MODE
replaceOnce(
  '    // First: allow admin session token without user auth (useful for local/dev admin panel).\n    const at0 = getAdminToken(req);\n    if (at0){\n',
  '    // First: allow admin session token without user auth (useful for local/dev admin panel)  DEV ONLY.\n    const at0 = getAdminToken(req);\n    if (DEV_MODE && at0){\n',
  "requireAdmin dev-only admin token"
);

fs.writeFileSync(file, s, "utf8");
console.log("OK: patched index.js (admin security).");