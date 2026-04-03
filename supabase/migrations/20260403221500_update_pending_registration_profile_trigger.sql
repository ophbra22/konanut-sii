alter table public.users_profile
add column if not exists requested_role text
check (requested_role in ('super_admin', 'instructor', 'viewer'));

alter table public.users_profile
add column if not exists requested_area text;

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
    'viewer',
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
