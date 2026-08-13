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
    "Ibelieverr",
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
    "Funzy600",
    "Emeka",
    "Gameon9910"
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const groupASeeds = [
    "Blvck_sparrow60",
    "Sixdigits_man",
    "Demreal",
    "Onli-1-ik",
    "Sanematic"
  ];
  const groupBSeeds = ["Mr-blaze24-", "Fr3ddreek", "Lastbreed77", "Quivcy"];

  function seededShuffle(values: string[]) {
    return [...values].sort((a, b) => {
      const score = (value: string) =>
        Array.from(value).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 7), 0) % 997;
      return score(a) - score(b) || a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }

  const seededPlayers = new Set([...groupASeeds, ...groupBSeeds]);
  const remainingPlayers = seededShuffle(teamNames.filter((teamName) => !seededPlayers.has(teamName)));
  const groupA = [...groupASeeds, ...remainingPlayers.slice(0, 5)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  const groupB = [...groupBSeeds, ...remainingPlayers.slice(5)].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  const groups = [
    { name: "Group A", teams: groupA },
    { name: "Group B", teams: groupB }
  ];

  console.log(`Group A: ${groupA.join(", ")}`);
  console.log(`Group B: ${groupB.join(", ")}`);

  // 1. Clean previous tournament data, keeping admins/auth intact.
  await check(supabase.from("knockout_matches").delete().neq("label", "__never__"));
  await check(supabase.from("groups").delete().neq("name", "__never__"));

  // 2. Groups
  await check(supabase.from("groups").insert(groups.map((group) => ({ name: group.name }))));
  const groupRows = await check(supabase.from("groups").select("id,name"));
  const groupIds = new Map(groupRows.map((group: any) => [group.name, group.id]));

  // 3. Teams
  const teamData = groups.flatMap((group) =>
    group.teams.map((teamName, index) => ({
      name: teamName,
      group_id: groupIds.get(group.name),
      display_order: index + 1
    }))
  );

  await check(supabase.from("teams").insert(teamData));
  const teamRows = await check(supabase.from("teams").select("id, name, group_id, display_order"));

  // 4. Standings
  const standingsData = teamRows.map((team: any) => ({
    team_id: team.id,
    group_id: team.group_id
  }));
  await check(supabase.from("standings").insert(standingsData));

  const t = new Map(teamRows.map((team: any) => [team.name, team.id]));

  // 5. Fixtures: 18 round-robin rounds per group, 6 rounds per game week.
  function buildGroupFixtures(group: { name: string; teams: string[] }) {
    const groupId = groupIds.get(group.name);
    const fixedTeam = group.teams[0];
    let rotatingTeams = group.teams.slice(1);
    const firstHalfRounds = [];

    for (let roundIndex = 0; roundIndex < group.teams.length - 1; roundIndex += 1) {
      const roundTeams = [fixedTeam, ...rotatingTeams];
      const matches = [];

      for (let matchIndex = 0; matchIndex < roundTeams.length / 2; matchIndex += 1) {
        const firstTeam = roundTeams[matchIndex];
        const secondTeam = roundTeams[roundTeams.length - 1 - matchIndex];
        const swapHome = (roundIndex + matchIndex) % 2 === 1;

        matches.push({
          group_id: groupId,
          home_team_id: t.get(swapHome ? secondTeam : firstTeam),
          away_team_id: t.get(swapHome ? firstTeam : secondTeam)
        });
      }

      firstHalfRounds.push(matches);
      rotatingTeams = [rotatingTeams[rotatingTeams.length - 1], ...rotatingTeams.slice(0, -1)];
    }

    const secondHalfRounds = firstHalfRounds.map((matches) =>
      matches.map((fixture) => ({
        group_id: groupId,
        home_team_id: fixture.away_team_id,
        away_team_id: fixture.home_team_id
      }))
    );

    return [...firstHalfRounds, ...secondHalfRounds].flatMap((matches, roundIndex) =>
      matches.map((fixture) => ({
        ...fixture,
        matchday: Math.floor(roundIndex / 6) + 1
      }))
    );
  }

  const fixturesByGroup = groups.map((group) => buildGroupFixtures(group));

  const fixturesData = [1, 2, 3].flatMap((matchday) =>
    fixturesByGroup.flatMap((groupFixtures) =>
      groupFixtures.filter((fixture) => fixture.matchday === matchday)
    )
  );

  await check(supabase.from("fixtures").insert(fixturesData));
  console.log(`${fixturesData.length} league fixtures inserted across 3 game weeks.`);

  await check(supabase.rpc("recalculate_standings"));
  await check(
    supabase
      .from("standing_position_snapshots")
      .upsert(
        groups.flatMap((group) => group.teams.map((teamName, index) => ({
          team_id: t.get(teamName),
          previous_position: index + 1
        }))),
        { onConflict: "team_id" }
      )
  );

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
