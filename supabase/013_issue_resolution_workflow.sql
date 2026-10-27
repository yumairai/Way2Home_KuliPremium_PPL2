-- ============================================================
-- 013_issue_resolution_workflow.sql
--
-- Alur penanganan kendala Pengawas -> Customer -> Mandor
--
-- Pemetaan dari alur lama (Laravel PPL1) ke PPL2:
--   issue_reports            -> public.kendala
--   issue_resolutions        -> public.issue_resolutions   (dipertahankan)
--   issue_discussion         -> public.resolution_discussions (sudah dibuat 012)
--   customer_approval_status -> public.issue_resolutions.persetujuan_customer
--
-- Prinsip:
--   * Tidak ada DROP TABLE / DROP COLUMN. Struktur lama dipertahankan.
--   * Semua ALTER memakai "if not exists" / "if exists" agar idempoten.
--   * Nilai lama dinormalisasi DULU sebelum constraint baru dipasang,
--     supaya data yang sudah terisi tidak menyebabkan migrasi gagal.
-- ============================================================

-- ============================================================
-- 1. issue_resolutions: tambahkan kolom keadaan persetujuan
--    (setara customer_approval_status pada tabel lama)
-- ============================================================
alter table public.issue_resolutions
  add column if not exists persetujuan_customer text
    not null
    default 'tidak_diminta';

alter table public.issue_resolutions
  add column if not exists disetujui_oleh uuid
    references public.profiles(id) on delete set null;

alter table public.issue_resolutions
  add column if not exists disetujui_pada timestamptz;

-- Ditulis pengawas lewat tombol "Tetapkan keputusan final ke mandor":
-- menutup kendala tanpa menunggu persetujuan customer.
alter table public.issue_resolutions
  add column if not exists keputusan_final boolean not null default false;

comment on column public.issue_resolutions.persetujuan_customer is
  'Setara customer_approval_status lama: tidak_diminta | menunggu | disetujui | ditolak.';
comment on column public.issue_resolutions.keputusan_final is
  'True bila pengawas menetapkan keputusan final; kendala langsung dianggap selesai.';
comment on column public.issue_resolutions.status is
  'Status workflow: Ditindaklanjuti | Menunggu approval customer | Diskusi dengan pengawas.';
comment on column public.issue_resolutions.analisis_ai is
  'Hasil analisis AI, jsonb: { summary, options[], selectedOption }.';
comment on column public.issue_resolutions.sumber is
  'Pengawas (diisi manual) atau Analisis AI (diisi dari hasil analisis).';

-- ------------------------------------------------------------
-- 1a. Normalisasi nilai lama SEBELUM constraint dipasang.
--     Baris yang dibuat sebelum kolom ini ada selalu berarti
--     "butuh_persetujuan = true  -> menunggu"
--                       false -> tidak_diminta".
--     Nilai apa pun di luar daftar yang dikenal diturunkan dengan aman.
-- ------------------------------------------------------------
update public.issue_resolutions
   set persetujuan_customer = 'menunggu'
 where persetujuan_customer not in
       ('tidak_diminta', 'menunggu', 'disetujui', 'ditolak');

update public.issue_resolutions
   set status = 'Ditindaklanjuti'
 where status is null
    or status not in ('Ditindaklanjuti',
                      'Menunggu approval customer',
                      'Diskusi dengan pengawas');

-- ------------------------------------------------------------
-- 1b. Constraint keadaan persetujuan (nilai lama sudah bersih)
-- ------------------------------------------------------------
alter table public.issue_resolutions
  drop constraint if exists issue_resolutions_persetujuan_customer_check;

alter table public.issue_resolutions
  add constraint issue_resolutions_persetujuan_customer_check
  check (persetujuan_customer in
         ('tidak_diminta', 'menunggu', 'disetujui', 'ditolak'));

-- ------------------------------------------------------------
-- 1c. Constraint status penanganan.
--     Sebelumnya kolom ini teks bebas; sekarang dibatasi agar
--     tampilan Pengawas/Customer selalu punya padanan yang jelas.
-- ------------------------------------------------------------
alter table public.issue_resolutions
  drop constraint if exists issue_resolutions_status_check;

alter table public.issue_resolutions
  add constraint issue_resolutions_status_check
  check (status in ('Ditindaklanjuti',
                    'Menunggu approval customer',
                    'Diskusi dengan pengawas'));

alter table public.issue_resolutions
  drop constraint if exists issue_resolutions_sumber_check;

