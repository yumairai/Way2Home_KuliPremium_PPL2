-- ============================================================
-- 012_mandor_pengawas_flow.sql
--
-- Backend alur lapangan Mandor -> Pengawas.
--
-- Menambahkan model "milestone + subtask" yang dipakai UI:
--   project_stages  = milestone (6 tahap, dibuat manual oleh Pengawas)
--   project_subtasks= subtask dengan bobot (total 100%)
--
-- Alur resmi:
--   1. Pengawas membuat tahapan + subtask.
--   2. Mandor mengirim laporan progress per subtask  -> progress_reports (pending)
--   3. Pengawas memverifikasi                        -> keputusan + feedback
--      Subtask ditandai selesai & progres resmi tahap ikut naik.
--   4. Mandor melaporkan kendala                     -> kendala
--   5. Pengawas menindaklanjuti                      -> tindak_lanjut + resolusi
--   6. Mandor mengirim catatan singkat               -> foreman_notes
--   7. Pengawas menerbitkan dokumentasi & update customer.
-- ============================================================

-- ============================================================
-- 1. TAHAPAN: tambah tanggal & catatan arahan
-- ============================================================
alter table public.project_stages
  add column if not exists tanggal_mulai date,
  add column if not exists tanggal_selesai date;

comment on column public.project_stages.keterangan is
  'Arahan pengawas untuk tahap ini; ditampilkan sebagai "Arahan pengawas" pada panel mandor.';

