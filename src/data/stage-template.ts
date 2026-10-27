/**
 * stage-template.ts
 *
 * Template baku 6 tahap / 24 subtask pembangunan rumah.
 *
 * Dipakai oleh:
 *   - POST /api/pengawas/projects/[id]/stages  (payload `template: true`)
 *   - stage.service.createStagesFromTemplate()
 *
 * Kepemilikan: tahapan dibuat MANUAL oleh Pengawas (bukan otomatis saat
 * status proyek berubah). Template ini hanya mempercepat pengisian.
 *
 * Total bobot subtask = 100%.
 */

export type StageTemplateSubtask = {
  title: string;
  weight: number;
};

export type StageTemplateStage = {
  name: string;
  subtasks: StageTemplateSubtask[];
};

export const STAGE_TEMPLATE: StageTemplateStage[] = [
  {
    name: "Pekerjaan Persiapan & Fondasi",
    subtasks: [
      { title: "Pembersihan Lahan", weight: 3.75 },
      { title: "Pengukuran (Bowplank)", weight: 3.75 },
      { title: "Galian Tanah", weight: 3.75 },
      { title: "Pengecoran Fondasi & Sloof", weight: 3.75 },
    ],
  },
  {
    name: "Pekerjaan Struktur Utama",
    subtasks: [
      { title: "Pengerjaan Kolom (Tiang)", weight: 5 },
      { title: "Pengerjaan Balok", weight: 5 },
      { title: "Pelat Lantai (Jika 2 lantai)", weight: 5 },
      { title: "Rangka Atap", weight: 5 },
    ],
  },
  {
    name: "Pekerjaan Dinding & Penutup Atap",
    subtasks: [
      { title: "Pemasangan Bata", weight: 5 },
      { title: "Plesteran Awal", weight: 5 },
      { title: "Pengerjaan Kusen", weight: 5 },
      { title: "Pemasangan Genteng / Atap", weight: 5 },
    ],
  },
  {
    name: "Instalasi Jalur MEP",
    subtasks: [
      { title: "Penanaman Pipa Air Bersih & Kotor", weight: 5 },
      { title: "Pipa Kabel Listrik Dinding", weight: 5 },
      { title: "Pembuatan Septic Tank", weight: 5 },
    ],
  },
  {
    name: "Pekerjaan Finishing",
    subtasks: [
      { title: "Acian Dinding", weight: 4 },
      { title: "Pemasangan Keramik / Granit", weight: 4 },
      { title: "Pemasangan Plafon", weight: 4 },
      { title: "Pengecatan Interior & Eksterior", weight: 4 },
      { title: "Pemasangan Lampu, Keran & Sanitari", weight: 4 },
    ],
  },
  {
    name: "Lingkungan Luar & Serah Terima",
    subtasks: [
      { title: "Pengerjaan Pagar & Carport", weight: 2.5 },
      { title: "Pembuatan Taman", weight: 2.5 },
      { title: "Pembersihan Total (Final Cleaning)", weight: 2.5 },
      { title: "Inspeksi Komplain (Punch List) & Penyerahan Kunci", weight: 2.5 },
    ],
  },
];

export const TEMPLATE_TOTAL_WEIGHT = STAGE_TEMPLATE.reduce(
  (total, stage) => total + stage.subtasks.reduce((sum, item) => sum + item.weight, 0),
  0,
);

export const ISSUE_CATEGORIES: { value: string; label: string }[] = [
  { value: "CUACA_LINGKUNGAN", label: "Cuaca dan lingkungan" },
  { value: "MATERIAL_PERALATAN", label: "Material dan peralatan" },
  { value: "TENAGA_KERJA", label: "Tenaga kerja" },
  { value: "TEKNIS_KONSTRUKSI", label: "Teknis konstruksi" },
  { value: "DESAIN_SPESIFIKASI", label: "Desain dan spesifikasi" },
  { value: "ANGGARAN_PENGADAAN", label: "Anggaran dan pengadaan" },
  { value: "PERIZINAN_EKSTERNAL", label: "Perizinan dan pihak eksternal" },
  { value: "LAINNYA", label: "Lainnya" },
];
