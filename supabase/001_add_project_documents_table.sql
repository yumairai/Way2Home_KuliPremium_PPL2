-- ============================================================
-- PROJECT DOCUMENTS
-- ============================================================

create table project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  jenis_dokumen text not null,
  nama_dokumen text not null,
  url text not null,
  uploaded_by uuid not null references profiles(id),
  catatan text,
  created_at timestamptz not null default now()
);

-- INDEX
create index idx_project_documents_project
on project_documents(project_id);

create index idx_project_documents_uploaded_by
on project_documents(uploaded_by);

-- RLS ENABLE
alter table project_documents enable row level security;

-- Semua anggota project dapat melihat dokumen
create policy "project_documents_select"
on project_documents
for select
using (
  is_project_member(project_id)
);

-- Customer project dan admin dapat upload dokumen
create policy "project_documents_insert"
on project_documents
for insert
with check (
  uploaded_by = auth.uid()
  and (
    get_my_role() = 'admin'
    or (
      get_my_role() = 'customer'
      and exists (
        select 1
        from projects p
        where p.id = project_id
        and p.customer_id = auth.uid()
      )
    )
  )
);

-- Pengunggah atau admin dapat mengubah dokumen
create policy "project_documents_update"
on project_documents
for update
using (
  uploaded_by = auth.uid()
  or get_my_role() = 'admin'
)
with check (
  uploaded_by = auth.uid()
  or get_my_role() = 'admin'
);

-- Pengunggah atau admin dapat menghapus dokumen
create policy "project_documents_delete"
on project_documents
for delete
using (
  uploaded_by = auth.uid()
  or get_my_role() = 'admin'
);