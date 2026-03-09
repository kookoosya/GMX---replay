import { buildArcadeMigrationManifest, exportArcadeDeepResumeBundle, importArcadeDeepResumeBundle } from "./storage";
import { exportArcadeRuntimeSnapshot, importArcadeRuntimeSnapshot } from "./runtimeAdapter";
import {
  buildArcadeSupabaseBootstrapManifest,
  exportArcadeSupabaseEnvTemplate,
  exportArcadeSupabaseMergeNotes,
} from "./supabaseFoundation";
import { exportArcadeSupabaseGatewayScaffold } from "./supabaseGatewayScaffold";
import { exportArcadeSupabaseLiveMergePlan } from "./supabaseLiveMergePlan";

export interface ArcadeFullMigrationBundle {
  manifest: ReturnType<typeof buildArcadeMigrationManifest>;
  supabase?: ReturnType<typeof buildArcadeSupabaseBootstrapManifest>;
  supabaseEnv?: string;
  supabaseMergeNotes?: string;
  supabaseGateway?: unknown;
  supabaseLivePlan?: unknown;
  deepResume: unknown;
  runtime: ReturnType<typeof exportArcadeRuntimeSnapshot>;
}

export function buildArcadeFullMigrationBundle(): ArcadeFullMigrationBundle {
  return {
    manifest: buildArcadeMigrationManifest(),
    deepResume: JSON.parse(exportArcadeDeepResumeBundle(false)),
    runtime: exportArcadeRuntimeSnapshot(),
    supabase: buildArcadeSupabaseBootstrapManifest(),
    supabaseEnv: exportArcadeSupabaseEnvTemplate(),
    supabaseMergeNotes: exportArcadeSupabaseMergeNotes(),
    supabaseGateway: JSON.parse(exportArcadeSupabaseGatewayScaffold(false)),
    supabaseLivePlan: JSON.parse(exportArcadeSupabaseLiveMergePlan(false)),
  };
}

export function exportArcadeFullMigrationBundle(pretty = true) {
  return JSON.stringify(buildArcadeFullMigrationBundle(), null, pretty ? 2 : 0);
}

export function importArcadeFullMigrationBundle(raw: string) {
  let parsed: any = null;
  try {
    parsed = JSON.parse(String(raw || "{}"));
  } catch {
    return { importedResumes: 0, importedRuns: 0, importedBest: 0, statusRestored: false, version: "invalid" };
  }
  const deep = importArcadeDeepResumeBundle(JSON.stringify(parsed?.deepResume || {}));
  const runtime = importArcadeRuntimeSnapshot(JSON.stringify(parsed?.runtime || {}));
  return {
    importedResumes: deep.imported,
    importedRuns: runtime.importedRuns,
    importedBest: runtime.importedBest,
    statusRestored: runtime.statusRestored,
    version: String(parsed?.manifest?.version || parsed?.version || "unknown"),
  };
}

export function buildArcadeChatHandoffText() {
  const bundle = buildArcadeFullMigrationBundle();
  const deepResume = bundle.deepResume as { checkpoints?: unknown[] } | null;
  const livePlan = (bundle.supabaseLivePlan as { steps?: unknown[] } | null)?.steps || [];
  const lines = [
    "ARCADE REACT/VITE HANDOFF · PHASE 53",
    "",
    "State:",
    `- Version: ${bundle.manifest.version}`,
    `- Route: ${bundle.manifest.route}`,
    `- Copy set groups: ${bundle.manifest.copyset.length}`,
    `- Deep resumes: ${Array.isArray(deepResume?.checkpoints) ? deepResume!.checkpoints!.length : 0}`,
    `- Runtime runs: ${Array.isArray(bundle.runtime.allRuns) ? bundle.runtime.allRuns.length : 0}`,
    `- Supabase live plan steps: ${Array.isArray(livePlan) ? livePlan.length : 0}`,
    "",
    "Rules:",
    "- Arcade and in-game UI remain English-only",
    "- React + Vite is the only growth path",
    "- Legacy arcade.js remains as a temporary compatibility bridge until fully replaced",
    "- Free shelf stays capped at 5 React games with Rift Harvest as the showcase Free slot",
    "- Strong flagship loops stay in Pro",
    "- Supabase runtime sync is still OFF in this archive",
    "- Future cloud writes must go through one shared runtime/storage gateway, never straight from game modules",
    "",
    "What Phase 53 adds:",
    "- Supabase env export",
    "- Supabase merge notes export",
    "- Supabase gateway scaffold export",
    "- Supabase live wiring plan export",
    "- More migration copy moved away from hardcoded page text into adapter/foundation output",
    "",
    "If moving into the main working repo:",
    "1. Merge page + feature files first",
    "2. Apply SQL in order: 04 -> 05 -> 06 -> 07 -> 08",
    "3. Wire one shared Supabase client",
    "4. Keep local migration exports alive until the first live cloud pass is verified",
  ];
  return lines.join("\n");
}
