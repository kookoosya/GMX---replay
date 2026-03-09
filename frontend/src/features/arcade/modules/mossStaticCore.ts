import { mountShuntGardenCore, type ShuntGardenModuleOptions, type ShuntGardenSnapshot } from "./shuntGardenCore";

export interface MossStaticSnapshot extends ShuntGardenSnapshot {
  mossState: string;
  staticField: string;
}

export interface MossStaticModuleOptions extends ShuntGardenModuleOptions {
  onSnapshot?: (snapshot: MossStaticSnapshot) => void;
}

export function mountMossStaticCore(host: HTMLElement, options: MossStaticModuleOptions = {}) {
  let lastMoss = "";
  let lastStatic = "";
  return mountShuntGardenCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const mossState = snapshot.integrity <= 18 ? "Frayed" : snapshot.seconds >= 72 ? "Rooted" : snapshot.seconds >= 38 ? "Holding" : "Fresh";
      const staticField = snapshot.routeBloom === "Wide" ? "Clear" : snapshot.sync >= 94 ? "Threaded" : snapshot.seconds >= 32 ? "Humming" : "Thin";
      const mossBonus = mossState === "Fresh" ? 3 : mossState === "Holding" ? 13 : mossState === "Rooted" ? 28 : 32;
      const staticBonus = staticField === "Thin" ? 0 : staticField === "Humming" ? 8 : staticField === "Threaded" ? 17 : 26;
      let status = snapshot.status;
      if (snapshot.integrity > 0 && mossState !== lastMoss) {
        status = mossState === "Rooted" ? "Moss rooted" : mossState === "Frayed" ? "Moss frayed" : `${mossState} moss`;
        lastMoss = mossState;
      } else if (snapshot.integrity > 0 && staticField !== lastStatic) {
        if (staticField === "Clear") status = "Static cleared";
        else if (staticField === "Threaded") status = "Static threaded";
      }
      lastStatic = staticField;
      options.onSnapshot?.({
        ...snapshot,
        mossState,
        staticField,
        zone: mossState === "Fresh" ? "Moss fringe" : mossState === "Holding" ? "Static hedge" : mossState === "Rooted" ? "Signal hedge" : "Frayed hedge",
        score: snapshot.score + mossBonus + staticBonus,
        status,
      });
    },
  });
}
