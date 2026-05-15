import { createClient } from "@/lib/supabase/server";
import type { Fixture, KnockoutMatch, Standing, Team } from "@/lib/types";

export async function getTeams() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*, groups(id, name)")
    .order("display_order");

  if (error) throw error;
  return data as (Team & { groups: { id: string; name: string } })[];
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
    .select("*, teams(*), groups(*)")
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false })
    .order("wins", { ascending: false });

  if (error) throw error;
  return data as Standing[];
}

export async function getKnockoutMatches() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knockout_matches")
    .select(
      "*, home_team:teams!knockout_matches_home_team_id_fkey(*), away_team:teams!knockout_matches_away_team_id_fkey(*), winner_team:teams!knockout_matches_winner_team_id_fkey(*)"
    )
    .order("sort_order");

  if (error) throw error;
  return data as KnockoutMatch[];
}

export async function getResults() {
  const [fixtures, knockout] = await Promise.all([getFixtures(), getKnockoutMatches()]);
  return {
    fixtures: fixtures.filter((match) => match.status === "finished"),
    knockout: knockout.filter((match) => match.status === "finished")
  };
}
