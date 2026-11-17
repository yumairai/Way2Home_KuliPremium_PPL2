/**
 * subtask-seeding.service.ts
 *
 * Menyemai data project_stages + project_subtasks secara otomatis
 * setiap kali sebuah proyek baru dibuat.
 *
 * - Menggunakan admin (service-role) client agar tidak terhalang RLS.
 * - Idempoten: lewati proyek yang sudah punya 6 tahap lengkap.
 * - Menggunakan STAGE_TEMPLATE baku 6 tahap / 24 subtask (total bobot = 100%).
 * - Semua subtask dimulai dengan selesai = false (no progress).
 */

import { createAdminClient } from "@/utils/supabase/admin";
import { STAGE_TEMPLATE } from "@/data/stage-template";

/**
 * Semaikan 6 tahap + 24 subtask untuk proyek yang baru dibuat.
 * Fungsi ini HANYA dipanggil dari server-side (API route / service)
 * dengan project ID yang sudah valid.
 *
 * @param projectId  UUID proyek yang baru dibuat
 */
export async function seedProjectSubtasks(projectId: string): Promise<void> {
  const admin = createAdminClient();

  // Idempoten: cek apakah tahap sudah ada
  const { data: existingStages, error: checkError } = await admin
    .from("project_stages")
    .select("id")
    .eq("project_id", projectId);

  if (checkError) {
    console.warn(
      `[seedProjectSubtasks] Gagal cek stage proyek ${projectId}:`,
      checkError.message,
    );
    return;
  }

  if (existingStages && existingStages.length >= 6) {
    // Sudah ada tahapan lengkap, tidak perlu seed ulang
    return;
  }

  // Tentukan urutan awal berdasarkan tahap yang sudah ada (jika partial)
  const existingUrutans = new Set(
    (existingStages ?? []).map((_, idx) => idx + 1),
  );

  for (let stageIdx = 0; stageIdx < STAGE_TEMPLATE.length; stageIdx++) {
    const templateStage = STAGE_TEMPLATE[stageIdx];
    const urutan = stageIdx + 1;

    // Lewati jika tahap dengan urutan ini sudah ada
    if (existingUrutans.has(urutan)) continue;

    // Insert tahap
    const { data: insertedStage, error: stageError } = await admin
      .from("project_stages")
      .insert({
        project_id: projectId,
        nama_tahap: templateStage.name,
        urutan,
        progress_percentage: 0,
        status: "belum_mulai",
      })
      .select("id")
      .single();

    if (stageError || !insertedStage) {
      console.warn(
        `[seedProjectSubtasks] Gagal insert tahap urutan ${urutan}:`,
        stageError?.message,
      );
      continue;
    }

    // Insert subtask-subtask tahap ini
    if (templateStage.subtasks.length > 0) {
      const subtaskRows = templateStage.subtasks.map((subtask, subIdx) => ({
        project_stage_id: insertedStage.id,
        judul: subtask.title,
        bobot: subtask.weight,
        urutan: subIdx + 1,
        selesai: false,
        target_selesai: null,
      }));

      const { error: subtaskError } = await admin
        .from("project_subtasks")
        .insert(subtaskRows);

      if (subtaskError) {
        console.warn(
          `[seedProjectSubtasks] Gagal insert subtask tahap ${urutan}:`,
          subtaskError.message,
        );
      }
    }
  }

  console.log(
    `[seedProjectSubtasks] Selesai menyemai tahap & subtask untuk proyek ${projectId}`,
  );
}

