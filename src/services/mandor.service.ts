import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  MandorForemanNote,
  MandorIssueCategory,
  MandorIssueReport,
  MandorMilestone,
  MandorProgressReport,
  MandorProject,
  MandorRegistrationStatus,
  MandorSubtask,
} from "@/data/mandor";

type DbSubtask = {
  id: string;
  judul: string;
  bobot: number | null;
  urutan: number | null;
  selesai: boolean | null;
  target_selesai: string | null;
  completed_at: string | null;
};

type DbStage = {
  id: string;
  nama_tahap: string;
  urutan: number | null;
  progress_percentage: number | null;
  status: string;
  keterangan: string | null;
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  project_subtasks?: DbSubtask[] | null;
};

type DbProject = {
  id: string;
  status: string;
  alamat_proyek: string | null;
  created_at: string;
  pengawas_id: string | null;
  designs: {
    id: string;
    nama: string;
    highlights: string[] | null;
    durasi_bulan: number | null;
  } | null;
  project_stages: DbStage[] | null;
};

type DbProgressReport = {
  id: string;
  project_stage_id: string;
  project_subtask_id: string | null;
  persentase: number | null;
  keterangan: string | null;
  foto_url: string | null;
  status: string;
  keputusan: string;
  feedback: string | null;
  reviewer_note?: string | null;
  created_at: string;
  project_stages?: { nama_tahap: string } | null;
  project_subtasks?: { judul: string } | null;
};

type DbKendala = {
  id: string;
  project_id: string;
  project_stage_id: string | null;
  project_subtask_id: string | null;
  deskripsi: string;
  kategori: string | null;
  kondisi_pekerjaan: string | null;
  dampak_waktu_hari: number | null;
  informasi_tambahan: string | null;
  lampiran: string | null;
  lampiran_nama: string | null;
  status: string;
  tindak_lanjut: string | null;
  created_at: string;
  project_stages?: { nama_tahap: string } | null;
  project_subtasks?: { judul: string } | null;
};

type DbForemanNote = {
  id: string;
  project_id: string;
  catatan: string;
  created_at: string;
};

const ISSUE_CATEGORIES_LABEL: Record<string, string> = {
  CUACA_LINGKUNGAN: "Cuaca & Lingkungan",
  MATERIAL_PERALATAN: "Material & Peralatan",
  TENAGA_KERJA: "Tenaga Kerja",
  TEKNIS_KONSTRUKSI: "Teknis & Konstruksi",
  DESAIN_SPESIFIKASI: "Desain & Spesifikasi",
  ANGGARAN_PENGADAAN: "Anggaran & Pengadaan",
  PERIZINAN_EKSTERNAL: "Perizinan & Eksternal",
  LAINNYA: "Lainnya",
};

const formatDateIndo = (isoDate?: string | null) => {
  if (!isoDate) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

const formatDateTimeIndo = (isoDate?: string | null) => {
  if (!isoDate) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

export async function getMandorStatus(
  supabase: SupabaseClient<Database>,
): Promise<{ status: MandorRegistrationStatus; reason: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "Menunggu", reason: "" };
  }

  const { data, error } = await supabase
    .from("mandor_profiles")
    .select("status, catatan_verifikasi")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return { status: "Menunggu", reason: "" };
  }

  const statusMap: Record<string, MandorRegistrationStatus> = {
    approved: "Disetujui",
    pending: "Menunggu",
    rejected: "Ditolak",
  };

  return {
    status: statusMap[data.status] || "Menunggu",
    reason: data.catatan_verifikasi || "",
  };
}

export async function getMandorWaitingReportsCount(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("progress_reports")
    .select("id", { count: "exact", head: true })
    .eq("mandor_id", user.id)
    .eq("keputusan", "menunggu");

  if (error) {
    console.error("[getMandorWaitingReportsCount] Error:", error);
    return 0;
  }

  return count || 0;
}

