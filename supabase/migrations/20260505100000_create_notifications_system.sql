-- Adds scoped in-app notifications, Expo push tokens, and delivery tracking.
-- The app continues to work before the Edge Function is deployed; push delivery
-- is server-side only and relies on existing RLS helpers for scope checks.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  role_scope text,
  settlement_id uuid references public.settlements (id) on delete cascade,
  council_id uuid references public.regional_councils (id) on delete cascade,
  training_id uuid references public.trainings (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  severity text not null default 'info',
  status text not null default 'unread',
  action_screen text,
  action_params jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz
);

alter table public.notifications
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists role_scope text,
  add column if not exists settlement_id uuid references public.settlements (id) on delete cascade,
  add column if not exists council_id uuid references public.regional_councils (id) on delete cascade,
  add column if not exists training_id uuid references public.trainings (id) on delete cascade,
  add column if not exists type text,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists severity text not null default 'info',
  add column if not exists status text not null default 'unread',
  add column if not exists action_screen text,
  add column if not exists action_params jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists read_at timestamptz,
  add column if not exists expires_at timestamptz;

alter table public.notifications
  drop constraint if exists notifications_type_check,
  add constraint notifications_type_check
  check (
    type in (
      'upcoming_training',
      'new_feedback',
      'missing_report',
      'missing_half_year_range',
      'missing_defense_training',
      'general'
    )
  );

alter table public.notifications
  drop constraint if exists notifications_severity_check,
  add constraint notifications_severity_check
  check (severity in ('info', 'success', 'warning', 'danger'));

alter table public.notifications
  drop constraint if exists notifications_status_check,
  add constraint notifications_status_check
  check (status in ('unread', 'read', 'dismissed'));

create index if not exists notifications_user_id_idx
  on public.notifications (user_id);
create index if not exists notifications_settlement_id_idx
  on public.notifications (settlement_id);
create index if not exists notifications_council_id_idx
  on public.notifications (council_id);
create index if not exists notifications_training_id_idx
  on public.notifications (training_id);
create index if not exists notifications_type_idx
  on public.notifications (type);
create index if not exists notifications_status_idx
  on public.notifications (status);
create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_push_tokens
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists expo_push_token text,
  add column if not exists platform text,
  add column if not exists device_name text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists user_push_tokens_user_token_unique
  on public.user_push_tokens (user_id, expo_push_token);
create index if not exists user_push_tokens_user_id_idx
  on public.user_push_tokens (user_id);
create index if not exists user_push_tokens_active_idx
  on public.user_push_tokens (is_active);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  training_id uuid references public.trainings (id) on delete cascade,
  push_token text not null,
  type text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent',
  error_message text
);

alter table public.notification_deliveries
  add column if not exists notification_id uuid references public.notifications (id) on delete set null,
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists training_id uuid references public.trainings (id) on delete cascade,
  add column if not exists push_token text,
  add column if not exists type text,
  add column if not exists sent_at timestamptz not null default now(),
  add column if not exists status text not null default 'sent',
  add column if not exists error_message text;

create index if not exists notification_deliveries_notification_id_idx
  on public.notification_deliveries (notification_id);
create index if not exists notification_deliveries_user_id_idx
  on public.notification_deliveries (user_id);
create index if not exists notification_deliveries_training_id_idx
  on public.notification_deliveries (training_id);
create index if not exists notification_deliveries_type_sent_at_idx
  on public.notification_deliveries (type, sent_at desc);
create index if not exists notification_deliveries_training_dedupe_idx
  on public.notification_deliveries (user_id, training_id, type, push_token, sent_at desc)
  where training_id is not null;

alter table public.notifications enable row level security;
alter table public.user_push_tokens enable row level security;
alter table public.notification_deliveries enable row level security;

create or replace function public.can_access_notification(target_notification_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.notifications notification
    left join public.regional_councils council
      on council.id = notification.council_id
    where notification.id = target_notification_id
      and public.is_active_user()
      and (
        (
          notification.user_id is not null
          and notification.user_id = auth.uid()
        )
        or (
          notification.user_id is null
          and (
            (
              notification.training_id is not null
              and public.has_training_access(notification.training_id)
            )
            or (
              notification.settlement_id is not null
              and public.has_settlement_access(notification.settlement_id)
            )
            or (
              notification.council_id is not null
              and public.has_regional_council_access(council.name)
            )
            or (
              notification.role_scope is not null
              and public.has_any_role(array[notification.role_scope])
            )
            or (
              notification.training_id is null
              and notification.settlement_id is null
              and notification.council_id is null
              and notification.role_scope is null
            )
          )
        )
      )
  );
