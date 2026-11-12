import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  ConstructionMilestone,
  ConstructionTask,
  ProjectGalleryItem,
  ProjectActivity,
  ProjectTracking,
} from "@/types/project-tracking";
import { TRACKING_MILESTONE_TEMPLATE } from "@/data/project-tracking";
import { formatDate } from "@/utils/format";

type Client = SupabaseClient;
type Stage = Database["public"]["Tables"]["project_stages"]["Row"];
type Report = Database["public"]["Tables"]["progress_reports"]["Row"];
type Subtask = Database["public"]["Tables"]["project_subtasks"]["Row"];
export type Issue = Database["public"]["Tables"]["kendala"]["Row"];

export type LiveProgressProject = {
  id: string;
  customerId: string;
  customerName: string;
  designName: string;
  address: string | null;
  status: string;
  stages: Stage[];
  reports: Report[];
  overallProgress: number | null;
};

export async function getProjectProgressAccess(
  supabase: Client,
  projectId: string,
): Promise<Database["public"]["Enums"]["project_status"] | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data?.status ?? null;
}

const stageStatus = (status: string): ConstructionMilestone["status"] => {
  if (status === "selesai") return "completed";
  if (status === "berjalan") return "in-progress";
  return "pending";
};

export function calculateOverallProgress(stages: Stage[]): number | null {
  if (stages.length !== 6) return null;
  return Number(
    (
      stages.reduce((total, stage) => total + stage.progress_percentage, 0) / 6
    ).toFixed(1),
  );
}

export function stagesToMilestones(
  stages: Stage[],
  subtasksByStage: Map<string, Subtask[]> = new Map(),
): ConstructionMilestone[] {
  return [...stages]
    .sort((a, b) => a.urutan - b.urutan)
    .map((stage) => {
      const template =
        TRACKING_MILESTONE_TEMPLATE[stage.urutan - 1] ??
        TRACKING_MILESTONE_TEMPLATE.find(
          (item) => item.title.toLowerCase() === stage.nama_tahap.toLowerCase(),
        );
      const tasks: ConstructionTask[] = (subtasksByStage.get(stage.id) ?? [])
        .sort((a, b) => a.urutan - b.urutan)
        .map((task) => ({
          id: task.id,
          title: task.judul,
          status: task.selesai ? "completed" : "pending",
          completedAt: task.completed_at ?? undefined,
        }));

      return {
        id: template?.id ?? stage.id,
        title: stage.nama_tahap,
        description: stage.keterangan ?? template?.description ?? "",
        status: stageStatus(stage.status),
        progress: stage.progress_percentage,
        startedAt: stage.tanggal_mulai ?? undefined,
        completedAt: stage.tanggal_selesai ?? undefined,
        updatedAt: stage.updated_at,
        tasks,
      };
    });
}

export async function getProjectProgress(
  supabase: Client,
  projectId: string,
  options: { customerOnly?: boolean } = {},
): Promise<{
  stages: Stage[];
  reports: Report[];
  overallProgress: number | null;
}> {
  const stagesResult = await supabase
    .from("project_stages")
    .select("*")
    .eq("project_id", projectId)
    .order("urutan", { ascending: true });

  if (stagesResult.error) throw stagesResult.error;
  const stages = stagesResult.data ?? [];
  if (stages.length === 0) {
    return { stages, reports: [], overallProgress: null };
  }

  let reportsQuery = supabase
    .from("progress_reports")
    .select("*")
    .in(
      "project_stage_id",
      stages.map((stage) => stage.id),
    )
    .order("created_at", { ascending: false });

  if (options.customerOnly)
    reportsQuery = reportsQuery.eq("status", "verified");
  const reportsResult = await reportsQuery;
  if (reportsResult.error) throw reportsResult.error;

  return {
    stages,
    reports: reportsResult.data ?? [],
    overallProgress: calculateOverallProgress(stages),
  };
}

