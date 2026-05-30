import { type ComponentType, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type RootModule = {
  default: ComponentType;
};

async function resolveRoot(): Promise<ComponentType> {
  const path = String(window.location.pathname || "/");
  const module: RootModule = path.startsWith("/bridge")
    ? await import("./App")
    : path.startsWith("/arcade")
      ? await import("./pages/ArcadePage")
      : await import("./AppShell");

  return module.default;
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

const root = ReactDOM.createRoot(rootEl);

function renderFrame(node: ReactNode) {
  root.render(node);
}

renderFrame(
  <div className="bootWrap">
    <div className="bootCard">
      <div className="bootTitle">GMXReply</div>
      <div className="bootText">Loading UI shell…</div>
    </div>
  </div>
);

void resolveRoot()
  .then((Root) => {
    renderFrame(<Root />);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || "boot_failed");
    renderFrame(
      <div className="bootWrap">
        <div className="bootCard">
          <div className="bootTitle">GMXReply boot failed</div>
          <div className="err" style={{ marginTop: 10 }}>{message}</div>
        </div>
      </div>
    );
  });
