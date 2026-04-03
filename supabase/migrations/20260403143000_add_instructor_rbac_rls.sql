alter table public.users_profile
drop constraint if exists users_profile_role_check;

alter table public.users_profile
add constraint users_profile_role_check
check (role in ('super_admin', 'instructor', 'viewer'));

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
    where profile.id = auth.uid()
      and profile.is_active = true
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
    where profile.id = auth.uid()
      and profile.is_active = true
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
      and target_instructor_id = auth.uid()
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
      and target_instructor_id = auth.uid()
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
  select coalesce(
    public.is_super_admin()
    or exists (
      select 1
      from public.trainings training_row
      where training_row.id = target_training_id
        and training_row.instructor_id = auth.uid()
        and public.is_instructor()
    ),
    false
  );
$$;

drop policy if exists settlements_select_accessible on public.settlements;
drop policy if exists settlements_manage_super_admin on public.settlements;

create policy settlements_select_all_roles
on public.settlements
for select
using (public.is_active_user());

create policy settlements_insert_super_admin
on public.settlements
for insert
with check (public.is_super_admin());

create policy settlements_update_super_admin
on public.settlements
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy settlements_delete_super_admin
on public.settlements
for delete
using (public.is_super_admin());

drop policy if exists trainings_select_accessible on public.trainings;
drop policy if exists trainings_manage_super_admin on public.trainings;

create policy trainings_select_all_roles
on public.trainings
for select
using (public.is_active_user());

create policy trainings_insert_super_admin_or_instructor
on public.trainings
for insert
with check (public.can_insert_training(instructor_id));

create policy trainings_update_super_admin
on public.trainings
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy trainings_delete_super_admin
on public.trainings
for delete
using (public.is_super_admin());

drop policy if exists feedbacks_select_accessible on public.feedbacks;
drop policy if exists feedbacks_manage_super_admin on public.feedbacks;

create policy feedbacks_select_all_roles
on public.feedbacks
for select
using (public.is_active_user());

create policy feedbacks_insert_super_admin_or_instructor
on public.feedbacks
for insert
with check (public.can_insert_feedback(instructor_id));

create policy feedbacks_update_super_admin
on public.feedbacks
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy feedbacks_delete_super_admin
on public.feedbacks
for delete
using (public.is_super_admin());

drop policy if exists settlement_rankings_select_accessible on public.settlement_rankings;
drop policy if exists settlement_rankings_manage_super_admin on public.settlement_rankings;

create policy settlement_rankings_select_all_roles
on public.settlement_rankings
for select
using (public.is_active_user());

create policy settlement_rankings_insert_super_admin
on public.settlement_rankings
for insert
with check (public.is_super_admin());

create policy settlement_rankings_update_super_admin
on public.settlement_rankings
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy settlement_rankings_delete_super_admin
on public.settlement_rankings
for delete
using (public.is_super_admin());

drop policy if exists users_profile_select_self_or_admin on public.users_profile;
drop policy if exists users_profile_manage_super_admin on public.users_profile;

create policy users_profile_select_self_or_admin
on public.users_profile
for select
using (
  public.is_super_admin()
  or id = auth.uid()
);

create policy users_profile_update_super_admin
on public.users_profile
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy users_profile_delete_super_admin
on public.users_profile
for delete
using (public.is_super_admin());

drop policy if exists training_settlements_select_accessible on public.training_settlements;
drop policy if exists training_settlements_manage_super_admin on public.training_settlements;

create policy training_settlements_select_all_roles
on public.training_settlements
for select
using (public.is_active_user());

create policy training_settlements_insert_super_admin_or_instructor
on public.training_settlements
for insert
with check (public.can_insert_training_settlement(training_id));

create policy training_settlements_update_super_admin
on public.training_settlements
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy training_settlements_delete_super_admin
on public.training_settlements
for delete
using (public.is_super_admin());

drop policy if exists alerts_select_accessible on public.alerts;
drop policy if exists alerts_manage_super_admin on public.alerts;

create policy alerts_select_all_roles
on public.alerts
for select
using (public.is_active_user());

create policy alerts_insert_super_admin
on public.alerts
for insert
with check (public.is_super_admin());

create policy alerts_update_super_admin
on public.alerts
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy alerts_delete_super_admin
on public.alerts
for delete
using (public.is_super_admin());

grant execute on all functions in schema public to authenticated;
