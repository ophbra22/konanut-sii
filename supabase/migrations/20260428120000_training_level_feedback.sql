alter table public.feedbacks
add column if not exists is_training_level boolean not null default false;

alter table public.feedbacks
add column if not exists is_legacy boolean not null default false;

with ranked_feedbacks as (
  select
    id,
    row_number() over (
      partition by training_id
      order by created_at asc, id asc
    ) as row_number
  from public.feedbacks
)
update public.feedbacks feedback
set
  is_training_level = ranked_feedbacks.row_number = 1,
  is_legacy = ranked_feedbacks.row_number > 1
from ranked_feedbacks
where feedback.id = ranked_feedbacks.id
  and feedback.training_id is not null;

create unique index if not exists feedbacks_training_level_unique
on public.feedbacks (training_id)
where is_training_level = true;

create index if not exists feedbacks_training_level_idx
on public.feedbacks (training_id, is_training_level);
