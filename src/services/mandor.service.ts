/**
 * mandor.service.ts
 *
 * Backend sisi Mandor untuk alur lapangan Mandor -> Pengawas.
 *
 *   - membaca daftar & detail proyek yang ditugaskan (via project_mandors)
 *   - membaca tahapan + subtask (dibuat Pengawas)
 *   - mengirim laporan progress  -> progress_reports   (keputusan: menunggu)
 *   - mengirim laporan kendala    -> kendala            (status: reported)
 *   - mengirim catatan singkat    -> foreman_notes
 *   - membaca status verifikasi pendaftaran mandor_profiles.status
 *
 * Semua tulisan divalidasi RLS (progress_mandor_insert, kendala_mandor_insert,
 * foreman_notes_mandor_insert).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireRole, ServiceError } from "./access.service";
import {
  calculateOfficialProgress,
  findCurrentStage,
  getProjectStages,
  normalizeStageRows,
  type StageDTO,
} from "./stage.service";
import { ISSUE_CATEGORIES } from "@/data/stage-template";
import { formatDate, formatDateTimeComma, formatDateTimeDot } from "@/utils/format";
import type {
  MandorForemanNote,
  MandorIssueCategory,
  MandorIssueCondition,
  MandorIssueReport,
  MandorMilestone,
  MandorProgressReport,
  MandorProject,
  MandorRegistrationStatus,
} from "@/data/mandor";

type Row = Record<string, unknown>;

const FALLBACK_IMAGE = "/images/katalog/house-dummy1.webp";

const DEFAULT_SCOPE = [
  "Pekerjaan persiapan dan pengukuran lahan",
  "Pekerjaan pondasi, struktur, dinding dan atap",
  "Instalasi jalur MEP dan pekerjaan finishing",
  "Pekerjaan lingkungan luar dan serah terima",
];

// ============================================================
// HELPERS PEMETAAN
// ============================================================

const CATEGORY_LABEL = new Map(
  ISSUE_CATEGORIES.map((item) => [item.value, item.label]),
);

const KENDALA_STATUS_UI: Record<string, MandorIssueReport["status"]> = {
  reported: "Menunggu",
  reviewed: "Ditindaklanjuti",
  resolved: "Selesai",
};

const KEPUTUSAN_UI: Record<string, MandorProgressReport["review"]> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  perlu_revisi: "Perlu revisi",
};

function toMilestones(stages: StageDTO[]): MandorMilestone[] {
  return stages.map((stage) => ({
    id: stage.id,
    title: stage.nama_tahap,
    target: stage.tanggal_selesai ? formatDate(stage.tanggal_selesai) : "-",
    weight: stage.subtasks.reduce((sum, item) => sum + item.bobot, 0),
    subtasks: stage.subtasks.map((item) => ({
      id: item.id,
      title: item.judul,
      weight: item.bobot,
      done: item.selesai,
    })),
  }));
}

function toProgressReport(row: Row): MandorProgressReport {
  const stage = (row.project_stages ?? {}) as Row;
  const subtask = (row.project_subtasks ?? {}) as Row;
  const keputusan = String(row.keputusan ?? "menunggu");
  return {
    id: String(row.id),
    milestoneId: String(row.project_stage_id ?? stage.id ?? ""),
    milestoneTitle: String(stage.nama_tahap ?? "Tanpa tahap"),
    subtaskTitle: String(subtask.judul ?? "Pekerjaan"),
    note: String(row.keterangan ?? ""),
    photo: (row.foto_url as string | null) ?? null,
    submitted: formatDateTimeDot(String(row.created_at)),
    review: KEPUTUSAN_UI[keputusan] ?? "Menunggu",
    feedback: String(row.feedback ?? ""),
    weight: Number(row.persentase ?? subtask.bobot ?? 0),
  };
}

/**
 * Petakan baris `kendala` (+ embed tahap & subtask) ke bentuk UI mandor.
 * Dipakai juga oleh supervisor.service untuk menampilkan detail kendala.
 */
