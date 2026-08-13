import { createClient } from "@/lib/supabase/server";
import type { Fixture, Group, Standing, Team } from "@/lib/types";

export async function getTeams() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*, groups(id, name)")
    .order("display_order");

  if (error) throw error;
  return data as (Team & { groups: { id: string; name: string } })[];
}

export async function getGroups() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as Group[];
}

export async function getFixtures() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fixtures")
    .select(
      "*, groups(id, name), home_team:teams!fixtures_home_team_id_fkey(*), away_team:teams!fixtures_away_team_id_fkey(*)"
    )
    .order("matchday")
    .order("created_at");

  if (error) throw error;
  return data as Fixture[];
}

export async function getStandings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("standings")
    .select("*, teams(*), groups(*)");

  if (error) throw error;
  return (data as Standing[]).sort((a, b) => {
    const standingsSort =
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      b.wins - a.wins;

    if (standingsSort !== 0) return standingsSort;

    return (a.teams?.name ?? "").localeCompare(b.teams?.name ?? "", undefined, {
      sensitivity: "base"
    });
  });
}

export async function getResults() {
  const fixtures = await getFixtures();
  return {
    fixtures: fixtures.filter((match) => match.status === "finished"),
  };
}
