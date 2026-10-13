alter table designs
  add column if not exists slug text,
  add column if not exists deskripsi text,
  add column if not exists luas_tanah numeric,
  add column if not exists jumlah_lantai int,
  add column if not exists lokasi text,            -- lokasi contoh/referensi desain
  add column if not exists highlights text[] not null default '{}';

create unique index if not exists designs_slug_key on designs (slug);