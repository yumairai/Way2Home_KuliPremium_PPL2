import type { MandorIssueReport } from "./mandor";

export type SupervisorProjectStatus =
  "Berjalan" | "Perlu perhatian" | "Selesai";
export type SupervisorMilestone = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "Selesai" | "Berjalan" | "Menunggu";
  progress: number;
};
export type SupervisorTask = {
  id: string;
  milestoneId: string;
  title: string;
  done: boolean;
};
export type SupervisorReport = {
  id: string;
  foreman: string;
  milestoneId: string;
  title: string;
  subtaskTitle: string;
  note: string;
  submitted: string;
  progress: number;
  decision: "Menunggu" | "Disetujui" | "Perlu revisi";
  photo: string | null;
  weight: number;
};
export type SupervisorIssue = {
  id: string;
  title: string;
  description: string;
  priority: "Tinggi" | "Sedang";
  state: "Baru" | "Ditindaklanjuti";
  reportDate: string;
  followUp: string;
};
export type IssueDiscussionEntry = {
  id: string;
  author: "Pengawas" | "Customer";
  message: string;
  date: string;
};

/**
 * Penanganan kendala (tabel `issue_resolutions`).
 * Jembatan alur: Pengawas menetapkan solusi -> customer memberi keputusan
 * (saat ini masih simulasi di halaman pengawas) -> instruksi diteruskan ke mandor.
 */
export type IssueResolution = {
  id: string;
  projectId: string;
  issueId: string;
  solution: string;
  source: "Pengawas" | "Analisis AI";
  aiAnalysis: {
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
  discussion: IssueDiscussionEntry[];
  submitted: string;
};

export type SupervisorForemanNote = {
  id: string;
  foreman: string;
  note: string;
  submitted: string;
};

export type SupervisorProject = {
  id: string;
  title: string;
  customer: string;
  customerPhone: string;
  design: string;
  category: string;
  address: string;
  status: SupervisorProjectStatus;
  progress: number;
  deadline: string;
  started: string;
  value: number;
  supervisor: string;
  foreman: string | null;
  foremen?: string[];
  needs: string;
  specifications: string[];
  contractId: string;
  milestones: SupervisorMilestone[];
  tasks: SupervisorTask[];
  reports: SupervisorReport[];
  issues: SupervisorIssue[];
  customerUpdates: { id: string; date: string; message: string }[];
  documentation: { id: string; date: string; caption: string; image: string }[];
  payments: {
    id: string;
    stage: string;
    amount: number;
    status: "Lunas" | "Menunggu" | "Belum jatuh tempo";
    dueDate: string;
  }[];
  /**
   * Diisi backend (supervisor.service) ketika detail proyek dibaca dari
   * Supabase. Data contoh statis tidak mengisinya.
   */
  issueReports?: MandorIssueReport[];
  resolutions?: IssueResolution[];
  foremanNotes?: SupervisorForemanNote[];
};
export type VerifiedForeman = {
  id: string;
  name: string;
  specialties: string[];
  experience: number;
  area: string;
  portfolio: string;
  phone: string;
  verified: boolean;
};

/**
 * Daftar mandor terverifikasi untuk dialog penugasan cepat di halaman detail.
 * Penugasan mandor yang sebenarnya dikelola dari dashboard pengawas
 * melalui `allocation.service` (tabel `project_mandors`).
 */
export const verifiedForemen: VerifiedForeman[] = [
  {
    id: "M-012",
    name: "Agus Santoso",
    specialties: ["Struktur", "Pondasi"],
    experience: 9,
    area: "Jakarta Selatan",
    portfolio: "12 proyek rumah tinggal",
    phone: "+62 812-9000-1201",
    verified: true,
  },
  {
    id: "M-018",
    name: "Bima Saputra",
    specialties: ["Pembangunan rumah", "Struktur"],
    experience: 7,
    area: "Jakarta Selatan · Depok",
    portfolio: "9 proyek rumah tinggal",
    phone: "+62 812-9000-1802",
    verified: true,
  },
  {
    id: "M-024",
    name: "Teguh Wibowo",
    specialties: ["Finishing", "Struktur"],
    experience: 11,
    area: "Depok · Bogor",
    portfolio: "18 proyek rumah tinggal",
    phone: "+62 812-9000-2403",
    verified: true,
  },
  {
    id: "M-029",
    name: "Dedi Kurniawan",
    specialties: ["Pondasi", "Pembangunan rumah"],
    experience: 6,
    area: "Jakarta · Bekasi",
    portfolio: "7 proyek rumah tinggal",
    phone: "+62 812-9000-2904",
    verified: true,
  },
];
