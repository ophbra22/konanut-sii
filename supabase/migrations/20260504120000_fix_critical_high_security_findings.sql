-- Fixes SEC-002, SEC-003, SEC-005, and SEC-006 from SECURITY_AUDIT_REPORT.md.
-- This migration is intentionally revoke-by-default for public functions, then
-- grants only the RPC/helper functions required by the app and RLS policies.

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users_profile profile
    where auth.uid() is not null
      and profile.id = auth.uid()
      and profile.is_active = true
      and profile.approval_status = 'approved'
  );
$$;

create or replace function public.has_any_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users_profile profile
    where auth.uid() is not null
      and allowed_roles is not null
      and profile.id = auth.uid()
      and profile.is_active = true
      and profile.approval_status = 'approved'
      and profile.role = any (allowed_roles)
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['super_admin']);
$$;

create or replace function public.is_instructor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['instructor']);
$$;

create or replace function public.is_mashkabat()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['mashkabat']);
$$;

create or replace function public.current_assigned_plaga()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select profile.assigned_plaga
  from public.users_profile profile
  where auth.uid() is not null
    and profile.id = auth.uid()
    and profile.is_active = true
    and profile.approval_status = 'approved'
  limit 1;
$$;

create or replace function public.has_plaga_access(target_plaga text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_any_role(array['super_admin', 'instructor', 'razar', 'sarazar'])
    or (
      public.has_any_role(array['mepag', 'samepag'])
      and nullif(trim(coalesce(target_plaga, '')), '') is not null
      and lower(trim(target_plaga)) =
        lower(trim(coalesce(public.current_assigned_plaga(), '')))
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
        where auth.uid() is not null
          and council_link.user_id = auth.uid()
          and lower(trim(council_link.regional_council)) =
            lower(trim(target_regional_council))
          and profile.is_active = true
          and profile.approval_status = 'approved'
      )
    ),
    false
  );
$$;

create or replace function public.has_settlement_access(target_settlement_id uuid)
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
        from public.settlements settlement
        where settlement.id = target_settlement_id
          and public.has_regional_council_access(settlement.regional_council)
      )
    )
    or (
      public.has_any_role(array['mashkabat'])
      and exists (
        select 1
        from public.user_settlements user_link
        join public.users_profile profile
          on profile.id = user_link.user_id
        where auth.uid() is not null
          and user_link.user_id = auth.uid()
          and user_link.settlement_id = target_settlement_id
          and profile.is_active = true
          and profile.approval_status = 'approved'
      )
    )
    or (
      public.has_any_role(array['mepag', 'samepag'])
      and exists (
        select 1
        from public.settlements settlement
        left join public.regional_councils council
          on lower(trim(council.name)) = lower(trim(coalesce(settlement.regional_council, '')))
        where settlement.id = target_settlement_id
          and public.has_plaga_access(
            coalesce(
              nullif(trim(coalesce(council.plaga_name, '')), ''),
              nullif(trim(coalesce(settlement.area, '')), '')
            )
          )
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
    )
    or (
      public.has_any_role(array['mepag', 'samepag'])
      and exists (
        select 1
        from public.training_settlements training_link
        join public.settlements settlement
          on settlement.id = training_link.settlement_id
        left join public.regional_councils council
          on lower(trim(council.name)) = lower(trim(coalesce(settlement.regional_council, '')))
        where training_link.training_id = target_training_id
          and public.has_plaga_access(
            coalesce(
              nullif(trim(coalesce(council.plaga_name, '')), ''),
              nullif(trim(coalesce(settlement.area, '')), '')
            )
          )
      )
    ),
    false
  );
$$;

drop policy if exists settlement_rankings_select_accessible on public.settlement_rankings;
drop policy if exists settlement_rankings_select_all_roles on public.settlement_rankings;
drop policy if exists settlement_rankings_select_role_scoped on public.settlement_rankings;

create policy settlement_rankings_select_role_scoped
on public.settlement_rankings
for select
using (
  public.is_active_user()
  and public.has_settlement_access(settlement_id)
);

revoke all on function public.list_global_settlement_rankings(text) from public;
revoke all on function public.list_global_settlement_rankings(text) from anon;
revoke all on function public.list_global_settlement_rankings(text) from authenticated;

create or replace function public.list_global_settlement_rankings(period_key text)
returns table (
  settlement_id uuid,
  settlement_name text,
  council_id uuid,
  council_name text,
  regional_council text,
  regional_squad_name text,
  plaga_name text,
  half_year_period text,
  shooting_completed boolean,
  defense_completed boolean,
  median_range_participation_percent integer,
  settlement_defense_participation_percent integer,
  base_score integer,
  training_score integer,
  instructor_feedback_points integer,
  feedback_score integer,
  final_score integer,
  ranking_level text,
  calculated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ranking.settlement_id,
    settlement.name as settlement_name,
    settlement.council_id,
    council.name as council_name,
    settlement.regional_council,
    council.regional_squad_name,
    coalesce(
      nullif(trim(coalesce(council.plaga_name, '')), ''),
      nullif(trim(coalesce(settlement.area, '')), '')
    ) as plaga_name,
    ranking.half_year_period,
    ranking.shooting_completed,
    ranking.defense_completed,
    ranking.median_range_participation_percent,
    ranking.settlement_defense_participation_percent,
    ranking.base_score,
    ranking.training_score,
    ranking.instructor_feedback_points,
    ranking.feedback_score,
    ranking.final_score,
    ranking.ranking_level,
    ranking.calculated_at
  from public.settlement_rankings ranking
  join public.settlements settlement
    on settlement.id = ranking.settlement_id
  left join public.regional_councils council
    on council.id = settlement.council_id
  where auth.uid() is not null
    and public.is_active_user()
    and ranking.half_year_period = period_key
    and public.has_settlement_access(ranking.settlement_id)
  order by ranking.final_score desc, settlement.name asc;
$$;

create or replace function public.delete_regional_council(target_council_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_council_name text;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.has_any_role(array['super_admin']) then
    raise exception 'not_authorized';
  end if;

  select council.name
  into target_council_name
  from public.regional_councils council
  where council.id = target_council_id;

  if target_council_name is null then
    raise exception 'council_not_found';
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

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema public revoke execute on functions from authenticated;

grant execute on function public.is_active_user() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_instructor() to authenticated;
grant execute on function public.is_mashkabat() to authenticated;
grant execute on function public.current_assigned_plaga() to authenticated;
grant execute on function public.has_plaga_access(text) to authenticated;
grant execute on function public.has_regional_council_access(text) to authenticated;
grant execute on function public.has_settlement_access(uuid) to authenticated;
grant execute on function public.has_training_access(uuid) to authenticated;
grant execute on function public.can_insert_training(uuid) to authenticated;
grant execute on function public.can_insert_feedback(uuid) to authenticated;
grant execute on function public.can_insert_training_settlement(uuid) to authenticated;
grant execute on function public.list_global_settlement_rankings(text) to authenticated;
grant execute on function public.complete_email_registration(text, text, uuid, uuid, text) to authenticated;
grant execute on function public.list_email_registration_options() to authenticated;
grant execute on function public.complete_phone_registration(text, text, uuid, uuid, text) to authenticated;
grant execute on function public.list_phone_registration_options() to authenticated;
grant execute on function public.delete_current_user_account() to authenticated;
grant execute on function public.admin_delete_user_account(uuid) to authenticated;
grant execute on function public.delete_regional_council(uuid) to authenticated;
