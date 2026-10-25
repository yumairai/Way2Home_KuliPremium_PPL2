DROP POLICY IF EXISTS "projects_customer_delete_draft" ON public.projects;

CREATE POLICY "projects_customer_delete_draft" ON public.projects
FOR DELETE TO authenticated
USING (
  customer_id = auth.uid()
  AND status IN (
    'draft',
    'verifikasi_dokumen',
    'revisi_dokumen',
    'alokasi_mandor_pengawas',
    'finalisasi_kontrak'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.contracts AS c
    WHERE c.project_id = projects.id
      AND (
        c.signed_customer_at IS NOT NULL
        OR c.status IN ('aktif', 'selesai')
      )
  )
);
