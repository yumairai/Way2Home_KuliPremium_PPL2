/**
 * supervisor.service.ts
 *
 * Backend sisi Pengawas untuk alur lapangan Mandor -> Pengawas.
 *
 *   Membaca
 *     - daftar proyek yang diawasi
 *     - detail proyek: tahapan, subtask, laporan progress, kendala,
 *       penanganan kendala, catatan mandor, dokumentasi, update customer,
 *       monitoring pembayaran
 *
 *   Menulis
 *     - verifyProgressReport() : memverifikasi laporan mandor.
 *           Disetujui    -> subtask selesai, progres tahap & progres resmi naik
 *           Perlu revisi -> subtask tetap terbuka, laporan dikembalikan
 *     - followUpKendala()      : mencatat tindak lanjut pengawas
 *     - saveIssueResolution()  : membuat / memperbarui penanganan kendala
 *     - addResolutionDiscussion(): menambahkan diskusi penanganan
 *     - addProjectUpdate()     : menerbitkan update untuk customer
 *     - addProjectDocumentation(): mengunggah dokumentasi lapangan
 *
 * Otorisasi seluruhnya dijalankan RLS (is_project_pengawas) tanpa service-role key.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { requireRole, ServiceError } from "./access.service";
import {
  calculateOfficialProgress,
  getProjectStages,
  persistStageProgress,
  type StageDTO,
} from "./stage.service";
import { mapKendalaToIssueReport } from "./mandor.service";
import { ISSUE_CATEGORIES } from "@/data/stage-template";
import { formatDate, formatDateTimeDot, formatMonthDay } from "@/utils/format";
import type { MandorIssueReport } from "@/data/mandor";
import type {
  IssueDiscussionEntry,
  IssueResolution,
  SupervisorIssue,
  SupervisorMilestone,
  SupervisorProject,
  SupervisorReport,
  SupervisorTask,
} from "@/data/pengawas";

type Row = Record<string, unknown>;

const FALLBACK_IMAGE = "/images/katalog/house-dummy1.webp";

const CATEGORY_LABEL = new Map(
  ISSUE_CATEGORIES.map((item) => [item.value, item.label]),
);

const REPORT_DECISION_UI: Record<string, SupervisorReport["decision"]> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  perlu_revisi: "Perlu revisi",
};

const KENDALA_STATE_UI: Record<string, SupervisorIssue["state"]> = {
  reported: "Baru",
  reviewed: "Ditindaklanjuti",
  resolved: "Ditindaklanjuti",
};

const STAGE_STATUS_UI: Record<string, SupervisorMilestone["status"]> = {
  selesai: "Selesai",
  berjalan: "Berjalan",
  belum_mulai: "Menunggu",
};

// ============================================================
// QUERY DASAR
// ============================================================

const PROJECT_SELECT = `
  id,
  status,
  alamat_proyek,
  nilai_proyek,
  created_at,
  designs (
    nama,
    gaya_arsitektur,
    deskripsi,
    luas_tanah,
    luas_bangunan,
    jumlah_kamar_tidur,
    jumlah_kamar_mandi,
    jumlah_lantai
  ),
  contracts (
    id,
    nilai_kontrak,
    tanggal_mulai,
    tanggal_selesai_estimasi
  ),
  profiles!projects_customer_id_fkey ( full_name, phone ),
  pengawas_profiles (
    profiles!pengawas_profiles_id_fkey ( full_name )
  ),
  project_mandors (
    mandor_id,
    mandor_profiles (
      profiles!mandor_profiles_id_fkey ( full_name )
    )
  ),
  payment_stages (
    id,
    nama_tahap,
    urutan,
    nominal,
    status,
    tanggal_bayar
  )
`;

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
  project_subtasks ( id, judul, bobot ),
  mandor_profiles (
    profiles!mandor_profiles_id_fkey ( full_name )
  )
`;

const KENDALA_SELECT = `
  id,
  project_id,
  project_stage_id,
  project_subtask_id,
  reported_by,
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

const RESOLUTION_SELECT = `id, project_id, kendala_id, solusi, sumber, analisis_ai,
  status, butuh_persetujuan, alasan_persetujuan, bukti, umpan_balik_customer,
  created_at`;

// ============================================================
// PEMETAAN
// ============================================================

function toSupervisorMilestones(stages: StageDTO[]): SupervisorMilestone[] {
  return stages.map((stage) => ({
    id: stage.id,
    name: stage.nama_tahap,
    start: stage.tanggal_mulai ? formatMonthDay(stage.tanggal_mulai) : "-",
    end: stage.tanggal_selesai ? formatMonthDay(stage.tanggal_selesai) : "-",
    status: STAGE_STATUS_UI[stage.status] ?? "Menunggu",
    progress: stage.progress_percentage,
  }));
}

function toSupervisorTasks(stages: StageDTO[]): SupervisorTask[] {
  return stages.flatMap((stage) =>
    stage.subtasks.map((subtask) => ({
      id: subtask.id,
      milestoneId: stage.id,
      title: subtask.judul,
      done: subtask.selesai,
    })),
  );
}

function toSupervisorReport(
  row: Row,
  projectProgress: number,
): SupervisorReport {
  const stage = (row.project_stages ?? {}) as Row;
  const subtask = (row.project_subtasks ?? {}) as Row;
  const mandorRow = (row.mandor_profiles ?? null) as Row | null;
  const mandorProfile = (mandorRow?.profiles ?? {}) as Row;

  return {
    id: String(row.id),
    foreman: String(mandorProfile.full_name ?? "Mandor lapangan"),
    milestoneId: String(row.project_stage_id ?? ""),
    title: String(stage.nama_tahap ?? "Tanpa tahap"),
    subtaskTitle: String(subtask.judul ?? "Pekerjaan"),
    note: String(row.keterangan ?? ""),
    submitted: formatDateTimeDot(String(row.created_at)),
    progress: projectProgress,
    decision:
      REPORT_DECISION_UI[String(row.keputusan ?? "menunggu")] ?? "Menunggu",
    photo: (row.foto_url as string | null) ?? null,
    weight: Number(row.persentase ?? subtask.bobot ?? 0),
  };
}

function toSupervisorIssue(row: Row): SupervisorIssue {
  const stage = (row.project_stages ?? {}) as Row;
  const kategori = String(row.kategori ?? "LAINNYA");
  const kategoriLabel = CATEGORY_LABEL.get(kategori) ?? "Kendala lapangan";
  const berhenti = String(row.kondisi_pekerjaan ?? "") === "BERHENTI";
  const dampak = Number(row.dampak_waktu_hari ?? 0);

  return {
    id: String(row.id),
    title: stage.nama_tahap
      ? `${kategoriLabel} · ${String(stage.nama_tahap)}`
      : kategoriLabel,
    description: String(row.deskripsi ?? ""),
    priority: berhenti || dampak >= 3 ? "Tinggi" : "Sedang",
    state: KENDALA_STATE_UI[String(row.status ?? "reported")] ?? "Baru",
    reportDate: formatDate(String(row.created_at)),
    followUp: String(row.tindak_lanjut ?? ""),
  };
}

function buildSpecifications(design: Row, contractId: string): string[] {
  const parts: string[] = [];
  if (design.luas_tanah) parts.push(`Luas tanah ${design.luas_tanah} m²`);
  if (design.luas_bangunan)
    parts.push(`Luas bangunan ${design.luas_bangunan} m²`);
  if (design.jumlah_kamar_tidur || design.jumlah_kamar_mandi) {
    parts.push(
      `${design.jumlah_kamar_tidur ?? 0} kamar tidur · ${
        design.jumlah_kamar_mandi ?? 0
      } kamar mandi`,
    );
  }
  if (design.jumlah_lantai || design.gaya_arsitektur) {
    parts.push(
      `${design.jumlah_lantai ?? 1} lantai · gaya ${design.gaya_arsitektur ?? "-"}`,
    );
  }
  if (contractId) parts.push(`Kontrak #${contractId}`);
  return parts.length ? parts : ["Spesifikasi belum lengkap"];
}

function contractCode(contractId: unknown): string {
  if (!contractId) return "-";
  return `K-${String(contractId).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function paymentUiStatus(
  status: string,
  dueDate: string | null,
): "Lunas" | "Menunggu" | "Belum jatuh tempo" {
  if (status === "lunas") return "Lunas";
  if (!dueDate) return "Belum jatuh tempo";
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`).getTime();
  return Number.isNaN(due) || due >= Date.now()
    ? "Belum jatuh tempo"
    : "Menunggu";
}

function resolveProjectStatus(
  projectStatus: string,
  progress: number,
  issues: SupervisorIssue[],
): SupervisorProject["status"] {
  if (projectStatus === "selesai" || progress >= 100) return "Selesai";
  const criticalOpen = issues.some(
    (issue) => issue.priority === "Tinggi" && issue.state === "Baru",
  );
  return criticalOpen ? "Perlu perhatian" : "Berjalan";
}

function composeUpdateMessage(judul: string, isi: string): string {
  const body = isi.trim();
  const head = judul.trim().replace(/[.:]+$/, "");
  if (!head) return body;
  if (!body) return head;
  return `${head}. ${body}`;
}

function buildSupervisorProject(
  row: Row,
  stages: StageDTO[],
  reports: SupervisorReport[],
  issues: SupervisorIssue[],
  issueReports: MandorIssueReport[],
  resolutions: IssueResolution[],
  foremanNotes: SupervisorProject["foremanNotes"],
  customerUpdates: SupervisorProject["customerUpdates"],
  documentation: SupervisorProject["documentation"],
): SupervisorProject {
  const design = (row.designs ?? {}) as Row;
  const contract = (row.contracts ?? null) as Row | null;
  const customer = (row.profiles ?? {}) as Row;
  const pengawasRow = (row.pengawas_profiles ?? null) as Row | null;
  const pengawasProfile = (pengawasRow?.profiles ?? {}) as Row;
  const assignments = Array.isArray(row.project_mandors)
    ? (row.project_mandors as Row[])
    : [];
  const payments = Array.isArray(row.payment_stages)
    ? (row.payment_stages as Row[])
    : [];

  const progress = calculateOfficialProgress(stages);
  const contractId = contractCode(contract?.id);

  const foremen = assignments
    .map((assignment) => {
      const mandorRow = (assignment.mandor_profiles ?? null) as Row | null;
      const profile = (mandorRow?.profiles ?? {}) as Row;
      return profile.full_name ? String(profile.full_name) : null;
    })
    .filter((name): name is string => Boolean(name));

  return {
    id: String(row.id),
    title: String(design.nama ?? "Proyek Pembangunan"),
    customer: String(customer.full_name ?? "Customer"),
    customerPhone: String(customer.phone ?? "-"),
    design: `${String(design.nama ?? "-")} · ${String(design.gaya_arsitektur ?? "-")}`,
    category: "Pembangunan rumah",
    address: String(row.alamat_proyek ?? "-"),
    status: resolveProjectStatus(String(row.status ?? ""), progress, issues),
    progress,
    deadline: contract?.tanggal_selesai_estimasi
      ? formatDate(String(contract.tanggal_selesai_estimasi))
      : "-",
    started: contract?.tanggal_mulai
      ? formatDate(String(contract.tanggal_mulai))
      : formatDate(String(row.created_at)),
    value: Number(row.nilai_proyek ?? contract?.nilai_kontrak ?? 0),
    supervisor: String(pengawasProfile.full_name ?? "Belum ditugaskan"),
    foreman: foremen[0] ?? null,
    foremen,
    needs: String(design.deskripsi ?? "Kebutuhan customer belum diisi."),
    specifications: buildSpecifications(design, contractId),
    contractId,
    milestones: toSupervisorMilestones(stages),
    tasks: toSupervisorTasks(stages),
    reports,
    issues,
    issueReports,
    resolutions,
    foremanNotes,
    customerUpdates,
    documentation,
    payments: [...payments]
      .sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0))
      .map((payment) => ({
        id: String(payment.id),
        stage: String(payment.nama_tahap ?? "-"),
        amount: Number(payment.nominal ?? 0),
        status: paymentUiStatus(
          String(payment.status ?? "belum"),
          (payment.tanggal_bayar as string | null) ?? null,
        ),
        dueDate: payment.tanggal_bayar
          ? formatDate(String(payment.tanggal_bayar))
          : "-",
      })),
  };
}

function toIssueResolution(row: Row): IssueResolution {
  const ai = (row.analisis_ai ?? null) as
    | { summary?: string; options?: string[]; selectedOption?: number | null }
    | null;

  return {
    id: String(row.id),
    projectId: String(row.project_id),
    issueId: String(row.kendala_id),
    solution: String(row.solusi ?? ""),
    source: String(row.sumber ?? "Pengawas") === "Analisis AI"
      ? "Analisis AI"
      : "Pengawas",
    aiAnalysis: ai
      ? {
          summary: String(ai.summary ?? ""),
          options: Array.isArray(ai.options) ? ai.options.map(String) : [],
          selectedOption:
            typeof ai.selectedOption === "number" ? ai.selectedOption : null,
        }
      : null,
    status: String(row.status ?? "Ditindaklanjuti") as IssueResolution["status"],
    requiresCustomerApproval: row.butuh_persetujuan === true,
    approvalReason: String(row.alasan_persetujuan ?? ""),
    approvalEvidence: (row.bukti as string | null) ?? null,
    customerFeedback: String(row.umpan_balik_customer ?? ""),
    discussion: [],
    submitted: formatDate(String(row.created_at)),
  };
}

// ============================================================
// BACA
// ============================================================

/** Daftar proyek yang diawasi pengawas yang sedang login. */
export async function getSupervisorProjects(
  supabase: SupabaseClient<Database>,
): Promise<SupervisorProject[]> {
  const { user } = await requireRole(supabase, "pengawas");

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("pengawas_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getSupervisorProjects]", error?.message);
    throw new ServiceError("Gagal memuat daftar proyek Anda.", 500);
  }

  const rows = (data ?? []) as unknown as Row[];
  const projects: SupervisorProject[] = [];

  for (const row of rows) {
    projects.push(
      await buildDetail(supabase, row, { includeDiscussions: false }),
    );
  }

  return projects;
}

