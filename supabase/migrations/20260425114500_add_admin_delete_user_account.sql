create or replace function public.admin_delete_user_account(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.has_any_role(array['super_admin']) then
    raise exception 'not_authorized';
  end if;

  if target_user_id is null then
    raise exception 'user_not_found';
  end if;

  if target_user_id = current_user_id then
    raise exception 'cannot_delete_current_session';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'user_not_found';
  end if;

  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'user_not_found';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_delete_user_account(uuid) from public;
grant execute on function public.admin_delete_user_account(uuid) to authenticated;
