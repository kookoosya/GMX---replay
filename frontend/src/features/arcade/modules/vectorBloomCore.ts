import { mountDriftRelayCore, type DriftRelayModuleOptions, type DriftRelaySnapshot } from "./driftRelayCore";

export interface VectorBloomSnapshot extends DriftRelaySnapshot {
  canopy: number;
  sector: string;
}

export interface VectorBloomModuleOptions extends DriftRelayModuleOptions {
  onSnapshot?: (snapshot: VectorBloomSnapshot) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function mapStatus(status: string) {
  const raw = String(status || "Bloom stable");
  if (raw === "Relay stable") return "Bloom stable";
  if (raw === "Routing right") return "Bloom shift right";
  if (raw === "Routing left") return "Bloom shift left";
  if (raw === "Boost recovered") return "Dew recovered";
  if (raw === "Boost empty") return "Bloom charge empty";
  if (raw === "Relay burst") return "Bloom burst";
  if (raw === "Crosswind pulse") return "Split gust";
  if (raw === "Storm corridor") return "Blight rush";
  if (raw === "Relay broken") return "Canopy broken";
  return raw;
}

export function mountVectorBloomCore(host: HTMLElement, options: VectorBloomModuleOptions = {}) {
  let lastBand = -1;
  return mountDriftRelayCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const band = Math.floor(Math.max(0, snapshot.seconds) / 16);
      const sector = band >= 2 ? "Canopy lock" : band >= 1 ? "Split bloom" : "Seed mesh";
      const sectorBonus = band <= 0 ? 0 : band === 1 ? 12 : 28;
      const canopy = clamp(
        Math.round(snapshot.integrity + snapshot.boosts * 8 - snapshot.sync * 0.06 + (band === 1 ? 10 : band >= 2 ? 18 : 0)),
        0,
        140,
      );
      let status = mapStatus(snapshot.status);
      if (snapshot.integrity > 0 && band !== lastBand) {
        status = `${sector} online`;
        lastBand = band;
      }
      options.onSnapshot?.({
        ...snapshot,
        zone: sector,
        sector,
        canopy,
        score: snapshot.score + sectorBonus + (canopy >= 100 ? 8 : 0),
        status,
      });
    },
  });
}
