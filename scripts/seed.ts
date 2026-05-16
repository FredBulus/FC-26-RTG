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

// We'll use a simpler version of the error handler to avoid any 'T' name errors
function failOnError(obj: any) {
  if (obj.error) throw new Error(obj.error.message);
  return obj.data;
}

async function main() {
  // 1. Seed Groups
  await failOnError(await supabase.from("groups").upsert([{ name: "Group A" }, { name: "Group B" }], { onConflict: "name" }));

  const groupRows = await failOnError(await supabase.from("groups").select("id,name"));
  const groupIds = new Map(groupRows.map((g: any) => [g.name, g.id]));

  // 2. Seed Teams
  const teamData = [
    { name: "CLC", group_id: groupIds.get("Group A"), display_order: 1 },
    { name: "Hope Chapel", group_id: groupIds.get("Group A"), display_order: 2 },
    { name: "KICC", group_id: groupIds.get("Group A"), display_order: 3 },
    { name: "Carmel City Church", group_id: groupIds.get("Group A"), display_order: 4 },
    { name: "BOLM FC", group_id: groupIds.get("Group A"), display_order: 5 },
    { name: "RCCG Glory of God", group_id: groupIds.get("Group B"), display_order: 1 },
    { name: "GHIC Yeovil", group_id: groupIds.get("Group B"), display_order: 2 },
    { name: "GHIC Bristol", group_id: groupIds.get("Group B"), display_order: 3 },
    { name: "Dayspring", group_id: groupIds.get("Group B"), display_order: 4 },
    { name: "Church of Pentecost", group_id: groupIds.get("Group B"), display_order: 5 },
  ];

  await failOnError(await supabase.from("teams").upsert(teamData, { onConflict: "name" }));
  const teamRows = await failOnError(await supabase.from("teams").select("id,name"));
  const t = new Map(teamRows.map((team: any) => [team.name, team.id]));

  // 3. Seed Standings
  await failOnError(await supabase.from("standings").upsert(teamRows.map((team: any) => ({ team_id: team.id, group_id: team.group_id })), { onConflict: "team_id" }));

  // 4. CLEAN RESET: Delete all existing fixtures
  await failOnError(await supabase.from("fixtures").delete().neq("group_id", "00000000-0000-0000-0000-000000000000"));

  // 5. HARD-CODED FIXTURE LIST
  // This order ensures no team plays more than 2-3 games in a row.
  const fixturesData = [
    // --- Matchday 1 ---
    { group_id: groupIds.get("Group A"), home_team_id: t.get("CLC"), away_team_id: t.get("Hope Chapel"), matchday: 1 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("KICC"), away_team_id: t.get("Carmel City Church"), matchday: 1 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("RCCG Glory of God"), away_team_id: t.get("GHIC Yeovil"), matchday: 1 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Bristol"), away_team_id: t.get("Dayspring"), matchday: 1 },

    // --- Matchday 2 ---
    { group_id: groupIds.get("Group A"), home_team_id: t.get("BOLM FC"), away_team_id: t.get("CLC"), matchday: 2 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Hope Chapel"), away_team_id: t.get("KICC"), matchday: 2 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Church of Pentecost"), away_team_id: t.get("RCCG Glory of God"), matchday: 2 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Yeovil"), away_team_id: t.get("GHIC Bristol"), matchday: 2 },

    // --- Matchday 3 ---
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Carmel City Church"), away_team_id: t.get("BOLM FC"), matchday: 3 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("CLC"), away_team_id: t.get("KICC"), matchday: 3 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Dayspring"), away_team_id: t.get("Church of Pentecost"), matchday: 3 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("RCCG Glory of God"), away_team_id: t.get("GHIC Bristol"), matchday: 3 },

    // --- Matchday 4 ---
    // Note: CLC and RCCG REST HERE
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Hope Chapel"), away_team_id: t.get("Carmel City Church"), matchday: 4 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("KICC"), away_team_id: t.get("BOLM FC"), matchday: 4 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Yeovil"), away_team_id: t.get("Dayspring"), matchday: 4 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Bristol"), away_team_id: t.get("Church of Pentecost"), matchday: 4 },

    // --- Matchday 5 ---
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Carmel City Church"), away_team_id: t.get("CLC"), matchday: 5 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("BOLM FC"), away_team_id: t.get("Hope Chapel"), matchday: 5 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Dayspring"), away_team_id: t.get("RCCG Glory of God"), matchday: 5 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Church of Pentecost"), away_team_id: t.get("GHIC Yeovil"), matchday: 5 },
  ];

  await failOnError(await supabase.from("fixtures").upsert(fixturesData, { onConflict: "group_id,home_team_id,away_team_id" }));

  // 6. Seed Knockouts
  await failOnError(await supabase.from("knockout_matches").upsert([
    { round: "Semi Final", label: "SF1", sort_order: 1, home_seed: "1st Group A", away_seed: "2nd Group B" },
    { round: "Semi Final", label: "SF2", sort_order: 2, home_seed: "1st Group B", away_seed: "2nd Group A" },
    { round: "Final", label: "Final", sort_order: 3, home_seed: "Winner SF1", away_seed: "Winner SF2" }
  ], { onConflict: "label" }));

  await failOnError(await supabase.rpc("recalculate_standings"));
  await failOnError(await supabase.rpc("refresh_knockout_seeds"));

  console.log("Seeded with hard-coded, non-consecutive fixtures.");
}

main().catch((err) => { console.error(err); process.exit(1); });
