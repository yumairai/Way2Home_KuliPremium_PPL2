import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { ServiceError } from "@/services/access.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Run the atomic, server-only test submission workflow for the authenticated customer's project. */
export async function automateTestProjectSubmission(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new ServiceError("Sesi tidak valid.", 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_test_user")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_test_user) return;

  const admin = createAdminClient();
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, customer_id, status")
    .eq("id", projectId)
    .eq("customer_id", user.id)
    .single();
  if (projectError || !project) throw new ServiceError("Proyek tidak ditemukan.", 404);
  if (project.status !== "verifikasi_dokumen") return;

  const { data: docs, error: docsError } = await admin
    .from("project_documents")
    .select("jenis_dokumen")
    .eq("project_id", projectId);
  const required = ["sertifikat_tanah", "ktp_pemilik", "imb_pbg"];
  
  console.log("[test-automation] Documents check:", {
    projectId,
    docsError: docsError?.message,
    docsCount: docs?.length,
    foundTypes: docs?.map(d => d.jenis_dokumen),
    requiredTypes: required,
  });
  
  if (docsError || !docs || !required.every((kind) => docs.some((doc) => doc.jenis_dokumen === kind))) {
    if (docsError) {
      console.error("[test-automation] Gagal membaca project_documents:", docsError);
      throw new ServiceError(
        "Server tidak dapat membaca dokumen proyek. Periksa service-role key dan grant tabel project_documents.",
        500,
      );
    }
    throw new ServiceError("Dokumen wajib pengajuan tidak lengkap.", 409);
  }

  const { data: supervisor, error: supervisorError } = await admin
    .from("profiles")
    .select("id")
    .eq("is_test_user", true)
    .eq("role", "pengawas")
    .limit(1)
    .single();
  const { data: mandor, error: mandorError } = await admin
    .from("mandor_profiles")
    .select("id")
    .eq("status", "approved")
    .in("id", (await admin.from("profiles").select("id").eq("is_test_user", true).eq("role", "mandor")).data?.map((row) => row.id) ?? [])
    .limit(1)
    .single();
  if (supervisorError || !supervisor || mandorError || !mandor) {
    throw new ServiceError("Akun dummy pengawas/mandor belum siap.", 409);
  }

  const { data: existingContract, error: existingContractError } = await admin
    .from("contracts")
    .select("status, signed_pengawas_signature_path")
    .eq("project_id", projectId)
    .maybeSingle();
  if (existingContractError) throw new ServiceError("Gagal memeriksa kontrak proyek.", 500);
  if (existingContract?.signed_pengawas_signature_path) return;

  const signature = await readFile(path.join(
    process.cwd(), "public", "test-assets", "signatures", "pengawas-signature.png",
  ));
  if (!signature.length || signature.length > 1024 * 1024) {
    throw new ServiceError("Signature dummy tidak valid.", 500);
  }

  const signaturePath = `${projectId}/${supervisor.id}/pengawas-${crypto.randomUUID()}.png`;
  const { error: uploadError } = await admin.storage
    .from("contract-signatures")
    .upload(signaturePath, signature, { contentType: "image/png", upsert: false });
  if (uploadError) throw new ServiceError("Gagal mengunggah signature dummy.", 500);

  const { data, error } = await admin.rpc("test_automate_submission", {
    p_project_id: projectId,
    p_customer_id: user.id,
    p_signature_path: signaturePath,
    p_supervisor_id: supervisor.id,
    p_mandor_id: mandor.id,
  });
  if (error || !data) {
    await admin.storage.from("contract-signatures").remove([signaturePath]);
    throw new ServiceError("Otomasi pengajuan testing gagal.", 500);
  }

  const result = data as { success?: boolean };
  if (!result.success) {
    await admin.storage.from("contract-signatures").remove([signaturePath]);
    throw new ServiceError("Otomasi pengajuan testing tidak menyelesaikan kontrak.", 500);
  }
}
