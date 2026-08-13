import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before verifying fixtures.");
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false }
});

async function main() {
  const { data, error } = await supabase
    .from("fixtures")
    .select("matchday, groups(name), home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name)")
    .order("matchday");

  if (error) throw error;

  const counts = new Map<string, number>();

  for (const fixture of (data ?? []) as any[]) {
    const groupName = Array.isArray(fixture.groups) ? fixture.groups[0]?.name : fixture.groups?.name;
    const homeName = Array.isArray(fixture.home_team) ? fixture.home_team[0]?.name : fixture.home_team?.name;
    const awayName = Array.isArray(fixture.away_team) ? fixture.away_team[0]?.name : fixture.away_team?.name;

    for (const teamName of [homeName, awayName]) {
      const key = [`GW${fixture.matchday}`, groupName, teamName].join("|");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const badCounts = [...counts.entries()].filter(([, count]) => count !== 6);
  const summary = new Map<string, number>();

  for (const [key] of counts) {
    const [gameWeek, groupName] = key.split("|");
    const summaryKey = `${gameWeek} ${groupName}`;
    summary.set(summaryKey, (summary.get(summaryKey) ?? 0) + 1);
  }

  console.log([...summary.entries()].sort().map(([key, count]) => `${key}: ${count} teams`).join("\n"));

  if (badCounts.length > 0) {
    console.error("Unbalanced fixture counts:");
    console.error(badCounts.map(([key, count]) => `${key}: ${count}`).join("\n"));
    process.exit(1);
  }

  console.log("All teams have 6 fixtures per game week.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
