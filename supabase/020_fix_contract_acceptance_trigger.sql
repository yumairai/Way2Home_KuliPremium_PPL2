-- Customer contract acceptance transitions the project only after the contract
-- update, signature path, and explicit consent have been validated by the RPC.
-- Rebuild payment schedule creation for this transition (not on status update).
begin;

drop trigger if exists create_project_payment_schedule_on_status_change on public.projects;

drop function if exists public.create_project_payment_schedule();

drop function if exists public.sign_project_contract(uuid, text);

create function public.sign_project_contract(pid uuid, signature_path text)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  authenticated_customer_id uuid := auth.uid();
  current_status public.project_status;
  current_contract_status text;
  supervisor_path text;
  contract_row public.contracts%rowtype;
  contract_total numeric;
  dp_due_date date;
  installment_start_date date;
  dp_amount numeric;
  installment_one_amount numeric;
  installment_two_amount numeric;
begin
  if authenticated_customer_id is null or public.get_my_role() <> 'customer' then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;
  if signature_path is null or signature_path !~ ('^' || pid::text || '/' || authenticated_customer_id::text || '/customer-[a-f0-9-]+[.]png$') then
    raise exception 'Path tanda tangan tidak valid.' using errcode = '22023';
  end if;

  select p.status into current_status
  from public.projects p
  where p.id = pid and p.customer_id = authenticated_customer_id
  for update;
  if not found then raise exception 'Proyek tidak ditemukan.' using errcode = 'P0002'; end if;
  if current_status <> 'finalisasi_kontrak' then
    raise exception 'Proyek tidak sedang menunggu finalisasi kontrak.' using errcode = 'P0001';
  end if;

  select c.* into contract_row
  from public.contracts c
  where c.project_id = pid
  for update;
  if not found then raise exception 'Kontrak belum tersedia.' using errcode = 'P0001'; end if;
  current_contract_status := contract_row.status::text;
  supervisor_path := contract_row.signed_pengawas_signature_path;
  if current_contract_status <> 'menunggu_ttd' or supervisor_path is null then
    raise exception 'Kontrak belum ditandatangani pengawas.' using errcode = 'P0001';
  end if;
  if contract_row.signed_customer_at is not null or contract_row.signed_customer_signature_path is not null then
    raise exception 'Kontrak sudah disetujui sebelumnya.' using errcode = 'P0001';
  end if;

  update public.contracts
  set status = 'aktif', signed_customer_at = now(), signed_customer_consent_at = now(), signed_customer_signature_path = signature_path
  where id = contract_row.id;

  contract_total := round(contract_row.nilai_kontrak);
  if contract_total is null or contract_total <= 0 then
    raise exception 'Nilai kontrak tidak valid.' using errcode = 'P0001';
  end if;
  dp_amount := round(contract_total * 0.30);
  installment_one_amount := round(contract_total * 0.25);
  installment_two_amount := round(contract_total * 0.25);
  dp_due_date := (coalesce(contract_row.signed_customer_at, contract_row.created_at)::date + 7);
  installment_start_date := coalesce(contract_row.tanggal_mulai, current_date);

  insert into public.payment_stages (project_id, nama_tahap, urutan, nominal, status, tanggal_jatuh_tempo)
  values
    (pid, 'Down Payment (30%)', 0, dp_amount, 'belum', dp_due_date),
    (pid, 'Cicilan 1 (25%)', 1, installment_one_amount, 'belum', (installment_start_date + interval '1 month')::date),
    (pid, 'Cicilan 2 (25%)', 2, installment_two_amount, 'belum', (installment_start_date + interval '2 months')::date),
    (pid, 'Cicilan 3 (20%)', 3, contract_total - dp_amount - installment_one_amount - installment_two_amount, 'belum', (installment_start_date + interval '3 months')::date)
  on conflict (project_id, urutan) do nothing;

  update public.projects
  set status = 'pembayaran_dp'
  where id = pid and customer_id = authenticated_customer_id and status = 'finalisasi_kontrak';
end;
$$;

revoke all on function public.sign_project_contract(uuid, text) from public;
grant execute on function public.sign_project_contract(uuid, text) to authenticated;
commit;