-- ============================================================
-- 2. SUBTASK (bobot per item, total 100%)
-- ============================================================
create table if not exists public.project_subtasks (
  id uuid primary key default gen_random_uuid(),
  project_stage_id uuid not null references public.project_stages(id) on delete cascade,
  judul text not null,
  bobot numeric not null default 0 check (bobot >= 0),
  urutan int not null default 0,
  target_selesai date,
  selesai boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_subtasks_stage on public.project_subtasks(project_stage_id);

alter table public.project_subtasks enable row level security;

drop policy if exists "subtasks_select" on public.project_subtasks;
create policy "subtasks_select" on public.project_subtasks
  for select using (
    exists (
      select 1 from public.project_stages ps
      where ps.id = project_stage_id and is_project_member(ps.project_id)
    )
  );

drop policy if exists "subtasks_pengawas_manage" on public.project_subtasks;
create policy "subtasks_pengawas_manage" on public.project_subtasks
  for all using (
    exists (
      select 1 from public.project_stages ps
      where ps.id = project_stage_id
        and (is_project_pengawas(ps.project_id) or get_my_role() = 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.project_stages ps
      where ps.id = project_stage_id
        and (is_project_pengawas(ps.project_id) or get_my_role() = 'admin')
    )
  );

-- ============================================================
-- 3. LAPORAN PROGRESS: keputusan + feedback pengawas
--    persentase menyimpan bobot subtask yang dilaporkan.
-- ============================================================
alter table public.progress_reports
  add column if not exists project_subtask_id uuid references public.project_subtasks(id) on delete set null,
  add column if not exists keputusan text not null default 'menunggu'
    check (keputusan in ('menunggu', 'disetujui', 'perlu_revisi')),
  add column if not exists feedback text,
  add column if not exists revisi_ke int not null default 1;

comment on column public.progress_reports.persentase is
  'Bobot subtask (%) yang dilaporkan mandor, bukan progres kumulatif.';
comment on column public.progress_reports.keputusan is
  'menunggu | disetujui | perlu_revisi. Kolom status tetap disinkronkan (verified <-> disetujui).';

-- ============================================================
-- 4. KENDALA: rincian struktur dari form mandor
-- ============================================================
alter table public.kendala
  add column if not exists project_subtask_id uuid references public.project_subtasks(id) on delete set null,
  add column if not exists kategori text,
  add column if not exists kondisi_pekerjaan text
    check (kondisi_pekerjaan is null or kondisi_pekerjaan in ('BERJALAN', 'TERHAMBAT_SEBAGIAN', 'BERHENTI')),
  add column if not exists informasi_tambahan text,
  add column if not exists lampiran text,
  add column if not exists lampiran_nama text,
  add column if not exists updated_at timestamptz;

-- ============================================================
-- 5. CATATAN MANDOR UNTUK PENGAWAS
-- ============================================================
create table if not exists public.foreman_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  mandor_id uuid not null references public.mandor_profiles(id),
  catatan text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_foreman_notes_project on public.foreman_notes(project_id);

alter table public.foreman_notes enable row level security;

drop policy if exists "foreman_notes_select" on public.foreman_notes;
create policy "foreman_notes_select" on public.foreman_notes
  for select using (is_project_member(project_id));

drop policy if exists "foreman_notes_mandor_insert" on public.foreman_notes;
create policy "foreman_notes_mandor_insert" on public.foreman_notes
  for insert with check (mandor_id = auth.uid() and is_project_mandor(project_id));

-- ============================================================
-- 6. PENANGANAN KENDALA (Pengawas -> Customer -> Mandor)
-- ============================================================
create table if not exists public.issue_resolutions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kendala_id uuid not null references public.kendala(id) on delete cascade,
  solusi text not null,
  sumber text not null default 'Pengawas' check (sumber in ('Pengawas', 'Analisis AI')),
  analisis_ai jsonb,
  status text not null default 'Ditindaklanjuti',
  butuh_persetujuan boolean not null default false,
  alasan_persetujuan text,
  bukti text,
  umpan_balik_customer text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resolutions_kendala on public.issue_resolutions(kendala_id);

create table if not exists public.resolution_discussions (
  id uuid primary key default gen_random_uuid(),
  resolution_id uuid not null references public.issue_resolutions(id) on delete cascade,
  penulis text not null check (penulis in ('Pengawas', 'Customer')),
  pesan text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_discussions_resolution on public.resolution_discussions(resolution_id);

alter table public.issue_resolutions enable row level security;
alter table public.resolution_discussions enable row level security;

drop policy if exists "resolutions_select" on public.issue_resolutions;
create policy "resolutions_select" on public.issue_resolutions
  for select using (is_project_member(project_id));

drop policy if exists "resolutions_pengawas_manage" on public.issue_resolutions;
create policy "resolutions_pengawas_manage" on public.issue_resolutions
  for all using (is_project_pengawas(project_id) or get_my_role() = 'admin')
  with check (is_project_pengawas(project_id) or get_my_role() = 'admin');

drop policy if exists "discussions_select" on public.resolution_discussions;
create policy "discussions_select" on public.resolution_discussions
  for select using (
    exists (
      select 1 from public.issue_resolutions r
      where r.id = resolution_id and is_project_member(r.project_id)
    )
  );

drop policy if exists "discussions_insert" on public.resolution_discussions;
create policy "discussions_insert" on public.resolution_discussions
  for insert with check (
    exists (
      select 1 from public.issue_resolutions r
      where r.id = resolution_id
        and (
          is_project_pengawas(r.project_id)
          or (
            get_my_role() = 'customer'
            and exists (select 1 from public.projects p where p.id = r.project_id and p.customer_id = auth.uid())
          )
        )
    )
  );

-- ============================================================
-- 7. DOKUMENTASI: boleh tanpa tahap (dokumentasi umum proyek)
-- ============================================================
alter table public.progress_documentation
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

alter table public.progress_documentation
  alter column project_stage_id drop not null;

drop policy if exists "documentation_select" on public.progress_documentation;
drop policy if exists "documentation_insert" on public.progress_documentation;

create policy "documentation_select" on public.progress_documentation
  for select using (
    is_project_member(project_id)
    or (
      project_stage_id is not null
      and exists (select 1 from public.project_stages ps where ps.id = project_stage_id and is_project_member(ps.project_id))
    )
  );

create policy "documentation_insert" on public.progress_documentation
  for insert with check (
    uploaded_by = auth.uid()
    and (is_project_pengawas(project_id) or is_project_mandor(project_id))
  );

-- ============================================================
-- 8. CATATAN VERIFIKASI MANDOR (ditulis admin saat menolak)
-- ============================================================
alter table public.mandor_profiles
  add column if not exists catatan_verifikasi text;

-- ------------------------------------------------------------
-- 8b. Pengerasan: policy "mandor_update_own" di schema.sql terlalu
--     longgar sehingga mandor bisa menyetujui dirinya sendiri.
--     Mandor hanya boleh mengajukan ulang verifikasi (status -> pending)
--     dan tidak boleh menyentuh kolom profil lain.
-- ------------------------------------------------------------
create or replace function public.enforce_mandor_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_my_role() = 'admin' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.keahlian is distinct from old.keahlian
     or new.pengalaman_tahun is distinct from old.pengalaman_tahun
     or new.area_kerja is distinct from old.area_kerja
     or new.portofolio_url is distinct from old.portofolio_url
     or new.catatan_verifikasi is distinct from old.catatan_verifikasi
     or new.created_at is distinct from old.created_at then
    raise exception 'Mandor hanya boleh mengajukan ulang verifikasi.';
  end if;

  if new.status is distinct from old.status and new.status <> 'pending' then
    raise exception 'Status verifikasi hanya dapat diubah oleh admin.';
  end if;

  new.catatan_verifikasi := null;
  return new;
end;
$$;

drop trigger if exists trg_mandor_profile_update on public.mandor_profiles;
create trigger trg_mandor_profile_update
  before update on public.mandor_profiles
  for each row execute function public.enforce_mandor_profile_update();

-- ============================================================
-- 9. GRANTS
--    (dipertegas karena beberapa tabel baru & policy lama berubah)
-- ============================================================
grant select, update on public.project_stages to authenticated;
grant select, insert, update, delete on public.project_subtasks to authenticated;
grant select, insert, update on public.progress_reports to authenticated;
grant select, insert, update on public.kendala to authenticated;
grant select, insert on public.foreman_notes to authenticated;
grant select, insert, update on public.issue_resolutions to authenticated;
grant select, insert on public.resolution_discussions to authenticated;
grant select, insert, update on public.progress_documentation to authenticated;
grant select, insert on public.project_updates to authenticated;
grant select, update on public.mandor_profiles to authenticated;
