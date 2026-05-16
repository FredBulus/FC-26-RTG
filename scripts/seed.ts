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

function failOnError<T>(obj: { error: { message: string } | null; data: T }): T {
  if (obj.error) throw obj.error;
  return obj.data;
}

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

function failOnError<T>({ error, data }: { error: { message: string } | null; data: T }) {
  if (error) throw error;
  return data;
}

async function main() {
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

  await failOnError(
    await supabase.from("standings").upsert(
      teamRows.map((team) => ({ team_id: team.id, group_id: team.group_id })),
      { onConflict: "team_id" }
    )
  );

  const fixtures = groups.flatMap((groupName) => {
    const groupId = groupIds.get(groupName)!;
    const groupTeams = teamRows
      .filter((team) => team.group_id === groupId)
      .sort((a, b) => a.display_order - b.display_order);

    const rows: {
      group_id: string;
      home_team_id: string;
      away_team_id: string;
      matchday: number;
    }[] = [];
    let matchday = 1;
    for (let i = 0; i < groupTeams.length; i += 1) {
      for (let j = i + 1; j < groupTeams.length; j += 1) {
        rows.push({
          group_id: groupId,
          home_team_id: groupTeams[i].id,
          away_team_id: groupTeams[j].id,
          matchday: matchday++
        });
      }
    }
    return rows;
  });

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
  await failOnError(await supabase.rpc("recalculate_standings"));
  await failOnError(await supabase.rpc("refresh_knockout_seeds"));

  console.log("Seeded Legacy Tournament 2026.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
