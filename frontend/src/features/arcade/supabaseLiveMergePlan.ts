export interface ArcadeSupabaseLiveMergeStep {
  step: number;
  title: string;
  action: string;
  safety: string;
}

export interface ArcadeSupabaseLiveMergePlanEnvelope {
  version: string;
  createdAt: string;
  steps: ArcadeSupabaseLiveMergeStep[];
}

export function buildArcadeSupabaseLiveMergePlan(): ArcadeSupabaseLiveMergePlanEnvelope {
  return {
    version: "phase53",
    createdAt: new Date().toISOString(),
    steps: [
      {
        step: 1,
        title: "Apply SQL scaffold",
        action: "Run 04, 05, 06, 07, and 08 in order inside Supabase before touching any runtime code.",
        safety: "Do not switch gameplay to cloud yet.",
      },
      {
        step: 2,
        title: "Wire one shared client",
        action: "Create one shared Supabase client in the main working repo and expose it through a narrow arcade gateway.",
        safety: "Do not instantiate clients inside ArcadePage or game modules.",
      },
      {
        step: 3,
        title: "Hydrate on load",
        action: "Let runtimeAdapter hydrate profile, selected shelf state, recent runs, and resumes through the gateway after auth resolves.",
        safety: "Keep local state authoritative until the first pull succeeds.",
      },
      {
        step: 4,
        title: "Queue writes",
        action: "Write profile, runs, and resumes into the queue/gateway path first, then let RPC apply them.",
        safety: "Do not let game modules post directly to Supabase.",
      },
      {
        step: 5,
        title: "Verify fallback",
        action: "Keep migration bundle, runtime snapshot, and deep resume export live during the first cloud rollout.",
        safety: "Cloud issues must not break local handoff or the 5-game Free shelf.",
      },
      {
        step: 6,
        title: "Tighten after proof",
        action: "Only after the live path is stable, reduce duplicate local mirror writes and retire more bridge/UI surface.",
        safety: "Do not touch arcade.js until the bridge replacement is actually ready.",
      },
    ],
  };
}

export function exportArcadeSupabaseLiveMergePlan(pretty = true) {
  return JSON.stringify(buildArcadeSupabaseLiveMergePlan(), null, pretty ? 2 : 0);
}
