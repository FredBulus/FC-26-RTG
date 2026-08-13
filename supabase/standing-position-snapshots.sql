create table if not exists public.standing_position_snapshots (
  team_id uuid primary key references public.teams(id) on delete cascade,
  previous_position integer not null check (previous_position > 0),
  updated_at timestamptz not null default now()
);

alter table public.standing_position_snapshots enable row level security;

drop policy if exists "Public can read standing position snapshots" on public.standing_position_snapshots;
create policy "Public can read standing position snapshots"
on public.standing_position_snapshots for select using (true);

drop policy if exists "Admins can manage standing position snapshots" on public.standing_position_snapshots;
create policy "Admins can manage standing position snapshots"
on public.standing_position_snapshots for all
using (public.is_admin())
with check (public.is_admin());

insert into public.standing_position_snapshots (team_id, previous_position)
select ranked.team_id, ranked.position
from (
  select
    s.team_id,
    row_number() over (
      order by s.points desc, s.goal_difference desc, s.goals_for desc, s.wins desc, t.name asc
    )::int as position
  from public.standings s
  join public.teams t on t.id = s.team_id
) ranked
on conflict (team_id) do update
set previous_position = excluded.previous_position,
    updated_at = now();
