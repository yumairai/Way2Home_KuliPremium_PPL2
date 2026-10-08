export type DocumentStatus = "pending" | "revision" | "approved";

export type ContractStatus =
  | "menunggu"
  | "disetujui"
  | "ditolak"
  | "revisi"
  | "kedaluwarsa";

export type ProjectStatus =
  | "Menunggu Verifikasi"
  | "Revisi Dokumen"
  | "Alokasi Tim"
  | "Kontrak Proyek"
  | "Pembayaran DP"
  | "Proyek Aktif"
  | "Selesai"
  | "Dibatalkan";

export type TeamMember = {
  id: string;
  name: string;
  role: "Mandor" | "Pengawas";
  phone: string;
  experience: string;
  projects: number;
};

export type Payment = {
  periode: number;
  label: string;
  amount: number;
  dueDate: string;
  status: "lunas" | "menunggu" | "aktif" | "akan_datang";
};

export type Contract = {
  id: string;
  status: ContractStatus;
  version: number;
  issuedAt: string;
  deadlineAt: string;
  rejectionReasons?: string[];
  adminNotes?: string;
};

export type Project = {
  id: number;
  type: string;
  designName: string;
  location: string;
  image: string;
  style: string;
  landArea: number;
  buildingArea: number;
  budget: number;
  duration: number;
  address: string;
  submittedAt: string;
  status: ProjectStatus;
  documentStatus: DocumentStatus;
  adminNote?: string;
  team: TeamMember[];
  contract: Contract;
  payments: Payment[];
  scope: string[];
  activePeriod?: number;
};
