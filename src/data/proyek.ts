import type { Project } from "@/types/proyek";

/* ============================================================================
 * MOCK DATA PROYEK — ganti bagian ini untuk simulasi milestone.
 *
 * 1. Demo proyek (status aktif): ganti `status`, `contract.status`,
 *    `payments`, dan `team` di bawah untuk mensimulasikan tiap tahap.
 * 2. Daftar proyek di sidebar: tambah/hapus entri pada array `projects`.
 * ==========================================================================*/

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const iso = (ms: number) => new Date(ms).toISOString();
const inDays = (days: number) => iso(now + days * DAY);
const agoDays = (days: number) => iso(now - days * DAY);

export const CONTRACT_DEADLINE_DAYS = 7;
export const DP_DEADLINE_DAYS = 7;

export const project: Project = {
  id: 1,
  type: "Bangun Rumah",
  designName: "Nawasena",
  location: "Bandung",
  image: "/images/katalog/house-dummy1.webp",
  style: "Modern Tropis",
  landArea: 90,
  buildingArea: 72,
  budget: 685000000,
  duration: 8,
  address: "Jl. Cihampelas No. 88, Bandung, Jawa Barat",
  submittedAt: agoDays(20),
  status: "Proyek Aktif",
  documentStatus: "approved",
  team: [
    { id: "t1", name: "Hendra Wijaya", role: "Mandor", phone: "0812-3456-7890", experience: "12 tahun", projects: 34 },
    { id: "t2", name: "Siti Rahma", role: "Pengawas", phone: "0813-9876-5432", experience: "8 tahun", projects: 21 },
  ],
  contract: {
    id: "W2H-CTR-2024-0001",
    status: "disetujui",
    version: 2,
    issuedAt: agoDays(7),
    deadlineAt: inDays(0),
  },
  payments: [
    { periode: 0, label: "Down Payment (30%)", amount: 205500000, dueDate: inDays(0), status: "lunas" },
    { periode: 1, label: "Cicilan 1 (25%)", amount: 171250000, dueDate: inDays(22), status: "aktif" },
    { periode: 2, label: "Cicilan 2 (25%)", amount: 171250000, dueDate: inDays(52), status: "akan_datang" },
    { periode: 3, label: "Cicilan 3 (20%)", amount: 137000000, dueDate: inDays(82), status: "akan_datang" },
  ],
  scope: [
    "Pekerjaan persiapan, penggalian, dan pondasi",
    "Struktur beton bertulang lantai 1",
    "Dinding bata ringan, plester, dan acian",
    "Rangka atap baja ringan dan penutup genteng",
    "Instalasi listrik dan plumbing",
    "Finishing lantai, dinding, dan cat",
  ],
};

export const projects: Project[] = [
  project,
  {
    ...project,
    id: 2,
    designName: "Arunika",
    location: "Bogor",
    style: "Japandi",
    landArea: 120,
    buildingArea: 96,
    budget: 895000000,
    duration: 10,
    address: "Jl. Raya Pajajaran No. 21, Bogor, Jawa Barat",
    status: "Selesai",
    payments: project.payments.map((p) => ({ ...p, status: "lunas" as const })),
  },
];
