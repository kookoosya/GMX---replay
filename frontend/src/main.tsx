import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const path = String(window.location.pathname || "/");

if (!path.startsWith("/bridge")) {
  const target = path.startsWith("/arcade") ? "/arcade" : "/app";
  window.location.replace(`${target}${window.location.search}${window.location.hash}`);
} else {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    throw new Error("Root element #root not found");
  }

  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <div className="bootWrap">
      <div className="bootCard">
        <div className="bootTitle">GMXReply</div>
        <div className="bootText">Loading Account Center…</div>
      </div>
    </div>
  );

  root.render(<App />);
}
