import { LIVE_REACT_GAMES, type ReactArcadeGameKey } from "./gameRegistry";
import { exportArcadeSupabaseGatewayScaffold } from "./supabaseGatewayScaffold";
import { exportArcadeSupabaseLiveMergePlan } from "./supabaseLiveMergePlan";

export type ArcadeSupabasePlan = "loading" | "free" | "pro";

const ENV_KEYS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_PROJECT_ID"];
const SQL_FILES = [
  "supabase/04_arcade_progress.sql",
  "supabase/05_arcade_runtime_sync_scaffold.sql",
  "supabase/06_arcade_runtime_queue_scaffold.sql",
  "supabase/07_arcade_runtime_rpc_scaffold.sql",
  "supabase/08_arcade_runtime_gateway_stub.sql",
];
const CLIENT_FILES = [
  "frontend/src/features/arcade/supabaseFoundation.ts",
  "frontend/src/features/arcade/supabaseGatewayScaffold.ts",
  "frontend/src/features/arcade/supabaseLiveMergePlan.ts",
  "frontend/src/features/arcade/storage.ts",
  "frontend/src/features/arcade/runtimeAdapter.ts",
  "frontend/src/features/arcade/migrationBundle.ts",
  "frontend/src/pages/ArcadePage.tsx",
];

export interface ArcadeSupabaseFoundationState {
  readinessLine: string;
  envLine: string;
  schemaLine: string;
  gatewayLine: string;
  scopeLine: string;
  mergePlanLine: string;
  nextStepLine: string;
  safetyLine: string;
}

export interface ArcadeSupabaseBootstrapManifest {
  version: string;
  createdAt: string;
  route: string;
  env: string[];
  sqlFiles: string[];
  clientFiles: string[];
  reactGameKeys: ReactArcadeGameKey[];
  exports: string[];
  notes: string[];
}

export function buildArcadeSupabaseFoundationState(plan: ArcadeSupabasePlan): ArcadeSupabaseFoundationState {
  const liveCount = LIVE_REACT_GAMES.length;
  const freeCount = LIVE_REACT_GAMES.filter((game) => game.access === "free").length;
  const topProCount = LIVE_REACT_GAMES.filter((game) => game.highlight === "top_pro").length;
  const accessLead = plan === "pro"
    ? "Pro is active, so the future cloud pass can later unlock full premium resume without changing the current page model."
    : plan === "free"
      ? "Free is active, so the archive stays documentation-first: no live network writes yet, but the merge path is already laid out."
      : "Access is still syncing, but the Supabase foundation is already staged as a dormant merge helper.";
  return {
    readinessLine: `${accessLead} Phase 53 keeps runtime sync OFF, but it now ships a merge-ready Supabase stack for ${liveCount} React modules (${freeCount} Free, ${topProCount} Top Pro).`,
    envLine: `Client env keys prepared for the later merge: ${ENV_KEYS.join(" · ")}`,
    schemaLine: `SQL scaffold order is ready: ${SQL_FILES.join(" -> ")}`,
    gatewayLine: "A shared gateway scaffold is now included, so the main repo can route runtime reads and writes through one adapter-owned lane instead of touching game modules.",
    scopeLine: "Planned cloud scope: React run rows, React resume rows, runtime profile rows, queued sync rows, and a narrow mirror of the selected React shelf state. No live writes are enabled in this archive.",
    mergePlanLine: "Phase 53 now also exports env template, merge notes, gateway shape, and a live wiring plan so the main working repo can enable cloud sync without guessing the order.",
    nextStepLine: "After this archive is merged into the main working repo, apply the SQL scaffold in order, wire the real Supabase client once, then route runtimeAdapter writes through one shared gateway instead of calling Supabase from page or game modules.",
    safetyLine: "This phase adds dormant helpers, SQL scaffolds, and exportable docs only. It does not connect gameplay to Supabase, change access gating, or replace the local-first handoff exports.",
  };
}

export function buildArcadeSupabaseBootstrapManifest(): ArcadeSupabaseBootstrapManifest {
  return {
    version: "phase53",
    createdAt: new Date().toISOString(),
    route: "/arcade",
    env: [...ENV_KEYS],
    sqlFiles: [...SQL_FILES],
    clientFiles: [...CLIENT_FILES],
    reactGameKeys: LIVE_REACT_GAMES.map((game) => game.key as ReactArcadeGameKey),
    exports: [
      "supabase-scaffold",
      "supabase-env",
      "supabase-merge-notes",
      "supabase-gateway",
      "supabase-live-plan",
    ],
    notes: [
      "Phase 53 keeps Supabase runtime sync disabled in this archive.",
      "The scaffold exists so the main working repo can enable cloud runtime sync faster after the archive merge.",
      "Keep the existing local migration bundle, deep resume export, and runtime snapshot as the primary handoff path until cloud writes are actually wired.",
      "Do not call Supabase directly from game modules. Route future cloud sync through one shared runtimeAdapter/storage gateway.",
      "Apply supabase/04_arcade_progress.sql first, then 05, 06, 07, and 08 in order.",
      "The later live sync pass should preserve the 5-game Free shelf and the current Free / Top Pro / Extended Pro product model.",
    ],
  };
}

export function exportArcadeSupabaseBootstrapManifest(pretty = true) {
  return JSON.stringify(buildArcadeSupabaseBootstrapManifest(), null, pretty ? 2 : 0);
}

export function exportArcadeSupabaseEnvTemplate() {
  return [
    "VITE_SUPABASE_URL=",
    "VITE_SUPABASE_ANON_KEY=",
    "VITE_SUPABASE_PROJECT_ID=",
  ].join("\n");
}

export function exportArcadeSupabaseMergeNotes() {
  const notes = [
    "GMXReply Arcade · Supabase Merge Notes · Phase 53",
    "",
    "1. Keep live sync OFF in this archive.",
    "2. Merge the SQL scaffold in order: 04 -> 05 -> 06 -> 07 -> 08.",
    "3. Wire one shared Supabase client in the main working repo.",
    "4. Route runtimeAdapter writes through the shared gateway only.",
    "5. Do not let React game modules call Supabase directly.",
    "6. Keep local migration bundle and deep resume export as the fallback handoff path until the first live pass is verified.",
    "7. Preserve Free = 5 and keep Rift Harvest as the showcase Free slot.",
    "",
    "Gateway scaffold preview:",
    exportArcadeSupabaseGatewayScaffold(false),
    "",
    "Live wiring plan preview:",
    exportArcadeSupabaseLiveMergePlan(false),
  ];
  return notes.join("\n");
}
