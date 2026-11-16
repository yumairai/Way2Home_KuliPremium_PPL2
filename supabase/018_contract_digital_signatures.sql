-- Contract digital-signature flow: supervisor signs after staffing, then customer
-- signs and gives explicit consent before payment scheduling starts.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contract-signatures', 'contract-signatures', false, 1048576, array['image/png']::text[])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/png']::text[];

alter table public.contracts
  add column if not exists signed_customer_signature_path text,
  add column if not exists signed_pengawas_signature_path text,
  add column if not exists document_version integer not null default 1,
  add column if not exists signed_customer_consent_at timestamptz,
  add column if not exists company_signature_label text not null default 'Placeholder tanda tangan PT Way2Home Konstruksi';

create or replace function public.sign_supervisor_contract(pid uuid, signature_path text)
returns void language plpgsql security definer set search_path = public, storage as $$
declare
  supervisor_id uuid := auth.uid();
  current_status public.project_status;
  current_contract_status text;
  existing_signature_path text;
begin
  if supervisor_id is null or public.get_my_role() <> 'pengawas' then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;
  if signature_path is null or signature_path !~ ('^' || pid::text || '/' || supervisor_id::text || '/pengawas-[a-f0-9-]+[.]png$') then
    raise exception 'Path tanda tangan tidak valid.' using errcode = '22023';
  end if;
  select p.status into current_status from public.projects p where p.id = pid and p.pengawas_id = supervisor_id for update;
  if not found then raise exception 'Proyek tidak ditemukan.' using errcode = 'P0002'; end if;
  if current_status <> 'finalisasi_kontrak' then raise exception 'Proyek belum siap untuk tanda tangan pengawas.' using errcode = 'P0001'; end if;
  select c.status::text, c.signed_pengawas_signature_path into current_contract_status, existing_signature_path from public.contracts c where c.project_id = pid for update;
  if not found then raise exception 'Kontrak belum tersedia.' using errcode = 'P0001'; end if;
  if current_contract_status <> 'draft' or existing_signature_path is not null then raise exception 'Kontrak tidak tersedia untuk tanda tangan pengawas.' using errcode = 'P0001'; end if;
  update public.contracts set status = 'menunggu_ttd', signed_pengawas_at = now(), signed_pengawas_signature_path = signature_path,
    company_signature_label = 'Placeholder tanda tangan PT Way2Home Konstruksi', document_version = greatest(document_version, 2)
  where project_id = pid;
end;
$$;

create or replace function public.sign_project_contract(pid uuid, signature_path text)
returns void language plpgsql security definer set search_path = public, storage as $$
declare
  customer_id uuid := auth.uid();
  current_status public.project_status;
  current_contract_status text;
  supervisor_path text;
begin
  if customer_id is null or public.get_my_role() <> 'customer' then raise exception 'Akses ditolak.' using errcode = '42501'; end if;
  if signature_path is null or signature_path !~ ('^' || pid::text || '/' || customer_id::text || '/customer-[a-f0-9-]+[.]png$') then
    raise exception 'Path tanda tangan tidak valid.' using errcode = '22023';
  end if;
  select p.status into current_status from public.projects p where p.id = pid and p.customer_id = customer_id for update;
  if not found then raise exception 'Proyek tidak ditemukan.' using errcode = 'P0002'; end if;
  if current_status <> 'finalisasi_kontrak' then raise exception 'Proyek tidak sedang menunggu finalisasi kontrak.' using errcode = 'P0001'; end if;
  select c.status::text, c.signed_pengawas_signature_path into current_contract_status, supervisor_path
    from public.contracts c where c.project_id = pid for update;
  if not found then raise exception 'Kontrak belum tersedia.' using errcode = 'P0001'; end if;
  if current_contract_status <> 'menunggu_ttd' or supervisor_path is null then raise exception 'Kontrak belum ditandatangani pengawas.' using errcode = 'P0001'; end if;
  update public.contracts set status = 'aktif', signed_customer_at = now(), signed_customer_consent_at = now(), signed_customer_signature_path = signature_path where project_id = pid;
  update public.projects set status = 'pembayaran_dp' where id = pid;
end;
$$;

revoke all on function public.sign_supervisor_contract(uuid, text) from public;
revoke all on function public.sign_project_contract(uuid) from public;
revoke all on function public.sign_project_contract(uuid, text) from public;
grant execute on function public.sign_supervisor_contract(uuid, text) to authenticated;
grant execute on function public.sign_project_contract(uuid, text) to authenticated;
drop function if exists public.sign_project_contract(uuid);

drop policy if exists "contract_signatures_read_members" on storage.objects;
create policy "contract_signatures_read_members" on storage.objects for select to authenticated using (
  bucket_id = 'contract-signatures' and exists (
    select 1 from public.projects p where (storage.foldername(name))[1] = p.id::text
      and (p.customer_id = auth.uid() or p.pengawas_id = auth.uid() or public.get_my_role() = 'admin')
  )
);
drop policy if exists "contract_signatures_insert_members" on storage.objects;
create policy "contract_signatures_insert_members" on storage.objects for insert to authenticated with check (
  bucket_id = 'contract-signatures' and exists (
    select 1 from public.projects p where (storage.foldername(name))[1] = p.id::text and (
      (p.customer_id = auth.uid() and (storage.foldername(name))[2] = auth.uid()::text and storage.filename(name) like 'customer-%')
      or (p.pengawas_id = auth.uid() and (storage.foldername(name))[2] = auth.uid()::text and storage.filename(name) like 'pengawas-%')
    )
  )
);
commit;
