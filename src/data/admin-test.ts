import type { VerificationRequest } from "@/data/admin-verification";
import type { MandorApplication } from "@/services/mandor-verification.service";
import type { AdminDashboardData } from "@/services/admin-dashboard.service";
import type { PengawasOption, ProjectForAdmin } from "@/services/allocation.service";

export const ADMIN_TEST_EMAIL = "admin-testing@way2home.test";
const VERSION = 2;
export type AdminTestState = {
  requests: VerificationRequest[];
  applications: MandorApplication[];
  projects: Array<ProjectForAdmin & { mandors: Array<{ id: string; full_name: string }>; value: number }>;
  supervisors: PengawasOption[];
  trend: AdminDashboardData["trend"];
};

const designs = [
  { name: "Griya Batik Bukit", style: "Tradisional Modern", land: 195, build: 90, floors: 1, beds: 2, duration: 6, cost: 522000000, image: "/images/katalog/house-dummy1.webp" },
  { name: "Griya Baru Lavender", style: "Tropis Modern", land: 95, build: 42, floors: 1, beds: 2, duration: 4, cost: 253000000, image: "/images/katalog/house-dummy1.webp" },
  { name: "Griya Birch Harmoni", style: "Skandinavia", land: 160, build: 179, floors: 2, beds: 4, duration: 10, cost: 1136000000, image: "/images/katalog/house-dummy1.webp" },
  { name: "Rumah Hening Permata", style: "Japandi", land: 215, build: 243, floors: 2, beds: 6, duration: 11, cost: 2026000000, image: "/images/katalog/house-dummy1.webp" },
];
const docs = [
  ["Sertifikat Tanah", "sertifikat-tanah-dummy.png", "image"],
  ["KTP Pemilik", "ktp-dummy.png", "image"],
  ["IMB/PBG", "imb-dummy.jpg", "image"],
  ["Surat Kuasa", "surat-kuasa-dummy.png", "image"],
] as const;
const applicants = [
  ["Robby Azwan", "robby.azwan@example.test", 0], ["Nadia Putri", "nadia.putri@example.test", 1], ["Dimas Pratama", "dimas.pratama@example.test", 2], ["Siti Rahmawati", "siti.rahmawati@example.test", 3],
] as const;
function createRequests(): VerificationRequest[] {
  return applicants.map(([applicant, email, index]) => {
    const design = designs[index];
    return { id: `ADM-WH-${2501 + index}`, applicant, email, submittedAt: `${10 + index} Okt 2026 · 09.30`, adminNote: "", budget: design.cost + 35000000, house: { slug: design.name.toLowerCase().replaceAll(" ", "-"), name: design.name, style: design.style, location: ["Bandung", "Bogor", "Depok", "Jakarta Selatan"][index], landArea: design.land, buildingArea: design.build, bedrooms: design.beds, bathrooms: Math.max(1, Math.round(design.beds / 2)), floors: design.floors, estimatedCost: design.cost, estimatedDuration: design.duration, description: `Rancangan ${design.style.toLowerCase()} dengan spesifikasi dummy untuk simulasi pemeriksaan admin.`, highlights: ["Struktur sesuai kebutuhan keluarga", "Tata ruang fungsional", "Finishing sesuai desain"], image: design.image }, documents: docs.map(([name, fileName, kind], j) => ({ id: `doc-${index + 1}-${j + 1}`, name, status: "Menunggu" as const, kind, fileName, dataUrl: `/test-assets/documents/${fileName}` })) };
  });
}
const names = ["Agus Santoso", "Bima Saputra", "Teguh Wibowo", "Rian Kurniawan"];
function createApplications(): MandorApplication[] {
  return names.map((name, i) => ({ id: `TEST-M-${i + 1}`, name, initials: name.split(" ").map((part) => part[0]).join(""), email: `${name.toLowerCase().replaceAll(" ", ".")}@example.test`, phone: `0812-9000-${1200 + i * 17}`, city: ["Jakarta Selatan", "Depok", "Bogor", "Tangerang"][i], expertise: ["Struktur & pondasi", "Atap & rangka", "Finishing interior", "Instalasi listrik"][i], skills: ["Pengecoran", "Pemasangan batu", "Manajemen tenaga"].join(", "), experience: 5 + i * 2, submitted: `${12 + i} Okt 2026, 10.30`, cvUrl: `/documents/cv-mandor-${["rizky", "siti", "fajar", "dewi"][i]}.pdf`, summary: "Calon mitra konstruksi dengan pengalaman proyek residensial dan referensi kerja yang dapat ditinjau.", projects: `${8 + i * 3} proyek rumah tinggal`, status: "pending", verificationNote: null }));
}
const supervisors: PengawasOption[] = [
  { id: "test-supervisor-1", full_name: "Rizky Mahendra", phone: "0812-1000-1001", spesialisasi: "Struktur dan fondasi", aktif: true, available: true },
  { id: "test-supervisor-2", full_name: "Maya Lestari", phone: "0812-1000-1002", spesialisasi: "Manajemen konstruksi", aktif: true, available: true },
  { id: "test-supervisor-3", full_name: "Fajar Nugraha", phone: "0812-1000-1003", spesialisasi: "Quality control", aktif: true, available: true },
  { id: "test-supervisor-4", full_name: "Nabila Putri", phone: "0812-1000-1004", spesialisasi: "Pengawasan struktur", aktif: true, available: true },
  { id: "test-supervisor-5", full_name: "Arif Wicaksono", phone: "0812-1000-1005", spesialisasi: "Finishing dan mutu", aktif: true, available: true },
];
function createProjects(): AdminTestState["projects"] {
  const projectStatuses = [
    "alokasi_mandor_pengawas",
    "alokasi_mandor_pengawas",
    "finalisasi_kontrak",
    "berjalan",
    "berjalan",
    "selesai",
  ];
  const projectMandors = [
    { id: "TEST-STAFF-M-1", full_name: "Hendra Saputra" },
    { id: "TEST-STAFF-M-2", full_name: "Doni Kurniawan" },
    { id: "TEST-STAFF-M-3", full_name: "Raka Permana" },
  ];

  return Array.from({ length: 6 }, (_, i) => {
    const design = designs[i % designs.length];
    const supervisorIndex =
      i === 2 ? 0 : i === 3 ? 1 : i === 4 ? 2 : i === 5 ? 0 : null;
    const assignedSupervisor =
      supervisorIndex === null ? null : supervisors[supervisorIndex];
    const mandors =
      i === 2 || i === 5
        ? [projectMandors[0]]
        : i === 3
          ? [projectMandors[1]]
          : i === 4
            ? [projectMandors[2]]
            : [];
    return {
      id: `TEST-PROJECT-${i + 1}`,
      status: projectStatuses[i],
      created_at: `2026-0${Math.min(i + 5, 9)}-0${i + 1}T09:00:00.000Z`,
      alamat_proyek: `${["Jl. Melati", "Jl. Anggrek", "Jl. Kenanga", "Jl. Merdeka", "Jl. Pahlawan", "Jl. Cendana"][i]} No. ${12 + i}, ${["Bandung", "Bogor", "Depok", "Jakarta Selatan", "Tangerang", "Bekasi"][i]}`,
      design_name: design.name,
      customer_name: applicants[i % applicants.length][0],
      pengawas_id: assignedSupervisor?.id ?? null,
      pengawas_name: assignedSupervisor?.full_name ?? null,
      customer_phone: "0812-0000-0000",
      mandors,
      value: design.cost,
    };
  });
}
function createTrend(): AdminDashboardData["trend"] {
  const months = ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"];
  const values = [0.28, 0.42, 0.36, 0.61, 0.76, 0.92];
  return { points: months.map((month, i) => ({ month, amount: values[i] * 90 + 12, rawAmount: values[i] * 520000000 })), totalValueFormatted: "Rp 2,41 M", percentageChangeFormatted: "+21,6%", monthRangeLabel: "Mei – Okt 2026" };
}
export function createAdminTestState(): AdminTestState {
  const projects = createProjects();
  const busySupervisorIds = new Set(
    projects
      .filter(
        (project) =>
          project.pengawas_id &&
          project.status !== "selesai" &&
          project.status !== "batal",
      )
      .map((project) => project.pengawas_id),
  );
  return {
    requests: createRequests(),
    applications: createApplications(),
    projects,
    supervisors: supervisors.map((item) => ({
      ...item,
      available: item.aktif && !busySupervisorIds.has(item.id),
    })),
    trend: createTrend(),
  };
}