alter table public.issue_resolutions
  add constraint issue_resolutions_sumber_check
  check (sumber in ('Pengawas', 'Analisis AI'));

create index if not exists idx_resolutions_project
  on public.issue_resolutions(project_id);

create index if not exists idx_resolutions_persetujuan
  on public.issue_resolutions(persetujuan_customer);

-- ============================================================
-- 2. resolution_discussions (tabel diskusi terpisah)
--    Struktur lama sudah dipakai: id, resolution_id, penulis,
--    pesan, created_by, created_at. Cukup diberi label yang jelas.
-- ============================================================
comment on table public.resolution_discussions is
  'Diskusi penanganan kendala per baris issue_resolutions (Pengawas <-> Customer).';

comment on column public.resolution_discussions.penulis is
  'Pengawas | Customer';

-- ============================================================
-- 3. Penjaga kolom + sinkronisasi status
--    Trigger BEFORE : menjaga kolom mana yang boleh disentuh siapa,
--                     dan mengisi keadaan persetujuan yang konsisten.
--    Trigger AFTER  : menurunkan status kendala mengikuti keputusan.
-- ============================================================
create or replace function public.enforce_issue_resolution_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Baris baru selalu punya keadaan persetujuan yang jelas.
    if new.butuh_persetujuan then
      new.persetujuan_customer := coalesce(new.persetujuan_customer, 'menunggu');
    else
      new.persetujuan_customer := 'tidak_diminta';
      new.disetujui_oleh := null;
      new.disetujui_pada := null;
    end if;
    return new;
  end if;

  if get_my_role() = 'customer' then
    -- Penanganan yang sudah diputuskan final tidak bisa dibuka lagi.
    if old.keputusan_final then
      raise exception 'Kendala ini sudah diputuskan final oleh pengawas.';
    end if;

    -- Customer hanya boleh mengubah kolom keputusan.
    if new.id is distinct from old.id
       or new.project_id is distinct from old.project_id
       or new.kendala_id is distinct from old.kendala_id
       or new.solusi is distinct from old.solusi
       or new.sumber is distinct from old.sumber
       or new.analisis_ai is distinct from old.analisis_ai
       or new.butuh_persetujuan is distinct from old.butuh_persetujuan
       or new.alasan_persetujuan is distinct from old.alasan_persetujuan
       or new.bukti is distinct from old.bukti
       or new.keputusan_final is distinct from old.keputusan_final
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at then
      raise exception 'Customer hanya boleh memberikan keputusan persetujuan.';
    end if;

    -- Keputusan customer dikirim lewat kolom `status` yang sudah dipakai
    -- oleh sisi klien, lalu dipetakan ke keadaan persetujuan yang tersistri.
    if new.status = 'Ditindaklanjuti' then
      new.persetujuan_customer := 'disetujui';
    elsif new.status = 'Diskusi dengan pengawas' then
      new.persetujuan_customer := 'ditolak';
    else
      raise exception 'Keputusan customer harus disetujui atau ditolak.';
    end if;

    if new.persetujuan_customer = 'disetujui' then
      new.disetujui_oleh := auth.uid();
      new.disetujui_pada := now();
    else
      new.disetujui_oleh := null;
      new.disetujui_pada := null;
    end if;
  else
    -- Pengawas boleh menulis kolom apa pun, tetapi tidak boleh
    -- menyetujui atas nama customer.
    if new.disetujui_oleh is distinct from old.disetujui_oleh
       or new.disetujui_pada is distinct from old.disetujui_pada then
      if get_my_role() <> 'admin' then
        raise exception 'Persetujuan hanya dapat diberikan customer.';
      end if;
    end if;

    if not new.butuh_persetujuan then
      new.persetujuan_customer := 'tidak_diminta';
    end if;
  end if;

  -- Flag persetujuan dan keadaannya tidak boleh saling bertentangan.
  -- Catatan: kolom ini selalu terisi (default 'tidak_diminta'), jadi
  -- cabang INSERT yang memakai coalesce saja tidak cukup -- nilai harus
  -- dinaikkan ke 'menunggu' di sini untuk INSERT maupun UPDATE.
  if new.butuh_persetujuan
     and (new.persetujuan_customer is null
          or new.persetujuan_customer = 'tidak_diminta') then
    new.persetujuan_customer := 'menunggu';
  end if;

  -- Status penanganan harus selalu mengikuti keadaan persetujuan.
  if new.butuh_persetujuan and new.persetujuan_customer = 'menunggu' then
    new.status := 'Menunggu approval customer';
  end if;

  -- Keputusan final mengunci penanganan: status tampil sebagai
  -- 'Ditindaklanjuti' dan MENIMPA status persetujuan apa pun, supaya
  -- penanganan yang sudah diputuskan final tidak lagi tertulis
  -- 'Menunggu approval customer'. Kendala ikut ditutup oleh trigger AFTER.
  -- Diletakkan paling akhir agar tidak tertimpa blok sync di atas.
  if new.keputusan_final then
    new.status := 'Ditindaklanjuti';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_issue_resolution_enforce on public.issue_resolutions;
