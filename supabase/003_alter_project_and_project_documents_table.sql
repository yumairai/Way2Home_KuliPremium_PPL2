-- 1. Alamat & budget ada di form, belum ada di projects
alter table public.projects
  add column if not exists alamat_proyek text,
  add column if not exists budget_proyek numeric;

-- 2. Info file buat validasi & tampilan
alter table public.project_documents
  add column if not exists ukuran_bytes integer,
  add column if not exists mime_type text;

-- 3. Satu dokumen per jenis per proyek (biar "Ajukan Ulang" tinggal replace)
create unique index if not exists project_documents_proyek_jenis_uniq
  on public.project_documents (project_id, jenis_dokumen)
  where jenis_dokumen in ('sertifikat_tanah','ktp_pemilik','imb_pbg','surat_kuasa');