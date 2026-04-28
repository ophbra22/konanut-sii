create or replace function public.delete_current_user_account()
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

  delete from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'user_not_found';
  end if;

  return true;
end;
$$;

revoke all on function public.delete_current_user_account() from public;
grant execute on function public.delete_current_user_account() to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'request_account_deletion'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke all on function public.request_account_deletion() from public;
    revoke all on function public.request_account_deletion() from authenticated;
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_delete_requested_user_account'
      and pg_get_function_identity_arguments(p.oid) = 'target_user_id uuid'
  ) then
    revoke all on function public.admin_delete_requested_user_account(uuid) from public;
    revoke all on function public.admin_delete_requested_user_account(uuid) from authenticated;
  end if;
exception
  when undefined_function then
    null;
end;
$$;