export async function getMandorProjects(
  supabase: SupabaseClient<Database>,
): Promise<MandorProject[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Ambil data penugasan proyek mandor
  const { data: assignments, error: pmErr } = await supabase
    .from("project_mandors")
    .select("project_id, assigned_at")
    .eq("mandor_id", user.id);

  if (pmErr || !assignments || assignments.length === 0) {
    return [];
  }

  const projectIds = assignments.map(
    (a: { project_id: string }) => a.project_id,
  );
  const assignmentMap = new Map(
    assignments.map((a: { project_id: string; assigned_at: string }) => [
      a.project_id,
      a.assigned_at,
    ]),
  );

  // Ambil detail projects, designs, dan project_stages
  const { data: rawProjects, error: pErr } = await supabase
    .from("projects")
    .select(`
      id,
      status,
      alamat_proyek,
      created_at,
      pengawas_id,
      designs (
        id,
        nama,
        highlights,
        durasi_bulan
      ),
      project_stages (
        id,
        nama_tahap,
        urutan,
        progress_percentage,
        status,
        keterangan,
        tanggal_selesai
      )
    `)
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (pErr || !rawProjects) {
    console.error("[getMandorProjects] Error fetching projects:", pErr);
    return [];
  }

  const projects = rawProjects as unknown as DbProject[];

  // Ambil nama pengawas jika ada
  const supervisorIds = Array.from(
    new Set(
      projects.map((p) => p.pengawas_id).filter(Boolean) as string[],
    ),
  );
  let supervisorMap: Record<string, string> = {};
  if (supervisorIds.length > 0) {
    const { data: supervisors } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", supervisorIds);

    if (supervisors) {
      supervisorMap = Object.fromEntries(
        (supervisors as Array<{ id: string; full_name?: string | null }>).map((s) => [s.id, s.full_name || "Pengawas"]),
      );
    }
  }

  return projects.map((p) => {
    const stages = (p.project_stages || []).sort(
      (a, b) => (a.urutan || 0) - (b.urutan || 0),
    );

    const overallProgress = stages.length
      ? Math.round(
          stages.reduce(
            (sum: number, st) => sum + (Number(st.progress_percentage) || 0),
            0,
          ) / stages.length,
        )
      : p.status === "selesai"
        ? 100
        : 0;

    const currentStage =
      stages.find((st) => st.status === "berjalan") ||
      stages.find((st) => st.status !== "selesai") ||
      stages[0];

    const currentMilestone = currentStage
      ? currentStage.nama_tahap
      : "Persiapan Lapangan";

    const supervisorNote =
      currentStage?.keterangan ||
      "Patuhi gambar kerja dan periksa kesiapan peralatan.";

    const lastStage = stages[stages.length - 1];
    const targetDate = lastStage?.tanggal_selesai
      ? formatDateIndo(lastStage.tanggal_selesai)
      : p.designs?.durasi_bulan
        ? `${p.designs.durasi_bulan} Bulan`
        : "Sesuai Jadwal";

    const assignedDate = assignmentMap.get(p.id) || p.created_at;

    const fallbackImages = [
      "/images/aset/construction2.jpg",
      "/images/aset/construction.jpg",
    ];
    const imageIndex = Math.abs(p.id.charCodeAt(0)) % fallbackImages.length;
    const image = fallbackImages[imageIndex];

    const scope = Array.isArray(p.designs?.highlights) &&
      p.designs.highlights.length > 0
        ? p.designs.highlights
        : [
            "Pekerjaan Persiapan & Fondasi",
            "Pekerjaan Struktur Utama",
            "Pekerjaan Finishing",
          ];

    return {
      id: p.id,
      title: p.designs?.nama || "Pembangunan Rumah",
      design: p.designs?.nama || "Konsep Tropis Modern",
      location: p.alamat_proyek || "Lokasi Proyek",
      assignedAt: formatDateIndo(assignedDate),
      target: targetDate,
      overallProgress,
      currentMilestone,
      supervisor: p.pengawas_id
        ? supervisorMap[p.pengawas_id] || "Pengawas Lapangan"
        : "Belum Ditugaskan",
      supervisorNote,
      image,
      scope,
      milestones: [],
      progressReports: [],
      issueReports: [],
      notes: [],
    };
  });
}