create trigger trg_issue_resolution_enforce
  before insert or update on public.issue_resolutions
  for each row execute function public.enforce_issue_resolution_update();

-- ------------------------------------------------------------
-- 3b. Status kendala (kendala_status) mengikuti keputusan.
--     reported  -> kendala baru dari mandor
--     reviewed  -> pengawas sudah menindaklanjuti ATAU customer menolak
--                  (diskusi berlanjut, kendala belum selesai)
--     resolved  -> customer menyetujui ATAU pengawas menetapkan
--                  keputusan final
--     Trigger SECURITY DEFINER sehingga keputusan customer tidak
--     memerlukan policy UPDATE terpisah pada tabel kendala.
-- ------------------------------------------------------------
create or replace function public.sync_kendala_from_resolution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_status kendala_status;
begin
  if new.keputusan_final or new.persetujuan_customer = 'disetujui' then
    target_status := 'resolved';
  else
    target_status := 'reviewed';
  end if;

  -- 'resolved' bersifat terminal: status yang sudah selesai tidak pernah
  -- diturunkan kembali oleh tindak lanjut biasa maupun perubahan flag
  -- persetujuan. Tanpa klausa ini, pengawas yang mengubah
  -- butuh_persetujuan menjadi false setelah customer menyetujui akan
  -- membuka kembali kendala yang sudah ditutup.
  update public.kendala
     set status = target_status,
         updated_at = now()
   where id = new.kendala_id
     and status is distinct from target_status
     and not (status = 'resolved' and target_status <> 'resolved');

  return new;
end;
$$;

drop trigger if exists trg_sync_kendala_from_resolution
  on public.issue_resolutions;
-- Sengaja tanpa daftar "update of ...": kolom persetujuan_customer dihitung
-- ulang di trigger BEFORE dan tidak pernah muncul di klausa SET pemanggil,
-- sehingga trigger "update of <kolom>" tidak akan pernah aktif.
create trigger trg_sync_kendala_from_resolution
  after insert or update
  on public.issue_resolutions
  for each row execute function public.sync_kendala_from_resolution();

-- ============================================================
-- 4. RLS: customer boleh memberi keputusan pada resolusi miliknya
--    (kolom yang boleh diubah dibatasi trigger di atas)
-- ============================================================
drop policy if exists "resolutions_customer_decide" on public.issue_resolutions;

create policy "resolutions_customer_decide" on public.issue_resolutions
  for update
  using (
    get_my_role() = 'customer'
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.customer_id = auth.uid()
    )
  )
  with check (
    get_my_role() = 'customer'
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.customer_id = auth.uid()
    )
  );

-- Pengawas tetap boleh mengelola resolusi milik proyeknya.
drop policy if exists "resolutions_pengawas_manage" on public.issue_resolutions;

create policy "resolutions_pengawas_manage" on public.issue_resolutions
  for all
  using (is_project_pengawas(project_id) or get_my_role() = 'admin')
  with check (is_project_pengawas(project_id) or get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 4b. Customer boleh membalas diskusi penanganan
--     (kebijakan sudah ada di 012; dipastikan tetap terpasang)
-- ------------------------------------------------------------
drop policy if exists "discussions_insert" on public.resolution_discussions;

create policy "discussions_insert" on public.resolution_discussions
  for insert
  with check (
    exists (
      select 1 from public.issue_resolutions r
      where r.id = resolution_id
        and (
          is_project_pengawas(r.project_id)
          or (
            get_my_role() = 'customer'
            and exists (
              select 1 from public.projects p
              where p.id = r.project_id and p.customer_id = auth.uid()
            )
          )
        )
    )
  );

-- ============================================================
-- 5. GRANTS
--    Kolom baru tidak butuh grant tambahan; dipastikan hak akses
--    baris (RLS) tersedia untuk ketiga peran yang terlibat.
-- ============================================================
grant select, insert, update on public.issue_resolutions to authenticated;
grant select, insert on public.resolution_discussions to authenticated;
grant select, update on public.kendala to authenticated;
