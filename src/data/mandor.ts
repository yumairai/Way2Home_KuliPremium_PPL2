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

const MILESTONE_TITLES: Record<string, string> = {
  m1: "Pekerjaan Persiapan & Fondasi",
  m2: "Pekerjaan Struktur Utama",
  m3: "Pekerjaan Dinding & Penutup Atap",
  m4: "Instalasi Jalur MEP",
  m5: "Pekerjaan Finishing",
  m6: "Lingkungan Luar & Serah Terima",
};

const SUBTASK_DEFS: {
  id: string;
  milestoneId: string;
  title: string;
  weight: number;
}[] = [
  { id: "s1", milestoneId: "m1", title: "Pembersihan Lahan", weight: 3.75 },
  { id: "s2", milestoneId: "m1", title: "Pengukuran (Bowplank)", weight: 3.75 },
  { id: "s3", milestoneId: "m1", title: "Galian Tanah", weight: 3.75 },
  {
    id: "s4",
    milestoneId: "m1",
    title: "Pengecoran Fondasi & Sloof",
    weight: 3.75,
  },
  { id: "s5", milestoneId: "m2", title: "Pengerjaan Kolom (Tiang)", weight: 5 },
  { id: "s6", milestoneId: "m2", title: "Pengerjaan Balok", weight: 5 },
  {
    id: "s7",
    milestoneId: "m2",
    title: "Pelat Lantai (Jika 2 lantai)",
    weight: 5,
  },
  { id: "s8", milestoneId: "m2", title: "Rangka Atap", weight: 5 },
  { id: "s9", milestoneId: "m3", title: "Pemasangan Bata", weight: 5 },
  { id: "s10", milestoneId: "m3", title: "Plesteran Awal", weight: 5 },
  { id: "s11", milestoneId: "m3", title: "Pengerjaan Kusen", weight: 5 },
  {
    id: "s12",
    milestoneId: "m3",
    title: "Pemasangan Genteng / Atap",
    weight: 5,
  },
  {
    id: "s13",
    milestoneId: "m4",
    title: "Penanaman Pipa Air Bersih & Kotor",
    weight: 5,
  },
  {
    id: "s14",
    milestoneId: "m4",
    title: "Pipa Kabel Listrik Dinding",
    weight: 5,
  },
  { id: "s15", milestoneId: "m4", title: "Pembuatan Septic Tank", weight: 5 },
  { id: "s16", milestoneId: "m5", title: "Acian Dinding", weight: 4 },
  {
    id: "s17",
    milestoneId: "m5",
    title: "Pemasangan Keramik / Granit",
    weight: 4,
  },
  { id: "s18", milestoneId: "m5", title: "Pemasangan Plafon", weight: 4 },
  {
    id: "s19",
    milestoneId: "m5",
    title: "Pengecatan Interior & Eksterior",
    weight: 4,
  },
  {
    id: "s20",
    milestoneId: "m5",
    title: "Pemasangan Lampu, Keran & Sanitari",
    weight: 4,
  },
  {
    id: "s21",
    milestoneId: "m6",
    title: "Pengerjaan Pagar & Carport",
    weight: 2.5,
  },
  { id: "s22", milestoneId: "m6", title: "Pembuatan Taman", weight: 2.5 },
  {
    id: "s23",
    milestoneId: "m6",
    title: "Pembersihan Total (Final Cleaning)",
    weight: 2.5,
  },
  {
    id: "s24",
    milestoneId: "m6",
    title: "Inspeksi Komplain (Punch List) & Penyerahan Kunci",
    weight: 2.5,
  },
];

function buildMilestones(
  targets: Record<string, string>,
  done: Record<string, boolean>,
): MandorMilestone[] {
  return Object.entries(MILESTONE_TITLES).map(([id, title]) => ({
    id,
    title,
    target: targets[id],
    weight: SUBTASK_DEFS.filter((item) => item.milestoneId === id).reduce(
      (sum, item) => sum + item.weight,
      0,
    ),
    subtasks: SUBTASK_DEFS.filter((item) => item.milestoneId === id).map(
      (item) => ({ ...item, done: done[item.id] ?? false }),
    ),
  }));
}

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

