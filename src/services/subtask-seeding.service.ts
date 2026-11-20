/**
 * subtask-seeding.service.ts
 *
 * Menyemai data project_stages + project_subtasks secara otomatis
 * saat kontrak proyek disetujui.
 *
 * - Menggunakan admin (service-role) client agar tidak terhalang RLS.
 * - Idempoten: lengkapi tahap/subtask yang belum ada tanpa menggandakan data.
 * - Menggunakan STAGE_TEMPLATE baku 6 tahap / 24 subtask (total bobot = 100%).
 * - Semua subtask dimulai dengan selesai = false (no progress).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { createAdminClient } from "@/utils/supabase/admin";
import { STAGE_TEMPLATE } from "@/data/stage-template";

/**
 * Semaikan 6 tahap + 24 subtask sebelum persetujuan kontrak disimpan.
 * Fungsi ini dipanggil dari server-side (API route / service)
 * dengan project ID yang sudah valid.
 *
 * @param projectId       UUID proyek yang baru dibuat
 * @param fallbackClient  Client Supabase opsional jika admin client gagal
 */
export async function seedProjectSubtasks(
  projectId: string,
  fallbackClient?: SupabaseClient<Database>,
): Promise<void> {
  let client: SupabaseClient<Database>;
  try {
    client = createAdminClient();
  } catch (err) {
    if (fallbackClient) {
      client = fallbackClient;
    } else {
      console.warn("[seedProjectSubtasks] Admin client tidak tersedia:", err);
      return;
    }
  }

  // Idempoten: cek apakah tahap sudah ada
  let { data: existingStages, error: checkError } = await client
    .from("project_stages")
    .select("id, urutan")
    .eq("project_id", projectId);

  if (checkError && fallbackClient && client !== fallbackClient) {
    client = fallbackClient;
    const retry = await client
      .from("project_stages")
      .select("id, urutan")
      .eq("project_id", projectId);
    existingStages = retry.data;
    checkError = retry.error;
  }

  if (checkError) {
    console.warn(
      `[seedProjectSubtasks] Gagal cek stage proyek ${projectId}:`,
      checkError.message,
    );
    // Jangan throw error yang membatalkan operasi utama (misal contract signature)
    return;
  }

  const existingByOrder = new Map(
    (existingStages ?? []).map((stage) => [Number(stage.urutan), stage.id]),
  );

  for (let stageIdx = 0; stageIdx < STAGE_TEMPLATE.length; stageIdx++) {
    const templateStage = STAGE_TEMPLATE[stageIdx];
    const urutan = stageIdx + 1;

    let stageId = existingByOrder.get(urutan);
    if (!stageId) {
      const { data: insertedStage, error: stageError } = await client
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
          `[seedProjectSubtasks] Gagal membuat tahap ${urutan}:`,
          stageError?.message,
        );
        continue;
      }
      stageId = insertedStage.id;
    }

    const { data: existingSubtasks, error: subtasksCheckError } = await client
      .from("project_subtasks")
      .select("urutan")
      .eq("project_stage_id", stageId);
    if (subtasksCheckError) {
      console.warn(
        `[seedProjectSubtasks] Gagal memeriksa subtask tahap ${urutan}:`,
        subtasksCheckError.message,
      );
      continue;
    }
    const existingSubtaskOrders = new Set(
      (existingSubtasks ?? []).map((item) => Number(item.urutan)),
    );

    // Insert subtask-subtask tahap ini
    if (templateStage.subtasks.length > 0) {
      const subtaskRows = templateStage.subtasks
        .map((subtask, subIdx) => ({
          project_stage_id: stageId,
          judul: subtask.title,
          bobot: subtask.weight,
          urutan: subIdx + 1,
          selesai: false,
          target_selesai: null,
        }))
        .filter((item) => !existingSubtaskOrders.has(item.urutan));

      if (subtaskRows.length === 0) continue;
      const { error: subtaskError } = await client
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

