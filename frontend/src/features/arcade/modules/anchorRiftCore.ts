import { mountPulseValeCore, type PulseValeModuleOptions, type PulseValeSnapshot } from "./pulseValeCore";

export interface AnchorRiftSnapshot extends PulseValeSnapshot {
  anchorState: string;
  surgeWindow: string;
  sealBand: string;
  riftPulse: string;
}

export interface AnchorRiftModuleOptions extends PulseValeModuleOptions {
  onSnapshot?: (snapshot: AnchorRiftSnapshot) => void;
}

export function mountAnchorRiftCore(host: HTMLElement, options: AnchorRiftModuleOptions = {}) {
  let lastAnchor = "";
  let lastWindow = "";
  let lastSeal = "";
  let lastPulse = "";
  return mountPulseValeCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const anchorState = snapshot.integrity <= 24 ? "Breaking" : snapshot.seconds >= 54 ? "Lifted" : snapshot.seconds >= 26 ? "Threaded" : "Locked";
      const surgeWindow = snapshot.sync >= 124 ? "Open" : snapshot.sync >= 76 ? "Narrow" : "Closed";
      const sealBand = snapshot.integrity <= 26 ? "Frayed" : snapshot.sync >= 158 ? "Overseal" : snapshot.seconds >= 34 ? "Set" : "Raw";
      const riftPulse = snapshot.integrity <= 18 ? "Critical" : snapshot.sync >= 170 ? "Prime" : snapshot.seconds >= 44 ? "Live" : snapshot.seconds >= 18 ? "Charging" : "Idle";
      const anchorBonus = anchorState === "Locked" ? 4 : anchorState === "Threaded" ? 12 : anchorState === "Lifted" ? 20 : 26;
      const windowBonus = surgeWindow === "Closed" ? 0 : surgeWindow === "Narrow" ? 8 : 18;
      const sealBonus = sealBand === "Raw" ? 0 : sealBand === "Set" ? 8 : sealBand === "Overseal" ? 18 : 22;
      const pulseBonus = riftPulse === "Idle" ? 0 : riftPulse === "Charging" ? 7 : riftPulse === "Live" ? 16 : riftPulse === "Prime" ? 28 : 34;
      let status = snapshot.status;
      if (snapshot.integrity > 0 && anchorState !== lastAnchor) {
        status = `${anchorState} anchor`;
        lastAnchor = anchorState;
      } else if (snapshot.integrity > 0 && surgeWindow !== lastWindow && surgeWindow === "Open") {
        status = "Surge vent open";
      } else if (snapshot.integrity > 0 && sealBand !== lastSeal && (sealBand === "Set" || sealBand === "Overseal")) {
        status = sealBand === "Overseal" ? "Anchor oversealed" : "Seal set";
      } else if (snapshot.integrity > 0 && riftPulse !== lastPulse && (riftPulse === "Live" || riftPulse === "Prime")) {
        status = riftPulse === "Prime" ? "Rift pulse prime" : "Rift pulse live";
      }
      lastWindow = surgeWindow;
      lastSeal = sealBand;
      lastPulse = riftPulse;
      options.onSnapshot?.({
        ...snapshot,
        anchorState,
        surgeWindow,
        sealBand,
        riftPulse,
        zone: anchorState === "Locked" ? "Near anchor" : anchorState === "Threaded" ? "Threaded anchor" : anchorState === "Lifted" ? "Raised anchor" : "Breaking anchor",
        score: snapshot.score + anchorBonus + windowBonus + sealBonus + pulseBonus,
        status,
      });
    },
  });
}
