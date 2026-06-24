# Legacy tooling (archived)

Production deploy is **Render only** (`https://www.gmxreply.com`). See `DEPLOY.md`.

## VPS SSH deploy (obsolete)

`deploy-vps.mjs` — one-time migration / disaster-recovery only. Requires `ssh2` devDependency.

```bash
# Blocked by default — use explicit opt-in:
npm run deploy:legacy:probe
npm run deploy:legacy:setup
npm run deploy:legacy:vps
npm run deploy:legacy:ssl
```

Or manually:

```bash
DEPLOY_VPS_ALLOW=1 DEPLOY_SSH_PASSWORD=*** node tools/legacy/deploy-vps.mjs probe
```

`npm run deploy:vps` (and `deploy:probe`, `deploy:setup`, `deploy:ssl`) exit with instructions to use Render.