export async function getCustomerProjectTracking(
  supabase: Client,
  projectId: string,
): Promise<ProjectTracking> {
  const { stages, reports } = await getProjectProgress(supabase, projectId, {
    customerOnly: true,
  });
  const stageIds = stages.map((stage) => stage.id);
  const [subtasksResult, updatesResult, documentationResult, contractResult, resolutionsResult] =
    await Promise.all([
      stageIds.length
        ? supabase
            .from("project_subtasks")
            .select(
              "id, project_stage_id, judul, bobot, urutan, target_selesai, selesai, completed_at, created_at",
            )
            .in("project_stage_id", stageIds)
            .order("urutan", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("project_updates")
        .select("id, judul, isi, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("progress_documentation")
        .select("id, project_stage_id, url, catatan, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("contracts")
        .select("tanggal_mulai, tanggal_selesai_estimasi, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("issue_resolutions")
        .select(`
          id,
          kendala_id,
          solusi,
          alasan_persetujuan,
          bukti,
          status,
          created_at,
          kendala ( kategori, deskripsi ),
          resolution_discussions ( id, penulis, pesan, created_at )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

  if (subtasksResult.error) throw subtasksResult.error;
  if (updatesResult.error) throw updatesResult.error;
  if (documentationResult.error) throw documentationResult.error;
  if (contractResult.error) throw contractResult.error;

  const subtasksByStage = new Map<string, Subtask[]>();
  for (const subtask of (subtasksResult.data ?? []) as Subtask[]) {
    const current = subtasksByStage.get(subtask.project_stage_id) ?? [];
    current.push(subtask);
    subtasksByStage.set(subtask.project_stage_id, current);
  }

  const milestones = stagesToMilestones(stages, subtasksByStage);
  const milestoneIdByStageId = new Map(
    stages.map((stage, index) => [stage.id, milestones[index]?.id]),
  );
  const reportActivities: ProjectActivity[] = reports.map((report) => {
    const stage = stages.find((item) => item.id === report.project_stage_id);
    return {
      id: report.id,
      title: `${stage?.nama_tahap ?? "Tahap"} diperbarui`,
      description: report.keterangan ?? "Progress telah diverifikasi Pengawas.",
      createdAt: report.verified_at ?? report.created_at,
      authorName: "Pengawas",
      authorRole: "Pengawas",
    };
  });
  const updateActivities: ProjectActivity[] = (updatesResult.data ?? []).map(
    (update) => ({
      id: update.id,
      title: update.judul,
      description: update.isi,
      createdAt: update.created_at,
      authorName: "Pengawas",
      authorRole: "Pengawas",
    }),
  );
  const documentationGallery: ProjectGalleryItem[] = (
    documentationResult.data ?? []
  ).map((item) => ({
    id: item.id,
    src: item.url,
    alt: "Dokumentasi pembangunan proyek",
    caption: item.catatan ?? undefined,
    createdAt: item.created_at,
    milestoneId: item.project_stage_id
      ? milestoneIdByStageId.get(item.project_stage_id)
      : undefined,
  }));

  const rawResolutions = (resolutionsResult.data ?? []) as Record<string, unknown>[];
  const resolutions = rawResolutions.map((res) => {
    const k = (res.kendala ?? {}) as Record<string, unknown>;
    const rawDisc = Array.isArray(res.resolution_discussions)
      ? (res.resolution_discussions as Record<string, unknown>[])
      : [];
    const discussion = rawDisc.map((d) => ({
      id: String(d.id),
      author: String(d.penulis ?? "Pengawas"),
      message: String(d.pesan ?? ""),
      date: formatDate(String(d.created_at)),
    }));

    return {
      id: String(res.id),
      issueId: String(res.kendala_id),
      issueTitle: String(k.kategori ?? "Kendala Lapangan"),
      solution: String(res.solusi ?? ""),
      approvalReason: String(res.alasan_persetujuan ?? ""),
      approvalEvidence: (res.bukti as string | null) ?? null,
      status: String(res.status ?? ""),
      submittedAt: formatDate(String(res.created_at)),
      discussion,
    };
  });

  return {
    startedAt:
      contractResult.data?.tanggal_mulai ??
      stages.find((stage) => stage.tanggal_mulai)?.tanggal_mulai ??
      undefined,
    targetDate: contractResult.data?.tanggal_selesai_estimasi ?? undefined,
    milestones,
    activities: [...reportActivities, ...updateActivities],
    gallery: [
      ...reports
        .filter((report) => Boolean(report.foto_url))
        .map((report) => ({
          id: report.id,
          src: report.foto_url as string,
          alt: "Dokumentasi progress proyek",
          caption: report.keterangan ?? undefined,
          createdAt: report.verified_at ?? report.created_at,
          milestoneId: milestoneIdByStageId.get(report.project_stage_id),
        })),
      ...documentationGallery,
    ],
    resolutions,
  };
}

async function getProjectsByIds(
  supabase: Client,
  projectIds: string[],
): Promise<LiveProgressProject[]> {
  if (!projectIds.length) return [];
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, customer_id, alamat_proyek, status, design_id")
    .in("id", projectIds);
  if (error) throw error;

  const designIds = [
    ...new Set((projects ?? []).map((project) => project.design_id)),
  ];
  const { data: designs, error: designsError } = await supabase
    .from("designs")
    .select("id, nama")
    .in("id", designIds);
  if (designsError) throw designsError;

  const customerIds = [
    ...new Set((projects ?? []).map((project) => project.customer_id)),
  ];
  const { data: customers, error: customersError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", customerIds);
  if (customersError) throw customersError;

  return Promise.all(
    (projects ?? []).map(async (project) => {
      const progress = await getProjectProgress(supabase, project.id);
      return {
        id: project.id,
        customerId: project.customer_id,
        customerName:
          customers?.find((customer) => customer.id === project.customer_id)
            ?.full_name ?? "Customer",
        designName:
          designs?.find((design) => design.id === project.design_id)?.nama ??
          "Desain rumah",
        address: project.alamat_proyek,
        status: project.status,
        ...progress,
      };
    }),
  );
}

export async function getMandorProgressProjects(
  supabase: Client,
): Promise<LiveProgressProject[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return [];

  const { data: assignments, error } = await supabase
    .from("project_mandors")
    .select("project_id")
    .eq("mandor_id", userData.user.id);
  if (error) throw error;
  return getProjectsByIds(
    supabase,
    (assignments ?? []).map((assignment) => assignment.project_id),
  );
}

export async function getPengawasProgressProjects(
  supabase: Client,
): Promise<LiveProgressProject[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return [];

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id")
    .eq("pengawas_id", userData.user.id);
  if (error) throw error;
  return getProjectsByIds(
    supabase,
    (projects ?? []).map((project) => project.id),
  );
}

export async function submitProgressReport(
  supabase: Client,
  input: {
    projectStageId: string;
    persentase: number;
    keterangan: string;
    fotoUrl?: string | null;
  },
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi pengguna tidak ditemukan.");

  const { data, error } = await supabase
    .from("progress_reports")
    .insert({
      project_stage_id: input.projectStageId,
      mandor_id: userData.user.id,
      persentase: input.persentase,
      keterangan: input.keterangan,
      foto_url: input.fotoUrl ?? null,
      status: "pending",
      keputusan: "menunggu",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reviewProgressReport(
  supabase: Client,
  reportId: string,
  decision: "approve" | "reject",
  feedback?: string,
) {
  if (decision === "approve") {
    const { data, error } = await supabase.rpc("approve_progress_report", {
      report_id: reportId,
      review_note: feedback ?? null,
    });
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.rpc("reject_progress_report", {
    report_id: reportId,
    review_note: feedback ?? "",
  });
  if (error) throw error;
  return data;
}

export async function getProjectIssues(supabase: Client, projectId: string) {
  const { data, error } = await supabase
    .from("kendala")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function submitProjectIssue(
  supabase: Client,
  input: {
    projectId: string;
    projectStageId?: string | null;
    description: string;
  },
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sesi pengguna tidak ditemukan.");
  const { data, error } = await supabase
    .from("kendala")
    .insert({
      project_id: input.projectId,
      project_stage_id: input.projectStageId ?? null,
      reported_by: userData.user.id,
      deskripsi: input.description,
      status: "reported",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectIssue(
  supabase: Client,
  issueId: string,
  values: {
    status?: Database["public"]["Enums"]["kendala_status"];
    tindak_lanjut?: string | null;
    dampak_biaya?: number | null;
    dampak_waktu_hari?: number | null;
    visible_to_customer?: boolean;
  },
) {
  const { data, error } = await supabase
    .from("kendala")
    .update(values)
    .eq("id", issueId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
