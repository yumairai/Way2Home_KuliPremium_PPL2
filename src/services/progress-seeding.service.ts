import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { createAdminClient } from "@/utils/supabase/admin";
import { readFile } from "node:fs/promises";
import path from "node:path";

type ProgressCap = 30 | 55 | 80 | 100;

const PHOTO_FILES = [
  "progress-01-pondasi.jpg",
  "progress-02-struktur.webp",
  "progress-03-dinding.jpg",
  "progress-04-atap.jpg",
  "progress-05-plester.webp",
  "progress-06-instalasi.jpeg",
  "progress-07-keramik.jpg",
  "progress-08-pengecatan.webp",
];

/** Test-only project progress is derived from completed subtask weights (total 100). */
export async function seedProgressAfterPayment(
  projectId: string,
  targetCap: ProgressCap,
): Promise<void> {
  const admin = createAdminClient();
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("customer_id, created_at")
    .eq("id", projectId)
    .single();
  if (projectError || !project) throw new Error(`Seed: project lookup failed: ${projectError?.message ?? "not found"}`);

  const { data: owner, error: ownerError } = await admin
    .from("profiles")
    .select("is_test_user")
    .eq("id", project.customer_id)
    .single();
  if (ownerError || !owner?.is_test_user) throw new Error("Seed refused: project is not owned by a test user");

  const [{ data: stages, error: stagesError }, { data: supervisors }, { data: mandorProfiles }] = await Promise.all([
    admin.from("project_stages").select("id, urutan, nama_tahap").eq("project_id", projectId).order("urutan"),
    admin.from("profiles").select("id").eq("is_test_user", true).eq("role", "pengawas").limit(1),
    admin.from("profiles").select("id").eq("is_test_user", true).eq("role", "mandor"),
  ]);
  if (stagesError || !stages?.length) throw new Error(`Seed: project stages missing: ${stagesError?.message ?? "no stages"}`);
  const supervisor = supervisors?.[0];
  if (!supervisor) throw new Error("Seed: test supervisor missing");
  const mandorIds = (mandorProfiles ?? []).map((p) => p.id);
  if (!mandorIds.length) throw new Error("Seed: test mandor missing");
  const { data: mandorRows, error: mandorError } = await admin
    .from("mandor_profiles").select("id").eq("status", "approved").in("id", mandorIds).limit(1);
  if (mandorError || !mandorRows?.[0]) throw new Error(`Seed: approved test mandor missing: ${mandorError?.message ?? "not found"}`);
  const mandor = mandorRows[0];

  const { data: subtasks, error: subtaskError } = await admin
    .from("project_subtasks")
    .select("id, project_stage_id, bobot, urutan, selesai")
    .in("project_stage_id", stages.map((s) => s.id))
    .order("urutan");
  if (subtaskError || !subtasks?.length) throw new Error(`Seed: subtasks missing: ${subtaskError?.message ?? "no subtasks"}`);

  const totalWeight = subtasks.reduce((sum, task) => sum + Number(task.bobot ?? 0), 0);
  if (Math.round(totalWeight) !== 100) throw new Error(`Seed: expected subtask weights total 100, got ${totalWeight}`);

  const stagesByUrutan = [...stages].sort(
    (a, b) => Number(a.urutan) - Number(b.urutan),
  );
  const subtasksByStage = new Map<string, typeof subtasks>();
  for (const stage of stagesByUrutan) {
    subtasksByStage.set(
      stage.id,
      subtasks
        .filter((task) => task.project_stage_id === stage.id)
        .sort((a, b) => Number(a.urutan) - Number(b.urutan)),
    );
  }

  // Payment-to-progress plans use the real subtask weights:
  // 30: stages 1-1 full, stage 2 partial
  // 55: stages 1-3 full
  // 80: stages 1-4 full, stage 5 partial
  // 100: every stage full
  const completedIds = new Set<string>();
  for (const stage of stagesByUrutan) {
    const stageNumber = Number(stage.urutan);
    const stageTasks = subtasksByStage.get(stage.id) ?? [];
    let completeCount = 0;

    if (targetCap === 30) completeCount = stageNumber === 1 ? stageTasks.length : stageNumber === 2 ? 3 : 0;
    if (targetCap === 55) completeCount = stageNumber <= 3 ? stageTasks.length : 0;
    if (targetCap === 80) completeCount =
      stageNumber <= 4 ? stageTasks.length : stageNumber === 5 ? 2 : 0;
    if (targetCap === 100) completeCount = stageTasks.length;

    for (const task of stageTasks.slice(0, completeCount)) {
      completedIds.add(task.id);
    }
  }

  const allocated = subtasks
    .filter((task) => completedIds.has(task.id))
    .reduce((sum, task) => sum + Number(task.bobot ?? 0), 0);
  const dateBase = new Date(project.created_at).getTime();

  for (const task of subtasks) {
    const isComplete = completedIds.has(task.id);
    const taskIndex = subtasks.indexOf(task);
    const completedAt = new Date(dateBase + (taskIndex + 1) * 2 * 86400000).toISOString();
    const { error } = await admin.from("project_subtasks").update({
      selesai: isComplete,
      completed_at: isComplete ? completedAt : null,
    }).eq("id", task.id);
    if (error) throw new Error(`Seed: failed updating subtask ${task.id}: ${error.message}`);
  }

  // Reconcile test progress on retry: remove reports/documentation created by
  // previous payment seeds before recreating the current target state.
  await admin
    .from("progress_documentation")
    .delete()
    .eq("project_id", projectId);
  await admin
    .from("progress_reports")
    .delete()
    .in("project_stage_id", stagesByUrutan.map((stage) => stage.id))
    .eq("mandor_id", mandor.id);

  let cumulative = 0;
  for (const stage of stagesByUrutan) {
    const stageTasks = subtasks.filter((task) => task.project_stage_id === stage.id);
    const stageWeight = stageTasks.reduce((sum, task) => sum + Number(task.bobot ?? 0), 0);
    const doneWeight = stageTasks.filter((task) => completedIds.has(task.id)).reduce((sum, task) => sum + Number(task.bobot ?? 0), 0);
    cumulative += doneWeight;
    const stageStatus = doneWeight >= stageWeight ? "selesai" : doneWeight > 0 ? "berjalan" : "belum_mulai";
    const startedAt = new Date(dateBase + Math.max(1, Number(stage.urutan)) * 2 * 86400000).toISOString();
    const completedAt = stageStatus === "selesai" ? startedAt : null;
    const { error: stageUpdateError } = await admin.from("project_stages").update({
      status: stageStatus,
      progress_percentage: stageWeight ? Math.round((doneWeight / stageWeight) * 100) : 0,
      tanggal_mulai: doneWeight > 0 ? startedAt : null,
      tanggal_selesai: completedAt,
    }).eq("id", stage.id);
    if (stageUpdateError) throw new Error(`Seed: failed updating stage ${stage.urutan}: ${stageUpdateError.message}`);

    // Create one verified report per stage and attach one supplied photo.
    if (doneWeight > 0) {
      const reportDate = new Date(dateBase + Math.max(1, Number(stage.urutan)) * 2 * 86400000);
      const reportKeterangan = `Laporan testing: ${stage.nama_tahap}, progress kumulatif ${Math.round(cumulative)}%.`;
      const { data: existingReport } = await admin
        .from("progress_reports")
        .select("id")
        .eq("project_stage_id", stage.id)
        .eq("keterangan", reportKeterangan)
        .maybeSingle();

      let report = existingReport;
      if (!report) {
        const { data: insertedReport, error: reportError } = await admin
          .from("progress_reports")
          .insert({
            project_stage_id: stage.id,
            mandor_id: mandor.id,
            persentase: Math.round((doneWeight / stageWeight) * 100),
            keterangan: reportKeterangan,
            status: "verified",
            verified_at: reportDate.toISOString(),
            verified_by: supervisor.id,
            keputusan: "disetujui",
            reviewer_note: "Laporan testing otomatis diverifikasi.",
            created_at: new Date(reportDate.getTime() - 3600000).toISOString(),
          })
          .select("id")
          .single();
        if (reportError || !insertedReport) {
          throw new Error(`Seed: progress report insert failed for stage ${stage.urutan}: ${reportError?.message ?? "no row"}`);
        }
        report = insertedReport;
      }
      await attachPhotos(admin, projectId, stage.id, report.id, Number(stage.urutan), mandor.id);
    }
  }

  if (targetCap === 55) {
    const roofStage = stagesByUrutan.find((stage) => Number(stage.urutan) === 3) ?? stagesByUrutan[0];
    await ensureTestKendala(admin, projectId, roofStage.id, mandor.id, supervisor.id, dateBase);
  }
  if (targetCap === 100) {
    const { error } = await admin.from("projects").update({ status: "selesai" }).eq("id", projectId);
    if (error) throw new Error(`Seed: failed marking project complete: ${error.message}`);
  }
  console.info(`[seed-progress] project=${projectId} target=${targetCap} actual=${allocated} stages=${stages.length}`);
}

