alter table public.issue_resolutions
  add column if not exists dampak_type text,
  add column if not exists tambahan_biaya bigint,
  add column if not exists tambahan_hari integer;

alter table public.issue_resolutions
  drop constraint if exists issue_resolutions_impact_check;

alter table public.issue_resolutions
  add constraint issue_resolutions_impact_check
  check (case
    when dampak_type is null then
      tambahan_biaya is null and tambahan_hari is null
    when dampak_type = 'biaya' then
      tambahan_biaya is not null and tambahan_biaya > 0
      and tambahan_hari is null
    when dampak_type = 'waktu' then
      tambahan_biaya is null and tambahan_hari is not null
      and tambahan_hari > 0
    when dampak_type = 'biaya_dan_waktu' then
      tambahan_biaya is not null and tambahan_biaya > 0
      and tambahan_hari is not null and tambahan_hari > 0
    else false
  end);

alter table public.resolution_discussions
  add column if not exists dampak_type text,
  add column if not exists tambahan_biaya bigint,
  add column if not exists tambahan_hari integer;

alter table public.resolution_discussions
  drop constraint if exists resolution_discussions_impact_check;

alter table public.resolution_discussions
  add constraint resolution_discussions_impact_check
  check (case
    when penulis = 'Customer' then
      dampak_type is null
      and tambahan_biaya is null
      and tambahan_hari is null
    when penulis = 'Pengawas' then
      case
        when dampak_type = 'biaya' then
          tambahan_biaya is not null and tambahan_biaya > 0
          and tambahan_hari is null
        when dampak_type = 'waktu' then
          tambahan_biaya is null and tambahan_hari is not null
          and tambahan_hari > 0
        when dampak_type = 'biaya_dan_waktu' then
          tambahan_biaya is not null and tambahan_biaya > 0
          and tambahan_hari is not null and tambahan_hari > 0
        else false
      end
    else false
  end) not valid;

create or replace function public.protect_customer_resolution_impact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_my_role() = 'customer'
     and (
       new.dampak_type is distinct from old.dampak_type
       or new.tambahan_biaya is distinct from old.tambahan_biaya
       or new.tambahan_hari is distinct from old.tambahan_hari
     ) then
    raise exception 'Customer tidak dapat mengubah dampak atau nominal usulan.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_customer_resolution_impact
  on public.issue_resolutions;

create trigger trg_protect_customer_resolution_impact
  before update on public.issue_resolutions
  for each row execute function public.protect_customer_resolution_impact();
