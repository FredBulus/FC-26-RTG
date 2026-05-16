import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

// Helper without generics to avoid Vercel "T" name build errors
async function failOnError(promise: Promise<any>) {
  const { data, error } = await promise;
  if (error) {
    console.error("Database Error:", error.message);
    throw new Error(error.message);
  }
  return data;
}

async function main() {
  console.log("🚀 Starting clean seed...");

  // 1. Seed Groups
  await failOnError(supabase.from("groups").upsert([{ name: "Group A" }, { name: "Group B" }], { onConflict: "name" }));
  const groupRows = await failOnError(supabase.from("groups").select("id,name"));
  const groupIds = new Map(groupRows.map((g: any) => [g.name, g.id]));

  // 2. Seed Teams
  const teamSource = [
    { name: "CLC", group_name: "Group A", display_order: 1 },
    { name: "Hope Chapel", group_name: "Group A", display_order: 2 },
    { name: "KICC", group_name: "Group A", display_order: 3 },
    { name: "Carmel City Church", group_name: "Group A", display_order: 4 },
    { name: "BOLM FC", group_name: "Group A", display_order: 5 },
    { name: "RCCG Glory of God", group_name: "Group B", display_order: 1 },
    { name: "GHIC Yeovil", group_name: "Group B", display_order: 2 },
    { name: "GHIC Bristol", group_name: "Group B", display_order: 3 },
    { name: "Dayspring", group_name: "Group B", display_order: 4 },
    { name: "Church of Pentecost", group_name: "Group B", display_order: 5 },
  ];

  const teamData = teamSource.map(t => ({
    name: t.name,
    group_id: groupIds.get(t.group_name),
    display_order: t.display_order
  }));

  await failOnError(supabase.from("teams").upsert(teamData, { onConflict: "name" }));
  const teamRows = await failOnError(supabase.from("teams").select("id, name, group_id"));
  const t = new Map(teamRows.map((team: any) => [team.name, team.id]));

  // 3. Seed Standings
  const standingsData = teamRows.map((team: any) => ({
    team_id: team.id,
    group_id: team.group_id 
  }));
  await failOnError(supabase.from("standings").upsert(standingsData, { onConflict: "team_id" }));

  // 4. NUCLEAR RESET: This wipes the fixtures table completely
  console.log("🧹 Wiping old fixture data...");
  await failOnError(supabase.from("fixtures").delete().neq("matchday", -1));

  // 5. HARD-CODED FIXTURES (Exactly 20 games, 4 matches per matchday)
  const fixturesData = [
    // Matchday 1
    { group_id: groupIds.get("Group A"), home_team_id: t.get("CLC"), away_team_id: t.get("Hope Chapel"), matchday: 1 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("KICC"), away_team_id: t.get("Carmel City Church"), matchday: 1 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("RCCG Glory of God"), away_team_id: t.get("GHIC Yeovil"), matchday: 1 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Bristol"), away_team_id: t.get("Dayspring"), matchday: 1 },

    // Matchday 2
    { group_id: groupIds.get("Group A"), home_team_id: t.get("BOLM FC"), away_team_id: t.get("CLC"), matchday: 2 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Hope Chapel"), away_team_id: t.get("KICC"), matchday: 2 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Church of Pentecost"), away_team_id: t.get("RCCG Glory of God"), matchday: 2 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Yeovil"), away_team_id: t.get("GHIC Bristol"), matchday: 2 },

    // Matchday 3
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Carmel City Church"), away_team_id: t.get("BOLM FC"), matchday: 3 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("CLC"), away_team_id: t.get("KICC"), matchday: 3 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Dayspring"), away_team_id: t.get("Church of Pentecost"), matchday: 3 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("RCCG Glory of God"), away_team_id: t.get("GHIC Bristol"), matchday: 3 },

    // Matchday 4 (CLC and RCCG REST)
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Hope Chapel"), away_team_id: t.get("Carmel City Church"), matchday: 4 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("KICC"), away_team_id: t.get("BOLM FC"), matchday: 4 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Yeovil"), away_team_id: t.get("Dayspring"), matchday: 4 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("GHIC Bristol"), away_team_id: t.get("Church of Pentecost"), matchday: 4 },

    // Matchday 5
    { group_id: groupIds.get("Group A"), home_team_id: t.get("Carmel City Church"), away_team_id: t.get("CLC"), matchday: 5 },
    { group_id: groupIds.get("Group A"), home_team_id: t.get("BOLM FC"), away_team_id: t.get("Hope Chapel"), matchday: 5 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Dayspring"), away_team_id: t.get("RCCG Glory of God"), matchday: 5 },
    { group_id: groupIds.get("Group B"), home_team_id: t.get("Church of Pentecost"), away_team_id: t.get("GHIC Yeovil"), matchday: 5 },
  ];

  // Using .insert instead of .upsert to ensure zero duplicates
  await failOnError(supabase.from("fixtures").insert(fixturesData));
  console.log("✅ 20 Clean fixtures inserted.");

  // 6. Seed Knockouts
  await failOnError(supabase.from("knockout_matches").upsert([
    { round: "Semi Final", label: "SF1", sort_order: 1, home_seed: "1st Group A", away_seed: "2nd Group B" },
    { round: "Semi Final", label: "SF2", sort_order: 2, home_seed: "1st Group B", away_seed: "2nd Group A" },
    { round: "Final", label: "Final", sort_order: 3, home_seed: "Winner SF1", away_seed: "Winner SF2" }
  ], { onConflict: "label" }));

  await failOnError(supabase.rpc("recalculate_standings"));
  await failOnError(supabase.rpc("refresh_knockout_seeds"));

  console.log("🎉 Seeding complete!");
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
