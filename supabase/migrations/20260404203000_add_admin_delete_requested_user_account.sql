create or replace function public.admin_delete_requested_user_account(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_super_admin() then
    raise exception 'not_authorized';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'cannot_delete_current_session';
  end if;

  if not exists (
    select 1
    from public.users_profile
    where id = target_user_id
      and deletion_requested_at is not null
  ) then
    raise exception 'deletion_request_not_found';
  end if;

  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'profile_not_found';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_delete_requested_user_account(uuid) from public;
grant execute on function public.admin_delete_requested_user_account(uuid) to authenticated;
