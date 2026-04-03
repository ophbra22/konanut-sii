create extension if not exists pgcrypto;

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  regional_council text,
  area text not null,
  coordinator_name text,
  coordinator_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null check (role in ('super_admin', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile (id) on delete cascade,
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, settlement_id)
);

create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  training_type text not null check (
    training_type in (
      'מטווח',
      'הגנת יישוב',
      'אימון יבש',
      'ריענון',
      'תרגיל',
      'אימון לילה',
      'חירום'
    )
  ),
  location text,
  instructor_id uuid references public.users_profile (id) on delete set null,
  training_date date not null,
  training_time time,
  status text not null default 'מתוכנן' check (
    status in ('מתוכנן', 'הושלם', 'בוטל', 'נדחה')
  ),
  notes text,
  created_at timestamptz not null default now()
);

create table public.training_settlements (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id) on delete cascade,
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (training_id, settlement_id)
);

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id) on delete cascade,
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  instructor_id uuid references public.users_profile (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text,
  severity text not null check (severity in ('low', 'medium', 'high')),
  related_settlement_id uuid references public.settlements (id) on delete set null,
  related_training_id uuid references public.trainings (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table public.settlement_rankings (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  half_year_period text not null,
  shooting_completed boolean not null default false,
  defense_completed boolean not null default false,
  training_score integer not null default 0,
  feedback_score integer not null default 0,
  final_score integer not null default 0,
  ranking_level text not null,
  calculated_at timestamptz not null default now(),
  unique (settlement_id, half_year_period)
);

create index settlements_name_idx on public.settlements (name);
create index settlements_is_active_idx on public.settlements (is_active);
create index user_settlements_user_id_idx on public.user_settlements (user_id);
create index user_settlements_settlement_id_idx on public.user_settlements (settlement_id);
create index trainings_training_date_idx on public.trainings (training_date);
create index trainings_status_idx on public.trainings (status);
create index trainings_instructor_id_idx on public.trainings (instructor_id);
create index training_settlements_training_id_idx on public.training_settlements (training_id);
create index training_settlements_settlement_id_idx on public.training_settlements (settlement_id);
create index feedbacks_training_id_idx on public.feedbacks (training_id);
create index feedbacks_settlement_id_idx on public.feedbacks (settlement_id);
create index alerts_related_settlement_id_idx on public.alerts (related_settlement_id);
create index alerts_related_training_id_idx on public.alerts (related_training_id);
create index alerts_status_idx on public.alerts (status);
create index settlement_rankings_settlement_id_idx on public.settlement_rankings (settlement_id);
create index settlement_rankings_period_idx on public.settlement_rankings (half_year_period);

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
    'viewer',
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = case
      when trim(coalesce(public.users_profile.full_name, '')) = '' then excluded.full_name
      else public.users_profile.full_name
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute procedure public.handle_auth_user_change();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users_profile
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'super_admin', false);
$$;

create or replace function public.has_settlement_access(target_settlement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_super_admin()
    or exists (
      select 1
      from public.user_settlements user_link
      join public.users_profile profile
        on profile.id = user_link.user_id
      where user_link.user_id = auth.uid()
        and user_link.settlement_id = target_settlement_id
        and profile.is_active = true
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
    public.is_super_admin()
    or exists (
      select 1
      from public.training_settlements training_link
      where training_link.training_id = target_training_id
        and public.has_settlement_access(training_link.settlement_id)
    ),
    false
  );
$$;

alter table public.settlements enable row level security;
alter table public.users_profile enable row level security;
alter table public.user_settlements enable row level security;
alter table public.trainings enable row level security;
alter table public.training_settlements enable row level security;
alter table public.feedbacks enable row level security;
alter table public.alerts enable row level security;
alter table public.settlement_rankings enable row level security;

create policy settlements_select_accessible
on public.settlements
for select
using (
  public.is_super_admin()
  or public.has_settlement_access(id)
);

create policy settlements_manage_super_admin
on public.settlements
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy users_profile_select_self_or_admin
on public.users_profile
for select
using (
  public.is_super_admin()
  or id = auth.uid()
);

create policy users_profile_manage_super_admin
on public.users_profile
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy user_settlements_select_self_or_admin
on public.user_settlements
for select
using (
  public.is_super_admin()
  or user_id = auth.uid()
);

create policy user_settlements_manage_super_admin
on public.user_settlements
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy trainings_select_accessible
on public.trainings
for select
using (
  public.is_super_admin()
  or public.has_training_access(id)
);

create policy trainings_manage_super_admin
on public.trainings
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy training_settlements_select_accessible
on public.training_settlements
for select
using (
  public.is_super_admin()
  or public.has_training_access(training_id)
  or public.has_settlement_access(settlement_id)
);

create policy training_settlements_manage_super_admin
on public.training_settlements
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy feedbacks_select_accessible
on public.feedbacks
for select
using (
  public.is_super_admin()
  or public.has_settlement_access(settlement_id)
  or public.has_training_access(training_id)
);

create policy feedbacks_manage_super_admin
on public.feedbacks
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy alerts_select_accessible
on public.alerts
for select
using (
  public.is_super_admin()
  or (
    related_settlement_id is not null
    and public.has_settlement_access(related_settlement_id)
  )
  or (
    related_training_id is not null
    and public.has_training_access(related_training_id)
  )
);

create policy alerts_manage_super_admin
on public.alerts
for all
using (public.is_super_admin())
with check (public.is_super_admin());

create policy settlement_rankings_select_accessible
on public.settlement_rankings
for select
using (
  public.is_super_admin()
  or public.has_settlement_access(settlement_id)
);

create policy settlement_rankings_manage_super_admin
on public.settlement_rankings
for all
using (public.is_super_admin())
with check (public.is_super_admin());

grant usage on schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
grant execute on functions to authenticated;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant usage, select on sequences to authenticated;
