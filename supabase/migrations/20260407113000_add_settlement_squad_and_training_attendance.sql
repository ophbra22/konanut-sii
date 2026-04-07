alter table public.settlements
  add column if not exists total_squad_members integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'settlements_total_squad_members_check'
  ) then
    alter table public.settlements
      add constraint settlements_total_squad_members_check
      check (total_squad_members is null or total_squad_members >= 0);
  end if;
end
$$;

alter table public.trainings
  add column if not exists settlement_attendance jsonb;

update public.trainings
set settlement_attendance = '[]'::jsonb
where settlement_attendance is null;

alter table public.trainings
  alter column settlement_attendance set default '[]'::jsonb;

alter table public.trainings
  alter column settlement_attendance set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trainings_settlement_attendance_is_array_check'
  ) then
    alter table public.trainings
      add constraint trainings_settlement_attendance_is_array_check
      check (jsonb_typeof(settlement_attendance) = 'array');
  end if;
end
$$;
