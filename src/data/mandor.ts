/**
 * data/mandor.ts
 *
 * Kontrak tampilan (shape) untuk area Mandor. Seluruh nilai di bawah ini
 * sekarang diisi oleh backend (`mandor.service.ts` -> /api/mandor/*),
 * sehingga tidak ada lagi data proyek contoh yang disimpan di client.
 */

export type MandorRegistrationStatus = "Menunggu" | "Disetujui" | "Ditolak";
export type MandorSubtask = {
  id: string;
  title: string;
  weight: number;
  done: boolean;
};
export type MandorMilestone = {
  id: string;
  title: string;
  target: string;
  weight: number;
  subtasks: MandorSubtask[];
};
export type MandorProgressReport = {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  subtaskTitle: string;
  note: string;
  photo: string | null;
  submitted: string;
  review: "Menunggu" | "Disetujui" | "Perlu revisi";
  feedback: string;
  weight: number;
};
export type MandorIssueCategory =
  | "CUACA_LINGKUNGAN"
  | "MATERIAL_PERALATAN"
  | "TENAGA_KERJA"
  | "TEKNIS_KONSTRUKSI"
  | "DESAIN_SPESIFIKASI"
  | "ANGGARAN_PENGADAAN"
  | "PERIZINAN_EKSTERNAL"
  | "LAINNYA";
export type MandorIssueCondition =
  "BERJALAN" | "TERHAMBAT_SEBAGIAN" | "BERHENTI";
export type MandorIssueReport = {
  id: string;
  projectId: string;
  category: MandorIssueCategory;
  categoryLabel: string;
  description: string;
  affectedMilestoneId: string;
  affectedMilestoneTitle: string;
  affectedSubtaskId: string;
  affectedSubtaskTitle: string;
  workCondition: MandorIssueCondition;
  estimatedDelayDays: number;
  additionalInfo: string;
  attachment: string | null;
  attachmentName: string;
  submitted: string;
  status: "Menunggu" | "Ditindaklanjuti" | "Selesai";
  followUp: string;
};
export type MandorForemanNote = {
  id: string;
  projectId: string;
  note: string;
  submitted: string;
};
export type MandorProject = {
  id: string;
  title: string;
  design: string;
  location: string;
  assignedAt: string;
  target: string;
  overallProgress: number;
  currentMilestone: string;
  supervisor: string;
  supervisorNote: string;
  image: string;
  scope: string[];
  milestones: MandorMilestone[];
  progressReports: MandorProgressReport[];
  issueReports: MandorIssueReport[];
  notes: MandorForemanNote[];
};

/**
 * Isian awal formulir pendaftaran mandor. Dipakai sebagai default ketika
 * belum ada profil tersimpan; status verifikasinya sendiri selalu dibaca
 * dari `mandor_profiles` lewat /api/mandor/registration.
 */
export const initialMandorRegistration = {
  status: "Disetujui" as MandorRegistrationStatus,
  rejectionReason:
    "CV belum mencantumkan proyek dan pengalaman kerja secara rinci.",
  name: "Bima Saputra",
  email: "bima.saputra@mail.id",
  phone: "0812 6677 2041",
  expertise: "Pembangunan rumah",
  experience: "7",
  area: "Jakarta Selatan",
  experienceSummary:
    "Berpengalaman mengelola pekerjaan pembangunan rumah tinggal, mengatur tim lapangan, serta memastikan pekerjaan sesuai gambar dan target mutu.",
  previousProjects:
    "Pembangunan rumah tinggal dua lantai di Cilandak; pekerjaan struktur dan finishing rumah di Jagakarsa.",
  cv: "/documents/cv-mandor-rizky.pdf",
};
