# site-src

Canonical source for `/public/app.js`. Built with:

```bash
npm run build:site
```

## Parts (manifest order)

| Part | Role |
|------|------|
| `00-bootstrap.js` | API origin, unlock constants, `ASSET_REV` |
| `02-ui-performance-helpers.js` | Chunked render, lazy images |
| `03-lightweight-client-logs-for-support.js` | Logs, clean-fill, custom bg helpers, `TAB_THEME` |
| `03-wallpapers-engine.js` | Wallpaper catalog, `gmxWallLayer`, ext wallpapers |
| `04-themes-catalog.js` | Theme definitions |
| `04-themes-render-ui.js` | Theme/wallpaper grids |
| `04-app-chrome-usage.js` | Tab chrome, `setBg`, packs |
| `05-lists-*.js` | Saved banks, list UI |
| `06-best-pick-*.js` | Best pass scoring |
| `06-generate-engine.js` | `/api/generate` client |
| `07`–`12` | Leaderboard, prediction, referrals, wallet, admin, redeem |
| `13-site-i18n.js` | `siteTr`, `applyLang`, boot, event bindings |
| `13-connect.js` | Connect / reset handlers |

Split a part:

```bash
node tools/split-site-part.mjs <file.js> <firstLineOfNew> <new-file.js>
npm run build:site
```
