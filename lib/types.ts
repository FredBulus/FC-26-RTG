export type Group = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  group_id: string;
  display_order: number;
};

export type Fixture = {
  id: string;
  group_id: string;
  home_team_id: string;
  away_team_id: string;
  matchday: number;
  match_date: string | null;
  kickoff_time: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
  groups?: Group | null;
  home_team?: Team | null;
  away_team?: Team | null;
};

export type Standing = {
  team_id: string;
  group_id: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  teams?: Team | null;
  groups?: Group | null;
};
