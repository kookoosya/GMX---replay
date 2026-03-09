import { useEffect } from "react";

export default function ArcadePage() {
  useEffect(() => {
    try {
      window.location.replace("/arcade.html");
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="bootWrap">
      <div className="bootCard">
        <div className="bootTitle">GMXReply Arcade</div>
        <div className="bootText">Redirecting to the live arcade shelf…</div>
      </div>
    </div>
  );
}
