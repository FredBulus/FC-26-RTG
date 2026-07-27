create extension if not exists pgcrypto;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_id uuid not null references public.groups(id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  matchday integer not null,
  match_date date,
  kickoff_time time,
  venue text,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_fixture check (home_team_id <> away_team_id),
  constraint unique_group_fixture unique (group_id, home_team_id, away_team_id),
  constraint scores_complete check (
    (home_score is null and away_score is null)
    or (home_score is not null and away_score is not null)
  )
);

create table if not exists public.standings (
  team_id uuid primary key references public.teams(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  played integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer not null default 0,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.knockout_matches (
  id uuid primary key default gen_random_uuid(),
  round text not null check (round in ('Quarter Final', 'Semi Final', 'Final')),
  label text not null unique,
  sort_order integer not null,
  home_seed text,
  away_seed text,
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  match_date date,
  kickoff_time time,
  venue text,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  winner_team_id uuid references public.teams(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knockout_scores_complete check (
    (home_score is null and away_score is null)
    or (home_score is not null and away_score is not null)
  )
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fixtures_touch_updated_at on public.fixtures;
create trigger fixtures_touch_updated_at
before update on public.fixtures
for each row execute function public.touch_updated_at();

drop trigger if exists knockout_touch_updated_at on public.knockout_matches;
create trigger knockout_touch_updated_at
before update on public.knockout_matches
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid()
  );
$$;

create or replace function public.recalculate_standings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.standings (team_id, group_id)
  select id, group_id from public.teams
  on conflict (team_id) do nothing;

  update public.standings s
  set
    played = coalesce(calc.played, 0),
    wins = coalesce(calc.wins, 0),
    draws = coalesce(calc.draws, 0),
    losses = coalesce(calc.losses, 0),
    goals_for = coalesce(calc.goals_for, 0),
    goals_against = coalesce(calc.goals_against, 0),
    goal_difference = coalesce(calc.goals_for, 0) - coalesce(calc.goals_against, 0),
    points = coalesce(calc.points, 0),
    updated_at = now()
  from (
    select
      team_id,
      count(*)::int as played,
      sum(case when goals_for > goals_against then 1 else 0 end)::int as wins,
      sum(case when goals_for = goals_against then 1 else 0 end)::int as draws,
      sum(case when goals_for < goals_against then 1 else 0 end)::int as losses,
      sum(goals_for)::int as goals_for,
      sum(goals_against)::int as goals_against,
      sum(case when goals_for > goals_against then 3 when goals_for = goals_against then 1 else 0 end)::int as points
    from (
      select home_team_id as team_id, home_score as goals_for, away_score as goals_against
      from public.fixtures
      where status = 'finished' and home_score is not null and away_score is not null
      union all
      select away_team_id as team_id, away_score as goals_for, home_score as goals_against
      from public.fixtures
      where status = 'finished' and home_score is not null and away_score is not null
    ) results
    group by team_id
  ) calc
  where s.team_id = calc.team_id;

  update public.standings s
  set played = 0, wins = 0, draws = 0, losses = 0, goals_for = 0, goals_against = 0,
      goal_difference = 0, points = 0, updated_at = now()
  where not exists (
    select 1 from public.fixtures f
    where f.status = 'finished'
      and f.home_score is not null
      and f.away_score is not null
      and (f.home_team_id = s.team_id or f.away_team_id = s.team_id)
  );
end;
$$;

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

create or replace function public.after_fixture_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_standings();
  perform public.refresh_knockout_seeds();
  return coalesce(new, old);
end;
$$;

drop trigger if exists fixtures_recalculate_standings on public.fixtures;
create trigger fixtures_recalculate_standings
after insert or update or delete on public.fixtures
for each row execute function public.after_fixture_change();

create or replace function public.after_knockout_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.winner_team_id = null;
  if new.status = 'finished' and new.home_score is not null and new.away_score is not null then
    if new.home_score > new.away_score then
      new.winner_team_id = new.home_team_id;
    elsif new.away_score > new.home_score then
      new.winner_team_id = new.away_team_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists knockout_pick_winner on public.knockout_matches;
create trigger knockout_pick_winner
before insert or update on public.knockout_matches
for each row execute function public.after_knockout_change();

create or replace function public.after_knockout_progression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_knockout_seeds();
  return new;
end;
$$;

drop trigger if exists knockout_progression on public.knockout_matches;
create trigger knockout_progression
after insert or update on public.knockout_matches
for each row
when (pg_trigger_depth() < 2)
execute function public.after_knockout_progression();

alter table public.groups enable row level security;
alter table public.teams enable row level security;
alter table public.fixtures enable row level security;
alter table public.standings enable row level security;
alter table public.knockout_matches enable row level security;
alter table public.admins enable row level security;

create policy "Public can read groups" on public.groups for select using (true);
create policy "Public can read teams" on public.teams for select using (true);
create policy "Public can read fixtures" on public.fixtures for select using (true);
create policy "Public can read standings" on public.standings for select using (true);
create policy "Public can read knockout matches" on public.knockout_matches for select using (true);

create policy "Admins can manage groups" on public.groups for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage teams" on public.teams for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage fixtures" on public.fixtures for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage standings" on public.standings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage knockout" on public.knockout_matches for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins can read admins" on public.admins for select using (public.is_admin());

insert into public.knockout_matches (round, label, sort_order, home_seed, away_seed)
values
  ('Quarter Final', 'QF1', 1, '1st Group A', '2nd Group B'),
  ('Quarter Final', 'QF2', 2, '1st Group B', '2nd Group A'),
  ('Quarter Final', 'QF3', 3, '1st Group C', '2nd Group D'),
  ('Quarter Final', 'QF4', 4, '1st Group D', '2nd Group C'),
  ('Semi Final', 'SF1', 5, 'Winner QF1', 'Winner QF3'),
  ('Semi Final', 'SF2', 6, 'Winner QF2', 'Winner QF4'),
  ('Final', 'Final', 7, 'Winner SF1', 'Winner SF2')
on conflict (label) do nothing;

select public.recalculate_standings();
select public.refresh_knockout_seeds();
