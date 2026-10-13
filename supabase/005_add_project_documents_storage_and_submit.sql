-- 1. Bucket
insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

-- 2. Storage policies: folder pertama di path = project_id
drop policy if exists "project_docs_storage_insert" on storage.objects;
create policy "project_docs_storage_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(name))[1]
      and p.customer_id = auth.uid()
  )
);

drop policy if exists "project_docs_storage_select" on storage.objects;
create policy "project_docs_storage_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'project-documents'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(name))[1]
      and public.is_project_member(p.id)
  )
);

drop policy if exists "project_docs_storage_delete" on storage.objects;
create policy "project_docs_storage_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'project-documents'
  and (
    public.get_my_role() = 'admin'
    or exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.customer_id = auth.uid()
    )
  )
);

-- 3. RLS Policies untuk tabel projects
-- a. Customer boleh membuat (INSERT) proyek miliknya
drop policy if exists "projects_customer_insert" on public.projects;
create policy "projects_customer_insert" on public.projects
for insert to authenticated
with check (customer_id = auth.uid());

-- b. Customer & anggota proyek boleh membaca (SELECT) proyek miliknya
drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects
for select to authenticated
using (
  customer_id = auth.uid()
  or public.is_project_member(id)
);

-- c. Customer boleh hapus proyek DRAFT miliknya (buat rollback saat upload gagal)
drop policy if exists "projects_customer_delete_draft" on public.projects;
create policy "projects_customer_delete_draft" on public.projects
for delete to authenticated
using (customer_id = auth.uid() and status = 'draft');

-- 4. Fungsi untuk ubah status draft -> menunggu_pengawas
create or replace function public.submit_project(pid uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from projects
    where id = pid and customer_id = auth.uid() and status = 'draft'
  ) then
    raise exception 'Proyek tidak ditemukan atau sudah diajukan';
  end if;

  if (
    select count(distinct jenis_dokumen) from project_documents
    where project_id = pid
      and jenis_dokumen in ('sertifikat_tanah','ktp_pemilik','imb_pbg')
  ) < 3 then
    raise exception 'Dokumen wajib belum lengkap';
  end if;

  update projects set status = 'menunggu_pengawas' where id = pid;
end;
$$;

revoke execute on function public.submit_project(uuid) from public, anon;
grant execute on function public.submit_project(uuid) to authenticated;

-- 5. Privilese & Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Katalog: dibaca siapa saja
GRANT SELECT ON public.designs TO anon, authenticated;
GRANT SELECT ON public.design_images TO anon, authenticated;

-- Profil: authenticated
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Proyek: authenticated boleh INSERT, SELECT, dan DELETE draf
GRANT SELECT, INSERT, DELETE ON public.projects TO authenticated;

-- Dokumen proyek: authenticated boleh SELECT, INSERT, DELETE
GRANT SELECT, INSERT, DELETE ON public.project_documents TO authenticated;

-- Kontrak & Tahap Pembayaran: authenticated boleh SELECT
GRANT SELECT ON public.contracts TO authenticated;
GRANT SELECT ON public.payment_stages TO authenticated;
