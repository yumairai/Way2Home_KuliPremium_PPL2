/**
 * stage.service.ts
 *
 * Tahapan (milestone) + subtask pembangunan.
 *
 * Aturan main:
 * - Tahapan DIBUAT MANUAL oleh Pengawas (lihat POST /api/pengawas/projects/[id]/stages).
 *   Tidak ada pembuatan otomatis saat status proyek berubah.
 * - Setiap tahap punya subtask dengan bobot. Total bobot seluruh subtask = 100%.
 * - Progres resmi sebuah tahap  = bobot subtask yang sudah disetujui / bobot tahap.
 * - Progres resmi keseluruhan   = jumlah bobot subtask yang disetujui.
 *
 * Otoritas: RLS (stages_select / stages_pengawas_write / subtasks_*).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireRole, ServiceError } from "./access.service";
import { STAGE_TEMPLATE } from "@/data/stage-template";

type Row = Record<string, unknown>;

export type SubtaskInput = {
  judul: string;
  bobot: number;
  urutan?: number;
  target_selesai?: string | null;
};

export type StageInput = {
  nama_tahap: string;
  urutan?: number;
  keterangan?: string | null;
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  subtasks: SubtaskInput[];
};

export type SubtaskDTO = {
  id: string;
  judul: string;
  bobot: number;
  urutan: number;
  target_selesai: string | null;
  selesai: boolean;
};

export type StageDTO = {
  id: string;
  project_id: string;
  nama_tahap: string;
  urutan: number;
  progress_percentage: number;
  status: string;
  keterangan: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  subtasks: SubtaskDTO[];
};

const STAGE_SELECT = `
  id,
  project_id,
  nama_tahap,
  urutan,
  progress_percentage,
  status,
  keterangan,
  tanggal_mulai,
  tanggal_selesai,
  project_subtasks (
    id,
    judul,
    bobot,
    urutan,
    target_selesai,
    selesai
  )
`;

function toSubtask(row: Row): SubtaskDTO {
  return {
    id: String(row.id),
    judul: String(row.judul ?? ""),
    bobot: Number(row.bobot ?? 0),
    urutan: Number(row.urutan ?? 0),
    target_selesai: (row.target_selesai as string | null) ?? null,
    selesai: row.selesai === true,
  };
}

/**
 * Normalisasi baris mentah `project_stages` (+ subtask embed) menjadi StageDTO.
 * Progres tahap SELALU dihitung ulang dari bobot subtask yang selesai,
 * sehingga nilai di konsisten walau kolom progress_percentage belum disegarkan.
 */
export function normalizeStageRows(rows: Row[]): StageDTO[] {
  return rows.map(toStage);
}

function toStage(row: Row): StageDTO {
  const rawSubtasks = Array.isArray(row.project_subtasks)
    ? (row.project_subtasks as Row[])
    : [];
  const subtasks = rawSubtasks
    .map(toSubtask)
    .sort((a, b) => a.urutan - b.urutan || a.judul.localeCompare(b.judul));

  const totalWeight = subtasks.reduce((sum, item) => sum + item.bobot, 0);
  const doneWeight = subtasks
    .filter((item) => item.selesai)
    .reduce((sum, item) => sum + item.bobot, 0);
  const progress =
    totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;

  return {
    id: String(row.id),
    project_id: String(row.project_id),
    nama_tahap: String(row.nama_tahap ?? ""),
    urutan: Number(row.urutan ?? 0),
    progress_percentage: progress,
    status: progress >= 100 ? "selesai" : progress > 0 ? "berjalan" : "belum_mulai",
    keterangan: (row.keterangan as string | null) ?? null,
    tanggal_mulai: (row.tanggal_mulai as string | null) ?? null,
    tanggal_selesai: (row.tanggal_selesai as string | null) ?? null,
    subtasks,
  };
}

