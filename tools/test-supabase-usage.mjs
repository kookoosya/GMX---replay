import { createClient } from "@supabase/supabase-js";

const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const handle = "@localtest";
const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD UTC-ish
const limit = 70;

async function main() {
  console.log("Calling RPC usage_daily_consume ...");
  const r1 = await sb.rpc("usage_daily_consume", {
    p_handle: handle,
    p_day: today,
    p_kind: "gm",
    p_by: 1,
    p_limit: limit,
    p_plan: "free",
  });
  console.log("RPC gm:", r1);

  const r2 = await sb.rpc("usage_daily_consume", {
    p_handle: handle,
    p_day: today,
    p_kind: "gn",
    p_by: 2,
    p_limit: limit,
    p_plan: "free",
  });
  console.log("RPC gn:", r2);

  const q = await sb
    .from("usage_daily")
    .select("handle, day, gm_used, gn_used, plan, gm_limit, gn_limit, updated_at")
    .eq("handle", handle)
    .eq("day", today)
    .maybeSingle();

  console.log("Row:", q);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});