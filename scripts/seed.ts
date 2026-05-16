import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

const groups = ["Group A", "Group B"] as const;
const teams = [
  ["CLC", "Group A", 1],
  ["Hope Chapel", "Group A", 2],
  ["KICC", "Group A", 3],
  ["Carmel City Church", "Group A", 4],
  ["BOLM FC", "Group A", 5],
  ["RCCG Glory of God", "Group B", 1],
  ["GHIC Yeovil", "Group B", 2],
  ["GHIC Bristol", "Group B", 3],
  ["Dayspring", "Group B", 4],
  ["Church of Pentecost", "Group B", 5]
] as const;

// FIX: Standard function wrapper to resolve Vercel build syntax errors
function failOnError<T>(obj: { error: { message: string } | null; data: T }): T {
  if (obj.error) throw obj.error;
  return obj.data;
}

async function main() {
  // 1. Seed Groups
  failOnError(
    await supabase.from("groups").upsert(
      groups.map((name) => ({ name })),
      { onConflict: "name" }
    )
  );

  const groupRows = await failOnError(
    await supabase.from("groups").select("id,name").in("name", [...groups])
  ) ?? [];
  const groupIds = new Map(groupRows.map((group) => [group.name, group.id]));

  // 2. Seed Teams
  await failOnError(
    await supabase.from("teams").upsert(
      teams.map(([name, groupName, displayOrder]) => ({
        name,
        group_id: groupIds.get(groupName)!,
        display_order: displayOrder
      })),
      { onConflict: "name" }
    )
  );

  const teamRows = await failOnError(
    await supabase.from("teams").select("id,name,group_id,display_order").order("display_order")
  ) ?? [];

  // 3. Seed Standings
  await failOnError(
    await supabase.from("standings").upsert(
      teamRows.map((team) => ({ team_id: team.id, group_id: team.group_id })),
      { onConflict: "team_id" }
    )
  );

  // 4. CLEAN RESET: Delete existing fixtures to prevent mixing old and new schedules
  await failOnError(
    await supabase.from("fixtures").delete().neq("group_id", "00000000-0000-0000-0000-000000000000")
  );

  // 5. GENERATE OPTIMIZED FIXTURES (No 4-match streaks)
  const fixtures: {
    group_id: string;
    home_team_id: string;
    away_team_id: string;
    matchday: number;
  }[] = [];

  groups.forEach((groupName) => {
    const groupId = groupIds.get(groupName)!;
    const t = teamRows
      .filter((team) => team.group_id === groupId)
      .sort((a, b) => a.display_order - b.display_order);

    /**
     * Optimized 5-team round-robin schedule
     * Indices: 0, 1, 2, 3, 4 (Mapping to your team list)
     * Every team plays 4 games and has 1 Bye day to rest.
     */
    const schedule = [
      { day: 1, m1: [0, 1], m2: [2, 3] }, // Team 4 rests
      { day: 2, m1: [4, 0], m2: [1, 2] }, // Team 3 rests
      { day: 3, m1: [3, 4], m2: [0, 2] }, // Team 1 rests
      { day: 4, m1: [1, 3], m2: [2, 4] }, // Team 0 (CLC) rests - BREAKS STREAK
      { day: 5, m1: [3, 0], m2
