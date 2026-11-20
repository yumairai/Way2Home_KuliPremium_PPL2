import type { ConstructionMilestone } from "@/types/project-tracking";

export const TRACKING_MILESTONE_TEMPLATE: Pick<
  ConstructionMilestone,
  "id" | "title" | "description"
>[] = [
  {
    id: "persiapan-fondasi",
    title: "Pekerjaan Persiapan & Fondasi",
    description:
      "Penyiapan area kerja, pembersihan lahan, pengukuran, galian, dan pengecoran fondasi.",
  },
  {
    id: "struktur-utama",
    title: "Pekerjaan Struktur Utama",
    description:
      "Pengerjaan struktur utama seperti kolom tiang, balok, pelat lantai, dan rangka atap.",
  },
  {
    id: "dinding-penutup-atap",
    title: "Pekerjaan Dinding & Penutup Atap",
    description:
      "Pemasangan dinding bata, plesteran awal, pengerjaan kusen, dan pemasangan atap.",
  },
  {
    id: "jalur-mep",
    title: "Instalasi Jalur MEP",
    description:
      "Instalasi jalur mekanikal, elektrikal, perpipaan air bersih/kotor, dan septic tank.",
  },
  {
    id: "finishing",
    title: "Pekerjaan Finishing",
    description:
      "Acian dinding, pemasangan keramik/granit, plafon, pengecatan, dan sanitari.",
  },
  {
    id: "lingkungan-serah-terima",
    title: "Lingkungan Luar & Serah Terima",
    description:
      "Pengerjaan pagar, carport, taman, pembersihan total, dan serah terima kunci.",
  },
];
