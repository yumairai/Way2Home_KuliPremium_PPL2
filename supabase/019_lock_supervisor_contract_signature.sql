-- Prevent changing the supervisor signature after it is recorded.
begin;
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
  if current_contract_status <> 'draft' or existing_signature_path is not null then
    raise exception 'Kontrak tidak tersedia untuk tanda tangan pengawas.' using errcode = 'P0001';
  end if;
  update public.contracts set status = 'menunggu_ttd', signed_pengawas_at = now(), signed_pengawas_signature_path = signature_path,
    company_signature_label = 'Placeholder tanda tangan PT Way2Home Konstruksi', document_version = greatest(document_version, 2)
  where project_id = pid;
end;
$$;
revoke all on function public.sign_supervisor_contract(uuid, text) from public;
grant execute on function public.sign_supervisor_contract(uuid, text) to authenticated;
commit;