$$;

drop policy if exists notifications_select_scoped on public.notifications;
create policy notifications_select_scoped
on public.notifications
for select
using (public.can_access_notification(id));

drop policy if exists notifications_insert_managers on public.notifications;
create policy notifications_insert_managers
on public.notifications
for insert
with check (public.has_any_role(array['super_admin', 'instructor']));

drop policy if exists user_push_tokens_select_own on public.user_push_tokens;
create policy user_push_tokens_select_own
on public.user_push_tokens
for select
using (public.is_active_user() and user_id = auth.uid());

drop policy if exists user_push_tokens_insert_own on public.user_push_tokens;
create policy user_push_tokens_insert_own
on public.user_push_tokens
for insert
with check (public.is_active_user() and user_id = auth.uid());

drop policy if exists user_push_tokens_update_own on public.user_push_tokens;
create policy user_push_tokens_update_own
on public.user_push_tokens
for update
using (public.is_active_user() and user_id = auth.uid())
with check (public.is_active_user() and user_id = auth.uid());

drop policy if exists notification_deliveries_select_super_admin on public.notification_deliveries;
create policy notification_deliveries_select_super_admin
on public.notification_deliveries
for select
using (public.has_any_role(array['super_admin']));

create or replace function public.mark_notification_as_read(target_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not public.can_access_notification(target_notification_id) then
    raise exception 'not_authorized';
  end if;

  select notification.user_id
  into target_user_id
  from public.notifications notification
  where notification.id = target_notification_id;

  if target_user_id is null then
    return true;
  end if;

  update public.notifications
  set
    status = 'read',
    read_at = coalesce(read_at, now())
  where id = target_notification_id;

  return true;
end;
$$;

create or replace function public.dismiss_notification(target_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not public.can_access_notification(target_notification_id) then
    raise exception 'not_authorized';
  end if;

  select notification.user_id
  into target_user_id
  from public.notifications notification
  where notification.id = target_notification_id;

  if target_user_id is null then
    return true;
  end if;

  update public.notifications
  set
    status = 'dismissed',
    read_at = coalesce(read_at, now())
  where id = target_notification_id;

  return true;
end;
$$;

create or replace function public.create_new_feedback_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_training public.trainings%rowtype;
  target_settlement_id uuid;
  instructor_name text;
begin
  if new.training_id is null or coalesce(new.is_training_level, false) = false then
    return new;
  end if;

  select *
  into target_training
  from public.trainings
  where id = new.training_id;

  if target_training.id is null then
    return new;
  end if;

  select training_link.settlement_id
  into target_settlement_id
  from public.training_settlements training_link
  where training_link.training_id = new.training_id
  order by training_link.created_at asc
  limit 1;

  select profile.full_name
  into instructor_name
  from public.users_profile profile
  where profile.id = new.instructor_id;

  insert into public.notifications (
    settlement_id,
    training_id,
    type,
    title,
    body,
    severity,
    status,
    action_screen,
    action_params,
    expires_at
  )
  values (
    coalesce(new.settlement_id, target_settlement_id),
    new.training_id,
    'new_feedback',
    'התקבל משוב חדש',
    'הוזן משוב חדש עבור אימון ' || target_training.title || coalesce(' מאת ' || instructor_name, ''),
    'success',
    'unread',
    'training_details',
    jsonb_build_object('training_id', new.training_id),
    now() + interval '30 days'
  );

  return new;
end;
$$;

drop trigger if exists feedbacks_create_new_feedback_notification on public.feedbacks;
create trigger feedbacks_create_new_feedback_notification
after insert on public.feedbacks
for each row
execute function public.create_new_feedback_notification();

revoke execute on function public.can_access_notification(uuid) from public, anon;
revoke execute on function public.mark_notification_as_read(uuid) from public, anon;
revoke execute on function public.dismiss_notification(uuid) from public, anon;
grant execute on function public.can_access_notification(uuid) to authenticated;
grant execute on function public.mark_notification_as_read(uuid) to authenticated;
grant execute on function public.dismiss_notification(uuid) to authenticated;
