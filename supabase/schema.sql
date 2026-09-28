-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('customer', 'admin', 'pengawas', 'mandor');
create type verifikasi_status as enum ('pending', 'approved', 'rejected');
create type project_status as enum ('draft', 'menunggu_pengawas', 'kontrak', 'berjalan', 'selesai', 'batal');
create type contract_status as enum ('draft', 'menunggu_ttd', 'aktif', 'selesai');
create type payment_status as enum ('belum', 'lunas');
create type report_status as enum ('pending', 'verified');
create type kendala_status as enum ('reported', 'reviewed', 'resolved');

-- ============================================================
-- PROFILES (extend auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table mandor_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  keahlian text[] not null default '{}',
  pengalaman_tahun int,
  area_kerja text,
  portofolio_url text,
  status verifikasi_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table pengawas_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  spesialisasi text,
  aktif boolean not null default true
);

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  );

  if (new.raw_user_meta_data->>'role') = 'mandor' then
    insert into mandor_profiles (id) values (new.id);
  elsif (new.raw_user_meta_data->>'role') = 'pengawas' then
    insert into pengawas_profiles (id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- KATALOG & KEBUTUHAN
-- ============================================================
create table designs (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  gaya_arsitektur text not null,
  luas_bangunan numeric,
  jumlah_kamar_tidur int,
  jumlah_kamar_mandi int,
  spesifikasi jsonb not null default '{}',
  estimasi_biaya numeric not null,
  estimasi_durasi_hari int not null,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table design_images (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references designs(id) on delete cascade,
  url text not null,
  urutan int not null default 0
);

create table customer_requirements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  luas_tanah numeric not null,
  jumlah_kamar_tidur int not null,
  jumlah_kamar_mandi int not null,
  gaya_arsitektur text,
  budget numeric not null,
  lokasi text not null,
  created_at timestamptz not null default now()
);

create table ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references customer_requirements(id) on delete cascade,
  design_id uuid not null references designs(id),
  alasan text not null,
  estimasi_biaya numeric not null,
  estimasi_durasi_hari int not null,
  rank int not null default 1,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROYEK, ASSIGNMENT, KONTRAK
-- ============================================================
create table projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  design_id uuid not null references designs(id),
  requirement_id uuid references customer_requirements(id),
  pengawas_id uuid references pengawas_profiles(id),
  status project_status not null default 'draft',
  nilai_proyek numeric,
  created_at timestamptz not null default now()
);

