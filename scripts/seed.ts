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

/**
 * FIX: Using <T,> with a comma and 'obj' instead of destructuring 
 * prevents Vercel from confusing the generic for a JSX tag.
 */
function failOnError<T,>(obj: { error: { message: string } | null; data: T }): T {
  if (obj.error) throw new Error(obj.error.message);
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

  // 4. CLEAN RESET: Delete existing fixtures
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

    const schedule = [
      { day: 1, m1: [0, 1], m2: [2, 3] }, // Team 4 rests
      { day: 2, m1: [4, 0], m2: [1, 2] }, // Team 3 rests
      { day: 3, m1: [3, 4], m2: [0, 2] }, // Team 1 rests
      { day: 4, m1: [1, 3], m2: [2, 4] }, // Team 0 rests
      { day: 5, m1: [3, 0], m2: [4, 1] }, // Team 2 rests
    ];

    schedule.forEach((s) => {
      fixtures.push({
        group_id: groupId,
        home_team_id: t[s.m1[0]].id,
        away_team_id: t[s.m1[1]].id,
        matchday: s.day
      });
      fixtures.push({
        group_id: groupId,
        home_team_id: t[s.m2[0]].id,
        away_team_id: t[s.m2[1]].id,
        matchday: s.day
      });
    });
  });

  await failOnError(
    await supabase.from("fixtures").upsert(fixtures, {
      onConflict: "group_id,home_team_id,away_team_id"
    })
  );

  // 6. Seed Knockout Matches
  await failOnError(
    await supabase.from("knockout_matches").upsert(
      [
        { round: "Semi Final", label: "SF1", sort_order: 1, home_seed: "1st Group A", away_seed: "2nd Group B" },
        { round: "Semi Final", label: "SF2", sort_order: 2, home_seed: "1st Group B", away_seed: "2nd Group A" },
        { round: "Final", label: "Final", sort_order: 3, home_seed: "Winner SF1", away_seed: "Winner SF2" }
      ],
      { onConflict: "label" }
    )
  );

  await failOnError(await supabase.rpc("recalculate_standings"));
  await failOnError(await supabase.rpc("refresh_knockout_seeds"));

  console.log("Seeded Legacy Tournament 2026 with optimized fixtures.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