/** Ambil seluruh tahapan + subtask milik satu proyek, terurut. */
export async function getProjectStages(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<StageDTO[]> {
  const { data, error } = await supabase
    .from("project_stages")
    .select(STAGE_SELECT)
    .eq("project_id", projectId)
    .order("urutan", { ascending: true });

  if (error) {
    console.error("[getProjectStages]", error.message);
    throw new ServiceError("Gagal memuat tahapan proyek.", 500);
  }

  return ((data ?? []) as unknown as Row[]).map(toStage);
}

/** Progres resmi proyek = jumlah bobot subtask yang sudah disetujui. */
export function calculateOfficialProgress(stages: StageDTO[]): number {
  const total = stages.reduce(
    (sum, stage) => sum + stage.subtasks.reduce((s, item) => s + item.bobot, 0),
    0,
  );
  const done = stages.reduce(
    (sum, stage) =>
      sum +
      stage.subtasks.filter((item) => item.selesai).reduce((s, item) => s + item.bobot, 0),
    0,
  );
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** Tahap yang sedang berjalan: pertama yang belum 100%. */
export function findCurrentStage(stages: StageDTO[]): StageDTO | undefined {
  return (
    stages.find((stage) => stage.progress_percentage < 100) ??
    stages[stages.length - 1]
  );
}

/**
 * Simpan ulang progres & status sebuah tahap berdasarkan subtask yang selesai.
 * Dipanggil Pengawas setiap kali laporan progress diverifikasi.
 */
export async function persistStageProgress(
  supabase: SupabaseClient<Database>,
  stageId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("project_subtasks")
    .select("bobot, selesai")
    .eq("project_stage_id", stageId);

  if (error) {
    console.error("[persistStageProgress] select:", error.message);
    throw new ServiceError("Gagal menghitung ulang progres tahap.", 500);
  }

  const rows = (data ?? []) as { bobot: number; selesai: boolean }[];
  const total = rows.reduce((sum, row) => sum + Number(row.bobot ?? 0), 0);
  const done = rows
    .filter((row) => row.selesai === true)
    .reduce((sum, row) => sum + Number(row.bobot ?? 0), 0);

  const progress = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const status =
    progress >= 100 ? "selesai" : progress > 0 ? "berjalan" : "belum_mulai";

  const { error: updateError } = await supabase
    .from("project_stages")
    .update({
      progress_percentage: progress,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stageId);

  if (updateError) {
    console.error("[persistStageProgress] update:", updateError.message);
    throw new ServiceError("Gagal menyimpan progres tahap.", 500);
  }
}

function assertWeightLimit(stages: StageInput[]) {
  const total = stages.reduce(
    (sum, stage) => sum + stage.subtasks.reduce((s, item) => s + item.bobot, 0),
    0,
  );
  if (Math.abs(total - 100) > 0.001) {
    throw new ServiceError(
      `Total bobot seluruh subtask harus tepat 100%. Saat ini ${total}%.`,
      422,
    );
  }
}

/**
 * Buat tahapan pertama untuk proyek (Pengawas).
 * Menolak jika tahapan sudah ada agar laporan lapangan tidak kehilangan riwayat.
 */
export async function createProjectStages(
  supabase: SupabaseClient<Database>,
  projectId: string,
  stages: StageInput[],
): Promise<void> {
  await requireRole(supabase, "pengawas");

  if (stages.length === 0) {
    throw new ServiceError("Minimal satu tahapan harus dibuat.", 422);
  }
  assertWeightLimit(stages);

  const { count, error: checkError } = await supabase
    .from("project_stages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (checkError) {
    console.error("[createProjectStages] check:", checkError.message);
    throw new ServiceError("Gagal memeriksa tahapan proyek.", 500);
  }
  if (count && count > 0) {
    throw new ServiceError(
      "Tahapan proyek ini sudah dibuat. Ubah tahapan yang sudah ada.",
      409,
    );
  }

  for (const [index, stage] of stages.entries()) {
    const { data: inserted, error: stageError } = await supabase
      .from("project_stages")
      .insert({
        project_id: projectId,
        nama_tahap: stage.nama_tahap,
        urutan: stage.urutan ?? index + 1,
        keterangan: stage.keterangan ?? null,
        tanggal_mulai: stage.tanggal_mulai ?? null,
        tanggal_selesai: stage.tanggal_selesai ?? null,
        updated_by: null,
      })
      .select("id")
      .single();

    if (stageError || !inserted) {
      console.error("[createProjectStages] stage:", stageError?.message);
      throw new ServiceError("Gagal menyimpan tahapan proyek.", 500);
    }

    if (stage.subtasks.length > 0) {
      const rows = stage.subtasks.map((subtask, subIndex) => ({
        project_stage_id: String(inserted.id),
        judul: subtask.judul,
        bobot: subtask.bobot,
        urutan: subtask.urutan ?? subIndex + 1,
        target_selesai: subtask.target_selesai ?? null,
      }));
      const { error: subtaskError } = await supabase
        .from("project_subtasks")
        .insert(rows);

      if (subtaskError) {
        console.error("[createProjectStages] subtask:", subtaskError.message);
        throw new ServiceError("Gagal menyimpan subtask tahapan.", 500);
      }
    }
  }
}

/** Buat tahapan memakai template baku 6 tahap / 24 subtask (dipicu Pengawas). */
export async function createStagesFromTemplate(
  supabase: SupabaseClient<Database>,
  projectId: string,
  dates?: {
    tanggal_mulai?: (string | null)[];
    tanggal_selesai?: (string | null)[];
    keterangan?: (string | null)[];
  },
): Promise<void> {
  const stages: StageInput[] = STAGE_TEMPLATE.map((stage, index) => ({
    nama_tahap: stage.name,
    urutan: index + 1,
    tanggal_mulai: dates?.tanggal_mulai?.[index] ?? null,
    tanggal_selesai: dates?.tanggal_selesai?.[index] ?? null,
    keterangan: dates?.keterangan?.[index] ?? null,
    subtasks: stage.subtasks.map((subtask, subIndex) => ({
      judul: subtask.title,
      bobot: subtask.weight,
      urutan: subIndex + 1,
    })),
  }));

  await createProjectStages(supabase, projectId, stages);
}

/** Ubah data tahap (nama, jadwal, arahan). */
export async function updateStage(
  supabase: SupabaseClient<Database>,
  stageId: string,
  patch: Partial<Pick<StageDTO, "nama_tahap" | "keterangan" | "tanggal_mulai" | "tanggal_selesai">>,
): Promise<void> {
  const { user } = await requireRole(supabase, "pengawas");

  const { error } = await supabase
    .from("project_stages")
    .update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", stageId);

  if (error) {
    console.error("[updateStage]", error.message);
    throw new ServiceError("Gagal memperbarui tahapan.", 500);
  }
}

/** Tambah subtask ke satu tahap. */
export async function createSubtasks(
  supabase: SupabaseClient<Database>,
  stageId: string,
  subtasks: SubtaskInput[],
): Promise<void> {
  await requireRole(supabase, "pengawas");
  if (subtasks.length === 0) throw new ServiceError("Subtask kosong.", 422);

  const rows = subtasks.map((subtask, index) => ({
    project_stage_id: stageId,
    judul: subtask.judul,
    bobot: subtask.bobot,
    urutan: subtask.urutan ?? index + 1,
    target_selesai: subtask.target_selesai ?? null,
  }));

  const { error } = await supabase.from("project_subtasks").insert(rows);
  if (error) {
    console.error("[createSubtasks]", error.message);
    throw new ServiceError("Gagal menambahkan subtask.", 500);
  }
}

/** Ubah subtask (termasuk menandai selesai dari sisi pengawas). */
export async function updateSubtask(
  supabase: SupabaseClient<Database>,
  subtaskId: string,
  patch: Partial<Pick<SubtaskDTO, "judul" | "bobot" | "urutan" | "target_selesai" | "selesai">>,
): Promise<void> {
  await requireRole(supabase, "pengawas");

  const payload: Database["public"]["Tables"]["project_subtasks"]["Update"] = {
    ...patch,
  };
  if (patch.selesai === true) payload.completed_at = new Date().toISOString();
  if (patch.selesai === false) payload.completed_at = null;

  const { error } = await supabase
    .from("project_subtasks")
    .update(payload)
    .eq("id", subtaskId);

  if (error) {
    console.error("[updateSubtask]", error.message);
    throw new ServiceError("Gagal memperbarui subtask.", 500);
  }
}

export async function deleteStage(
  supabase: SupabaseClient<Database>,
  stageId: string,
): Promise<void> {
  await requireRole(supabase, "pengawas");
  const { error } = await supabase.from("project_stages").delete().eq("id", stageId);
  if (error) {
    console.error("[deleteStage]", error.message);
    throw new ServiceError("Gagal menghapus tahapan.", 500);
  }
}

export async function deleteSubtask(
  supabase: SupabaseClient<Database>,
  subtaskId: string,
): Promise<void> {
  await requireRole(supabase, "pengawas");
  const { error } = await supabase.from("project_subtasks").delete().eq("id", subtaskId);
  if (error) {
    console.error("[deleteSubtask]", error.message);
    throw new ServiceError("Gagal menghapus subtask.", 500);
  }
}
