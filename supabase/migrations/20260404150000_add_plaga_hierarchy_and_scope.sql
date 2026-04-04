create table if not exists public.regional_councils (
  name text primary key,
  plaga_name text not null,
  created_at timestamptz not null default now()
);

alter table public.regional_councils
drop constraint if exists regional_councils_plaga_name_check;

alter table public.regional_councils
add constraint regional_councils_plaga_name_check
check (plaga_name in ('פלגת לכיש', 'פלגת נגב'));

alter table public.regional_councils enable row level security;

insert into public.regional_councils (name, plaga_name)
select distinct
  trim(settlement.regional_council) as name,
  trim(settlement.area) as plaga_name
from public.settlements settlement
where nullif(trim(coalesce(settlement.regional_council, '')), '') is not null
  and trim(settlement.area) in ('פלגת לכיש', 'פלגת נגב')
on conflict (name) do update
set plaga_name = excluded.plaga_name;

alter table public.users_profile
add column if not exists assigned_plaga text;

alter table public.users_profile
drop constraint if exists users_profile_role_check;

alter table public.users_profile
drop constraint if exists users_profile_requested_role_check;

alter table public.users_profile
drop constraint if exists users_profile_assigned_plaga_check;

alter table public.users_profile
add constraint users_profile_role_check
check (
  role in (
    'super_admin',
    'instructor',
    'machbal',
    'eshkol_officer',
    'mashkabat',
    'mepag',
    'samepag',
    'razar',
    'sarazar'
  )
);

alter table public.users_profile
add constraint users_profile_requested_role_check
check (
  requested_role is null
  or requested_role in (
    'super_admin',
    'instructor',
    'machbal',
    'eshkol_officer',
    'mashkabat',
    'mepag',
    'samepag',
    'razar',
    'sarazar'
  )
);

alter table public.users_profile
add constraint users_profile_assigned_plaga_check
check (
  assigned_plaga is null
  or assigned_plaga in ('פלגת לכיש', 'פלגת נגב')
);

create or replace function public.current_assigned_plaga()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select assigned_plaga
  from public.users_profile
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.has_plaga_access(target_plaga text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_any_role(array['super_admin', 'instructor', 'razar', 'sarazar'])
    or (
      public.has_any_role(array['mepag', 'samepag'])
      and nullif(trim(coalesce(target_plaga, '')), '') is not null
      and lower(trim(target_plaga)) =
        lower(trim(coalesce(public.current_assigned_plaga(), '')))
    ),
    false
  );
$$;

create or replace function public.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users_profile (
    id,
    full_name,
    email,
    phone,
    requested_role,
    requested_area,
    assigned_plaga,
    role,
    is_active
  )
  values (
    new.id,
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), ''),
      'משתמש חדש'
    ),
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'requested_role', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'settlement_area', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'assigned_plaga', '')), ''),
    'razar',
    false
  )
  on conflict (id) do update
  set
    assigned_plaga = coalesce(excluded.assigned_plaga, public.users_profile.assigned_plaga),
    email = excluded.email,
    phone = coalesce(excluded.phone, public.users_profile.phone),
    requested_role = coalesce(excluded.requested_role, public.users_profile.requested_role),
    requested_area = coalesce(excluded.requested_area, public.users_profile.requested_area),
    full_name = case
      when trim(coalesce(public.users_profile.full_name, '')) = ''
        or public.users_profile.full_name = 'משתמש חדש'
      then excluded.full_name
      else public.users_profile.full_name
    end;

  return new;
end;
$$;

create or replace function public.has_settlement_access(target_settlement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_any_role(array['super_admin', 'instructor', 'razar', 'sarazar'])
    or (
      public.has_any_role(array['machbal', 'eshkol_officer'])
      and exists (
        select 1
        from public.settlements settlement
        where settlement.id = target_settlement_id
          and public.has_regional_council_access(settlement.regional_council)
      )
    )
    or (
      public.has_any_role(array['mashkabat'])
      and exists (
        select 1
        from public.user_settlements user_link
        join public.users_profile profile
          on profile.id = user_link.user_id
        where user_link.user_id = auth.uid()
          and user_link.settlement_id = target_settlement_id
          and profile.is_active = true
      )
    )
    or (
      public.has_any_role(array['mepag', 'samepag'])
      and exists (
        select 1
        from public.settlements settlement
        left join public.regional_councils council
          on lower(trim(council.name)) = lower(trim(coalesce(settlement.regional_council, '')))
        where settlement.id = target_settlement_id
          and public.has_plaga_access(
            coalesce(
              nullif(trim(coalesce(council.plaga_name, '')), ''),
              nullif(trim(coalesce(settlement.area, '')), '')
            )
          )
      )
    ),
    false
  );
