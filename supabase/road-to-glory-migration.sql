alter table public.groups
drop constraint if exists groups_name_check;

alter table public.knockout_matches
drop constraint if exists knockout_matches_round_check;

alter table public.knockout_matches
add constraint knockout_matches_round_check
check (round in ('Quarter Final', 'Semi Final', 'Final'));

create or replace function public.refresh_knockout_seeds()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ga1 uuid;
  ga2 uuid;
  gb1 uuid;
  gb2 uuid;
  gc1 uuid;
  gc2 uuid;
  gd1 uuid;
  gd2 uuid;
  qf1_winner uuid;
  qf2_winner uuid;
  qf3_winner uuid;
  qf4_winner uuid;
  sf1_winner uuid;
  sf2_winner uuid;
begin
  select s.team_id into ga1
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group A'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 0;

  select s.team_id into ga2
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group A'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 1;

  select s.team_id into gb1
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group B'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 0;

  select s.team_id into gb2
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group B'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 1;

  select s.team_id into gc1
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group C'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 0;

  select s.team_id into gc2
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group C'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 1;

  select s.team_id into gd1
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group D'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 0;

  select s.team_id into gd2
  from public.standings s join public.groups g on g.id = s.group_id
  where g.name = 'Group D'
  order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, s.updated_at asc
  limit 1 offset 1;

  update public.knockout_matches
  set home_team_id = ga1, away_team_id = gb2
  where label = 'QF1' and status <> 'finished';

  update public.knockout_matches
  set home_team_id = gb1, away_team_id = ga2
  where label = 'QF2' and status <> 'finished';

  update public.knockout_matches
  set home_team_id = gc1, away_team_id = gd2
  where label = 'QF3' and status <> 'finished';

  update public.knockout_matches
  set home_team_id = gd1, away_team_id = gc2
  where label = 'QF4' and status <> 'finished';

  select winner_team_id into qf1_winner from public.knockout_matches where label = 'QF1';
  select winner_team_id into qf2_winner from public.knockout_matches where label = 'QF2';
  select winner_team_id into qf3_winner from public.knockout_matches where label = 'QF3';
  select winner_team_id into qf4_winner from public.knockout_matches where label = 'QF4';

  update public.knockout_matches
  set home_team_id = qf1_winner, away_team_id = qf3_winner
  where label = 'SF1' and status <> 'finished';

  update public.knockout_matches
  set home_team_id = qf2_winner, away_team_id = qf4_winner
  where label = 'SF2' and status <> 'finished';

  select winner_team_id into sf1_winner from public.knockout_matches where label = 'SF1';
  select winner_team_id into sf2_winner from public.knockout_matches where label = 'SF2';

  update public.knockout_matches
  set home_team_id = sf1_winner, away_team_id = sf2_winner
  where label = 'Final' and status <> 'finished';
end;
$$;