export function mapKendalaToIssueReport(row: Row): MandorIssueReport {
  const stage = (row.project_stages ?? {}) as Row;
  const subtask = (row.project_subtasks ?? {}) as Row;
  const kategori = String(row.kategori ?? "LAINNYA");
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    category: kategori as MandorIssueCategory,
    categoryLabel: CATEGORY_LABEL.get(kategori) ?? "Lainnya",
    description: String(row.deskripsi ?? ""),
    affectedMilestoneId: String(row.project_stage_id ?? ""),
    affectedMilestoneTitle: String(stage.nama_tahap ?? "Tanpa tahap"),
    affectedSubtaskId: String(row.project_subtask_id ?? ""),
    affectedSubtaskTitle: String(subtask.judul ?? "Pekerjaan"),
    workCondition: (String(row.kondisi_pekerjaan ?? "BERJALAN") ||
      "BERJALAN") as MandorIssueCondition,
    estimatedDelayDays: Number(row.dampak_waktu_hari ?? 0),
    additionalInfo: String(row.informasi_tambahan ?? ""),
    attachment: (row.lampiran as string | null) ?? null,
    attachmentName: String(row.lampiran_nama ?? ""),
    submitted: formatDate(String(row.created_at)),
    status: KENDALA_STATUS_UI[String(row.status ?? "reported")] ?? "Menunggu",
    followUp: String(row.tindak_lanjut ?? ""),
  };
}

function toForemanNote(row: Row): MandorForemanNote {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    note: String(row.catatan ?? ""),
    submitted: formatDateTimeComma(String(row.created_at)),
  };
}

function splitScope(ruangLingkup: string | null): string[] {
  if (!ruangLingkup?.trim()) return DEFAULT_SCOPE;
  const items = ruangLingkup
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : DEFAULT_SCOPE;
}

function pickImage(design: Row): string {
  const images = Array.isArray(design.design_images)
    ? (design.design_images as Row[])
    : [];
  const sorted = [...images].sort(
    (a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0),
  );
  return String(sorted[0]?.url ?? FALLBACK_IMAGE);
}

function pickTarget(contract: Row | null, stages: StageDTO[]): string {
  if (contract?.tanggal_selesai_estimasi)
    return formatDate(String(contract.tanggal_selesai_estimasi));
  const dates = stages
    .map((stage) => stage.tanggal_selesai)
    .filter(Boolean)
    .sort() as string[];
  return dates.length ? formatDate(dates[dates.length - 1]) : "-";
}

// ============================================================
// AMBIL PROYEK MANDOR
// ============================================================

