import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const checks = {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    supabaseHost: supabaseUrl ? new URL(supabaseUrl).host : null,
    groups: null as number | null,
    fixtures: null as number | null,
    error: null as string | null
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(checks, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const [groupsResult, fixturesResult] = await Promise.all([
      supabase.from("groups").select("id", { count: "exact", head: true }),
      supabase.from("fixtures").select("id", { count: "exact", head: true })
    ]);

    if (groupsResult.error) throw groupsResult.error;
    if (fixturesResult.error) throw fixturesResult.error;

    checks.groups = groupsResult.count;
    checks.fixtures = fixturesResult.count;

    return NextResponse.json(checks);
  } catch (error) {
    checks.error = error instanceof Error ? error.message : "Unknown health check error";
    return NextResponse.json(checks, { status: 500 });
  }
}
