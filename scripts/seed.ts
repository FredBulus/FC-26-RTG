import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

// Removed all TypeScript generics (<T>) to stop Vercel build errors
async function check(promise: any) {
  const res = await promise;
  if (res.error) {
    console.error("DB Error:", res.error.message);
    throw res.error;
  }
  return res.data;
}

async function main() {
  console.log("Starting FC 26 Tournament (Road to Glory) seed...");

  const groups = [
    {
      name: "Group A",
      teams: ["Onli-1-ik", "Lastbreed77", "Freddreek", "Mr-blaze24-", "Ibelieverr"]
    },
    {
      name: "Group B",
      teams: ["ethanol_c", "lmw2288", "Quivcy", "Sixdigits_man"]
    },
    {
      name: "Group C",
      teams: ["Kinginthe_west", "Demreal", "Lordswiss", "ireayo_1"]
    },
    {
      name: "Group D",
      teams: ["Blvck_sparrow60", "Deelo_official", "Sanematic", "Blavk_dots13"]
    }
  ];

  // 1. Clean previous tournament data, keeping admins/auth intact.
  await check(supabase.from("knockout_matches").delete().neq("label", "__never__"));
  await check(supabase.from("groups").delete().neq("name", "__never__"));

  // 2. Groups
  await check(
    supabase
      .from("groups")
      .insert(groups.map((group) => ({ name: group.name })))
  );
  const groupRows = await check(supabase.from("groups").select("id,name"));
  const groupIds = new Map(groupRows.map((g: any) => [g.name, g.id]));

  // 3. Teams
  const teamData = groups.flatMap((group) => group.teams.map((teamName, index) => ({
    name: teamName,
    group_id: groupIds.get(group.name),
    display_order: index + 1
  })));

  await check(supabase.from("teams").insert(teamData));
  const teamRows = await check(supabase.from("teams").select("id, name, group_id, display_order"));

  // 4. Standings
  const standingsData = teamRows.map((team: any) => ({
    team_id: team.id,
    group_id: team.group_id
  }));
  await check(supabase.from("standings").insert(standingsData));

  const t = new Map(teamRows.map((team: any) => [team.name, team.id]));

  // 5. Fixtures: home-and-away round-robin within each group.
  const fixturesData = groups.flatMap((group) => {
    const groupId = groupIds.get(group.name);
    const fixtures = [];

    for (let homeIndex = 0; homeIndex < group.teams.length; homeIndex += 1) {
      for (let awayIndex = homeIndex + 1; awayIndex < group.teams.length; awayIndex += 1) {
        fixtures.push({
          group_id: groupId,
          home_team_id: t.get(group.teams[homeIndex]),
          away_team_id: t.get(group.teams[awayIndex]),
          matchday: fixtures.length + 1
        });
        fixtures.push({
          group_id: groupId,
          home_team_id: t.get(group.teams[awayIndex]),
          away_team_id: t.get(group.teams[homeIndex]),
          matchday: fixtures.length + 1
        });
      }
    }

    return fixtures;
  });

  await check(supabase.from("fixtures").insert(fixturesData));
  console.log(`${fixturesData.length} group fixtures inserted.`);

  // 6. Knockouts
  await check(supabase.from("knockout_matches").insert([
    { round: "Quarter Final", label: "QF1", sort_order: 1, home_seed: "1st Group A", away_seed: "2nd Group B" },
    { round: "Quarter Final", label: "QF2", sort_order: 2, home_seed: "1st Group B", away_seed: "2nd Group A" },
    { round: "Quarter Final", label: "QF3", sort_order: 3, home_seed: "1st Group C", away_seed: "2nd Group D" },
    { round: "Quarter Final", label: "QF4", sort_order: 4, home_seed: "1st Group D", away_seed: "2nd Group C" },
    { round: "Semi Final", label: "SF1", sort_order: 5, home_seed: "Winner QF1", away_seed: "Winner QF3" },
    { round: "Semi Final", label: "SF2", sort_order: 6, home_seed: "Winner QF2", away_seed: "Winner QF4" },
    { round: "Final", label: "Final", sort_order: 7, home_seed: "Winner SF1", away_seed: "Winner SF2" }
  ]));

  await check(supabase.rpc("recalculate_standings"));
  await check(supabase.rpc("refresh_knockout_seeds"));

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
