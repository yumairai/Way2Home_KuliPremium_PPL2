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

const MILESTONE_DURATION_WEIGHTS = [15, 25, 25, 10, 20, 5] as const;

async function resolveProjectStorageUrl(
  supabase: Client,
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(value, 3600);

  if (error) {
    console.error("[progress] Failed to create signed documentation URL:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

function jakartaDate(timestamp: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function milestoneSchedule(
  milestones: ConstructionMilestone[],
  startDate: string,
  durationDays: number,
  delayByStage: Map<string, number>,
  stages: Stage[],
) {
  let elapsedDays = 0;
  let totalDelayDays = 0;
  const orderedStages = [...stages].sort((a, b) => a.urutan - b.urutan);

  const scheduled = milestones.map((milestone, index) => {
    const stage = orderedStages[index];
    const previousBoundary = Math.round(
      (durationDays * MILESTONE_DURATION_WEIGHTS
        .slice(0, index)
        .reduce((sum, weight) => sum + weight, 0)) / 100,
    );
    const nextBoundary = Math.round(
      (durationDays * MILESTONE_DURATION_WEIGHTS
        .slice(0, index + 1)
        .reduce((sum, weight) => sum + weight, 0)) / 100,
    );
    const baseDuration = Math.max(0, nextBoundary - previousBoundary);
    const localDelay = stage ? delayByStage.get(stage.id) ?? 0 : 0;
    const targetStart = addCalendarDays(startDate, elapsedDays);
    elapsedDays += baseDuration + localDelay;
    totalDelayDays += localDelay;

    return {
      ...milestone,
      targetStart,
      targetEnd: addCalendarDays(startDate, elapsedDays),
      delayDays: localDelay,
    };
  });

  return {
    milestones: scheduled,
    targetDate: addCalendarDays(startDate, elapsedDays),
    totalDelayDays,
  };
}

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
      const subtasks = subtasksByStage.get(stage.id) ?? [];
      const tasks: ConstructionTask[] = subtasks
        .sort((a, b) => a.urutan - b.urutan)
        .map((task) => ({
          id: task.id,
          title: task.judul,
          status: task.selesai ? "completed" : "pending",
          weight: Number(task.bobot ?? 0),
          completedAt: task.completed_at ?? undefined,
        }));

      // Hitung progres tahap secara dinamis dari bobot subtask
      const totalWeight = subtasks.reduce(
        (sum, item) => sum + Number(item.bobot ?? 0),
        0,
      );
      const doneWeight = subtasks
        .filter((item) => item.selesai)
        .reduce((sum, item) => sum + Number(item.bobot ?? 0), 0);

      const progress =
        totalWeight > 0
          ? Math.min(100, Math.round((doneWeight / totalWeight) * 100))
          : stage.progress_percentage;

      let status: ConstructionMilestone["status"] = "pending";
      if (progress >= 100 || stage.status === "selesai") {
        status = "completed";
      } else if (progress > 0 || stage.status === "berjalan") {
        status = "in-progress";
      } else {
        status = stageStatus(stage.status);
      }

      return {
        id: template?.id ?? stage.id,
        title: stage.nama_tahap,
        description: stage.keterangan ?? template?.description ?? "",
        status,
        progress,
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

  const stageIds = stages.map((stage) => stage.id);
  const { data: subtasksData } = await supabase
    .from("project_subtasks")
    .select("project_stage_id, bobot, selesai")
    .in("project_stage_id", stageIds);

  const subtasks = (subtasksData ?? []) as {
    project_stage_id: string;
    bobot: number;
    selesai: boolean;
  }[];

  const subtasksByStage = new Map<
    string,
    { bobot: number; selesai: boolean }[]
  >();
  for (const st of subtasks) {
    const list = subtasksByStage.get(st.project_stage_id) ?? [];
    list.push(st);
    subtasksByStage.set(st.project_stage_id, list);
  }

  const updatedStages = stages.map((stage) => {
    const stageSubtasks = subtasksByStage.get(stage.id) ?? [];
    const totalWeight = stageSubtasks.reduce(
      (sum, item) => sum + Number(item.bobot ?? 0),
      0,
    );
    const doneWeight = stageSubtasks
      .filter((item) => item.selesai)
      .reduce((sum, item) => sum + Number(item.bobot ?? 0), 0);

    const progress =
      totalWeight > 0
        ? Math.min(100, Math.round((doneWeight / totalWeight) * 100))
        : stage.progress_percentage;

    const status =
      progress >= 100
        ? "selesai"
        : progress > 0
          ? "berjalan"
          : stage.status === "berjalan"
            ? "berjalan"
            : stage.status;

    return {
      ...stage,
      progress_percentage: progress,
      status,
    };
  });

  const totalAllWeight = subtasks.reduce(
    (sum, item) => sum + Number(item.bobot ?? 0),
    0,
  );
  const doneAllWeight = subtasks
    .filter((item) => item.selesai)
    .reduce((sum, item) => sum + Number(item.bobot ?? 0), 0);

  const overallProgress =
    totalAllWeight > 0
      ? Number(doneAllWeight.toFixed(1))
      : calculateOverallProgress(updatedStages);

  let reportsQuery = supabase
    .from("progress_reports")
    .select("*")
    .in("project_stage_id", stageIds)
    .order("created_at", { ascending: false });

  if (options.customerOnly)
    reportsQuery = reportsQuery.eq("status", "verified");
  const reportsResult = await reportsQuery;
  if (reportsResult.error) throw reportsResult.error;

  return {
    stages: updatedStages,
    reports: reportsResult.data ?? [],
    overallProgress,
  };
}

export async function getCustomerProjectTracking(
  supabase: Client,
  projectId: string,
): Promise<ProjectTracking> {
  const {
    stages,
    reports,
    overallProgress: baseOverallProgress,
  } = await getProjectProgress(supabase, projectId, {
    customerOnly: true,
  });
  const stageIds = stages.map((stage) => stage.id);
  const [
    subtasksResult,
    updatesResult,
    documentationResult,
    contractResult,
    resolutionsResult,
    paymentResult,
    projectResult,
  ] = await Promise.all([
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
      .select(
        `
          id,
          kendala_id,
          solusi,
          alasan_persetujuan,
          bukti,
          dampak_type,
          tambahan_biaya,
          tambahan_hari,
          status,
          created_at,
          kendala ( kategori, deskripsi, project_stage_id ),
          resolution_discussions (
            id, penulis, pesan, dampak_type, tambahan_biaya, tambahan_hari, created_at
          )
        `,
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_stages")
      .select("tanggal_bayar")
      .eq("project_id", projectId)
      .eq("urutan", 0)
      .eq("status", "lunas")
      .maybeSingle(),
    supabase
      .from("projects")
      .select("design_id")
      .eq("id", projectId)
      .maybeSingle(),
  ]);

  if (subtasksResult.error) throw subtasksResult.error;
  if (updatesResult.error) throw updatesResult.error;
  if (documentationResult.error) throw documentationResult.error;
  if (contractResult.error) throw contractResult.error;
  if (resolutionsResult.error) throw resolutionsResult.error;
  if (paymentResult.error) throw paymentResult.error;
  if (projectResult.error) throw projectResult.error;

  const designResult = projectResult.data?.design_id
    ? await supabase
        .from("designs")
        .select("estimasi_durasi_hari")
        .eq("id", projectResult.data.design_id)
        .maybeSingle()
    : null;
  if (designResult?.error) throw designResult.error;

  const allSubtasks = (subtasksResult.data ?? []) as Subtask[];
  const totalSubtasksWeight = allSubtasks.reduce(
    (sum, s) => sum + Number(s.bobot ?? 0),
    0,
  );
  const doneSubtasksWeight = allSubtasks
    .filter((s) => s.selesai)
    .reduce((sum, s) => sum + Number(s.bobot ?? 0), 0);

  const overallProgress =
    totalSubtasksWeight > 0
      ? Number(doneSubtasksWeight.toFixed(1))
      : baseOverallProgress;

  const subtasksByStage = new Map<string, Subtask[]>();
  for (const subtask of allSubtasks) {
    const current = subtasksByStage.get(subtask.project_stage_id) ?? [];
    current.push(subtask);
    subtasksByStage.set(subtask.project_stage_id, current);
  }

  let milestones = stagesToMilestones(stages, subtasksByStage);
  milestones = milestones.map((milestone, index) => {
    if (milestone.startedAt || milestone.status !== "in-progress")
      return milestone;

    const stage = [...stages].sort((a, b) => a.urutan - b.urutan)[index];
    if (!stage) return milestone;
    const observedStartDates = [
      ...reports
        .filter((report) => report.project_stage_id === stage.id)
        .map((report) => report.verified_at ?? report.created_at),
      ...(subtasksByStage.get(stage.id) ?? [])
        .map((subtask) => subtask.completed_at)
        .filter((date): date is string => Boolean(date)),
    ].sort((a, b) => a.localeCompare(b));

    return {
      ...milestone,
      startedAt:
        observedStartDates[0]?.slice(0, 10) ??
        stage.updated_at?.slice(0, 10) ??
        undefined,
    };
  });
  const milestoneIdByStageId = new Map(
    stages.map((stage, index) => [stage.id, milestones[index]?.id]),
  );
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
  const documentationGallery = (
    await Promise.all(
      (documentationResult.data ?? []).map(async (item): Promise<ProjectGalleryItem | null> => {
        const src = await resolveProjectStorageUrl(supabase, item.url);
        if (!src) return null;
        return {
          id: item.id,
          src,
          alt: "Dokumentasi pembangunan proyek",
          caption: item.catatan ?? undefined,
          createdAt: item.created_at,
          milestoneId: item.project_stage_id
            ? milestoneIdByStageId.get(item.project_stage_id)
            : undefined,
        };
      }),
    )
  ).filter((item): item is ProjectGalleryItem => item !== null);

  const rawResolutions = (resolutionsResult.data ?? []) as Record<
    string,
    unknown
  >[];
  const delayByStage = new Map<string, number>();
  const countedIssues = new Set<string>();
  for (const resolution of rawResolutions) {
    const issueId = String(resolution.kendala_id ?? "");
    if (!issueId || countedIssues.has(issueId)) continue;
    countedIssues.add(issueId);
    const status = String(resolution.status ?? "");
    const days = Number(resolution.tambahan_hari ?? 0);
    const issue = (resolution.kendala ?? {}) as Record<string, unknown>;
    const stageId = String(issue.project_stage_id ?? "");
    if (
      !stageId ||
      !["Ditindaklanjuti", "resolved"].includes(status) ||
      !["waktu", "biaya_dan_waktu"].includes(String(resolution.dampak_type)) ||
      !Number.isFinite(days) ||
      days <= 0
    ) continue;
    delayByStage.set(stageId, (delayByStage.get(stageId) ?? 0) + days);
  }

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
      impactType:
        d.dampak_type === "biaya" ||
        d.dampak_type === "waktu" ||
        d.dampak_type === "biaya_dan_waktu"
          ? (d.dampak_type as "biaya" | "waktu" | "biaya_dan_waktu")
          : null,
      additionalCost:
        d.tambahan_biaya == null ? null : Number(d.tambahan_biaya),
      additionalDays: d.tambahan_hari == null ? null : Number(d.tambahan_hari),
    }));

    return {
      id: String(res.id),
      issueId: String(res.kendala_id),
      issueTitle: String(k.kategori ?? "Kendala Lapangan"),
      solution: String(res.solusi ?? ""),
      approvalReason: String(res.alasan_persetujuan ?? ""),
      approvalEvidence: (res.bukti as string | null) ?? null,
      impactType:
        res.dampak_type === "biaya" ||
        res.dampak_type === "waktu" ||
        res.dampak_type === "biaya_dan_waktu"
          ? (res.dampak_type as "biaya" | "waktu" | "biaya_dan_waktu")
          : null,
      additionalCost:
        res.tambahan_biaya == null ? null : Number(res.tambahan_biaya),
      additionalDays:
        res.tambahan_hari == null ? null : Number(res.tambahan_hari),
      status: String(res.status ?? ""),
      submittedAt: formatDate(String(res.created_at)),
      discussion,
    };
  });

  const dpPaidAt = paymentResult.data?.tanggal_bayar
    ? jakartaDate(paymentResult.data.tanggal_bayar)
    : undefined;
  const designDuration = Number(designResult?.data?.estimasi_durasi_hari ?? 0);
  const schedule =
    dpPaidAt && designDuration > 0
      ? milestoneSchedule(
          milestones,
          dpPaidAt,
          designDuration,
          delayByStage,
          stages,
        )
      : null;
  if (schedule) milestones = schedule.milestones;

  return {
    startedAt:
      dpPaidAt ??
      contractResult.data?.tanggal_mulai ??
      stages.find((stage) => stage.tanggal_mulai)?.tanggal_mulai ??
      undefined,
    targetDate:
      schedule?.targetDate ??
      contractResult.data?.tanggal_selesai_estimasi ??
      undefined,
    totalDelayDays: schedule?.totalDelayDays ?? 0,
    overallProgress,
    milestones,
    activities: updateActivities,
    gallery: [
      ...(
        await Promise.all(
          reports
            .filter((report) => Boolean(report.foto_url))
            .map(async (report): Promise<ProjectGalleryItem | null> => {
              const src = await resolveProjectStorageUrl(
                supabase,
                report.foto_url,
              );
              if (!src) return null;
              return {
                id: report.id,
                src,
                alt: "Dokumentasi progress proyek",
                caption: report.keterangan ?? undefined,
                createdAt: report.verified_at ?? report.created_at,
                milestoneId: milestoneIdByStageId.get(report.project_stage_id),
              };
            }),
        )
      ).filter((item): item is ProjectGalleryItem => item !== null),
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