export const mandorProjects: MandorProject[] = [
  {
    id: "WH-2408",
    title: "Rumah Tumbuh Cilandak",
    design: "Arunika · Japandi",
    location: "Jl. Cilandak Tengah, Jakarta Selatan",
    assignedAt: "2 Sep 2026",
    target: "15 Des 2026",
    overallProgress: 20,
    currentMilestone: "Pekerjaan Struktur Utama",
    supervisor: "Rizky Ramadhan",
    supervisorNote:
      "Pastikan dimensi balok sesuai gambar struktur dan dokumentasikan pemeriksaan sebelum pengecoran berikutnya.",
    image: "/images/katalog/house-dummy1.webp",
    scope: [
      "Pembersihan dan pengukuran lahan",
      "Pekerjaan pondasi dan struktur utama",
      "Pemasangan dinding dan atap",
      "Pekerjaan finishing sesuai desain",
    ],
    milestones: buildMilestones(
      {
        m1: "18 Sep 2026",
        m2: "20 Okt 2026",
        m3: "4 Nov 2026",
        m4: "15 Nov 2026",
        m5: "28 Nov 2026",
        m6: "15 Des 2026",
      },
      { s1: true, s2: true, s3: true, s4: true, s5: true, s6: false },
    ),
    progressReports: [
      {
        id: "PR-2408-02",
        milestoneId: "m2",
        milestoneTitle: "Pekerjaan Struktur Utama",
        subtaskTitle: "Pengerjaan Balok",
        note: "Pengecoran balok lantai selesai. Hasil pemeriksaan awal sesuai spesifikasi struktur.",
        photo: null,
        submitted: "15 Okt 2026, 08.35",
        review: "Menunggu",
        feedback: "",
        weight: 5,
      },
      {
        id: "PR-2408-01",
        milestoneId: "m2",
        milestoneTitle: "Pekerjaan Struktur Utama",
        subtaskTitle: "Pengerjaan Kolom (Tiang)",
        note: "Pemasangan kolom utama selesai dan sudah dilakukan pengecekan tegak lurus.",
        photo: null,
        submitted: "12 Okt 2026, 15.10",
        review: "Disetujui",
        feedback: "Pekerjaan dapat dilanjutkan ke pengecoran balok lantai.",
        weight: 5,
      },
    ],
    issueReports: [
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
        additionalInfo: "Pemasok sedang mengonfirmasi jadwal pengiriman baru.",
        attachment: null,
        attachmentName: "",
        submitted: "14 Okt 2026",
        status: "Ditindaklanjuti",
        followUp:
          "Pengawas mengoordinasikan jadwal pengiriman baru dengan pemasok.",
      },
    ],
    notes: [
      {
        id: "CN-2408-01",
        projectId: "WH-2408",
        note: "Arahan dimensi balok sudah diterima tim. Pemeriksaan sebelum pengecoran berikutnya akan kami dokumentasikan.",
        submitted: "13 Okt 2026, 09.40",
      },
    ],
  },
  {
    id: "WH-2431",
    title: "Hunian Keluarga Jagakarsa",
    design: "Nawasena · Modern Tropis",
    location: "Jl. Moh. Kahfi I, Jakarta Selatan",
    assignedAt: "28 Sep 2026",
    target: "20 Jan 2027",
    overallProgress: 32,
    currentMilestone: "Pekerjaan Persiapan & Fondasi",
    supervisor: "Rizky Ramadhan",
    supervisorNote:
      "Periksa kembali elevasi pondasi sebelum pekerjaan sloof dimulai.",
    image: "/images/katalog/house-dummy1.webp",
    scope: [
      "Persiapan dan pengukuran lahan",
      "Pekerjaan pondasi dan sloof",
      "Struktur bangunan satu lantai",
      "Pekerjaan finishing rumah tinggal",
    ],
    milestones: buildMilestones(
      {
        m1: "8 Okt 2026",
        m2: "30 Okt 2026",
        m3: "28 Nov 2026",
        m4: "12 Des 2026",
        m5: "5 Jan 2027",
        m6: "20 Jan 2027",
      },
      { s1: true, s2: true, s3: true },
    ),
    progressReports: [
      {
        id: "PR-2431-01",
        milestoneId: "m1",
        milestoneTitle: "Pekerjaan Persiapan & Fondasi",
        subtaskTitle: "Pengecoran Fondasi & Sloof",
        note: "Pekerjaan pondasi berjalan, pemeriksaan elevasi dijadwalkan sebelum pengecoran sloof.",
        photo: null,
        submitted: "14 Okt 2026, 16.20",
        review: "Perlu revisi",
        feedback: "Mohon lengkapi catatan hasil pemeriksaan elevasi pondasi.",
        weight: 3.75,
      },
    ],
    issueReports: [],
    notes: [],
  },
];
