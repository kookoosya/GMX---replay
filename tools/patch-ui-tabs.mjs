import fs from "node:fs";
import path from "node:path";

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("[OK] " + file);
}

const appTsx = `import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { TopNav } from "./components/TopNav";

import { HomePage } from "./pages/HomePage";
import { GMPage } from "./pages/GMPage";
import { GNPage } from "./pages/GNPage";
import { ReferralsPage } from "./pages/ReferralsPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ThemesPage } from "./pages/ThemesPage";
import { ExtensionThemesPage } from "./pages/ExtensionThemesPage";
import { UpgradeProPage } from "./pages/UpgradeProPage";
import { AdminPage } from "./pages/AdminPage";

function getConnectedHandle() {
  const w = window;
  const candidates = [
    localStorage.getItem("x_handle"),
    localStorage.getItem("xHandle"),
    localStorage.getItem("handle"),
    localStorage.getItem("twitter_handle"),
    localStorage.getItem("twitterHandle"),
    w?.GMX_REPLY_USER?.handle,
    w?.user?.handle,
    w?.user?.twitterHandle,
  ].filter(Boolean);

  return String(candidates[0] || "");
}

function isAdminHandle(handle) {
  const h = String(handle || "").trim().replace(/^@/, "").toLowerCase();
  return h === "kristofer_sol_" || h === "kristofer_sol";
}

export default function App() {
  const connectedHandle = getConnectedHandle();
  const isAdmin = isAdminHandle(connectedHandle);

  return (
    <div className="appShell">
      <TopNav isAdmin={isAdmin} />
      <main className="pageShell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gm" element={<GMPage />} />
          <Route path="/gn" element={<GNPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/extension-themes" element={<ExtensionThemesPage />} />
          <Route path="/upgrade-pro" element={<UpgradeProPage />} />

          <Route
            path="/admin"
            element={isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {!isAdmin && (
          <div className="adminHint">
            Admin скрыт. Он показывается только для @Kristofer_Sol_ при подключении
          </div>
        )}
      </main>
    </div>
  );
}
`;

const mainTsx = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`;

const topNavTsx = `import { NavLink } from "react-router-dom";

