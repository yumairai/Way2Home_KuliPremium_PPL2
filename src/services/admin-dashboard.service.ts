import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireRole } from "./access.service";

export type AdminProjectStatus = "Berjalan" | "Menunggu" | "Selesai";

export type AdminMetricItem = {
  label: string;
  value: string;
  detail: string;
  icon: "users" | "buildings" | "files" | "check";
  tone: "blue" | "navy" | "amber" | "green";
};

export type RevenueTrendPoint = {
  month: string;
  amount: number;
  rawAmount: number;
};

export type AdminDashboardProject = {
  id: string;
  rawId: string;
  name: string;
  customer: string;
  foreman: string;
  supervisor: string;
  status: AdminProjectStatus;
  progress: number | null;
  category: string;
  budget: number;
};

export type AdminDashboardData = {
  currentDateFormatted: string;
  metrics: AdminMetricItem[];
  activeProjectsCount: number;
  availableSupervisorsCount: number;
  availableMandorsCount: number;
  trend: {
    points: RevenueTrendPoint[];
    totalValueFormatted: string;
    percentageChangeFormatted: string;
    monthRangeLabel: string;
  };
  projects: AdminDashboardProject[];
};

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatCurrencyCompact(val: number): string {
  if (val >= 1_000_000_000) {
    const formatted = (val / 1_000_000_000).toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `Rp ${formatted} M`;
  }
  if (val >= 1_000_000) {
    const formatted = Math.round(val / 1_000_000).toLocaleString("id-ID");
    return `Rp ${formatted} jt`;
  }
  return `Rp ${val.toLocaleString("id-ID")}`;
}