export async function getMandorProjectDetail(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<MandorProject | null> {
  // Ambil project, design, stages, dan subtasks
  const { data: rawP, error: pErr } = await supabase
    .from("projects")
    .select(`
      id,
      status,
      alamat_proyek,
      created_at,
      pengawas_id,
      designs (
        id,
        nama,
        highlights,
        durasi_bulan
      ),
      project_stages (
        id,
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
          selesai,
          target_selesai,
          completed_at
        )
      )
    `)
    .eq("id", projectId)
    .maybeSingle();

  if (pErr || !rawP) {
    console.error("[getMandorProjectDetail] Error:", pErr);
    return null;
  }

  const p = rawP as unknown as DbProject;

  // Ambil nama pengawas jika ada
  let supervisorName = "Pengawas Lapangan";
  if (p.pengawas_id) {
    const { data: sup } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", p.pengawas_id)
      .maybeSingle();
    if (sup?.full_name) {
      supervisorName = sup.full_name;
    }
  }

  // Ambil laporan progress
  const { data: rawReports } = await supabase
    .from("progress_reports")
    .select(`
      id,
      project_stage_id,
      project_subtask_id,
      persentase,
      keterangan,
      foto_url,
      status,
      keputusan,
      feedback,
      reviewer_note,
      created_at,
      project_stages (nama_tahap),
      project_subtasks (judul)
    `)
    .order("created_at", { ascending: false });

  const reportsData = (rawReports as unknown as DbProgressReport[]) || [];

  // Filter progress reports yang relevan dengan stage proyek ini
  const stageIds = new Set(
    (p.project_stages || []).map((st) => st.id),
  );
  const relevantReports = reportsData.filter((r) =>
    stageIds.has(r.project_stage_id),
  );

  // Ambil kendala
  const { data: rawIssues } = await supabase
    .from("kendala")
    .select(`
      id,
      project_id,
      project_stage_id,
      project_subtask_id,
      deskripsi,
      kategori,
      kondisi_pekerjaan,
      dampak_waktu_hari,
      informasi_tambahan,
      lampiran,
      lampiran_nama,
      status,
      tindak_lanjut,
      created_at,
      project_stages (nama_tahap),
      project_subtasks (judul)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const issuesData = (rawIssues as unknown as DbKendala[]) || [];

  // Ambil foreman notes
  const { data: rawNotes } = await supabase
    .from("foreman_notes")
    .select("id, project_id, catatan, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const notesData = (rawNotes as unknown as DbForemanNote[]) || [];

  // Petakan stages dan subtasks ke MandorMilestone
  const stages = (p.project_stages || []).sort(
    (a, b) => (a.urutan || 0) - (b.urutan || 0),
  );

  const milestones: MandorMilestone[] = stages.map((st) => {
    const rawSubtasks = (st.project_subtasks || []).sort(
      (a, b) => (a.urutan || 0) - (b.urutan || 0),
    );

    const subtasks: MandorSubtask[] = rawSubtasks.map((sub) => ({
      id: sub.id,
      title: sub.judul,
      weight: Number(sub.bobot) || 0,
      done: Boolean(sub.selesai),
    }));

    const totalWeight = subtasks.reduce((sum, s) => sum + s.weight, 0);

    return {
      id: st.id,
      title: st.nama_tahap,
      target: st.tanggal_selesai
        ? formatDateIndo(st.tanggal_selesai)
        : "Jadwal berjalan",
      weight: totalWeight > 0 ? totalWeight : 16.66,
      subtasks,
    };
  });

  // Petakan laporan progress
  const progressReports: MandorProgressReport[] = relevantReports.map(
    (r) => {
      let review: MandorProgressReport["review"] = "Menunggu";
      if (r.keputusan === "disetujui" || r.status === "verified") {
        review = "Disetujui";
      } else if (r.keputusan === "perlu_revisi") {
        review = "Perlu revisi";
      }

      return {
        id: r.id,
        milestoneId: r.project_stage_id,
        milestoneTitle:
          r.project_stages?.nama_tahap || "Tahap Pekerjaan",
        subtaskTitle:
          r.project_subtasks?.judul || "Laporan Lapangan",
        note: r.keterangan || "-",
        photo: r.foto_url || null,
        submitted: formatDateTimeIndo(r.created_at),
        review,
        feedback: r.feedback || r.reviewer_note || "",
        weight: Number(r.persentase) || 0,
      };
    },
  );

  // Petakan laporan kendala
  const issueReports: MandorIssueReport[] = issuesData.map((k) => {
    let status: MandorIssueReport["status"] = "Menunggu";
    if (k.status === "resolved" || k.status === "Selesai") {
      status = "Selesai";
    } else if (
      k.status === "in_progress" ||
      k.status === "Ditindaklanjuti" ||
      k.tindak_lanjut
    ) {
      status = "Ditindaklanjuti";
    }

    const cat = (k.kategori as MandorIssueCategory) || "LAINNYA";

    return {
      id: k.id,
      projectId: k.project_id,
      category: cat,
      categoryLabel: ISSUE_CATEGORIES_LABEL[cat] || cat,
      description: k.deskripsi || "-",
      affectedMilestoneId: k.project_stage_id || "",
      affectedMilestoneTitle:
        k.project_stages?.nama_tahap || "Semua Tahap",
      affectedSubtaskId: k.project_subtask_id || "",
      affectedSubtaskTitle:
        k.project_subtasks?.judul || "Pekerjaan Lapangan",
      workCondition: (k.kondisi_pekerjaan as MandorIssueReport["workCondition"]) || "BERJALAN",
      estimatedDelayDays: Number(k.dampak_waktu_hari) || 0,
      additionalInfo: k.informasi_tambahan || "-",
      attachment: k.lampiran || null,
      attachmentName: k.lampiran_nama || "lampiran.jpg",
      submitted: formatDateTimeIndo(k.created_at),
      status,
      followUp: k.tindak_lanjut || "",
    };
  });

  // Petakan foreman notes
  const notes: MandorForemanNote[] = notesData.map((fn) => ({
    id: fn.id,
    projectId: fn.project_id,
    note: fn.catatan,
    submitted: formatDateTimeIndo(fn.created_at),
  }));

  const overallProgress = stages.length
    ? Math.round(
        stages.reduce(
          (sum: number, st) => sum + (Number(st.progress_percentage) || 0),
          0,
        ) / stages.length,
      )
    : p.status === "selesai"
      ? 100
      : 0;

  const currentStage =
    stages.find((st) => st.status === "berjalan") ||
    stages.find((st) => st.status !== "selesai") ||
    stages[0];

  const currentMilestone = currentStage
    ? currentStage.nama_tahap
    : "Persiapan Lapangan";

  const supervisorNote =
    currentStage?.keterangan ||
    "Patuhi gambar kerja dan periksa kesiapan peralatan.";

  const lastStage = stages[stages.length - 1];
  const targetDate = lastStage?.tanggal_selesai
    ? formatDateIndo(lastStage.tanggal_selesai)
    : p.designs?.durasi_bulan
      ? `${p.designs.durasi_bulan} Bulan`
      : "Sesuai Jadwal";

  const fallbackImages = [
    "/images/aset/construction2.jpg",
    "/images/aset/construction.jpg",
  ];
  const imageIndex = Math.abs(p.id.charCodeAt(0)) % fallbackImages.length;
  const image = fallbackImages[imageIndex];

  const scope = Array.isArray(p.designs?.highlights) &&
    p.designs.highlights.length > 0
      ? p.designs.highlights
      : [
          "Pekerjaan Persiapan & Fondasi",
          "Pekerjaan Struktur Utama",
          "Pekerjaan Finishing",
        ];

  return {
    id: p.id,
    title: p.designs?.nama || "Pembangunan Rumah",
    design: p.designs?.nama || "Konsep Tropis Modern",
    location: p.alamat_proyek || "Lokasi Proyek",
    assignedAt: formatDateIndo(p.created_at),
    target: targetDate,
    overallProgress,
    currentMilestone,
    supervisor: supervisorName,
    supervisorNote,
    image,
    scope,
    milestones,
    progressReports,
    issueReports,
    notes,
  };
}

export async function submitProgressReport(
  supabase: SupabaseClient<Database>,
  input: {
    stageId: string;
    subtaskId?: string;
    weight: number;
    note: string;
    photo?: string | null;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Anda harus login terlebih dahulu.");

  const { data, error } = await supabase
    .from("progress_reports")
    .insert({
      project_stage_id: input.stageId,
      project_subtask_id: input.subtaskId || null,
      mandor_id: user.id,
      persentase: input.weight,
      keterangan: input.note,
      foto_url: input.photo || null,
      status: "pending",
      keputusan: "menunggu",
    })
    .select()
    .single();

  if (error) {
    console.error("[submitProgressReport] Error:", error);
    throw new Error(error.message || "Gagal mengirim laporan progress.");
  }

  return data;
}

export async function submitIssueReport(
  supabase: SupabaseClient<Database>,
  input: {
    projectId: string;
    stageId?: string;
    subtaskId?: string;
    category: string;
    workCondition: string;
    description: string;
    estimatedDelayDays?: number;
    additionalInfo?: string;
    attachment?: string | null;
    attachmentName?: string | null;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Anda harus login terlebih dahulu.");

  const { data, error } = await supabase
    .from("kendala")
    .insert({
      project_id: input.projectId,
      project_stage_id: input.stageId || null,
      project_subtask_id: input.subtaskId || null,
      reported_by: user.id,
      kategori: input.category,
      kondisi_pekerjaan: input.workCondition,
      deskripsi: input.description,
      dampak_waktu_hari: input.estimatedDelayDays || null,
      informasi_tambahan: input.additionalInfo || null,
      lampiran: input.attachment || null,
      lampiran_nama: input.attachmentName || null,
      status: "reported",
    })
    .select()
    .single();

  if (error) {
    console.error("[submitIssueReport] Error:", error);
    throw new Error(error.message || "Gagal melaporkan kendala.");
  }

  return data;
}

export async function submitForemanNote(
  supabase: SupabaseClient<Database>,
  input: {
    projectId: string;
    note: string;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Anda harus login terlebih dahulu.");

  const { data, error } = await supabase
    .from("foreman_notes")
    .insert({
      project_id: input.projectId,
      mandor_id: user.id,
      catatan: input.note,
    })
    .select()
    .single();

  if (error) {
    console.error("[submitForemanNote] Error:", error);
    throw new Error(error.message || "Gagal mengirim catatan.");
  }

  return data;
}
