-- Menambahkan kolom sesuai struktur designs.csv
alter table designs
  add column if not exists slug text,
  add column if not exists nama text,
  add column if not exists gaya_arsitektur text,
  add column if not exists luas_tanah numeric,
  add column if not exists luas_bangunan numeric,
  add column if not exists jumlah_kamar_tidur int,
  add column if not exists jumlah_lantai int,
  add column if not exists estimasi_biaya numeric,
  add column if not exists durasi_bulan int,
  add column if not exists deskripsi text,
  add column if not exists highlights text[] not null default '{}',
  add column if not exists dasar_pemetaan text[] not null default '{}';

-- Membuat slug sebagai identitas unik desain
create unique index if not exists designs_slug_key
  on designs (slug);

create table if not exists design_location_scores (
  id uuid primary key default gen_random_uuid(),

  slug text not null,
  nama text not null,
  lokasi text not null,

  skor_hujan numeric,
  skor_panas numeric,
  skor_kelembapan numeric,
  skor_kecocokan_iklim numeric,

  peringkat_lokasi_untuk_desain int,
  cocok boolean not null default false,

  created_at timestamptz not null default now(),

  constraint fk_design_location_scores_design
    foreign key (slug)
    references designs (slug)
    on update cascade
    on delete cascade,

  constraint unique_design_location
    unique (slug, lokasi)
);

-- Mempercepat pencarian desain berdasarkan lokasi
create index if not exists idx_design_location_scores_lokasi
  on design_location_scores (lokasi);

-- Mempercepat filter desain yang cocok
create index if not exists idx_design_location_scores_cocok
  on design_location_scores (cocok);

-- Mempercepat pencarian berdasarkan kombinasi lokasi dan kecocokan
create index if not exists idx_design_location_scores_lokasi_cocok
  on design_location_scores (lokasi, cocok);

-- Mempercepat pencarian berdasarkan peringkat
create index if not exists idx_design_location_scores_peringkat
  on design_location_scores (slug, peringkat_lokasi_untuk_desain);

-- Aktifkan RLS
ALTER TABLE public.design_location_scores
ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "location_scores_select_authenticated"
ON public.design_location_scores;

DROP POLICY IF EXISTS "location_scores_admin_all"
ON public.design_location_scores;

-- Semua pengguna yang login dapat membaca skor lokasi
CREATE POLICY "location_scores_select_authenticated"
ON public.design_location_scores
FOR SELECT
TO authenticated
USING (true);