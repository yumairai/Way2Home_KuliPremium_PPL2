import type { MandorIssueReport } from "@/data/mandor";
import { useSyncExternalStore } from "react";

export type SyncedReport = {
  id: string;
  projectId: string;
  foreman: string;
  milestoneId: string;
  milestoneTitle: string;
  subtaskTitle: string;
  note: string;
  photo: string | null;
  submitted: string;
  decision: "Menunggu" | "Disetujui" | "Perlu revisi";
  weight: number;
};

export type ForemanNote = {
  id: string;
  projectId: string;
  foreman: string;
  note: string;
  submitted: string;
};

export type DocumentationItem = {
  id: string;
  projectId: string;
  date: string;
  caption: string;
  image: string;
};

export type ApprovedSubtask = {
  projectId: string;
  milestoneId: string;
  subtaskTitle: string;
};

export type IssueResolution = {
  id: string;
  projectId: string;
  issueId: string;
  solution: string;
  source: "Pengawas" | "Analisis AI";
  aiAnalysis?: {
    summary: string;
    options: string[];
    selectedOption: number | null;
  } | null;
  status:
    | "Menunggu approval customer"
    | "Diskusi dengan pengawas"
    | "Ditindaklanjuti";
  requiresCustomerApproval: boolean;
  approvalReason: string;
  approvalEvidence: string | null;
  customerFeedback: string;
  discussion: {
    id: string;
    author: "Pengawas" | "Customer";
    message: string;
    date: string;
  }[];
  submitted: string;
};

type ProjectSyncState = {
  reports: SyncedReport[];
  issues: MandorIssueReport[];
  resolutions: IssueResolution[];
  notes: ForemanNote[];
  documentation: DocumentationItem[];
  approvedSubtasks: ApprovedSubtask[];
};

const EVENT_NAME = "way2home-project-sync";
const STORAGE_KEY = "way2home-project-sync";

const seedNotes: ForemanNote[] = [
  {
    id: "CN-2408-01",
    projectId: "WH-2408",
    foreman: "Bima Saputra",
    note: "Arahan dimensi balok sudah diterima tim. Pemeriksaan sebelum pengecoran berikutnya akan kami dokumentasikan.",
    submitted: "13 Okt 2026, 09.40",
  },
];

const seedReports: SyncedReport[] = [
  {
    id: "PR-2408-02",
    projectId: "WH-2408",
    foreman: "Bima Saputra",
    milestoneId: "m2",
    milestoneTitle: "Pekerjaan Struktur Utama",
    subtaskTitle: "Pengerjaan Balok",
    note: "Pengecoran balok lantai selesai. Hasil pemeriksaan awal sesuai spesifikasi struktur.",
    photo: null,
    submitted: "15 Okt 2026, 08.35",
    decision: "Menunggu",
    weight: 5,
  },
  {
    id: "PR-2408-01",
    projectId: "WH-2408",
    foreman: "Bima Saputra",
    milestoneId: "m2",
    milestoneTitle: "Pekerjaan Struktur Utama",
    subtaskTitle: "Pengerjaan Kolom (Tiang)",
    note: "Pemasangan kolom utama selesai dan sudah dilakukan pengecekan tegak lurus.",
    photo: null,
    submitted: "12 Okt 2026, 15.10",
    decision: "Disetujui",
    weight: 5,
  },
  {
    id: "PR-2431-01",
    projectId: "WH-2431",
    foreman: "Bima Saputra",
    milestoneId: "m1",
    milestoneTitle: "Pekerjaan Persiapan & Fondasi",
    subtaskTitle: "Pengecoran Fondasi & Sloof",
    note: "Pekerjaan pondasi berjalan, pemeriksaan elevasi dijadwalkan sebelum pengecoran sloof.",
    photo: null,
    submitted: "14 Okt 2026, 16.20",
    decision: "Perlu revisi",
    weight: 3.75,
  },
];

const seedApproved: ApprovedSubtask[] = [
  {
    projectId: "WH-2408",
    milestoneId: "m2",
    subtaskTitle: "Pengerjaan Kolom (Tiang)",
  },
];

const seedIssues: MandorIssueReport[] = [
  {
    id: "KN-2408-01",
    projectId: "WH-2408",
    category: "MATERIAL_PERALATAN",
    categoryLabel: "Material dan peralatan",
    description:
      "Material besi untuk balok lantai belum tiba sesuai jadwal pemasok sehingga pengecoran tahap berikutnya berisiko tertunda.",
    affectedMilestoneId: "m2",
    affectedMilestoneTitle: "Pekerjaan Struktur Utama",
    affectedSubtaskId: "s6",
    affectedSubtaskTitle: "Pengerjaan Balok",
    workCondition: "TERHAMBAT_SEBAGIAN",
    estimatedDelayDays: 3,
    additionalInfo:
      "Pemasok sudah dihubungi dan mengonfirmasi pengiriman ulang dijadwalkan 17 Okt 2026. Material di lapangan tidak mencukupi untuk melanjutkan pengecoran balok barat.",
    attachment: null,
    attachmentName: "",
    submitted: "14 Okt 2026",
    status: "Ditindaklanjuti",
    followUp:
      "Pengawas mengoordinasikan jadwal pengiriman baru dengan pemasok dan memerintahkan tim mengerjakan bagian yang tidak terdampak.",
  },
  {
    id: "KN-2408-02",
    projectId: "WH-2408",
    category: "DESAIN_SPESIFIKASI",
    categoryLabel: "Desain dan spesifikasi",
    description:
      "Dimensi balok di gambar kerja tidak sesuai dengan gambar struktur yang diterima mandor. Perbedaan lebar 5 cm berpotensi mempengaruhi kapasitas tulangan.",
    affectedMilestoneId: "m2",
    affectedMilestoneTitle: "Pekerjaan Struktur Utama",
    affectedSubtaskId: "s6",
    affectedSubtaskTitle: "Pengerjaan Balok",
    workCondition: "BERHENTI",
    estimatedDelayDays: 2,
    additionalInfo:
      "Tim sudah menghentikan pekerjaan pada balok yang bermasalah sambil menunggu klarifikasi dari perencana. Foto gambar kerja terlampir.",
    attachment: null,
    attachmentName: "",
    submitted: "16 Okt 2026",
    status: "Menunggu",
    followUp: "",
  },
];