export function TopNav({ isAdmin }) {
  const cls = (isActive) => "navItem" + (isActive ? " navItemActive" : "");

  return (
    <header className="topBar">
      <nav className="topNav">
        <NavLink to="/" className={({ isActive }) => cls(isActive)}>Home</NavLink>
        <NavLink to="/gm" className={({ isActive }) => cls(isActive)}>GM</NavLink>
        <NavLink to="/gn" className={({ isActive }) => cls(isActive)}>GN</NavLink>
        <NavLink to="/referrals" className={({ isActive }) => cls(isActive)}>Referrals</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => cls(isActive)}>Leaderboard</NavLink>
        <NavLink to="/themes" className={({ isActive }) => cls(isActive)}>Themes</NavLink>
        <NavLink to="/extension-themes" className={({ isActive }) => cls(isActive)}>Extension Themes</NavLink>
        <NavLink to="/upgrade-pro" className={({ isActive }) => cls(isActive)}>Upgrade Pro</NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => cls(isActive)}>Admin</NavLink>
        )}
      </nav>
    </header>
  );
}
`;

const pages = {
  "frontend/src/pages/HomePage.tsx": `export function HomePage() {
  return (
    <div className="page">
      <h1>Home</h1>
      <p className="pageNote">Каркас навигации готов. Дальше перенесём реальный UI по вкладкам</p>
    </div>
  );
}
`,
  "frontend/src/pages/GMPage.tsx": `export function GMPage() {
  return (
    <div className="page">
      <h1>GM</h1>
      <p className="pageNote">Тут будет UI генерации GM</p>
    </div>
  );
}
`,
  "frontend/src/pages/GNPage.tsx": `export function GNPage() {
  return (
    <div className="page">
      <h1>GN</h1>
      <p className="pageNote">Тут будет UI генерации GN</p>
    </div>
  );
}
`,
  "frontend/src/pages/ReferralsPage.tsx": `export function ReferralsPage() {
  return (
    <div className="page">
      <h1>Referrals</h1>
      <p className="pageNote">Тут будет статистика рефералов</p>
    </div>
  );
}
`,
  "frontend/src/pages/LeaderboardPage.tsx": `export function LeaderboardPage() {
  return (
    <div className="page">
      <h1>Leaderboard</h1>
      <p className="pageNote">Тут будет лидерборд</p>
    </div>
  );
}
`,
  "frontend/src/pages/ThemesPage.tsx": `export function ThemesPage() {
  return (
    <div className="page">
      <h1>Themes</h1>
      <p className="pageNote">Тут будут темы/обои сайта</p>
    </div>
  );
}
`,
  "frontend/src/pages/ExtensionThemesPage.tsx": `export function ExtensionThemesPage() {
  return (
    <div className="page">
      <h1>Extension Themes</h1>
      <p className="pageNote">Тут будут темы для расширения</p>
    </div>
  );
}
`,
  "frontend/src/pages/UpgradeProPage.tsx": `export function UpgradeProPage() {
  return (
    <div className="page">
      <h1>Upgrade Pro</h1>
      <p className="pageNote">Тут будет апгрейд/оплата</p>
    </div>
  );
}
`,
  "frontend/src/pages/AdminPage.tsx": `export function AdminPage() {
  return (
    <div className="page">
      <h1>Admin</h1>
      <p className="pageNote">Доступ только для @Kristofer_Sol_</p>
    </div>
  );
}
`,
};

const appCss = `:root { color-scheme: dark; }

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  background: radial-gradient(1200px 400px at 50% 0%, rgba(128,0,255,0.25), transparent 60%),
              radial-gradient(900px 400px at 0% 0%, rgba(0,255,208,0.18), transparent 55%),
              radial-gradient(900px 500px at 100% 0%, rgba(255,0,140,0.16), transparent 55%),
              #0b0b12;
  color: rgba(255,255,255,0.92);
}

.appShell { min-height: 100vh; padding: 18px 16px 40px; }
.topBar { display: flex; justify-content: center; }
.topNav {
  display: flex; gap: 10px; align-items: center;
  padding: 10px 12px; border-radius: 18px;
  background: rgba(20,18,34,0.75);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
}

.navItem {
  display: inline-flex; align-items: center;
  padding: 10px 16px; border-radius: 14px;
  text-decoration: none;
  color: rgba(255,255,255,0.78);
  font-size: 14px; letter-spacing: 0.2px;
  transition: transform 120ms ease, background 120ms ease, color 120ms ease;
}
.navItem:hover { transform: translateY(-1px); color: rgba(255,255,255,0.92); background: rgba(255,255,255,0.06); }
.navItemActive {
  color: rgba(0,0,0,0.92);
  background: linear-gradient(90deg, rgba(0,255,208,0.95), rgba(0,200,255,0.85));
  box-shadow: 0 8px 18px rgba(0,255,208,0.12);
}

.pageShell { max-width: 1100px; margin: 20px auto 0; padding: 0 6px; }
.page {
  margin-top: 14px; padding: 22px 20px; border-radius: 18px;
  background: rgba(20,18,34,0.65);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 30px rgba(0,0,0,0.28);
}
.page h1 { margin: 0 0 10px; font-size: 22px; font-weight: 700; }
.pageNote { margin: 0; color: rgba(255,255,255,0.70); font-size: 14px; }
.adminHint { margin-top: 14px; font-size: 12px; color: rgba(255,255,255,0.55); }
`;

const indexCss = `* { box-sizing: border-box; }`;

write("frontend/src/App.tsx", appTsx);
write("frontend/src/main.tsx", mainTsx);
write("frontend/src/components/TopNav.tsx", topNavTsx);
for (const [file, content] of Object.entries(pages)) write(file, content);
write("frontend/src/App.css", appCss);
write("frontend/src/index.css", indexCss);

console.log("\\nDone. Now run: npm run dev");
