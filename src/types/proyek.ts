import type {
  DocumentJenis,
  ProjectStatus as DBProjectStatus,
} from "./database.types";
import type { ProjectTracking } from "@/types/project-tracking";

export type DocumentStatus = "pending" | "revision" | "approved";

export type ContractStatus =
  | "belum_tersedia"
  | "menunggu"
  | "disetujui"
  | "ditolak"
  | "revisi"
  | "kedaluwarsa";

export type ProjectStatus =
  | "Verifikasi Dokumen"
  | "Revisi Dokumen"
  | "Alokasi Tim"
  | "Finalisasi Kontrak"
  | "Pembayaran DP"
  | "Proyek Aktif"
  | "Selesai"
  | "Dibatalkan";

export type DBProject = {
  id: string;
  customer_id: string;
  design_id: string;
  requirement_id: string | null;
  pengawas_id: string | null;
  status: DBProjectStatus;
  nilai_proyek: number | null;
  alamat_proyek: string | null;
  budget_proyek: number | null;
  created_at: string;
};

export type DBProjectDocument = {
  id: string;
  project_id: string;
  jenis_dokumen: DocumentJenis;
  nama_dokumen: string;
  url: string;
  uploaded_by: string;
  catatan: string | null;
  ukuran_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: "Mandor" | "Pengawas";
  phone: string;
  experience: string;
  projects: number;
};

export type Payment = {
  stageId?: string;
  periode: number;
  label: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: "lunas" | "menunggu" | "aktif" | "akan_datang";
};

export type Contract = {
  id: string;
  status: ContractStatus;
  version: number;
  issuedAt: string;
  deadlineAt: string;
  startAt?: string | null;
  estimatedCompletionAt?: string | null;
  rejectionReasons?: string[];
  adminNotes?: string;
  signedCustomerAt?: string | null;
  signedCustomerSignaturePath?: string | null;
  signedCustomerConsentAt?: string | null;
  signedPengawasAt?: string | null;
  signedPengawasSignaturePath?: string | null;
  documentVersion?: number;
  companySignatureLabel?: string;
};

export type Project = {
  id: string | number;
  type: string;
  designName: string;
  location: string;
  image: string;
  style: string;
  landArea: number;
  buildingArea: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  budget: number;
  estimatedCost?: number;
  customerName?: string;
  customerNik?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
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
  tracking?: ProjectTracking;
};