export async function getAdminDashboardData(
  supabase: SupabaseClient<Database>,
): Promise<AdminDashboardData> {
  await requireRole(supabase, "admin");

  const [
    { data: profilesData, error: profilesError },
    { data: projectsData, error: projectsError },
    { data: stagesData },
    { data: mandorProfilesData },
    { data: projectMandorsData },
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name"),
    supabase
      .from("projects")
      .select(
        `
        id,
        status,
        created_at,
        budget_proyek,
        nilai_proyek,
        pengawas_id,
        customer_id,
        designs ( nama, gaya_arsitektur ),
        profiles!projects_customer_id_fkey ( full_name )
      `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("project_stages")
      .select("id, project_id, progress_percentage, status"),
    supabase
      .from("mandor_profiles")
      .select("id, status, profiles!mandor_profiles_id_fkey ( full_name )"),
    supabase.from("project_mandors").select("project_id, mandor_id"),
  ]);

  if (profilesError) {
    console.error("[getAdminDashboardData] profiles error:", profilesError);
  }
  if (projectsError) {
    console.error("[getAdminDashboardData] projects error:", projectsError);
  }

  const profiles = (profilesData || []) as Array<{
    id: string;
    role: string;
    full_name: string | null;
  }>;
  const profileMap = new Map(
    profiles.map((p) => [p.id, p.full_name || "Tanpa Nama"]),
  );

  const projects = (projectsData || []) as Array<{
    id: string;
    status: string;
    created_at: string;
    budget_proyek: number | null;
    nilai_proyek: number | null;
    pengawas_id: string | null;
    customer_id: string;
    designs: { nama: string | null; gaya_arsitektur: string | null } | null;
    profiles: { full_name: string | null } | null;
  }>;

  const stages = (stagesData || []) as Array<{
    id: string;
    project_id: string;
    progress_percentage: number | null;
    status: string;
  }>;

  const stagesByProject = new Map<string, typeof stages>();
  for (const s of stages) {
    const list = stagesByProject.get(s.project_id) || [];
    list.push(s);
    stagesByProject.set(s.project_id, list);
  }

  const projectMandors = (projectMandorsData || []) as Array<{
    project_id: string;
    mandor_id: string;
  }>;
  const mandorsByProject = new Map<string, string[]>();
  for (const pm of projectMandors) {
    const mandorName = profileMap.get(pm.mandor_id) || "Mandor";
    const list = mandorsByProject.get(pm.project_id) || [];
    list.push(mandorName);
    mandorsByProject.set(pm.project_id, list);
  }

  // User counts
  const totalUsers = profiles.length;
  const customerCount = profiles.filter((p) => p.role === "customer").length;
  const mandorCount = profiles.filter((p) => p.role === "mandor").length;
  const pengawasCount = profiles.filter((p) => p.role === "pengawas").length;

  // Project counts
  const activeProjects = projects.filter(
    (p) => !["draft", "selesai", "batal"].includes(p.status),
  );
  const berjalanCount = projects.filter((p) => p.status === "berjalan").length;
  const persiapanCount = Math.max(0, activeProjects.length - berjalanCount);

  const docVerifCount = projects.filter((p) =>
    ["verifikasi_dokumen", "revisi_dokumen"].includes(p.status),
  ).length;

  const completedCount = projects.filter((p) => p.status === "selesai").length;

  // Staff Availability
  const activeProjectSupervisorIds = new Set(
    activeProjects.map((p) => p.pengawas_id).filter(Boolean),
  );
  const availableSupervisorsCount = Math.max(
    0,
    pengawasCount - activeProjectSupervisorIds.size,
  );

  const mandorProfiles = (mandorProfilesData || []) as Array<{
    id: string;
    status: string;
  }>;
  const approvedMandorIds = new Set(
    mandorProfiles.filter((m) => m.status === "approved").map((m) => m.id),
  );
  const activeProjectMandorIds = new Set(
    projectMandors
      .filter((pm) => activeProjects.some((ap) => ap.id === pm.project_id))
      .map((pm) => pm.mandor_id),
  );
  const availableMandorsCount = Math.max(
    0,
    approvedMandorIds.size - activeProjectMandorIds.size,
  );

  // Revenue Trend (last 6 months)
  const now = new Date();
  const last6Months: Array<{ year: number; monthIndex: number; label: string }> =
    [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: MONTH_NAMES_SHORT[d.getMonth()],
    });
  }

  const monthlySums: number[] = last6Months.map(() => 0);
  let totalProjectValue = 0;

  for (const project of projects) {
    const val = Number(project.nilai_proyek ?? project.budget_proyek ?? 0);
    totalProjectValue += val;

    if (project.created_at) {
      const pDate = new Date(project.created_at);
      const pYear = pDate.getFullYear();
      const pMonth = pDate.getMonth();

      const idx = last6Months.findIndex(
        (m) => m.year === pYear && m.monthIndex === pMonth,
      );
      if (idx !== -1) {
        monthlySums[idx] += val;
      }
    }
  }

  const maxMonthlyVal = Math.max(...monthlySums, 0);
  const trendPoints: RevenueTrendPoint[] = last6Months.map((m, idx) => {
    const rawAmount = monthlySums[idx];
    const amount =
      maxMonthlyVal > 0 ? Math.round(15 + (rawAmount / maxMonthlyVal) * 70) : 25;
    return {
      month: m.label,
      amount,
      rawAmount,
    };
  });

  const prevMonthVal = monthlySums[4] || 0;
  const currMonthVal = monthlySums[5] || 0;
  let percentageChangeFormatted = "+0%";
  if (prevMonthVal > 0) {
    const change = ((currMonthVal - prevMonthVal) / prevMonthVal) * 100;
    const sign = change >= 0 ? "+" : "";
    percentageChangeFormatted = `${sign}${change.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  } else if (currMonthVal > 0) {
    percentageChangeFormatted = "+100%";
  }

  const monthRangeLabel = `${last6Months[0].label}–${last6Months[5].label}`;
  const totalValueFormatted = formatCurrencyCompact(totalProjectValue);

  // Metrics
  const metrics: AdminMetricItem[] = [
    {
      label: "Total pengguna",
      value: new Intl.NumberFormat("id-ID").format(totalUsers),
      detail: `${customerCount} customer · ${mandorCount} mandor · ${pengawasCount} pengawas`,
      icon: "users",
      tone: "blue",
    },
    {
      label: "Proyek aktif",
      value: new Intl.NumberFormat("id-ID").format(activeProjects.length),
      detail: `${berjalanCount} berjalan · ${persiapanCount} alokasi tim`,
      icon: "buildings",
      tone: "navy",
    },
    {
      label: "Verifikasi dokumen",
      value: new Intl.NumberFormat("id-ID").format(docVerifCount),
      detail: docVerifCount > 0 ? "Perlu ditinjau" : "Semua telah ditinjau",
      icon: "files",
      tone: "amber",
    },
    {
      label: "Proyek selesai",
      value: new Intl.NumberFormat("id-ID").format(completedCount),
      detail: "Selesai dibangun",
      icon: "check",
      tone: "green",
    },
  ];

  // Map projects for table
  const mappedProjects: AdminDashboardProject[] = projects.map((project) => {
    const shortId = `WH-${project.id.slice(0, 4).toUpperCase()}`;
    const supervisorName = project.pengawas_id
      ? profileMap.get(project.pengawas_id) || "Pengawas"
      : "Belum ditentukan";
    const assignedForemen = mandorsByProject.get(project.id);
    const foremanName =
      assignedForemen && assignedForemen.length > 0
        ? assignedForemen.join(", ")
        : "Belum ditentukan";

    let status: AdminProjectStatus = "Menunggu";
    if (project.status === "selesai") {
      status = "Selesai";
    } else if (project.status === "berjalan") {
      status = "Berjalan";
    }

    let progress: number | null = null;
    if (status === "Selesai") {
      progress = 100;
    } else if (status === "Berjalan") {
      const pStages = stagesByProject.get(project.id) || [];
      if (pStages.length > 0) {
        const totalProgress = pStages.reduce(
          (sum, s) => sum + (s.progress_percentage || 0),
          0,
        );
        progress = Math.round(totalProgress / pStages.length);
      } else {
        progress = 0;
      }
    }

    return {
      id: shortId,
      rawId: project.id,
      name: project.designs?.nama || "Proyek Pembangunan",
      customer: project.profiles?.full_name || "Customer",
      foreman: foremanName,
      supervisor: supervisorName,
      status,
      progress,
      category: project.designs?.gaya_arsitektur || "Konstruksi",
      budget: Number(project.nilai_proyek ?? project.budget_proyek ?? 0),
    };
  });

  const currentDateFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return {
    currentDateFormatted,
    metrics,
    activeProjectsCount: activeProjects.length,
    availableSupervisorsCount,
    availableMandorsCount,
    trend: {
      points: trendPoints,
      totalValueFormatted,
      percentageChangeFormatted,
      monthRangeLabel,
    },
    projects: mappedProjects,
  };
}
