alter table public.users_profile
add column if not exists approval_status text not null default 'pending_approval';

alter table public.users_profile
add column if not exists requested_settlement_id uuid references public.settlements (id) on delete set null;

alter table public.users_profile
add column if not exists requested_council_id uuid references public.regional_councils (id) on delete set null;

alter table public.users_profile
add column if not exists requested_plaga_id text;

alter table public.users_profile
add column if not exists approved_by uuid references public.users_profile (id) on delete set null;

alter table public.users_profile
add column if not exists approved_at timestamptz;

alter table public.users_profile
add column if not exists rejected_at timestamptz;

alter table public.users_profile
add column if not exists rejection_reason text;

alter table public.users_profile
drop constraint if exists users_profile_approval_status_check;

alter table public.users_profile
add constraint users_profile_approval_status_check
check (approval_status in ('pending_approval', 'approved', 'rejected'));

update public.users_profile
set approval_status = case
  when is_active = true then 'approved'
  when approval_status = 'rejected' then 'rejected'
  else 'pending_approval'
end;

create unique index if not exists users_profile_phone_unique_idx
on public.users_profile (phone)
where phone is not null;

create index if not exists users_profile_approval_status_idx
on public.users_profile (approval_status);

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
    is_active,
    approval_status
  )
  values (
    new.id,
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), ''),
      'משתמש חדש'
    ),
    new.email,
    coalesce(
      nullif(trim(coalesce(new.phone, '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
    ),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'requested_role', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'settlement_area', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'assigned_plaga', '')), ''),
    'razar',
    false,
    'pending_approval'
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

drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
after insert or update of email, phone, raw_user_meta_data
on auth.users
for each row
execute procedure public.handle_auth_user_change();

create or replace function public.complete_phone_registration(
  user_full_name text,
  requested_role_input text,
  requested_settlement_id_input uuid default null,
  requested_council_id_input uuid default null,
  requested_plaga_id_input text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_roles constant text[] := array[
    'super_admin',
    'instructor',
    'machbal',
    'eshkol_officer',
    'mashkabat',
    'mepag',
    'samepag',
    'razar',
    'sarazar'
  ];
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if nullif(trim(coalesce(user_full_name, '')), '') is null then
    raise exception 'full_name_required';
  end if;

  if requested_role_input is null or not (requested_role_input = any (allowed_roles)) then
    raise exception 'invalid_requested_role';
  end if;

  update public.users_profile
  set
    approval_status = 'pending_approval',
    full_name = trim(user_full_name),
    is_active = false,
    rejected_at = null,
    rejection_reason = null,
    requested_council_id = requested_council_id_input,
    requested_plaga_id = nullif(trim(coalesce(requested_plaga_id_input, '')), ''),
    requested_role = requested_role_input,
    requested_settlement_id = requested_settlement_id_input
  where id = auth.uid()
    and approval_status = 'pending_approval'
    and is_active = false;

  if not found then
    raise exception 'profile_not_available_for_registration';
  end if;

  return true;
end;
$$;

revoke all on function public.complete_phone_registration(
  text,
  text,
  uuid,
  uuid,
  text
) from public;
grant execute on function public.complete_phone_registration(
  text,
  text,
  uuid,
  uuid,
  text
) to authenticated;

create or replace function public.list_phone_registration_options()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'councils',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', council.id,
            'name', council.name,
            'plaga_name', council.plaga_name
          )
          order by council.name
        )
        from public.regional_councils council
      ),
      '[]'::jsonb
    ),
    'settlements',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', settlement.id,
            'name', settlement.name,
            'council_id', settlement.council_id,
            'regional_council', settlement.regional_council
          )
          order by settlement.name
        )
        from public.settlements settlement
        where settlement.is_active = true
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.list_phone_registration_options() from public;
grant execute on function public.list_phone_registration_options() to authenticated;