async function attachPhotos(
  admin: SupabaseClient<Database>, projectId: string, stageId: string,
  reportId: string, stageNumber: number, mandorId: string,
): Promise<void> {
  // Distribute all eight supplied photos across stages; one photo per report.
  const fileName = PHOTO_FILES[(stageNumber - 1) % PHOTO_FILES.length];
  const bytes = await readFile(path.join(process.cwd(), "public", "test-assets", "progress", fileName));
  const storagePath = `${projectId}/progress/${reportId}/${fileName}`;
  const mimeType = fileName.endsWith(".webp") ? "image/webp" : "image/jpeg";
  const { error: uploadError } = await admin.storage.from("project-documents").upload(storagePath, bytes, { contentType: mimeType, upsert: true });
  if (uploadError) throw new Error(`Seed: photo upload ${fileName} failed: ${uploadError.message}`);
  const { error: docError } = await admin.from("progress_documentation").insert({
    project_id: projectId,
    project_stage_id: stageId,
    url: storagePath,
    uploaded_by: mandorId,
    catatan: `Dokumentasi progress testing - ${fileName}`,
    created_at: new Date().toISOString(),
  });
  if (docError) throw new Error(`Seed: photo metadata insert ${fileName} failed: ${docError.message}`);
}

async function ensureTestKendala(
  admin: SupabaseClient<Database>, projectId: string, stageId: string,
  mandorId: string, supervisorId: string, dateBase: number,
): Promise<void> {
  const { data: existing, error: lookupError } = await admin.from("kendala")
    .select("id").eq("project_id", projectId).eq("reported_by", mandorId).limit(1).maybeSingle();
  if (lookupError) throw new Error(`Seed: kendala lookup failed: ${lookupError.message}`);
  let kendalaId = existing?.id;
  if (!kendalaId) {
    const { data, error } = await admin.from("kendala").insert({
      project_id: projectId,
      project_stage_id: stageId,
      deskripsi: "Perubahan Spesifikasi Material Atap",
      kategori: "DESAIN_SPESIFIKASI",
      kondisi_pekerjaan: "TERHAMBAT_SEBAGIAN",
      status: "reported",
      reported_by: mandorId,
      dampak_biaya: 7500000,
      dampak_waktu_hari: 5,
      visible_to_customer: true,
      created_at: new Date(dateBase + 40 * 86400000).toISOString(),
    }).select("id").single();
    if (error || !data) throw new Error(`Seed: kendala insert failed: ${error?.message ?? "no row"}`);
    kendalaId = data.id;
  }
  const { data: resolution, error: resolutionLookupError } = await admin.from("issue_resolutions")
    .select("id").eq("kendala_id", kendalaId).limit(1).maybeSingle();
  if (resolutionLookupError) throw new Error(`Seed: resolution lookup failed: ${resolutionLookupError.message}`);
  if (!resolution) {
    const { error } = await admin.from("issue_resolutions").insert({
      kendala_id: kendalaId,
      project_id: projectId,
      created_by: supervisorId,
      solusi: "Ganti material atap ke metal roof sesuai permintaan.",
      dampak_type: "biaya_dan_waktu",
      tambahan_biaya: 7500000,
      tambahan_hari: 5,
      butuh_persetujuan: true,
      persetujuan_customer: "menunggu",
      status: "Menunggu approval customer",
      sumber: "Pengawas",
      keputusan_final: false,
      created_at: new Date(dateBase + 41 * 86400000).toISOString(),
    });
    if (error) throw new Error(`Seed: issue resolution insert failed: ${error.message}`);
  }
}
