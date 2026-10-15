export type MandorRegistrationStatus = "Menunggu" | "Disetujui" | "Ditolak";
export type MandorTask = { id: string; title: string; done: boolean };
export type MandorMilestone = {
  id: string;
  title: string;
  target: string;
  status: "Selesai" | "Berjalan" | "Menunggu";
  progress: number;
  tasks: MandorTask[];
};
export type MandorProgressReport = {
  id: string;
  milestoneId: string;
  status: "Belum dimulai" | "Berjalan" | "Selesai";
  proposedProgress: number;
  note: string;
  submitted: string;
  review: "Menunggu" | "Disetujui" | "Perlu revisi";
  feedback: string;
};
export type MandorIssueReport = {
  id: string;
  description: string;
  submitted: string;
  status: "Menunggu" | "Ditindaklanjuti" | "Selesai";
  followUp: string;
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
};
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
    overallProgress: 68,
    currentMilestone: "Struktur bangunan",
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
    milestones: [
      {
        id: "m1",
        title: "Persiapan & pondasi",
        target: "18 Sep 2026",
        status: "Selesai",
        progress: 100,
        tasks: [
          { id: "t1", title: "Pembersihan dan pengukuran lahan", done: true },
          { id: "t2", title: "Pengecoran pondasi", done: true },
        ],
      },
      {
        id: "m2",
        title: "Struktur bangunan",
        target: "20 Okt 2026",
        status: "Berjalan",
        progress: 68,
        tasks: [
          { id: "t3", title: "Pemasangan kolom utama", done: true },
          { id: "t4", title: "Pengecoran balok lantai", done: false },
          { id: "t5", title: "Pemeriksaan struktur", done: false },
        ],
      },
      {
        id: "m3",
        title: "Dinding & atap",
        target: "18 Nov 2026",
        status: "Menunggu",
        progress: 0,
        tasks: [{ id: "t6", title: "Pemasangan dinding bata", done: false }],
      },
      {
        id: "m4",
        title: "Finishing",
        target: "15 Des 2026",
        status: "Menunggu",
        progress: 0,
        tasks: [
          { id: "t7", title: "Pengecatan dan pemasangan lantai", done: false },
        ],
      },
    ],
    progressReports: [
      {
        id: "PR-2408-02",
        milestoneId: "m2",
        status: "Berjalan",
        proposedProgress: 74,
        note: "Pengecoran balok lantai selesai. Hasil pemeriksaan awal sesuai spesifikasi struktur.",
        submitted: "15 Okt 2026, 08.35",
        review: "Menunggu",
        feedback: "",
      },
      {
        id: "PR-2408-01",
        milestoneId: "m2",
        status: "Berjalan",
        proposedProgress: 68,
        note: "Pemasangan kolom utama selesai dan sudah dilakukan pengecekan tegak lurus.",
        submitted: "12 Okt 2026, 15.10",
        review: "Disetujui",
        feedback: "Pekerjaan dapat dilanjutkan ke pengecoran balok lantai.",
      },
    ],
    issueReports: [
      {
        id: "KN-2408-01",
        description:
          "Material besi untuk balok lantai belum tiba sesuai jadwal pemasok sehingga pengecoran tahap berikutnya berisiko tertunda.",
        submitted: "14 Okt 2026",
        status: "Ditindaklanjuti",
        followUp:
          "Pengawas mengoordinasikan jadwal pengiriman baru dengan pemasok.",
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
    currentMilestone: "Pekerjaan pondasi",
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
    milestones: [
      {
        id: "m1",
        title: "Persiapan lahan",
        target: "8 Okt 2026",
        status: "Selesai",
        progress: 100,
        tasks: [{ id: "a1", title: "Pembersihan lahan", done: true }],
      },
      {
        id: "m2",
        title: "Pekerjaan pondasi",
        target: "30 Okt 2026",
        status: "Berjalan",
        progress: 32,
        tasks: [
          { id: "a2", title: "Pemasangan pondasi", done: true },
          { id: "a3", title: "Pemeriksaan elevasi", done: false },
          { id: "a4", title: "Pengecoran sloof", done: false },
        ],
      },
      {
        id: "m3",
        title: "Struktur bangunan",
        target: "28 Nov 2026",
        status: "Menunggu",
        progress: 0,
        tasks: [{ id: "a5", title: "Pemasangan kolom", done: false }],
      },
      {
        id: "m4",
        title: "Finishing",
        target: "20 Jan 2027",
        status: "Menunggu",
        progress: 0,
        tasks: [{ id: "a6", title: "Pengecatan interior", done: false }],
      },
    ],
    progressReports: [
      {
        id: "PR-2431-01",
        milestoneId: "m2",
        status: "Berjalan",
        proposedProgress: 32,
        note: "Pekerjaan pondasi berjalan, pemeriksaan elevasi dijadwalkan sebelum pengecoran sloof.",
        submitted: "14 Okt 2026, 16.20",
        review: "Perlu revisi",
        feedback: "Mohon lengkapi catatan hasil pemeriksaan elevasi pondasi.",
      },
    ],
    issueReports: [],
  },
];
