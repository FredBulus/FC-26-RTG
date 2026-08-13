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
  console.log("Starting FC 26 League seed...");

  const teamNames = [
    "A1teey",
    "Deelo_official",
    "Fr3ddreek",
    "Sixdigits_man",
    "ireayo_1",
    "Blavk_dots13",
    "Kinginthe_west",
    "Imw2288",
    "Blvck_sparrow60",
    "Onli-1-ik",
    "Quivcy",
    "Lordswiss",
    "Demreal",
    "ethanol_c",
    "Mr-blaze24-",
    "Lastbreed77",
    "Sanematic",
    "Funzy",
    "Emeka"
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  // 1. Clean previous tournament data, keeping admins/auth intact.
  await check(supabase.from("knockout_matches").delete().neq("label", "__never__"));
  await check(supabase.from("groups").delete().neq("name", "__never__"));

  // 2. League
  await check(supabase.from("groups").insert([{ name: "League" }]));
  const groupRows = await check(supabase.from("groups").select("id,name"));
  const leagueId = groupRows.find((group: any) => group.name === "League")?.id;

  // 3. Teams
  const teamData = teamNames.map((teamName, index) => ({
    name: teamName,
    group_id: leagueId,
    display_order: index + 1
  }));

  await check(supabase.from("teams").insert(teamData));
  const teamRows = await check(supabase.from("teams").select("id, name, group_id, display_order"));

  // 4. Standings
  const standingsData = teamRows.map((team: any) => ({
    team_id: team.id,
    group_id: team.group_id
  }));
  await check(supabase.from("standings").insert(standingsData));

  const t = new Map(teamRows.map((team: any) => [team.name, team.id]));

  // 5. Fixtures: every team plays every other team home and away.
  const fixturePairs = [];

  for (let homeIndex = 0; homeIndex < teamNames.length; homeIndex += 1) {
    for (let awayIndex = homeIndex + 1; awayIndex < teamNames.length; awayIndex += 1) {
      fixturePairs.push({
        group_id: leagueId,
        home_team_id: t.get(teamNames[homeIndex]),
        away_team_id: t.get(teamNames[awayIndex])
      });
      fixturePairs.push({
        group_id: leagueId,
        home_team_id: t.get(teamNames[awayIndex]),
        away_team_id: t.get(teamNames[homeIndex])
      });
    }
  }

  const fixturesData = fixturePairs.map((fixture, index) => ({
    ...fixture,
    matchday: Math.floor((index * 4) / fixturePairs.length) + 1
  }));

  await check(supabase.from("fixtures").insert(fixturesData));
  console.log(`${fixturesData.length} league fixtures inserted across 4 game weeks.`);

  await check(supabase.rpc("recalculate_standings"));
  await check(
    supabase
      .from("standing_position_snapshots")
      .upsert(
        teamNames.map((teamName, index) => ({
          team_id: t.get(teamName),
          previous_position: index + 1
        })),
        { onConflict: "team_id" }
      )
  );

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
