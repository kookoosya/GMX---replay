import { mountPulseQuarryCore, type PulseQuarryModuleOptions, type PulseQuarrySnapshot } from "./pulseQuarryCore";

export interface FlareDockSnapshot extends PulseQuarrySnapshot {
  stage: string;
  heatBand: string;
  surgeTier: string;
  overdriveBand: string;
}
export interface FlareDockModuleOptions extends PulseQuarryModuleOptions {
  onSnapshot?: (snapshot: FlareDockSnapshot) => void;
}

function mapStatus(status: string) {
  const raw = String(status || "Holding lane");
  if (raw === "Cutting clean") return "Holding dock line";
  if (raw === "Pulse empty") return "Flare charge empty";
  if (raw === "Pulse cut") return "Flare vent";
  if (raw === "Cell recovered") return "Coolant tank secured";
  if (raw === "Fault cut") return "Flare wall cut";
  if (raw === "Ore mined") return "Barge secured";
  if (raw === "Charge recovered") return "Charge refilled";
  if (raw === "Quake surge") return "Flare surge";
  if (raw === "Shifting right") return "Shift right";
  if (raw === "Shifting left") return "Shift left";
  if (raw === "Rig collapsed") return "Dock line lost";
  return raw;
}

export function mountFlareDockCore(host: HTMLElement, options: FlareDockModuleOptions = {}) {
  let lastBand = -1;
  return mountPulseQuarryCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const band = Math.floor(Math.max(0, snapshot.seconds) / 16);
      const stage = band >= 3 ? "Night vent" : band >= 2 ? "Third shift" : band >= 1 ? "Mid dock" : "First shift";
      const heatBand = snapshot.stress >= 90 ? "Critical" : snapshot.stress >= 58 ? "Hot" : snapshot.stress >= 28 ? "Warm" : "Stable";
      const surgeTier = snapshot.charges >= 4 && heatBand !== "Critical" ? "Reserve" : snapshot.charges >= 2 ? "Loaded" : heatBand === "Critical" ? "Breakline" : "Thin";
      const overdriveBand = band >= 2 && snapshot.charges >= 3 && heatBand !== "Critical"
        ? "Overdrive"
        : snapshot.charges >= 4
          ? "Primed"
          : heatBand === "Critical"
            ? "Breakline"
            : band >= 1 && snapshot.charges >= 2
              ? "Armed"
              : "Idle";
      const stageBonus = band <= 0 ? 0 : band === 1 ? 12 : band === 2 ? 28 : 44;
      let status = mapStatus(snapshot.status);
      if (snapshot.hull > 0 && band !== lastBand) {
        status = overdriveBand === "Overdrive" ? `${stage} overdrive` : `${stage} online`;
        lastBand = band;
      }
      options.onSnapshot?.({
        ...snapshot,
        stage,
        heatBand,
        surgeTier,
        overdriveBand,
        score: snapshot.score + stageBonus + (snapshot.charges >= 3 ? 6 : 0) + (heatBand === "Stable" ? 4 : 0) + (surgeTier === "Reserve" ? 8 : surgeTier === "Breakline" ? 12 : 0) + (overdriveBand === "Overdrive" ? 14 : overdriveBand === "Primed" ? 8 : overdriveBand === "Armed" ? 4 : 0),
        status,
      });
    },
  });
}
