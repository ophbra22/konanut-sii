alter table public.users_profile
drop constraint if exists users_profile_role_check;

alter table public.users_profile
drop constraint if exists users_profile_requested_role_check;

update public.users_profile
set role = 'razar'
where role = 'viewer';

update public.users_profile
set requested_role = 'razar'
where requested_role = 'viewer';

alter table public.users_profile
add constraint users_profile_role_check
check (
  role in (
    'super_admin',
    'instructor',
    'machbal',
    'eshkol_officer',
    'mashkabat',
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
    'razar',
    'sarazar'
  )
);

create table if not exists public.user_regional_councils (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users_profile (id) on delete cascade,
  regional_council text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_regional_councils_user_id_regional_council_key'
      and conrelid = 'public.user_regional_councils'::regclass
  ) then
    alter table public.user_regional_councils
    add constraint user_regional_councils_user_id_regional_council_key
    unique (user_id, regional_council);
  end if;
end
$$;

create index if not exists user_regional_councils_user_id_idx
on public.user_regional_councils (user_id);

create index if not exists user_regional_councils_regional_council_idx
on public.user_regional_councils (regional_council);

alter table public.user_regional_councils enable row level security;

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
    'razar',
    false
  )
  on conflict (id) do update
  set
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
    public.has_any_role(array[
      'super_admin',
      'instructor',
      'machbal',
      'eshkol_officer',
      'razar',
      'sarazar'
    ])
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

create or replace function public.has_regional_council_access(target_regional_council text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_any_role(array['super_admin', 'instructor', 'razar', 'sarazar'])
    or (
      nullif(trim(coalesce(target_regional_council, '')), '') is not null
      and exists (
        select 1
        from public.user_regional_councils council_link
        join public.users_profile profile
          on profile.id = council_link.user_id
        where council_link.user_id = auth.uid()
          and lower(trim(council_link.regional_council)) =
            lower(trim(target_regional_council))
          and profile.is_active = true
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
    ),
    false
  );
$$;

create or replace function public.can_insert_training(target_instructor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_super_admin()
    or (
      public.is_instructor()
      and (target_instructor_id is null or target_instructor_id = auth.uid())
    ),
    false
  );
$$;

create or replace function public.can_insert_feedback(target_instructor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_super_admin()
    or (
      public.is_instructor()
      and (target_instructor_id is null or target_instructor_id = auth.uid())
    ),
    false
  );
$$;

create or replace function public.can_insert_training_settlement(target_training_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['super_admin', 'instructor']);
$$;

drop policy if exists user_regional_councils_select_self_or_admin
on public.user_regional_councils;

drop policy if exists user_regional_councils_manage_super_admin
on public.user_regional_councils;

create policy user_regional_councils_select_self_or_admin
on public.user_regional_councils
for select
using (
  public.is_super_admin()
  or user_id = auth.uid()
);

create policy user_regional_councils_manage_super_admin
on public.user_regional_councils
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists trainings_select_accessible on public.trainings;
drop policy if exists trainings_select_all_roles on public.trainings;
drop policy if exists trainings_select_role_scoped on public.trainings;

create policy trainings_select_role_scoped
on public.trainings
for select
using (public.has_training_access(id));

drop policy if exists training_settlements_select_accessible on public.training_settlements;
drop policy if exists training_settlements_select_all_roles on public.training_settlements;
drop policy if exists training_settlements_select_role_scoped on public.training_settlements;

create policy training_settlements_select_role_scoped
on public.training_settlements
for select
using (public.has_training_access(training_id));

drop policy if exists trainings_update_super_admin on public.trainings;
drop policy if exists trainings_update_super_admin_or_instructor on public.trainings;

create policy trainings_update_super_admin_or_instructor
on public.trainings
for update
using (public.has_any_role(array['super_admin', 'instructor']))
with check (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists trainings_delete_super_admin on public.trainings;
drop policy if exists trainings_delete_super_admin_or_instructor on public.trainings;

create policy trainings_delete_super_admin_or_instructor
on public.trainings
for delete
using (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists feedbacks_update_super_admin on public.feedbacks;
drop policy if exists feedbacks_update_super_admin_or_instructor on public.feedbacks;

create policy feedbacks_update_super_admin_or_instructor
on public.feedbacks
for update
using (public.has_any_role(array['super_admin', 'instructor']))
with check (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists feedbacks_delete_super_admin on public.feedbacks;
drop policy if exists feedbacks_delete_super_admin_or_instructor on public.feedbacks;

create policy feedbacks_delete_super_admin_or_instructor
on public.feedbacks
for delete
using (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists training_settlements_insert_super_admin_or_instructor
on public.training_settlements;

create policy training_settlements_insert_super_admin_or_instructor
on public.training_settlements
for insert
with check (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists training_settlements_update_super_admin on public.training_settlements;
drop policy if exists training_settlements_update_super_admin_or_instructor
on public.training_settlements;

create policy training_settlements_update_super_admin_or_instructor
on public.training_settlements
for update
using (public.has_any_role(array['super_admin', 'instructor']))
with check (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists training_settlements_delete_super_admin on public.training_settlements;
drop policy if exists training_settlements_delete_super_admin_or_instructor
on public.training_settlements;

create policy training_settlements_delete_super_admin_or_instructor
on public.training_settlements
for delete
using (public.has_any_role(array['super_admin', 'instructor']));

grant execute on function public.has_settlement_access(uuid) to authenticated;
grant execute on function public.has_regional_council_access(text) to authenticated;
grant execute on function public.has_training_access(uuid) to authenticated;
grant execute on function public.can_insert_training(uuid) to authenticated;
grant execute on function public.can_insert_feedback(uuid) to authenticated;
grant execute on function public.can_insert_training_settlement(uuid) to authenticated;
