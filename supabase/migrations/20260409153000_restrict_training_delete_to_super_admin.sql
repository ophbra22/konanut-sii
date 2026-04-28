drop policy if exists trainings_delete_super_admin on public.trainings;
drop policy if exists trainings_delete_super_admin_or_instructor on public.trainings;

create policy trainings_delete_super_admin
on public.trainings
for delete
using (public.has_any_role(array['super_admin']));