/** Detail satu proyek yang diawasi, lengkap. */
export async function getSupervisorProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<SupervisorProject | null> {
  const { user } = await requireRole(supabase, "pengawas");

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", projectId)
    .eq("pengawas_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getSupervisorProject]", error.message);
    throw new ServiceError("Gagal memuat detail proyek.", 500);
  }
  if (!data) return null;

  return buildDetail(supabase, data as unknown as Row, {
    includeDiscussions: true,
  });
}

async function buildDetail(
  supabase: SupabaseClient<Database>,
  row: Row,
  options: { includeDiscussions: boolean },
): Promise<SupervisorProject> {
  const projectId = String(row.id);

  const [stages, reportData, kendalaData, updateData, docData, noteData] =
    await Promise.all([
      getProjectStages(supabase, projectId),
      supabase
        .from("progress_reports")
        .select(REPORT_SELECT)
        .in("project_stage_id", await stageIdsOf(supabase, projectId))
        .order("created_at", { ascending: false }),
      supabase
        .from("kendala")
        .select(KENDALA_SELECT)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_updates")
        .select("id, judul, isi, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("progress_documentation")
        .select("id, url, catatan, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("foreman_notes")
        .select("id, catatan, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

  if (reportData.error)
    console.error("[buildDetail] reports:", reportData.error.message);
  if (kendalaData.error)
    console.error("[buildDetail] kendala:", kendalaData.error.message);
  if (updateData.error)
    console.error("[buildDetail] updates:", updateData.error.message);
  if (docData.error)
    console.error("[buildDetail] docs:", docData.error.message);
  if (noteData.error)
    console.error("[buildDetail] notes:", noteData.error.message);

  const progress = calculateOfficialProgress(stages);

  const reportRows = (reportData.data ?? []) as unknown as Row[];
  const mappedReports = reportRows.map((item) =>
    toSupervisorReport(item, progress),
  );

  const kendalaRows = (kendalaData.data ?? []) as unknown as Row[];
  const issues = kendalaRows.map(toSupervisorIssue);
  const issueReports = kendalaRows.map(mapKendalaToIssueReport);

  const [resolutions, discussions] = await Promise.all([
    getResolutions(supabase, projectId),
    options.includeDiscussions
      ? getDiscussions(supabase, projectId)
      : Promise.resolve([]),
  ]);

  const resolutionsWithDiscussion: IssueResolution[] = resolutions.map(
    (resolution) => ({
      ...resolution,
      discussion: discussions.filter(
        (entry) => entry.resolutionId === resolution.id,
      ),
    }),
  );

  const customerUpdates = ((updateData.data ?? []) as unknown as Row[]).map(
    (item) => ({
      id: String(item.id),
      date: formatDate(String(item.created_at)),
      message: composeUpdateMessage(
        String(item.judul ?? ""),
        String(item.isi ?? ""),
      ),
    }),
  );

  const documentation = ((docData.data ?? []) as unknown as Row[]).map(
    (item) => ({
      id: String(item.id),
      date: formatDate(String(item.created_at)),
      caption: String(item.catatan ?? "Dokumentasi lapangan"),
      image: String(item.url ?? FALLBACK_IMAGE),
    }),
  );

  const foremanNotes = ((noteData.data ?? []) as unknown as Row[]).map(
    (item) => ({
      id: String(item.id),
      foreman: "Mandor lapangan",
      note: String(item.catatan ?? ""),
      submitted: formatDate(String(item.created_at)),
    }),
  );

  return buildSupervisorProject(
    row,
    stages,
    mappedReports,
    issues,
    issueReports,
    resolutionsWithDiscussion,
    foremanNotes,
    customerUpdates,
    documentation,
  );
}

async function stageIdsOf(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_stages")
    .select("id")
    .eq("project_id", projectId);

  if (error) {
    console.error("[stageIdsOf]", error.message);
    throw new ServiceError("Gagal memuat tahapan proyek.", 500);
  }

  return ((data ?? []) as unknown as Row[]).map((item) => String(item.id));
}

async function getResolutions(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<IssueResolution[]> {
  const { data, error } = await supabase
    .from("issue_resolutions")
    .select(RESOLUTION_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getResolutions]", error.message);
    throw new ServiceError("Gagal memuat penanganan kendala.", 500);
  }

  return ((data ?? []) as unknown as Row[]).map(toIssueResolution);
}

type DiscussionEntry = IssueDiscussionEntry & { resolutionId: string };

async function getDiscussions(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<DiscussionEntry[]> {
  const { data, error } = await supabase
    .from("resolution_discussions")
    .select(
      `id, resolution_id, penulis, pesan, created_at,
       issue_resolutions!inner ( id )`,
    )
    .eq("issue_resolutions.project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getDiscussions]", error.message);
    throw new ServiceError("Gagal memuat diskusi penanganan.", 500);
  }

  return ((data ?? []) as unknown as Row[]).map((item) => ({
    id: String(item.id),
    resolutionId: String(item.resolution_id),
    author: String(item.penulis ?? "Pengawas") === "Customer"
      ? "Customer"
      : "Pengawas",
    message: String(item.pesan ?? ""),
    date: formatDate(String(item.created_at)),
  }));
}

// ============================================================
// VERIFIKASI LAPORAN PROGRESS
// ============================================================

export type ProgressDecision = "Disetujui" | "Perlu revisi";

const UI_DECISION_TO_DB: Record<ProgressDecision, "disetujui" | "perlu_revisi"> = {
  Disetujui: "disetujui",
  "Perlu revisi": "perlu_revisi",
};

/**
 * Verifikasi satu laporan progress mandor.
 *   - Disetujui    : subtask ditandai selesai & progres tahap naik.
 *   - Perlu revisi : laporan dikembalikan, subtask tetap terbuka.
 */
export async function verifyProgressReport(
  supabase: SupabaseClient<Database>,
  reportId: string,
  decision: ProgressDecision,
  feedback: string,
): Promise<void> {
  const { user } = await requireRole(supabase, "pengawas");

  const keputusan = UI_DECISION_TO_DB[decision];
  if (!keputusan) {
    throw new ServiceError("Keputusan verifikasi tidak dikenal.", 422);
  }

  const trimmedFeedback = feedback.trim();
  if (keputusan === "perlu_revisi" && trimmedFeedback.length < 5) {
    throw new ServiceError(
      "Tulis catatan revisi minimal 5 karakter untuk mandor.",
      422,
    );
  }

  const { data: report, error: reportError } = await supabase
    .from("progress_reports")
    .select("id, project_stage_id, project_subtask_id, keputusan")
    .eq("id", reportId)
    .maybeSingle();

  if (reportError || !report) {
    throw new ServiceError("Laporan progress tidak ditemukan.", 404);
  }
  if ((report as Row).keputusan === "disetujui") {
    throw new ServiceError("Laporan ini sudah pernah disetujui.", 409);
  }

  const { error: updateError } = await supabase
    .from("progress_reports")
    .update({
      keputusan,
      // `report_status` hanya punya 'pending' | 'verified'; laporan yang
      // diminta revisi tetap pending dan ditandai lewat kolom `keputusan`.
      status: keputusan === "disetujui" ? "verified" : "pending",
      feedback: trimmedFeedback || null,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (updateError) {
    console.error("[verifyProgressReport] update:", updateError.message);
    throw new ServiceError("Gagal menyimpan keputusan verifikasi.", 500);
  }

  const subtaskId = (report as Row).project_subtask_id as string | null;
  const stageId = String((report as Row).project_stage_id);

  if (subtaskId) {
    const { error: subtaskError } = await supabase
      .from("project_subtasks")
      .update(
        keputusan === "disetujui"
          ? { selesai: true, completed_at: new Date().toISOString() }
          : { selesai: false, completed_at: null },
      )
      .eq("id", subtaskId);

    if (subtaskError) {
      console.error("[verifyProgressReport] subtask:", subtaskError.message);
      throw new ServiceError("Gagal memperbarui status subtask.", 500);
    }
  }

  await persistStageProgress(supabase, stageId);
}

// ============================================================
// KENDALA & PENANGANAN
// ============================================================

/** Catat tindak lanjut pengawas atas kendala. Status menjadi 'reviewed'. */
export async function followUpKendala(
  supabase: SupabaseClient<Database>,
  kendalaId: string,
  tindakLanjut: string,
): Promise<void> {
  await requireRole(supabase, "pengawas");

  const trimmed = tindakLanjut.trim();
  if (trimmed.length < 10) {
    throw new ServiceError("Tuliskan tindak lanjut minimal 10 karakter.", 422);
  }

  const { data: kendala, error: kendalaError } = await supabase
    .from("kendala")
    .select("id, status")
    .eq("id", kendalaId)
    .maybeSingle();

  if (kendalaError || !kendala) {
    throw new ServiceError("Kendala tidak ditemukan.", 404);
  }

  const { error } = await supabase
    .from("kendala")
    .update({
      tindak_lanjut: trimmed,
      // 'resolved' bersifat terminal: dibuat oleh trigger saat customer
      // menyetujui atau pengawas menetapkan keputusan final, sehingga
      // tindak lanjut biasa tidak boleh menurunkannya kembali.
      status: (kendala as Row).status === "resolved" ? "resolved" : "reviewed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", kendalaId);

  if (error) {
    console.error("[followUpKendala]", error.message);
    throw new ServiceError("Gagal menyimpan tindak lanjut kendala.", 500);
  }
}

export type ResolutionPayload = {
  solusi: string;
  source?: "Pengawas" | "Analisis AI";
  analisisAi?: {
    summary: string;
    options: string[];
    selectedOption: number | null;
  } | null;
  butuhPersetujuan?: boolean;
  alasanPersetujuan?: string;
  bukti?: string | null;
  umpanBalikCustomer?: string | null;
  /** Default: "Menunggu approval customer" bila perlu persetujuan, selain itu "Ditindaklanjuti". */
  status?: IssueResolution["status"];
  /**
   * True bila pengawas menetapkan keputusan final: penanganan dikunci
   * dan kendala ikut ditutup di sisi database.
   */
  keputusanFinal?: boolean;
};

/**
 * Buat atau perbarui penanganan satu kendala.
 * Mengembalikan `id` penanganan yang tersimpan.
 */
export async function saveIssueResolution(
  supabase: SupabaseClient<Database>,
  kendalaId: string,
  payload: ResolutionPayload,
  existingResolutionId?: string,
): Promise<string> {
  const { user } = await requireRole(supabase, "pengawas");

  const solusi = payload.solusi.trim();
  if (solusi.length < 10) {
    throw new ServiceError("Tuliskan solusi minimal 10 karakter.", 422);
  }

  let projectId: string;

  if (existingResolutionId) {
    const { data, error } = await supabase
      .from("issue_resolutions")
      .select("id, project_id, kendala_id")
      .eq("id", existingResolutionId)
      .maybeSingle();

    if (error || !data) {
      throw new ServiceError("Penanganan kendala tidak ditemukan.", 404);
    }
    if (String((data as Row).kendala_id) !== kendalaId) {
      throw new ServiceError("Penanganan tidak cocok dengan kendala ini.", 422);
    }
    projectId = String((data as Row).project_id);
  } else {
    const { data: kendala, error: kendalaError } = await supabase
      .from("kendala")
      .select("id, project_id")
      .eq("id", kendalaId)
      .maybeSingle();

    if (kendalaError || !kendala) {
      throw new ServiceError("Kendala tidak ditemukan.", 404);
    }
    projectId = String((kendala as Row).project_id);
  }

  const needsApproval = payload.butuhPersetujuan === true;

  type ResolutionUpdate =
    Database["public"]["Tables"]["issue_resolutions"]["Update"];
  const row: Omit<ResolutionUpdate, "solusi"> & { solusi: string } = {
    solusi,
    sumber: payload.source === "Analisis AI" ? "Analisis AI" : "Pengawas",
    analisis_ai: (payload.analisisAi ?? null) as Json,
    butuh_persetujuan: needsApproval,
    alasan_persetujuan: payload.alasanPersetujuan?.trim() || null,
    bukti: payload.bukti?.trim() || null,
    status:
      payload.status ??
      (needsApproval ? "Menunggu approval customer" : "Ditindaklanjuti"),
    umpan_balik_customer: payload.umpanBalikCustomer?.trim() || null,
    updated_at: new Date().toISOString(),
    // Hanya ditulis ketika diminta; bendera keputusan final bersifat menempel
    // sehingga penanganan yang sudah ditutup tidak terbuka kembali diam-diam.
    ...(payload.keputusanFinal === true ? { keputusan_final: true } : {}),
  };

  let resolutionId: string;

  if (existingResolutionId) {
    resolutionId = existingResolutionId;
    const { error } = await supabase
      .from("issue_resolutions")
      .update(row)
      .eq("id", resolutionId);

    if (error) {
      console.error("[saveIssueResolution] update:", error.message);
      throw new ServiceError("Gagal memperbarui penanganan kendala.", 500);
    }
  } else {
    const { data, error } = await supabase
      .from("issue_resolutions")
      .insert({
        ...row,
        project_id: projectId,
        kendala_id: kendalaId,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[saveIssueResolution] insert:", error?.message);
      throw new ServiceError("Gagal menyimpan penanganan kendala.", 500);
    }
    resolutionId = String((data as Row).id);
  }

  // Penanganan yang tidak menunggu persetujuan langsung diteruskan ke mandor.
  // Trigger AFTER pada issue_resolutions sudah menurunkan status ke
  // 'reviewed' dengan sendirinya; blok ini hanya pengaman, dan sengaja
  // tidak menyentuh status 'resolved' agar keputusan yang sudah selesai
  // tidak pernah diturunkan kembali.
  if (!needsApproval) {
    await supabase
      .from("kendala")
      .update({ status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", kendalaId)
      .neq("status", "resolved");
  }

  return resolutionId;
}

/** Tambahkan diskusi pada sebuah penanganan kendala. */
export async function addResolutionDiscussion(
  supabase: SupabaseClient<Database>,
  resolutionId: string,
  penulis: "Pengawas" | "Customer",
  pesan: string,
): Promise<DiscussionEntry> {
  const { user } = await requireRole(supabase, "pengawas");

  const trimmed = pesan.trim();
  if (trimmed.length < 3) {
    throw new ServiceError("Tuliskan pesan minimal 3 karakter.", 422);
  }

  const { data: resolution, error: resolutionError } = await supabase
    .from("issue_resolutions")
    .select("id")
    .eq("id", resolutionId)
    .maybeSingle();

  if (resolutionError || !resolution) {
    throw new ServiceError("Penanganan kendala tidak ditemukan.", 404);
  }

  const { data, error } = await supabase
    .from("resolution_discussions")
    .insert({
      resolution_id: resolutionId,
      penulis,
      pesan: trimmed,
      created_by: user.id,
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    console.error("[addResolutionDiscussion]", error?.message);
    throw new ServiceError("Gagal mengirim tanggapan.", 500);
  }

  return {
    id: String((data as Row).id),
    resolutionId,
    author: penulis,
    message: trimmed,
    date: formatDate(String((data as Row).created_at)),
  };
}

// ============================================================
// UPDATE CUSTOMER & DOKUMENTASI
// ============================================================

/** Terbitkan update proyek untuk customer. */
export async function addProjectUpdate(
  supabase: SupabaseClient<Database>,
  projectId: string,
  judul: string,
  isi: string,
): Promise<{ id: string; date: string; message: string }> {
  const { user } = await requireRole(supabase, "pengawas");

  const body = isi.trim();
  if (body.length < 10) {
    throw new ServiceError("Tuliskan update minimal 10 karakter.", 422);
  }

  const { data, error } = await supabase
    .from("project_updates")
    .insert({
      project_id: projectId,
      pengawas_id: user.id,
      judul: judul.trim() || "Update proyek",
      isi: body,
    })
    .select("id, created_at, judul, isi")
    .single();

  if (error || !data) {
    console.error("[addProjectUpdate]", error?.message);
    throw new ServiceError("Gagal menerbitkan update proyek.", 500);
  }

  return {
    id: String((data as Row).id),
    date: formatDate(String((data as Row).created_at)),
    message: composeUpdateMessage(
      String((data as Row).judul ?? ""),
      String((data as Row).isi ?? ""),
    ),
  };
}

/** Unggah dokumentasi lapangan milik proyek. */
export async function addProjectDocumentation(
  supabase: SupabaseClient<Database>,
  projectId: string,
  url: string,
  catatan: string,
  projectStageId?: string | null,
): Promise<{ id: string; date: string; caption: string; image: string }> {
  const { user } = await requireRole(supabase, "pengawas");

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new ServiceError("Sertakan gambar dokumentasi.", 422);
  }

  const { data, error } = await supabase
    .from("progress_documentation")
    .insert({
      project_id: projectId,
      project_stage_id: projectStageId ?? null,
      url: trimmedUrl,
      catatan: catatan.trim() || null,
      uploaded_by: user.id,
    })
    .select("id, created_at, catatan, url")
    .single();

  if (error || !data) {
    console.error("[addProjectDocumentation]", error?.message);
    throw new ServiceError("Gagal menyimpan dokumentasi.", 500);
  }

  return {
    id: String((data as Row).id),
    date: formatDate(String((data as Row).created_at)),
    caption: String((data as Row).catatan ?? "Dokumentasi lapangan"),
    image: String((data as Row).url ?? FALLBACK_IMAGE),
  };
}
