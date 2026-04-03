create or replace function public.has_training_access(target_training_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_any_role(array['super_admin', 'instructor'])
    or (
      public.is_mashkabat()
      and exists (
        select 1
        from public.training_settlements training_link
        where training_link.training_id = target_training_id
          and public.has_settlement_access(training_link.settlement_id)
      )
    ),
    false
  );
$$;

drop policy if exists trainings_select_all_roles on public.trainings;

create policy trainings_select_role_scoped
on public.trainings
for select
using (public.has_training_access(id));

drop policy if exists training_settlements_select_all_roles on public.training_settlements;

create policy training_settlements_select_role_scoped
on public.training_settlements
for select
using (public.has_training_access(training_id));
