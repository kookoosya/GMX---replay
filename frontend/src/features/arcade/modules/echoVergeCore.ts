import { mountDriftRelayCore, type DriftRelayModuleOptions, type DriftRelaySnapshot } from "./driftRelayCore";

export interface EchoVergeSnapshot extends DriftRelaySnapshot {
  seam: string;
  echoBand: string;
  phase: string;
  surgeLevel: string;
}

export interface EchoVergeModuleOptions extends DriftRelayModuleOptions {
  onSnapshot?: (snapshot: EchoVergeSnapshot) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function mapStatus(status: string) {
  const raw = String(status || "Verge stable");
  if (raw === "Relay stable") return "Verge stable";
  if (raw === "Routing right") return "Seam right";
  if (raw === "Routing left") return "Seam left";
  if (raw === "Boost recovered") return "Echo charge recovered";
  if (raw === "Boost empty") return "Echo charge empty";
  if (raw === "Relay burst") return "Echo sweep";
  if (raw === "Crosswind pulse") return "Mirror pulse";
  if (raw === "Storm corridor") return "Echo rupture";
  if (raw === "Relay lost") return "Verge collapsed";
  if (raw === "Signal drift") return "Echo drift";
  if (raw === "Relay strain") return "Verge strain";
  if (raw === "Storm tearing relay") return "Rupture tearing verge";
  return raw;
}

export function mountEchoVergeCore(host: HTMLElement, options: EchoVergeModuleOptions = {}) {
  let lastSeam = "";
  let lastBand = "";
  return mountDriftRelayCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const bandIndex = Math.floor(Math.max(0, snapshot.seconds) / 18);
      const seam = bandIndex >= 2 ? "Fracture verge" : bandIndex >= 1 ? "Mirror seam" : "Near seam";
      const echoBand = snapshot.sync >= 118 ? "Overload" : snapshot.sync >= 84 ? "Dense" : snapshot.sync >= 46 ? "Layered" : "Soft";
      const phase = bandIndex >= 2 ? "Fracture pull" : bandIndex >= 1 ? "Split pull" : "Low pull";
      const surgeLevel = snapshot.sync >= 132 ? "Pushed" : snapshot.sync >= 90 ? "Raised" : snapshot.sync >= 54 ? "Held" : "Quiet";
      const seamBonus = bandIndex <= 0 ? 0 : bandIndex === 1 ? 14 : 32;
      const bandBonus = echoBand === "Soft" ? 6 : echoBand === "Layered" ? 2 : echoBand === "Dense" ? 10 : 16;
      const phaseBonus = phase === "Low pull" ? 2 : phase === "Split pull" ? 10 : 18;
      const surgeBonus = surgeLevel === "Quiet" ? 0 : surgeLevel === "Held" ? 4 : surgeLevel === "Raised" ? 8 : 14;
      let status = mapStatus(snapshot.status);
      if (snapshot.integrity > 0 && seam !== lastSeam) {
        status = `${seam} online`;
        lastSeam = seam;
      } else if (snapshot.integrity > 0 && echoBand !== lastBand && echoBand === "Overload") {
        status = "Overload echo";
      } else if (snapshot.integrity > 0 && surgeLevel === "Pushed") {
        status = "Pushed echo";
      }
      lastBand = echoBand;
      options.onSnapshot?.({
        ...snapshot,
        seam,
        echoBand,
        phase,
        surgeLevel,
        zone: seam,
        score: snapshot.score + seamBonus + bandBonus + phaseBonus + surgeBonus + (clamp(100 - snapshot.integrity, 0, 100) <= 24 ? 6 : 0),
        status,
      });
    },
  });
}