function loadInitial(): ProjectSyncState {
  if (typeof window === "undefined") {
    return {
      reports: seedReports,
      issues: seedIssues,
      resolutions: [],
      notes: seedNotes,
      documentation: [],
      approvedSubtasks: seedApproved,
    };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProjectSyncState>;
      return {
        reports: Array.isArray(parsed.reports) ? parsed.reports : seedReports,
        issues: Array.isArray(parsed.issues) ? parsed.issues : seedIssues,
        resolutions: Array.isArray(parsed.resolutions)
          ? parsed.resolutions
          : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : seedNotes,
        documentation: Array.isArray(parsed.documentation)
          ? parsed.documentation
          : [],
        approvedSubtasks: Array.isArray(parsed.approvedSubtasks)
          ? parsed.approvedSubtasks
          : seedApproved,
      };
    }
  } catch {
    // storage kosong atau rusak — mulai dari kondisi awal
  }
  return {
    reports: seedReports,
    issues: seedIssues,
    resolutions: [],
    notes: seedNotes,
    documentation: [],
    approvedSubtasks: seedApproved,
  };
}

let state: ProjectSyncState = loadInitial();

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

function snapshot(): ProjectSyncState {
  return state;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // foto terlalu besar — biarkan state tetap hidup di memori selama sesi
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useProjectSync() {
  return useSyncExternalStore(subscribe, snapshot, getServerSnapshot);
}

const serverState: ProjectSyncState = {
  reports: seedReports,
  issues: [],
  resolutions: [],
  notes: seedNotes,
  documentation: [],
  approvedSubtasks: seedApproved,
};

function getServerSnapshot(): ProjectSyncState {
  return serverState;
}

export function addSyncedReport(report: SyncedReport) {
  const approvedSubtasks =
    report.decision === "Disetujui" &&
    !state.approvedSubtasks.some(
      (item) =>
        item.projectId === report.projectId &&
        item.milestoneId === report.milestoneId &&
        item.subtaskTitle === report.subtaskTitle,
    )
      ? [
          ...state.approvedSubtasks,
          {
            projectId: report.projectId,
            milestoneId: report.milestoneId,
            subtaskTitle: report.subtaskTitle,
          },
        ]
      : state.approvedSubtasks;
  state = {
    ...state,
    reports: [report, ...state.reports],
    approvedSubtasks,
  };
  persist();
  emit();
}

export function updateSyncedReportDecision(
  id: string,
  decision: SyncedReport["decision"],
) {
  const report = state.reports.find((item) => item.id === id);
  const approvedSubtasks =
    decision === "Disetujui" && report
      ? state.approvedSubtasks.some(
          (item) =>
            item.projectId === report.projectId &&
            item.milestoneId === report.milestoneId &&
            item.subtaskTitle === report.subtaskTitle,
        )
        ? state.approvedSubtasks
        : [
            ...state.approvedSubtasks,
            {
              projectId: report.projectId,
              milestoneId: report.milestoneId,
              subtaskTitle: report.subtaskTitle,
            },
          ]
      : state.approvedSubtasks;
  state = {
    ...state,
    reports: state.reports.map((item) =>
      item.id === id ? { ...item, decision } : item,
    ),
    approvedSubtasks,
  };
  persist();
  emit();
}

export function addIssueReport(issue: MandorIssueReport) {
  state = {
    ...state,
    issues: [issue, ...state.issues.filter((item) => item.id !== issue.id)],
  };
  persist();
  emit();
}

export function updateIssueReport(issue: MandorIssueReport) {
  state = {
    ...state,
    issues: state.issues.map((item) => (item.id === issue.id ? issue : item)),
  };
  persist();
  emit();
}

export function persistIssueFollowUp(issueId: string, followUp: string) {
  const existing = state.issues.find((item) => item.id === issueId);
  if (existing) {
    updateIssueReport({ ...existing, status: "Ditindaklanjuti", followUp });
    return;
  }

  const seeded = seedIssues.find((item) => item.id === issueId);
  if (seeded)
    updateIssueReport({ ...seeded, status: "Ditindaklanjuti", followUp });
}

export function addIssueResolution(resolution: IssueResolution) {
  state = {
    ...state,
    resolutions: [
      resolution,
      ...state.resolutions.filter((item) => item.id !== resolution.id),
    ],
  };
  persist();
  emit();
}

export function updateIssueResolution(resolution: IssueResolution) {
  state = {
    ...state,
    resolutions: state.resolutions.map((item) =>
      item.id === resolution.id ? resolution : item,
    ),
  };
  persist();
  emit();
}

export function addForemanNote(note: ForemanNote) {
  state = { ...state, notes: [note, ...state.notes] };
  persist();
  emit();
}

export function addDocumentationItem(item: DocumentationItem) {
  state = { ...state, documentation: [item, ...state.documentation] };
  persist();
  emit();
}

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(reader.result as string);
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}
