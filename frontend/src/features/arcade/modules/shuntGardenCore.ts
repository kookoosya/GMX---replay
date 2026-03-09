import { mountAnchorRiftCore, type AnchorRiftModuleOptions, type AnchorRiftSnapshot } from "./anchorRiftCore";

export interface ShuntGardenSnapshot extends AnchorRiftSnapshot {
  canopyState: string;
  routeBloom: string;
}

export interface ShuntGardenModuleOptions extends AnchorRiftModuleOptions {
  onSnapshot?: (snapshot: ShuntGardenSnapshot) => void;
}

export function mountShuntGardenCore(host: HTMLElement, options: ShuntGardenModuleOptions = {}) {
  let lastCanopy = "";
  let lastBloom = "";
  return mountAnchorRiftCore(host, {
    ...options,
    onSnapshot: (snapshot) => {
      const canopyState = snapshot.integrity <= 22 ? "Split" : snapshot.seconds >= 58 ? "Full bloom" : snapshot.seconds >= 30 ? "Spread" : "Seeded";
      const routeBloom = snapshot.surgeWindow === "Open" ? "Wide" : snapshot.sync >= 92 ? "Threaded" : "Narrow";
      const canopyBonus = canopyState === "Seeded" ? 2 : canopyState === "Spread" ? 10 : canopyState === "Full bloom" ? 22 : 26;
      const routeBonus = routeBloom === "Narrow" ? 0 : routeBloom === "Threaded" ? 7 : 18;
      let status = snapshot.status;
      if (snapshot.integrity > 0 && canopyState !== lastCanopy) {
        status = canopyState === "Full bloom" ? "Canopy full" : canopyState === "Split" ? "Canopy split" : `${canopyState} canopy`;
        lastCanopy = canopyState;
      } else if (snapshot.integrity > 0 && routeBloom !== lastBloom && routeBloom === "Wide") {
        status = "Garden route wide";
      }
      lastBloom = routeBloom;
      options.onSnapshot?.({
        ...snapshot,
        canopyState,
        routeBloom,
        zone: canopyState === "Seeded" ? "Seed lattice" : canopyState === "Spread" ? "Canopy lattice" : canopyState === "Full bloom" ? "Bloom lattice" : "Split lattice",
        score: snapshot.score + canopyBonus + routeBonus,
        status,
      });
    },
  });
}
