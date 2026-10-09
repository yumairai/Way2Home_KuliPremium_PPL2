import type { ConstructionMilestone } from "@/types/project-tracking";

export const TRACKING_MILESTONE_TEMPLATE: Pick<ConstructionMilestone, "id" | "title" | "description">[] = [
  { id: "persiapan", title: "Persiapan", description: "Penyiapan area kerja dan kebutuhan awal pembangunan." },
  { id: "pondasi", title: "Pondasi", description: "Pekerjaan struktur bawah sebagai dasar bangunan." },
  { id: "struktur", title: "Struktur", description: "Pengerjaan struktur utama bangunan." },
  { id: "dinding-atap", title: "Dinding & Atap", description: "Pengerjaan dinding, rangka, dan penutup atap." },
  { id: "finishing", title: "Finishing", description: "Penyelesaian permukaan dan komponen interior." },
  { id: "serah-terima", title: "Serah Terima", description: "Pemeriksaan akhir dan penyerahan hasil pekerjaan." },
];