$$;

create or replace function public.has_training_access(target_training_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_any_role(array['super_admin', 'instructor', 'razar', 'sarazar'])
    or (
      public.has_any_role(array['machbal', 'eshkol_officer'])
      and exists (
        select 1
        from public.training_settlements training_link
        join public.settlements settlement
          on settlement.id = training_link.settlement_id
        where training_link.training_id = target_training_id
          and public.has_regional_council_access(settlement.regional_council)
      )
    )
    or (
      public.has_any_role(array['mashkabat'])
      and exists (
        select 1
        from public.training_settlements training_link
        where training_link.training_id = target_training_id
          and public.has_settlement_access(training_link.settlement_id)
      )
    )
    or (
      public.has_any_role(array['mepag', 'samepag'])
      and exists (
        select 1
        from public.training_settlements training_link
        join public.settlements settlement
          on settlement.id = training_link.settlement_id
        left join public.regional_councils council
          on lower(trim(council.name)) = lower(trim(coalesce(settlement.regional_council, '')))
        where training_link.training_id = target_training_id
          and public.has_plaga_access(
            coalesce(
              nullif(trim(coalesce(council.plaga_name, '')), ''),
              nullif(trim(coalesce(settlement.area, '')), '')
            )
          )
      )
    ),
    false
  );
$$;

create or replace function public.list_global_settlement_rankings(period_key text)
returns table (
  settlement_id uuid,
  settlement_name text,
  regional_council text,
  plaga_name text,
  half_year_period text,
  shooting_completed boolean,
  defense_completed boolean,
  training_score integer,
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
    settlement.regional_council,
    coalesce(
      nullif(trim(coalesce(council.plaga_name, '')), ''),
      nullif(trim(coalesce(settlement.area, '')), '')
    ) as plaga_name,
    ranking.half_year_period,
    ranking.shooting_completed,
    ranking.defense_completed,
    ranking.training_score,
    ranking.feedback_score,
    ranking.final_score,
    ranking.ranking_level,
    ranking.calculated_at
  from public.settlement_rankings ranking
  join public.settlements settlement
    on settlement.id = ranking.settlement_id
  left join public.regional_councils council
    on lower(trim(council.name)) = lower(trim(coalesce(settlement.regional_council, '')))
  where ranking.half_year_period = period_key
  order by ranking.final_score desc, settlement.name asc;
$$;

drop policy if exists regional_councils_select_active_users on public.regional_councils;
drop policy if exists regional_councils_manage_super_admin on public.regional_councils;

create policy regional_councils_select_active_users
on public.regional_councils
for select
using (public.is_active_user());

create policy regional_councils_manage_super_admin
on public.regional_councils
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists settlements_select_accessible on public.settlements;
drop policy if exists settlements_select_all_roles on public.settlements;
drop policy if exists settlements_select_role_scoped on public.settlements;

create policy settlements_select_role_scoped
on public.settlements
for select
using (public.has_settlement_access(id));

drop policy if exists feedbacks_select_accessible on public.feedbacks;
drop policy if exists feedbacks_select_all_roles on public.feedbacks;
drop policy if exists feedbacks_select_role_scoped on public.feedbacks;

create policy feedbacks_select_role_scoped
on public.feedbacks
for select
using (
  public.has_settlement_access(settlement_id)
  or public.has_training_access(training_id)
);

drop policy if exists alerts_select_accessible on public.alerts;
drop policy if exists alerts_select_all_roles on public.alerts;
drop policy if exists alerts_select_role_scoped on public.alerts;

create policy alerts_select_role_scoped
on public.alerts
for select
using (
  (
    related_settlement_id is not null
    and public.has_settlement_access(related_settlement_id)
  )
  or (
    related_training_id is not null
    and public.has_training_access(related_training_id)
  )
  or (
    related_training_id is null
    and related_settlement_id is null
    and public.is_active_user()
  )
);

grant execute on function public.current_assigned_plaga() to authenticated;
grant execute on function public.has_plaga_access(text) to authenticated;
grant execute on function public.has_settlement_access(uuid) to authenticated;
grant execute on function public.has_training_access(uuid) to authenticated;
grant execute on function public.list_global_settlement_rankings(text) to authenticated;
