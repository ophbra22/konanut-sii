alter table public.users_profile
drop constraint if exists users_profile_role_check;

alter table public.users_profile
add constraint users_profile_role_check
check (role in ('super_admin', 'instructor', 'mashkabat', 'viewer'));

alter table public.users_profile
drop constraint if exists users_profile_requested_role_check;

alter table public.users_profile
add constraint users_profile_requested_role_check
check (
  requested_role is null
  or requested_role in ('super_admin', 'instructor', 'mashkabat', 'viewer')
);

create table if not exists public.user_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile (id) on delete cascade,
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_settlements_user_id_settlement_id_key'
      and conrelid = 'public.user_settlements'::regclass
  ) then
    alter table public.user_settlements
    add constraint user_settlements_user_id_settlement_id_key
    unique (user_id, settlement_id);
  end if;
end
$$;

create index if not exists user_settlements_user_id_idx
on public.user_settlements (user_id);

create index if not exists user_settlements_settlement_id_idx
on public.user_settlements (settlement_id);

create index if not exists user_settlements_user_settlement_idx
on public.user_settlements (user_id, settlement_id);

create or replace function public.is_mashkabat()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['mashkabat']);
$$;
