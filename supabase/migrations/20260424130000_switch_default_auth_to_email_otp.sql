create unique index if not exists users_profile_email_unique_idx
on public.users_profile (lower(email))
where email is not null;

create or replace function public.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(nullif(trim(coalesce(new.email, '')), ''));
  is_system_admin boolean := normalized_email = 'ophbra22@gmail.com';
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
    approval_status,
    approved_at
  )
  values (
    new.id,
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
      case when is_system_admin then 'מנהל מערכת' else null end,
      'משתמש חדש'
    ),
    normalized_email,
    coalesce(
      nullif(trim(coalesce(new.phone, '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
    ),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'requested_role', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'settlement_area', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'assigned_plaga', '')), ''),
    case when is_system_admin then 'super_admin' else 'razar' end,
    is_system_admin,
    case when is_system_admin then 'approved' else 'pending_approval' end,
    case when is_system_admin then now() else null end
  )
  on conflict (id) do update
  set
    approval_status = case
      when is_system_admin then 'approved'
      else public.users_profile.approval_status
    end,
    approved_at = case
      when is_system_admin then coalesce(public.users_profile.approved_at, now())
      else public.users_profile.approved_at
    end,
    assigned_plaga = coalesce(excluded.assigned_plaga, public.users_profile.assigned_plaga),
    email = coalesce(excluded.email, public.users_profile.email),
    is_active = case
      when is_system_admin then true
      else public.users_profile.is_active
    end,
    phone = coalesce(excluded.phone, public.users_profile.phone),
    requested_role = case
      when is_system_admin then null
      else coalesce(excluded.requested_role, public.users_profile.requested_role)
    end,
    requested_area = case
      when is_system_admin then null
      else coalesce(excluded.requested_area, public.users_profile.requested_area)
    end,
    role = case
      when is_system_admin then 'super_admin'
      else public.users_profile.role
    end,
    full_name = case
      when is_system_admin then 'מנהל מערכת'
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

create or replace function public.complete_email_registration(
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

revoke all on function public.complete_email_registration(
  text,
  text,
  uuid,
  uuid,
  text
) from public;
grant execute on function public.complete_email_registration(
  text,
  text,
  uuid,
  uuid,
  text
) to authenticated;

create or replace function public.list_email_registration_options()
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

revoke all on function public.list_email_registration_options() from public;
grant execute on function public.list_email_registration_options() to authenticated;

update public.users_profile
set
  approval_status = 'approved',
  approved_at = coalesce(approved_at, now()),
  email = 'ophbra22@gmail.com',
  full_name = 'מנהל מערכת',
  is_active = true,
  requested_area = null,
  requested_council_id = null,
  requested_plaga_id = null,
  requested_role = null,
  requested_settlement_id = null,
  role = 'super_admin'
where lower(email) = 'ophbra22@gmail.com'
  or (
    role = 'super_admin'
    and email in ('admin@konanut.local', 'ophbra22@gmail.com')
  );

update auth.users
set
  email = 'ophbra22@gmail.com',
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) ||
    '{"full_name":"מנהל מערכת"}'::jsonb
where lower(email) = 'ophbra22@gmail.com'
  or email = 'admin@konanut.local';