create table project_mandors (
  project_id uuid not null references projects(id) on delete cascade,
  mandor_id uuid not null references mandor_profiles(id),
  assigned_by uuid references profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (project_id, mandor_id)
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  ruang_lingkup text not null,
  spesifikasi jsonb not null default '{}',
  nilai_kontrak numeric not null,
  tanggal_mulai date,
  tanggal_selesai_estimasi date,
  tanggung_jawab jsonb default '{}',
  ketentuan_perubahan text,
  status contract_status not null default 'draft',
  signed_customer_at timestamptz,
  signed_pengawas_at timestamptz,
  signed_mandor_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TAHAPAN, PROGRESS, KENDALA, PEMBAYARAN
-- ============================================================
create table project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  nama_tahap text not null,
  urutan int not null,
  progress_percentage int not null default 0 check (progress_percentage between 0 and 100),
  status text not null default 'belum_mulai',
  keterangan text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table progress_reports (
  id uuid primary key default gen_random_uuid(),
  project_stage_id uuid not null references project_stages(id) on delete cascade,
  mandor_id uuid not null references mandor_profiles(id),
  persentase int not null check (persentase between 0 and 100),
  keterangan text,
  foto_url text,
  status report_status not null default 'pending',
  verified_by uuid references pengawas_profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table kendala (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  project_stage_id uuid references project_stages(id),
  reported_by uuid not null references mandor_profiles(id),
  deskripsi text not null,
  status kendala_status not null default 'reported',
  tindak_lanjut text,
  dampak_biaya numeric,
  dampak_waktu_hari int,
  visible_to_customer boolean not null default false,
  created_at timestamptz not null default now()
);

create table payment_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  nama_tahap text not null,
  urutan int not null,
  nominal numeric not null,
  status payment_status not null default 'belum',
  tanggal_bayar timestamptz
);

-- ============================================================
-- PRIORITAS 2 (opsional, ringan)
-- ============================================================
create table progress_documentation (
  id uuid primary key default gen_random_uuid(),
  project_stage_id uuid not null references project_stages(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  url text not null,
  catatan text,
  created_at timestamptz not null default now()
);

create table project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  pengawas_id uuid not null references pengawas_profiles(id),
  judul text not null,
  isi text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  judul text not null,
  isi text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_requirements_customer on customer_requirements(customer_id);
create index idx_recommendations_requirement on ai_recommendations(requirement_id);
create index idx_projects_customer on projects(customer_id);
create index idx_projects_pengawas on projects(pengawas_id);
create index idx_projects_status on projects(status);
create index idx_project_mandors_mandor on project_mandors(mandor_id);
create index idx_contracts_project on contracts(project_id);
create index idx_stages_project on project_stages(project_id);
create index idx_progress_stage on progress_reports(project_stage_id);
create index idx_progress_mandor on progress_reports(mandor_id);
create index idx_kendala_project on kendala(project_id);
create index idx_payment_project on payment_stages(project_id);
create index idx_notifications_user on notifications(user_id) where is_read = false;

-- ============================================================
-- HELPER FUNCTIONS (dipakai berulang di RLS)
-- ============================================================
create or replace function get_my_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_project_member(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from projects p
    where p.id = pid
    and (
      p.customer_id = auth.uid()
      or p.pengawas_id = auth.uid()
      or exists (select 1 from project_mandors pm where pm.project_id = p.id and pm.mandor_id = auth.uid())
      or get_my_role() = 'admin'
    )
  )
$$;

create or replace function is_project_pengawas(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from projects p where p.id = pid and p.pengawas_id = auth.uid()
  )
$$;

create or replace function is_project_mandor(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from project_mandors pm where pm.project_id = pid and pm.mandor_id = auth.uid()
  )
$$;

-- ============================================================
-- RLS: ENABLE
-- ============================================================
alter table profiles enable row level security;
alter table mandor_profiles enable row level security;
alter table pengawas_profiles enable row level security;
alter table designs enable row level security;
alter table design_images enable row level security;
alter table customer_requirements enable row level security;
alter table ai_recommendations enable row level security;
alter table projects enable row level security;
alter table project_mandors enable row level security;
alter table contracts enable row level security;
alter table project_stages enable row level security;
alter table progress_reports enable row level security;
alter table kendala enable row level security;
alter table payment_stages enable row level security;
alter table progress_documentation enable row level security;
alter table project_updates enable row level security;
alter table notifications enable row level security;

-- ============================================================
-- RLS: PROFILES
-- ============================================================
create policy "profiles_select" on profiles
  for select using (id = auth.uid() or get_my_role() = 'admin' or get_my_role() in ('pengawas','mandor'));

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_admin_all" on profiles
  for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

-- ============================================================
-- RLS: MANDOR / PENGAWAS PROFILES
-- ============================================================
create policy "mandor_select" on mandor_profiles
  for select using (
    id = auth.uid() or status = 'approved' or get_my_role() in ('admin','pengawas')
  );

create policy "mandor_update_own" on mandor_profiles
  for update using (id = auth.uid() and get_my_role() = 'mandor')
  with check (id = auth.uid());

create policy "mandor_admin_verify" on mandor_profiles
  for update using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

create policy "mandor_insert_own" on mandor_profiles
  for insert with check (id = auth.uid());

create policy "pengawas_select" on pengawas_profiles
  for select using (true); -- info dasar pengawas gak sensitif, boleh dibuka ke semua login

create policy "pengawas_admin_write" on pengawas_profiles
  for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

-- ============================================================
-- RLS: DESIGNS & IMAGES
-- ============================================================
create policy "designs_select" on designs
  for select using (is_active = true or get_my_role() = 'admin');

create policy "designs_admin_write" on designs
  for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

create policy "design_images_select" on design_images
  for select using (exists (select 1 from designs d where d.id = design_id and (d.is_active or get_my_role() = 'admin')));

create policy "design_images_admin_write" on design_images
  for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

-- ============================================================
-- RLS: CUSTOMER REQUIREMENTS & AI RECOMMENDATIONS
-- ============================================================
create policy "requirements_owner" on customer_requirements
  for all using (customer_id = auth.uid() or get_my_role() = 'admin')
  with check (customer_id = auth.uid());

create policy "recommendations_select" on ai_recommendations
  for select using (
    exists (
      select 1 from customer_requirements r
      where r.id = requirement_id and (r.customer_id = auth.uid() or get_my_role() = 'admin')
    )
  );

-- ============================================================
-- RLS: PROJECTS & PROJECT_MANDORS
-- ============================================================
create policy "projects_select" on projects
  for select using (is_project_member(id));

create policy "projects_customer_insert" on projects
  for insert with check (customer_id = auth.uid());

create policy "projects_update" on projects
  for update using (
    (customer_id = auth.uid() and status = 'draft')
    or pengawas_id = auth.uid()
    or get_my_role() = 'admin'
  );

create policy "project_mandors_select" on project_mandors
  for select using (is_project_member(project_id));

create policy "project_mandors_pengawas_manage" on project_mandors
  for all using (is_project_pengawas(project_id) or get_my_role() = 'admin')
  with check (
    (is_project_pengawas(project_id) or get_my_role() = 'admin')
    and exists (select 1 from mandor_profiles mp where mp.id = mandor_id and mp.status = 'approved')
  );

-- ============================================================
-- RLS: CONTRACTS
-- ============================================================
create policy "contracts_select" on contracts
  for select using (is_project_member(project_id));

create policy "contracts_pengawas_admin_write" on contracts
  for all using (is_project_pengawas(project_id) or get_my_role() = 'admin')
  with check (is_project_pengawas(project_id) or get_my_role() = 'admin');

create policy "contracts_customer_sign" on contracts
  for update using (
    exists (select 1 from projects p where p.id = project_id and p.customer_id = auth.uid())
  );

-- ============================================================
-- RLS: PROJECT STAGES
-- ============================================================
create policy "stages_select" on project_stages
  for select using (is_project_member(project_id));

create policy "stages_pengawas_write" on project_stages
  for all using (is_project_pengawas(project_id) or get_my_role() = 'admin')
  with check (is_project_pengawas(project_id) or get_my_role() = 'admin');

-- ============================================================
-- RLS: PROGRESS REPORTS
-- ============================================================
create policy "progress_select" on progress_reports
  for select using (
    exists (select 1 from project_stages ps where ps.id = project_stage_id and is_project_member(ps.project_id))
  );

create policy "progress_mandor_insert" on progress_reports
  for insert with check (
    mandor_id = auth.uid()
    and exists (
      select 1 from project_stages ps
      where ps.id = project_stage_id and is_project_mandor(ps.project_id)
    )
  );

create policy "progress_pengawas_verify" on progress_reports
  for update using (
    exists (select 1 from project_stages ps where ps.id = project_stage_id and is_project_pengawas(ps.project_id))
    or get_my_role() = 'admin'
  );

-- ============================================================
-- RLS: KENDALA
-- ============================================================
create policy "kendala_select" on kendala
  for select using (
    reported_by = auth.uid()
    or (get_my_role() = 'customer' and visible_to_customer = true and is_project_member(project_id))
    or (get_my_role() in ('pengawas','admin') and is_project_member(project_id))
  );

create policy "kendala_mandor_insert" on kendala
  for insert with check (reported_by = auth.uid() and is_project_mandor(project_id));

create policy "kendala_pengawas_update" on kendala
  for update using (is_project_pengawas(project_id) or get_my_role() = 'admin');

-- ============================================================
-- RLS: PAYMENT STAGES
-- ============================================================
create policy "payment_select" on payment_stages
  for select using (is_project_member(project_id));

create policy "payment_admin_pengawas_write" on payment_stages
  for all using (is_project_pengawas(project_id) or get_my_role() = 'admin')
  with check (is_project_pengawas(project_id) or get_my_role() = 'admin');

-- ============================================================
-- RLS: DOKUMENTASI, UPDATES, NOTIFICATIONS (Prioritas 2)
-- ============================================================
create policy "documentation_select" on progress_documentation
  for select using (
    exists (select 1 from project_stages ps where ps.id = project_stage_id and is_project_member(ps.project_id))
  );

create policy "documentation_insert" on progress_documentation
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from project_stages ps
      where ps.id = project_stage_id
      and (is_project_pengawas(ps.project_id) or is_project_mandor(ps.project_id))
    )
  );

create policy "updates_select" on project_updates
  for select using (is_project_member(project_id));

create policy "updates_pengawas_insert" on project_updates
  for insert with check (pengawas_id = auth.uid() and is_project_pengawas(project_id));

create policy "notifications_own" on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());