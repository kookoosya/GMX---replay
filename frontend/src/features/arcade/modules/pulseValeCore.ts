import { mountEchoVergeCore, type EchoVergeModuleOptions, type EchoVergeSnapshot } from "./echoVergeCore";

export interface PulseValeSnapshot extends EchoVergeSnapshot {
  basin: string;
  pulseTier: string;
  crestState: string;
}

export interface PulseValeModuleOptions extends EchoVergeModuleOptions {
  onSnapshot?: (snapshot: PulseValeSnapshot) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function mountPulseValeCore(host: HTMLElement, options: PulseValeModuleOptions = {}) {
  let lastBasin = "";
  let lastTier = "";
  return mountEchoVergeCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const basin = snapshot.seconds >= 42 ? "Crest basin" : snapshot.seconds >= 20 ? "Split basin" : "Low basin";
      const pulseTier = snapshot.sync >= 126 ? "Peak" : snapshot.sync >= 92 ? "Lifted" : snapshot.sync >= 58 ? "Set" : "Calm";
      const crestState = snapshot.integrity <= 32 ? "Cracked" : snapshot.seconds >= 54 ? "Lifted" : snapshot.seconds >= 28 ? "Threaded" : "Sealed";
      const basinBonus = basin === "Low basin" ? 4 : basin === "Split basin" ? 12 : 24;
      const tierBonus = pulseTier === "Calm" ? 2 : pulseTier === "Set" ? 6 : pulseTier === "Lifted" ? 12 : 18;
      const crestBonus = crestState === "Sealed" ? 2 : crestState === "Threaded" ? 8 : crestState === "Lifted" ? 14 : 18;
      let status = snapshot.status;
      if (snapshot.integrity > 0 && basin !== lastBasin) {
        status = `${basin} online`;
        lastBasin = basin;
      } else if (snapshot.integrity > 0 && pulseTier !== lastTier && pulseTier === "Peak") {
        status = "Peak pulse";
      } else if (snapshot.integrity > 0 && crestState === "Lifted") {
        status = "Crest lifted";
      }
      lastTier = pulseTier;
      options.onSnapshot?.({
        ...snapshot,
        basin,
        pulseTier,
        crestState,
        score: snapshot.score + basinBonus + tierBonus + crestBonus + (clamp(snapshot.sync, 0, 180) >= 108 ? 8 : 0),
        status,
      });
    },
  });
}
