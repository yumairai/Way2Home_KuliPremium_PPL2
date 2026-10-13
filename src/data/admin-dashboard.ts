export type AdminProjectStatus = "Berjalan" | "Menunggu" | "Selesai";
export type AdminProject = {
  id: string;
  name: string;
  customer: string;
  foreman: string;
  supervisor: string;
  status: AdminProjectStatus;
  progress: number | null;
  category: string;
};
export const adminMetrics = [
  {
    label: "Total pengguna",
    value: "1.284",
    detail: "+8,2% dari bulan lalu",
    icon: "users",
    tone: "blue",
  },
  {
    label: "Proyek aktif",
    value: "48",
    detail: "12 konstruksi · 36 renovasi",
    icon: "buildings",
    tone: "navy",
  },
  {
    label: "Verifikasi dokumen",
    value: "12",
    detail: "Perlu ditinjau",
    icon: "files",
    tone: "amber",
  },
  {
    label: "Proyek selesai",
    value: "326",
    detail: "Sepanjang tahun ini",
    icon: "check",
    tone: "green",
  },
] as const;
export const revenueTrend = [
  { month: "Mei", amount: 42 },
  { month: "Jun", amount: 58 },
  { month: "Jul", amount: 47 },
  { month: "Agu", amount: 70 },
  { month: "Sep", amount: 62 },
  { month: "Okt", amount: 84 },
];
export const adminProjects: AdminProject[] = [
  {
    id: "WH-2408",
    name: "Rumah Tumbuh Cilandak",
    customer: "Nadia Putri",
    foreman: "Bima Saputra",
    supervisor: "Rizky Ramadhan",
    status: "Berjalan",
    progress: 68,
    category: "Renovasi",
  },
  {
    id: "WH-2412",
    name: "Hunian Keluarga Cipete",
    customer: "Dimas Pratama",
    foreman: "Agus Santoso",
    supervisor: "Maya Lestari",
    status: "Berjalan",
    progress: 42,
    category: "Konstruksi",
  },
  {
    id: "WH-2415",
    name: "Pembaruan Dapur Kemang",
    customer: "Salsa Maharani",
    foreman: "Belum ditentukan",
    supervisor: "Fajar Hidayat",
    status: "Menunggu",
    progress: null,
    category: "Renovasi",
  },
  {
    id: "WH-2396",
    name: "Ekstensi Rumah Depok",
    customer: "Rafi Akbar",
    foreman: "Teguh Wibowo",
    supervisor: "Maya Lestari",
    status: "Berjalan",
    progress: 81,
    category: "Konstruksi",
  },
  {
    id: "WH-2382",
    name: "Renovasi Teras Jagakarsa",
    customer: "Intan Permata",
    foreman: "Dedi Kurniawan",
    supervisor: "Rizky Ramadhan",
    status: "Selesai",
    progress: 100,
    category: "Renovasi",
  },
  {
    id: "WH-2418",
    name: "Rumah Minimalis Bintaro",
    customer: "Farhan Maulana",
    foreman: "Belum ditentukan",
    supervisor: "Belum ditentukan",
    status: "Menunggu",
    progress: null,
    category: "Konstruksi",
  },
];
