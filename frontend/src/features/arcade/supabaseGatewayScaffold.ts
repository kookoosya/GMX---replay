import { LIVE_REACT_GAMES } from "./gameRegistry";

export interface ArcadeSupabaseGatewayScaffold {
  version: string;
  route: string;
  accessModel: string;
  reads: string[];
  writes: string[];
  rpcOrder: string[];
  tables: string[];
  notes: string[];
}

export function buildArcadeSupabaseGatewayScaffold(): ArcadeSupabaseGatewayScaffold {
  const freeCount = LIVE_REACT_GAMES.filter((game) => game.access === "free").length;
  return {
    version: "phase53",
    route: "/arcade",
    accessModel: `Free shelf locked to ${freeCount} React games, with premium runtime depth preserved in Pro`,
    reads: [
      "hydrate profile snapshot",
      "hydrate selected bridge/react shelf state",
      "hydrate latest resume payloads for Pro bridge games and future React cloud resumes",
      "hydrate recent runtime runs",
    ],
    writes: [
      "queue runtime profile upsert",
      "queue resume upsert",
      "queue run insert",
      "queue status mirror refresh",
    ],
    rpcOrder: [
      "public.arcade_queue_runtime_sync",
      "public.arcade_apply_runtime_sync",
      "public.arcade_pull_runtime_state",
    ],
    tables: [
      "public.arcade_progress",
      "public.arcade_runtime_profiles",
      "public.arcade_runtime_runs",
      "public.arcade_runtime_resumes",
      "public.arcade_runtime_sync_queue",
    ],
    notes: [
      "This is a dormant scaffold only.",
      "The main working repo should create the real Supabase client and call it from one shared runtime gateway.",
      "Game modules stay storage/runtimeAdapter-first until the live pass is enabled.",
    ],
  };
}

export function exportArcadeSupabaseGatewayScaffold(pretty = true) {
  return JSON.stringify(buildArcadeSupabaseGatewayScaffold(), null, pretty ? 2 : 0);
}
