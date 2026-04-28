create or replace function public.delete_regional_council(target_council_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role public.users_profile.role%type;
  target_council_name text;
begin
  select profile.role
  into requester_role
  from public.users_profile profile
  where profile.id = auth.uid();

  if requester_role is distinct from 'super_admin' then
    raise exception 'אין הרשאה למחוק מועצה';
  end if;

  select council.name
  into target_council_name
  from public.regional_councils council
  where council.id = target_council_id;

  if target_council_name is null then
    raise exception 'המועצה שנבחרה לא נמצאה';
  end if;

  update public.settlements
  set
    council_id = null,
    regional_council = null
  where council_id = target_council_id;

  delete from public.user_regional_councils
  where lower(trim(regional_council)) = lower(trim(target_council_name));

  delete from public.regional_councils
  where id = target_council_id;

  return true;
end;
$$;

grant execute on function public.delete_regional_council(uuid) to authenticated;
