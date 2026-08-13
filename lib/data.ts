import { createClient } from "@/lib/supabase/server";
import { standingsWithPositions } from "@/lib/standings";
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

  const sortedStandings = standingsWithPositions(data as Standing[]);
  const { data: snapshots } = await supabase
    .from("standing_position_snapshots")
    .select("team_id, previous_position");
  const previousPositions = new Map(
    (snapshots ?? []).map((snapshot: { team_id: string; previous_position: number }) => [
      snapshot.team_id,
      snapshot.previous_position
    ])
  );

  return sortedStandings.map((row) => {
    const previousPosition = previousPositions.get(row.team_id);

    return {
      ...row,
      previous_position: previousPosition ?? row.position
    };
  });
}

export async function getResults() {
  const fixtures = await getFixtures();
  return {
    fixtures: fixtures.filter((match) => match.status === "finished"),
  };
}
