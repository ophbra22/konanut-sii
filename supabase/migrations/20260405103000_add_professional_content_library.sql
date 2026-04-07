create table if not exists public.professional_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content_type text not null
    check (content_type in ('video', 'presentation', 'document')),
  topic text,
  url text not null,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid default auth.uid()
    references public.users_profile (id)
    on delete set null
);

create index if not exists professional_content_is_active_idx
  on public.professional_content (is_active, created_at desc);

create index if not exists professional_content_content_type_idx
  on public.professional_content (content_type);

create index if not exists professional_content_topic_idx
  on public.professional_content (topic);

alter table public.professional_content enable row level security;

drop policy if exists professional_content_select_active_or_managed
  on public.professional_content;
drop policy if exists professional_content_insert_managers
  on public.professional_content;
drop policy if exists professional_content_update_managers
  on public.professional_content;
drop policy if exists professional_content_delete_managers
  on public.professional_content;

create policy professional_content_select_active_or_managed
on public.professional_content
for select
using (
  public.is_active_user()
  and (
    is_active = true
    or public.has_any_role(array['super_admin', 'instructor'])
  )
);

create policy professional_content_insert_managers
on public.professional_content
for insert
with check (public.has_any_role(array['super_admin', 'instructor']));

create policy professional_content_update_managers
on public.professional_content
for update
using (public.has_any_role(array['super_admin', 'instructor']))
with check (public.has_any_role(array['super_admin', 'instructor']));

create policy professional_content_delete_managers
on public.professional_content
for delete
using (public.has_any_role(array['super_admin', 'instructor']));
