import fs from 'fs';
import path from 'path';

const root = process.cwd();
const localeDir = path.join(root, 'shared/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));
const propagateKeys = [
  'h_freepro_2',
  'gm_pro_2',
  'gn_pro_2',
  'gm_lang_tabs_note',
  'gn_lang_tabs_note',
  'gm_right_list',
  'gn_right_list',
  'h_guide'
];
for (const file of fs.readdirSync(localeDir)) {
  if (!file.endsWith('.json')) continue;
  const fp = path.join(localeDir, file);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  for (const key of propagateKeys) data[key] = en[key];
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
}

const appTsx = path.join(root, 'frontend/src/App.tsx');
let app = fs.readFileSync(appTsx, 'utf8');
app = app.replace(
  'Use /app for GM, GN, themes, and any screen that is still in legacy',
  'Use /app for GM, GN, themes, wallpapers, and the main reply workspace'
);
app = app.replace(
  '5. Open /app for GM, GN, themes, wallpapers, and the tabs that still live there',
  '5. Open /app for GM, GN, themes, wallpapers, and the main reply workspace'
);
fs.writeFileSync(appTsx, app);

const bridgeTs = path.join(root, 'frontend/src/bridgeI18n.ts');
let bridge = fs.readFileSync(bridgeTs, 'utf8');
bridge = bridge.replace(
  'const BRIDGE_COPY: Record<string, CopyMap> = {',
  'const SHARED_SAFE_COPY: CopyMap = {\n' +
  '  accountCenterSub: "Use this area for access, referrals, and admin. Use /app for GM, GN, themes, wallpapers, and the main reply workspace.",\n' +
  '  overviewLegacyApp: "Use /app for GM, GN, themes, wallpapers, and the main reply workspace",\n' +
  '  startStep4: "4. Open /app for GM, GN, themes, wallpapers, and the main reply workspace",\n' +
  '};\n\n' +
  'const BRIDGE_COPY: Record<string, CopyMap> = {'
);
if (!bridge.includes('Object.keys(BRIDGE_COPY).forEach')) {
  bridge += '\n\nObject.keys(BRIDGE_COPY).forEach((lang) => {\n  BRIDGE_COPY[lang] = { ...BRIDGE_COPY[lang], ...SHARED_SAFE_COPY };\n});\n';
}
fs.writeFileSync(bridgeTs, bridge);

const popupJs = path.join(root, 'extension/popup.js');
let popup = fs.readFileSync(popupJs, 'utf8');
popup = popup.replace('`${state.base || DEFAULT_BASE}/arcade`', '`${state.base || DEFAULT_BASE}/arcade.html`');
fs.writeFileSync(popupJs, popup);