function migrateAdminTestState(saved: AdminTestState): AdminTestState {
  const defaults = createAdminTestState();
  const savedRequests = Array.isArray(saved.requests) ? saved.requests : [];
  const savedApplications = Array.isArray(saved.applications)
    ? saved.applications
    : [];
  const savedProjects = Array.isArray(saved.projects) ? saved.projects : [];
  const requests = defaults.requests.map((request) => {
    const previous = savedRequests.find((item) => item.id === request.id);
    return previous
      ? {
          ...request,
          ...previous,
          house: {
            ...request.house,
            ...previous.house,
            image: request.house.image,
          },
        }
      : request;
  });
  const applications = defaults.applications.map((application) => {
    const previous = savedApplications.find(
      (item) => item.id === application.id,
    );
    return previous ? { ...application, ...previous } : application;
  });
  const projects = defaults.projects.map((project) => {
    const previous = savedProjects.find((item) => item.id === project.id);
    if (!previous) return project;
    const supervisorId = previous.pengawas_id ?? project.pengawas_id;
    const assignedSupervisor = defaults.supervisors.find(
      (item) => item.id === supervisorId,
    );
    return {
      ...project,
      ...previous,
      pengawas_id: supervisorId,
      pengawas_name:
        previous.pengawas_name ??
        assignedSupervisor?.full_name ??
        project.pengawas_name,
      mandors:
        previous.mandors?.length > 0 ? previous.mandors : project.mandors,
    };
  });
  const busySupervisorIds = new Set(
    projects
      .filter(
        (project) =>
          project.pengawas_id &&
          project.status !== "selesai" &&
          project.status !== "batal",
      )
      .map((project) => project.pengawas_id),
  );
  return {
    ...defaults,
    requests,
    applications,
    projects,
    supervisors: defaults.supervisors.map((item) => ({
      ...item,
      available: item.aktif && !busySupervisorIds.has(item.id),
    })),
    trend: saved.trend ?? defaults.trend,
  };
}
const storageKey = (userId: string) => `way2home-admin-test:${userId}`;
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, AdminTestState>();
export function isAdminTestAccount(email: string | null | undefined, flag: boolean) { return !!flag && email?.toLowerCase() === ADMIN_TEST_EMAIL; }
export function loadAdminTestState(userId: string): AdminTestState {
  if (typeof window === "undefined") return createAdminTestState();
  if (!cache.has(userId)) {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      const parsed = raw
        ? (JSON.parse(raw) as { version?: number; state?: AdminTestState })
        : null;
      if (parsed?.version === VERSION && parsed.state) {
        cache.set(userId, parsed.state);
      } else if (parsed?.version === 1 && parsed.state) {
        const migrated = migrateAdminTestState(parsed.state);
        cache.set(userId, migrated);
        try {
          localStorage.setItem(
            storageKey(userId),
            JSON.stringify({ version: VERSION, state: migrated }),
          );
        } catch (error) {
          console.warn("Tidak dapat menyimpan migrasi state testing admin.", error);
        }
      } else {
        cache.set(userId, createAdminTestState());
      }
    } catch (error) {
      console.warn("Tidak dapat membaca state testing admin lokal.", error);
      cache.set(userId, createAdminTestState());
    }
  }
  return cache.get(userId)!;
}
export function saveAdminTestState(userId: string, state: AdminTestState) { cache.set(userId, state); if (typeof window !== "undefined") localStorage.setItem(storageKey(userId), JSON.stringify({ version: VERSION, state })); listeners.get(userId)?.forEach((listener) => listener()); }
export function subscribeAdminTestState(userId: string, listener: () => void) { const group = listeners.get(userId) ?? new Set(); group.add(listener); listeners.set(userId, group); return () => group.delete(listener); }
export function resetAdminTestState(userId: string) { const state = createAdminTestState(); saveAdminTestState(userId, state); return state; }
export function assignAdminTestSupervisor(
  state: AdminTestState,
  projectId: string,
  supervisorId: string,
): AdminTestState {
  const project = state.projects.find((item) => item.id === projectId);
  const supervisor = state.supervisors.find((item) => item.id === supervisorId);
  if (
    !project ||
    project.pengawas_id !== null ||
    project.status !== "alokasi_mandor_pengawas" ||
    !supervisor?.aktif ||
    !supervisor.available
  ) {
    return state;
  }

  const projects = state.projects.map((item) =>
    item.id === projectId
      ? {
          ...item,
          pengawas_id: supervisor.id,
          pengawas_name: supervisor.full_name,
        }
      : item,
  );
  const busySupervisorIds = new Set(
    projects
      .filter(
        (item) =>
          item.pengawas_id &&
          item.status !== "selesai" &&
          item.status !== "batal",
      )
      .map((item) => item.pengawas_id),
  );
  return {
    ...state,
    projects,
    supervisors: state.supervisors.map((item) => ({
      ...item,
      available: item.aktif && !busySupervisorIds.has(item.id),
    })),
  };
}
export function adminTestDashboard(state: AdminTestState): AdminDashboardData {
  const applicants = new Set(state.requests.filter((r) => r.documents.some((d) => d.status === "Menunggu")).map((r) => r.applicant));
  const waitingMandors = state.applications.filter((a) => a.status === "pending").length;
  const projects = state.projects.map((p, i) => ({ id: `#${String(i + 1).padStart(4, "0")}`, rawId: p.id, name: p.design_name, customer: p.customer_name, foreman: p.mandors.map((m) => m.full_name).join(", ") || "Belum ditentukan", supervisor: p.pengawas_name ?? "Belum dialokasikan", status: p.status === "selesai" ? "Selesai" as const : p.status === "berjalan" ? "Berjalan" as const : "Menunggu" as const, progress: p.status === "selesai" ? 100 : p.status === "berjalan" ? 45 + i * 7 : null, category: "Bangun rumah", budget: designs[i % designs.length].cost }));
  const totalUsers = 48 + state.applications.filter((a) => a.status === "approved").length;
  const fmt = (n: number) => `Rp ${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 0 })} jt`;
  return { currentDateFormatted: new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()), metrics: [{ label: "Total pengguna", value: String(totalUsers), detail: "Customer, mandor, pengawas", icon: "users", tone: "blue" }, { label: "Proyek aktif", value: String(state.projects.filter((p) => p.status === "berjalan").length), detail: "Sedang dikerjakan", icon: "buildings", tone: "navy" }, { label: "Verifikasi dokumen", value: String(applicants.size), detail: `${waitingMandors} mandor menunggu verifikasi`, icon: "files", tone: "amber" }, { label: "Proyek selesai", value: String(state.projects.filter((p) => p.status === "selesai").length), detail: "Sepanjang waktu", icon: "check", tone: "green" }], activeProjectsCount: state.projects.filter((p) => p.status === "berjalan").length, availableSupervisorsCount: state.supervisors.filter((item) => item.aktif && item.available).length, availableMandorsCount: state.applications.filter((a) => a.status === "approved").length, trend: { ...state.trend, totalValueFormatted: fmt(state.projects.reduce((sum, p) => sum + (p.value ?? 0), 0)) }, projects };
}
export function adminTestBadgeCounts(state: AdminTestState) { return { documentVerifications: new Set(state.requests.filter((r) => r.documents.some((d) => d.status === "Menunggu")).map((r) => r.id)).size, mandorVerifications: state.applications.filter((a) => a.status === "pending").length, supervisorAllocations: state.projects.filter((p) => p.status === "alokasi_mandor_pengawas" && !p.pengawas_id).length }; }