async function getAssignedProjectIds(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { user } = await requireRole(supabase, "mandor");

  const { data, error } = await supabase
    .from("project_mandors")
    .select("project_id, assigned_at")
    .eq("mandor_id", user.id);

  if (error) {
    console.error("[getAssignedProjectIds]", error.message);
    throw new ServiceError("Gagal memuat daftar penugasan Anda.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => String(row.project_id));
}

const PROJECT_SELECT = `
  id,
  status,
  alamat_proyek,
  created_at,
  nilai_proyek,
  designs (
    nama,
    gaya_arsitektur,
    lokasi,
    design_images ( url, urutan )
  ),
  contracts (
    ruang_lingkup,
    tanggal_mulai,
    tanggal_selesai_estimasi,
    nilai_kontrak
  ),
  pengawas_profiles (
    profiles!pengawas_profiles_id_fkey ( full_name )
  ),
  project_mandors (
    mandor_id,
    assigned_at
  )
`;

function buildMandorProject(
  row: Row,
  stages: StageDTO[],
  reports: MandorProgressReport[],
  issues: MandorIssueReport[],
  notes: MandorForemanNote[],
): MandorProject {
  const design = (row.designs ?? {}) as Row;
  const contract = (row.contracts ?? null) as Row | null;
  const pengawasRow = (row.pengawas_profiles ?? null) as Row | null;
  const pengawasProfile = (pengawasRow?.profiles ?? {}) as Row;
  const assignments = Array.isArray(row.project_mandors)
    ? (row.project_mandors as Row[])
    : [];

  const currentStage = findCurrentStage(stages);
  const milestones = toMilestones(stages);

  return {
    id: String(row.id),
    title: String(design.nama ?? "Proyek Pembangunan"),
    design: String(design.gaya_arsitektur ?? "-"),
    location: String(row.alamat_proyek ?? design.lokasi ?? "-"),
    assignedAt: assignments[0]?.assigned_at
      ? formatDate(String(assignments[0].assigned_at))
      : "-",
    target: pickTarget(contract, stages),
    overallProgress: calculateOfficialProgress(stages),
    currentMilestone: currentStage?.nama_tahap ?? "Belum ada tahapan",
    supervisor: String(pengawasProfile.full_name ?? "Belum ditugaskan"),
    supervisorNote:
      currentStage?.keterangan ??
      "Belum ada arahan pengawas untuk tahap ini.",
    image: pickImage(design),
    scope: splitScope(
      typeof contract?.ruang_lingkup === "string" ? contract.ruang_lingkup : null,
    ),
    milestones,
    progressReports: reports,
    issueReports: issues,
    notes,
  };
}

const REPORT_SELECT = `
  id,
  project_stage_id,
  project_subtask_id,
  persentase,
  keterangan,
  foto_url,
  keputusan,
  feedback,
  created_at,
  project_stages ( id, nama_tahap ),
  project_subtasks ( id, judul, bobot )
`;

const KENDALA_SELECT = `
  id,
  project_id,
  project_stage_id,
  project_subtask_id,
  deskripsi,
  kategori,
  kondisi_pekerjaan,
  status,
  tindak_lanjut,
  dampak_waktu_hari,
  informasi_tambahan,
  lampiran,
  lampiran_nama,
  created_at,
  project_stages ( id, nama_tahap ),
  project_subtasks ( id, judul )
`;

const NOTE_SELECT = `id, project_id, catatan, created_at`;

/** Daftar proyek yang ditugaskan ke mandor yang sedang login. */
export async function getMandorProjects(
  supabase: SupabaseClient<Database>,
): Promise<MandorProject[]> {
  const projectIds = await getAssignedProjectIds(supabase);
  if (projectIds.length === 0) return [];

  const [{ data: projectRows, error: projectError }, stages] = await Promise.all([
    supabase.from("projects").select(PROJECT_SELECT).in("id", projectIds),
    getAllStages(supabase, projectIds),
  ]);

  if (projectError || !projectRows) {
    console.error("[getMandorProjects]", projectError?.message);
    throw new ServiceError("Gagal memuat proyek Anda.", 500);
  }

  const stageIds = stages.map((stage) => stage.id);
  const reports = stageIds.length
    ? await getReportsForStages(supabase, stageIds)
    : [];

  // Tahapan dikelompokkan per proyek agar pemetaannya linear.
  const stageIdsByProject = new Map<string, Set<string>>();
  for (const stage of stages) {
    const set = stageIdsByProject.get(stage.project_id) ?? new Set<string>();
    set.add(stage.id);
    stageIdsByProject.set(stage.project_id, set);
  }

  return (projectRows as unknown as Row[])
    .map((row) => {
      const projectId = String(row.id);
      const ownStageIds = stageIdsByProject.get(projectId) ?? new Set<string>();
      return {
        project: buildMandorProject(
          row,
          stages.filter((stage) => stage.project_id === projectId),
          reports.filter((report) => ownStageIds.has(report.milestoneId)),
          [],
          [],
        ),
        assignedAt: String(
          (Array.isArray(row.project_mandors)
            ? (row.project_mandors as Row[])[0]?.assigned_at
            : null) ?? "",
        ),
      };
    })
    .sort((a, b) => String(b.assignedAt).localeCompare(String(a.assignedAt)))
    .map((entry) => entry.project);
}

async function getAllStages(
  supabase: SupabaseClient<Database>,
  projectIds: string[],
): Promise<StageDTO[]> {
  const { data, error } = await supabase
    .from("project_stages")
    .select(
      `
      id,
      project_id,
      nama_tahap,
      urutan,
      progress_percentage,
      status,
      keterangan,
      tanggal_mulai,
      tanggal_selesai,
      project_subtasks ( id, judul, bobot, urutan, target_selesai, selesai )
    `,
    )
    .in("project_id", projectIds)
    .order("urutan", { ascending: true });

  if (error) {
    console.error("[getAllStages]", error.message);
    throw new ServiceError("Gagal memuat tahapan proyek.", 500);
  }

  return normalizeStageRows((data ?? []) as unknown as Row[]);
}

async function getReportsForStages(
  supabase: SupabaseClient<Database>,
  stageIds: string[],
): Promise<MandorProgressReport[]> {
  const { data, error } = await supabase
    .from("progress_reports")
    .select(REPORT_SELECT)
    .in("project_stage_id", stageIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getReportsForStages]", error.message);
    throw new ServiceError("Gagal memuat laporan progress.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => toProgressReport(row));
}

/** Detail satu proyek milik mandor, lengkap dengan laporan & kendala. */
export async function getMandorProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<MandorProject | null> {
  const projectIds = await getAssignedProjectIds(supabase);
  if (!projectIds.includes(projectId)) return null;

  const [{ data, error }, stages] = await Promise.all([
    supabase.from("projects").select(PROJECT_SELECT).eq("id", projectId).maybeSingle(),
    getProjectStages(supabase, projectId),
  ]);

  if (error) {
    console.error("[getMandorProject]", error.message);
    throw new ServiceError("Gagal memuat detail proyek.", 500);
  }
  if (!data) return null;

  const stageIds = stages.map((stage) => stage.id);
  const [reports, issues, notes] = await Promise.all([
    stageIds.length
      ? getReportsForStages(supabase, stageIds)
      : Promise.resolve([]),
    getIssuesForProject(supabase, projectId),
    getNotesForProject(supabase, projectId),
  ]);

  return buildMandorProject(
    data as unknown as Row,
    stages,
    reports,
    issues,
    notes,
  );
}

async function getIssuesForProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<MandorIssueReport[]> {
  const { data, error } = await supabase
    .from("kendala")
    .select(KENDALA_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getIssuesForProject]", error.message);
    throw new ServiceError("Gagal memuat laporan kendala.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    mapKendalaToIssueReport(row),
  );
}

async function getNotesForProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<MandorForemanNote[]> {
  const { data, error } = await supabase
    .from("foreman_notes")
    .select(NOTE_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getNotesForProject]", error.message);
    throw new ServiceError("Gagal memuat catatan.", 500);
  }

  return (data ?? []).map((row: Record<string, unknown>) => toForemanNote(row));
}

// ============================================================
// AKSI MANDOR
// ============================================================

export type SubmitProgressInput = {
  project_subtask_id: string;
  keterangan: string;
  foto_url?: string | null;
};

/**
 * Kirim laporan progress untuk satu subtask.
 * Selalu berstatus 'menunggu' sampai diverifikasi Pengawas, sehingga
 * laporan ini BELUM mengubah progres resmi.
 */
export async function submitProgressReport(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: SubmitProgressInput,
): Promise<MandorProgressReport> {
  const { user } = await requireRole(supabase, "mandor");

  const keterangan = input.keterangan.trim();
  if (keterangan.length < 10) {
    throw new ServiceError("Tulis catatan pekerjaan minimal 10 karakter.", 422);
  }

  const { data: subtask, error: subtaskError } = await supabase
    .from("project_subtasks")
    .select("id, bobot, selesai, project_stage_id")
    .eq("id", input.project_subtask_id)
    .maybeSingle();

  if (subtaskError || !subtask) {
    throw new ServiceError("Subtask tidak ditemukan.", 404);
  }

  const { data: stage } = await supabase
    .from("project_stages")
    .select("project_id")
    .eq("id", String((subtask as Row).project_stage_id))
    .maybeSingle();

  if (!stage || String((stage as Row).project_id) !== projectId) {
    throw new ServiceError("Subtask bukan milik proyek ini.", 404);
  }
  if ((subtask as Row).selesai === true) {
    throw new ServiceError(
      "Subtask ini sudah selesai dan tidak dapat dilaporkan lagi.",
      409,
    );
  }

  // Satu laporan aktif per subtask: laporan sebelumnya yang masih menunggu diganti.
  await supabase
    .from("progress_reports")
    .delete()
    .eq("project_subtask_id", input.project_subtask_id)
    .eq("mandor_id", user.id)
    .eq("keputusan", "menunggu");

  const { data, error } = await supabase
    .from("progress_reports")
    .insert({
      project_stage_id: String((subtask as Row).project_stage_id),
      project_subtask_id: input.project_subtask_id,
      mandor_id: user.id,
      persentase: Number((subtask as Row).bobot ?? 0),
      keterangan,
      foto_url: input.foto_url ?? null,
      keputusan: "menunggu",
      status: "pending",
    })
    .select(REPORT_SELECT)
    .single();

  if (error || !data) {
    console.error("[submitProgressReport]", error?.message);
    throw new ServiceError("Gagal mengirim laporan progress.", 500);
  }

  return toProgressReport(data as unknown as Row);
}

export type SubmitKendalaInput = {
  project_stage_id: string;
  project_subtask_id: string;
  kategori: MandorIssueCategory;
  deskripsi: string;
  kondisi_pekerjaan: MandorIssueCondition;
  dampak_waktu_hari: number;
  informasi_tambahan?: string;
  lampiran?: string | null;
  lampiran_nama?: string;
};

/** Laporkan kendala lapangan. Status awal 'reported' (Menunggu). */
export async function submitKendala(
  supabase: SupabaseClient<Database>,
  projectId: string,
  input: SubmitKendalaInput,
): Promise<MandorIssueReport> {
  const { user } = await requireRole(supabase, "mandor");

  const deskripsi = input.deskripsi.trim();
  if (deskripsi.length < 10) {
    throw new ServiceError("Jelaskan kendala minimal 10 karakter.", 422);
  }
  if (!input.kategori) {
    throw new ServiceError("Pilih kategori kendala.", 422);
  }
  if (!input.kondisi_pekerjaan) {
    throw new ServiceError("Pilih kondisi pekerjaan saat ini.", 422);
  }

  const { data, error } = await supabase
    .from("kendala")
    .insert({
      project_id: projectId,
      project_stage_id: input.project_stage_id || null,
      project_subtask_id: input.project_subtask_id || null,
      reported_by: user.id,
      deskripsi,
      kategori: input.kategori,
      kondisi_pekerjaan: input.kondisi_pekerjaan,
      dampak_waktu_hari: Math.max(0, Math.min(30, input.dampak_waktu_hari)),
      informasi_tambahan: input.informasi_tambahan?.trim() || null,
      lampiran: input.lampiran ?? null,
      lampiran_nama: input.lampiran_nama ?? null,
      status: "reported",
      visible_to_customer: false,
    })
    .select(KENDALA_SELECT)
    .single();

  if (error || !data) {
    console.error("[submitKendala]", error?.message);
    throw new ServiceError("Gagal mengirim laporan kendala.", 500);
  }

  return mapKendalaToIssueReport(data as unknown as Row);
}

/** Kirim catatan singkat mandor untuk pengawas. */
export async function submitForemanNote(
  supabase: SupabaseClient<Database>,
  projectId: string,
  catatan: string,
): Promise<MandorForemanNote> {
  const { user } = await requireRole(supabase, "mandor");

  const trimmed = catatan.trim();
  if (trimmed.length < 5) {
    throw new ServiceError("Catatan minimal 5 karakter.", 422);
  }
  if (trimmed.length > 400) {
    throw new ServiceError("Catatan maksimal 400 karakter.", 422);
  }

  const { data, error } = await supabase
    .from("foreman_notes")
    .insert({ project_id: projectId, mandor_id: user.id, catatan: trimmed })
    .select(NOTE_SELECT)
    .single();

  if (error || !data) {
    console.error("[submitForemanNote]", error?.message);
    throw new ServiceError("Gagal mengirim catatan.", 500);
  }

  return toForemanNote(data as unknown as Row);
}

// ============================================================
// STATUS VERIFIKASI PENDAFTARAN MANDOR
// ============================================================

const STATUS_MAP: Record<string, MandorRegistrationStatus> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export async function getMandorRegistration(
  supabase: SupabaseClient<Database>,
): Promise<{ status: MandorRegistrationStatus; reason: string | null }> {
  const { user } = await requireRole(supabase, "mandor");

  const { data, error } = await supabase
    .from("mandor_profiles")
    .select("status, catatan_verifikasi")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    throw new ServiceError("Profil mandor tidak ditemukan.", 404);
  }

  return {
    status: STATUS_MAP[String((data as Row).status)] ?? "Menunggu",
    reason: ((data as Row).catatan_verifikasi as string | null) ?? null,
  };
}

/**
 * Ajukan ulang pendaftaran setelah ditolak.
 * Mengembalikan status ke 'pending' dan menghapus catatan penolakan.
 * (Pemicu `enforce_mandor_profile_update` memastikan mandor tidak bisa
 * menyetujui dirinya sendiri.)
 */
export async function resubmitMandorApplication(
  supabase: SupabaseClient<Database>,
): Promise<MandorRegistrationStatus> {
  const { user } = await requireRole(supabase, "mandor");

  const { data, error } = await supabase
    .from("mandor_profiles")
    .update({ status: "pending", catatan_verifikasi: null })
    .eq("id", user.id)
    .select("status")
    .maybeSingle();

  if (error || !data) {
    console.error("[resubmitMandorApplication]", error?.message);
    throw new ServiceError("Gagal mengajukan ulang pendaftaran.", 500);
  }

  return STATUS_MAP[String((data as Row).status)] ?? "Menunggu";
}
