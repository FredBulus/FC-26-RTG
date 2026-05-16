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
// 1. DELETE EXISTING FIXTURES FIRST
  await failOnError(
    await supabase.from("fixtures").delete().neq("group_id", "temp_ignore")
  );

  // 2. GENERATE OPTIMIZED FIXTURES
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

    // Optimized 5-team schedule: No team plays in consecutive matchdays
    const schedule = [
      { day: 1, m1: [0, 1], m2: [2, 3] }, // 4 rests
      { day: 2, m1: [4, 0], m2: [1, 2] }, // 3 rests
      { day: 3, m1: [3, 4], m2: [0, 2] }, // 1 rests
      { day: 4, m1: [1, 3], m2: [2, 4] }, // 0 rests
      { day: 5, m1: [3, 0], m2: [4, 1] }, // 2 rests
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

  // 3. UPSERT THE NEW FIXTURES
  await failOnError(
    await supabase.from("fixtures").upsert(fixtures, {
      onConflict: "group_id,home_team_id,away_team_id"
    })
  );

  // --- SAVE TRULY CHRONOLOGICAL FIXTURES ---
  await failOnError(
    await supabase.from("fixtures").upsert(fixtures, {
      onConflict: "group_id,home_team_id,away_team_id"
    })
  );

  await failOnError(
    await supabase.from("fixtures").upsert(fixtures, {
      onConflict: "group_id,home_team_id,away_team_id"
    })
  );

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

  console.log("Seeded Legacy Tournament 2026.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
