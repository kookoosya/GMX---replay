#!/usr/bin/env node
/**
 * Deploy GMXReply to VPS via SSH.
 *
 * Usage:
 *   DEPLOY_SSH_HOST=root@192.210.213.135 DEPLOY_SSH_PASSWORD=*** node tools/deploy-vps.mjs probe
 *   DEPLOY_SSH_HOST=root@192.210.213.135 DEPLOY_SSH_PASSWORD=*** node tools/deploy-vps.mjs setup
 *   DEPLOY_SSH_HOST=root@192.210.213.135 DEPLOY_SSH_PASSWORD=*** node tools/deploy-vps.mjs deploy
 *
 * First-time: setup (installs Node 22, pm2, clones repo, nginx, certbot).
 * Env on server: DEPLOY_ADMIN_PASSWORD (app admin), optional DEPLOY_GIT_URL.
 */
import { Client } from "ssh2";

const action = process.argv[2] || "probe";
const hostSpec = process.env.DEPLOY_SSH_HOST || "root@192.210.213.135";
const password = process.env.DEPLOY_SSH_PASSWORD || "";
const port = Number(process.env.DEPLOY_SSH_PORT || 22);
const appDirEnv = process.env.DEPLOY_APP_DIR || "";
const defaultAppDir = "/var/www/gmxreply";
const gitUrl = process.env.DEPLOY_GIT_URL || "https://github.com/kookoosya/GMX---replay.git";
const adminPassword = process.env.DEPLOY_ADMIN_PASSWORD || "";

const m = hostSpec.match(/^(?:(.+?)@)?([^:]+)$/);
const username = m?.[1] || "root";
const host = m?.[2] || hostSpec;

function exec(conn, command, { timeoutMs = 600_000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout: ${command.slice(0, 80)}`)), timeoutMs);
    conn.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timer);
        reject(err);
        return;
      }
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code) => {
          clearTimeout(timer);
          if (code !== 0) {
            reject(new Error(`exit ${code}: ${stderr || stdout || command}`));
            return;
          }
          resolve({ stdout, stderr });
        })
        .on("data", (d) => {
          const s = d.toString();
          stdout += s;
          process.stdout.write(s);
        })
        .stderr.on("data", (d) => {
          const s = d.toString();
          stderr += s;
          process.stderr.write(s);
        });
    });
  });
}

function connect() {
  return new Promise((resolve, reject) => {
    if (!password) {
      reject(new Error("DEPLOY_SSH_PASSWORD is required"));
      return;
    }
    const conn = new Client();
    conn
      .on("ready", () => resolve(conn))
      .on("error", reject)
      .connect({ host, port, username, password, readyTimeout: 20_000 });
  });
}

async function detectAppDir(conn) {
  if (appDirEnv) return appDirEnv;
  const candidates = [
    defaultAppDir,
    "/var/www/GMX---replay",
    "/root/GMX---replay",
    "/opt/gmxreply",
  ];
  for (const dir of candidates) {
    try {
      await exec(conn, `test -f ${dir}/package.json && echo OK`, { timeoutMs: 15_000 });
      return dir;
    } catch {
      /* try next */
    }
  }
  try {
    const { stdout } = await exec(
      conn,
      "find /var/www /root /opt -maxdepth 3 -name package.json 2>/dev/null | xargs -I{} dirname {} | while read d; do test -f \"$d/index.js\" && echo \"$d\"; done | head -1",
      { timeoutMs: 30_000 }
    );
    const found = stdout.trim().split("\n").filter(Boolean)[0];
    if (found) return found;
  } catch {
    /* fall through */
  }
  throw new Error(`Could not find app dir — run: node tools/deploy-vps.mjs setup (or set DEPLOY_APP_DIR)`);
}

async function probe(conn) {
  await exec(conn, "uname -a; node -v 2>/dev/null || echo 'node missing'; pm2 -v 2>/dev/null || echo 'pm2 missing'; git --version 2>/dev/null || echo 'git missing'");
  try {
    const dir = await detectAppDir(conn);
    console.log(`\n[deploy] APP_DIR=${dir}\n`);
    await exec(conn, `cd ${dir} && pwd && git remote -v 2>/dev/null || true && git log -1 --oneline 2>/dev/null || true && pm2 list 2>/dev/null || true`);
    return dir;
  } catch (e) {
    console.log(`\n[deploy] App not installed yet. Run: npm run deploy:setup\n`);
    throw e;
  }
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\"'\"'`)}'`;
}

async function setup(conn) {
  if (!adminPassword) {
    throw new Error("DEPLOY_ADMIN_PASSWORD is required for setup (app ADMIN_PASSWORD)");
  }
  const dir = defaultAppDir;
  const adminQ = shellQuote(adminPassword);
  const script = `
set -e
export DEBIAN_FRONTEND=noninteractive
echo "== Node.js 22 =="
if ! command -v node >/dev/null || ! node -v | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs build-essential python3
fi
node -v
npm -v
echo "== pm2 =="
if ! command -v pm2 >/dev/null; then
  npm install -g pm2
fi
echo "== clone =="
mkdir -p ${dir}
if [ ! -d ${dir}/.git ]; then
  git clone ${gitUrl} ${dir}
else
  cd ${dir} && git fetch origin main && git reset --hard origin/main
fi
cd ${dir}
mkdir -p data logs
if [ ! -f .env ]; then
  cat > .env << EOF
NODE_ENV=production
PORT=10000
TRUST_PROXY=1
ADMIN_PASSWORD=${adminPassword}
DB_PATH=${dir}/data/data.sqlite
ALLOWED_ORIGINS=https://www.gmxreply.com,https://gmxreply.com
EOF
  chmod 600 .env
fi
echo "== install + build =="
npm ci
npm ci --prefix frontend
npm run build
echo "== pm2 =="
pm2 delete gmxreply-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true
echo "== nginx =="
cat > /etc/nginx/sites-available/gmxreply << 'NGX'
server {
    listen 80;
    server_name gmxreply.com www.gmxreply.com;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:10000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGX
ln -sf /etc/nginx/sites-available/gmxreply /etc/nginx/sites-enabled/gmxreply
nginx -t
systemctl reload nginx
sleep 2
curl -sf http://127.0.0.1:10000/api/health && echo ""
echo "SETUP_OK"
`.trim();
  await exec(conn, script, { timeoutMs: 1_800_000 });
}

async function deploy(conn) {
  const dir = await detectAppDir(conn);
  console.log(`\n[deploy] deploying in ${dir}\n`);
  const script = `
set -e
cd ${dir}
echo "== git pull =="
git fetch origin main && git reset --hard origin/main
echo "== install =="
npm ci
npm ci --prefix frontend
echo "== build =="
npm run build
echo "== restart =="
if command -v pm2 >/dev/null; then
  pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
  pm2 save || true
else
  pkill -f 'node index.js' 2>/dev/null || true
  nohup node index.js > logs/app.log 2>&1 &
fi
sleep 2
curl -sf http://127.0.0.1:10000/api/health || curl -sf http://127.0.0.1:${process.env.PORT || 10000}/api/health || echo "health check failed"
echo "DEPLOY_OK"
`.trim();
  await exec(conn, script, { timeoutMs: 900_000 });
}

const conn = await connect();
try {
  if (action === "probe") {
    await probe(conn);
  } else if (action === "setup") {
    await setup(conn);
  } else if (action === "deploy") {
    await deploy(conn);
  } else {
    console.error(`Unknown action: ${action} (use probe|setup|deploy)`);
    process.exit(1);
  }
} finally {
  conn.end();
}
