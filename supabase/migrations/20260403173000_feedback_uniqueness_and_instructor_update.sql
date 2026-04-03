delete from public.feedbacks stale_feedback
using public.feedbacks newer_feedback
where stale_feedback.training_id = newer_feedback.training_id
  and stale_feedback.settlement_id = newer_feedback.settlement_id
  and (
    stale_feedback.created_at < newer_feedback.created_at
    or (
      stale_feedback.created_at = newer_feedback.created_at
      and stale_feedback.id::text < newer_feedback.id::text
    )
  );

alter table public.feedbacks
drop constraint if exists feedbacks_training_settlement_unique;

alter table public.feedbacks
add constraint feedbacks_training_settlement_unique
unique (training_id, settlement_id);

drop policy if exists feedbacks_update_super_admin on public.feedbacks;
drop policy if exists feedbacks_update_super_admin_or_instructor on public.feedbacks;

create policy feedbacks_update_super_admin_or_instructor
on public.feedbacks
for update
using (
  public.is_super_admin()
  or public.is_instructor()
)
with check (
  public.is_super_admin()
  or public.is_instructor()
);
