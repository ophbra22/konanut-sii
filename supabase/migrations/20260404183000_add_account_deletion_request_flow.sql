alter table public.users_profile
add column if not exists deletion_requested_at timestamptz;

create index if not exists users_profile_deletion_requested_at_idx
on public.users_profile (deletion_requested_at);

create or replace function public.request_account_deletion()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.users_profile
  set deletion_requested_at = coalesce(deletion_requested_at, now())
  where id = auth.uid();

  if not found then
    raise exception 'profile_not_found';
  end if;

  return true;
end;
$$;

revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;
