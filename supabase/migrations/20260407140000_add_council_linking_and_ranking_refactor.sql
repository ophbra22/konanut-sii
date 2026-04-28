alter table public.regional_councils
  add column if not exists id uuid default gen_random_uuid();

update public.regional_councils
set id = gen_random_uuid()
where id is null;

alter table public.regional_councils
  alter column id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'regional_councils_id_key'
      and conrelid = 'public.regional_councils'::regclass
  ) then
    alter table public.regional_councils
      add constraint regional_councils_id_key unique (id);
  end if;
end
$$;

alter table public.regional_councils
  add column if not exists regional_squad_name text;

update public.regional_councils
set regional_squad_name = 'כיתת כוננות אזורית'
where nullif(trim(coalesce(regional_squad_name, '')), '') is null;

alter table public.regional_councils
  add column if not exists updated_at timestamptz not null default now();

update public.regional_councils
set updated_at = now()
where updated_at is null;

create or replace function public.touch_regional_councils_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists regional_councils_touch_updated_at on public.regional_councils;
create trigger regional_councils_touch_updated_at
before update on public.regional_councils
for each row
execute procedure public.touch_regional_councils_updated_at();

insert into public.regional_councils (name, plaga_name, regional_squad_name)
select distinct
  trim(settlement.regional_council) as name,
  trim(settlement.area) as plaga_name,
  'כיתת כוננות אזורית' as regional_squad_name
from public.settlements settlement
where nullif(trim(coalesce(settlement.regional_council, '')), '') is not null
  and trim(settlement.area) in ('פלגת לכיש', 'פלגת נגב')
on conflict (name) do update
set
  plaga_name = excluded.plaga_name,
  regional_squad_name = coalesce(public.regional_councils.regional_squad_name, excluded.regional_squad_name),
  updated_at = now();

alter table public.settlements
  add column if not exists council_id uuid;

update public.settlements settlement
set council_id = council.id
from public.regional_councils council
where settlement.council_id is null
  and nullif(trim(coalesce(settlement.regional_council, '')), '') is not null
  and lower(trim(council.name)) = lower(trim(settlement.regional_council));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'settlements_council_id_fkey'
      and conrelid = 'public.settlements'::regclass
  ) then
    alter table public.settlements
      add constraint settlements_council_id_fkey
      foreign key (council_id)
      references public.regional_councils (id)
      on delete set null;
  end if;
end
$$;

create index if not exists settlements_council_id_idx
on public.settlements (council_id);

alter table public.settlement_rankings
  add column if not exists median_range_participation_percent integer;

alter table public.settlement_rankings
  add column if not exists settlement_defense_participation_percent integer;

alter table public.settlement_rankings
  add column if not exists base_score integer not null default 0;

alter table public.settlement_rankings
  add column if not exists instructor_feedback_points integer not null default 0;

update public.settlement_rankings
set
  base_score = coalesce(base_score, training_score, 0),
  instructor_feedback_points = coalesce(instructor_feedback_points, feedback_score, 0)
where base_score is null
   or instructor_feedback_points is null;

drop function if exists public.list_global_settlement_rankings(text);

create function public.list_global_settlement_rankings(period_key text)
returns table (
  settlement_id uuid,
  settlement_name text,
  council_id uuid,
  council_name text,
  regional_council text,
  regional_squad_name text,
  plaga_name text,
  half_year_period text,
  shooting_completed boolean,
  defense_completed boolean,
  median_range_participation_percent integer,
  settlement_defense_participation_percent integer,
  base_score integer,
  training_score integer,
  instructor_feedback_points integer,
  feedback_score integer,
  final_score integer,
  ranking_level text,
  calculated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ranking.settlement_id,
    settlement.name as settlement_name,
    settlement.council_id,
    council.name as council_name,
    settlement.regional_council,
    council.regional_squad_name,
    coalesce(
      nullif(trim(coalesce(council.plaga_name, '')), ''),
      nullif(trim(coalesce(settlement.area, '')), '')
    ) as plaga_name,
    ranking.half_year_period,
    ranking.shooting_completed,
    ranking.defense_completed,
    ranking.median_range_participation_percent,
    ranking.settlement_defense_participation_percent,
    ranking.base_score,
    ranking.training_score,
    ranking.instructor_feedback_points,
    ranking.feedback_score,
    ranking.final_score,
    ranking.ranking_level,
    ranking.calculated_at
  from public.settlement_rankings ranking
  join public.settlements settlement
    on settlement.id = ranking.settlement_id
  left join public.regional_councils council
    on council.id = settlement.council_id
  where ranking.half_year_period = period_key
  order by ranking.final_score desc, settlement.name asc;
$$;

grant execute on function public.touch_regional_councils_updated_at() to authenticated;
