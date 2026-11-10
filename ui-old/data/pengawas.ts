export type SupervisorProjectStatus =
  "Berjalan" | "Perlu perhatian" | "Selesai";
export type SupervisorMilestone = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "Selesai" | "Berjalan" | "Menunggu";
  progress: number;
};
export type SupervisorTask = {
  id: string;
  milestoneId: string;
  title: string;
  done: boolean;
};
export type SupervisorReport = {
  id: string;
  foreman: string;
  milestoneId: string;
  title: string;
  subtaskTitle: string;
  note: string;
  submitted: string;
  progress: number;
  decision: "Menunggu" | "Disetujui" | "Perlu revisi";
  photo: string | null;
  weight: number;
};
export type SupervisorIssue = {
  id: string;
  title: string;
  description: string;
  priority: "Tinggi" | "Sedang";
  state: "Baru" | "Ditindaklanjuti";
  reportDate: string;
  followUp: string;
};
export type SupervisorProject = {
  id: string;
  title: string;
  customer: string;
  customerPhone: string;
  design: string;
  category: string;
  address: string;
  status: SupervisorProjectStatus;
  progress: number;
  deadline: string;
  started: string;
  value: number;
  supervisor: string;
  foreman: string | null;
  foremen?: string[];
  needs: string;
  specifications: string[];
  contractId: string;
  milestones: SupervisorMilestone[];
  tasks: SupervisorTask[];
  reports: SupervisorReport[];
  issues: SupervisorIssue[];
  customerUpdates: { id: string; date: string; message: string }[];
  documentation: { id: string; date: string; caption: string; image: string }[];
  payments: {
    id: string;
    stage: string;
    amount: number;
    status: "Lunas" | "Menunggu" | "Belum jatuh tempo";
    dueDate: string;
  }[];
};
export type VerifiedForeman = {
  id: string;
  name: string;
  specialties: string[];
  experience: number;
  area: string;
  portfolio: string;
  phone: string;
  verified: boolean;
};
const constructionMilestones6: SupervisorMilestone[] = [
  {
    id: "m1",
    name: "Pekerjaan Persiapan & Fondasi",
    start: "2 Sep",
    end: "18 Sep",
    status: "Selesai",
    progress: 100,
  },
  {
    id: "m2",
    name: "Pekerjaan Struktur Utama",
    start: "19 Sep",
    end: "20 Okt",
    status: "Berjalan",
    progress: 25,
  },
  {
    id: "m3",
    name: "Pekerjaan Dinding & Penutup Atap",
    start: "21 Okt",
    end: "4 Nov",
    status: "Menunggu",
    progress: 0,
  },
  {
    id: "m4",
    name: "Instalasi Jalur MEP",
    start: "5 Nov",
    end: "15 Nov",
    status: "Menunggu",
    progress: 0,
  },
  {
    id: "m5",
    name: "Pekerjaan Finishing",
    start: "16 Nov",
    end: "28 Nov",
    status: "Menunggu",
    progress: 0,
  },
  {
    id: "m6",
    name: "Lingkungan Luar & Serah Terima",
    start: "29 Nov",
    end: "15 Des",
    status: "Menunggu",
    progress: 0,
  },
];
export const supervisorProjects: SupervisorProject[] = [
  {
    id: "WH-2408",
    title: "Rumah Tumbuh Cilandak",
    customer: "Nadia Putri",
    customerPhone: "+62 812-3456-7812",
    design: "Arunika · Japandi",
    category: "Pembangunan rumah",
    address: "Jl. Cilandak Tengah No. 24, Jakarta Selatan",
    status: "Berjalan",
    progress: 20,
    deadline: "15 Des 2026",
    started: "2 Sep 2026",
    value: 895000000,
    supervisor: "Rizky Ramadhan",
    foreman: "Bima Saputra",
    needs:
      "Hunian keluarga yang terang, memiliki ruang kerja terpisah, dan mudah beradaptasi untuk kebutuhan keluarga dalam jangka panjang.",
    specifications: [
      "Luas tanah 120 m²",
      "Luas bangunan 96 m²",
      "3 kamar tidur · 2 kamar mandi",
      "1 lantai · gaya Japandi",
      "Kontrak #K-2026-084",
    ],
    contractId: "K-2026-084",
    milestones: constructionMilestones6,
    tasks: [
      { id: "t1", milestoneId: "m1", title: "Pembersihan Lahan", done: true },
      {
        id: "t2",
        milestoneId: "m1",
        title: "Pengukuran (Bowplank)",
        done: true,
      },
      { id: "t3", milestoneId: "m1", title: "Galian Tanah", done: true },
      {
        id: "t4",
        milestoneId: "m1",
        title: "Pengecoran Fondasi & Sloof",
        done: true,
      },
      {
        id: "t5",
        milestoneId: "m2",
        title: "Pengerjaan Kolom (Tiang)",
        done: true,
      },
      {
        id: "t6",
        milestoneId: "m2",
        title: "Pengerjaan Balok",
        done: false,
      },
      { id: "t7", milestoneId: "m2", title: "Rangka Atap", done: false },
      { id: "t8", milestoneId: "m3", title: "Pemasangan Bata", done: false },
    ],
    reports: [
      {
        id: "PR-2408-02",
        foreman: "Bima Saputra",
        milestoneId: "m2",
        title: "Pengerjaan Balok",
        subtaskTitle: "Pengerjaan Balok",
        note: "Pengecoran balok lantai selesai. Hasil pemeriksaan awal sesuai spesifikasi struktur.",
        submitted: "15 Okt 2026 · 08.35",
        progress: 25,
        decision: "Menunggu",
        photo: null,
        weight: 5,
      },
      {
        id: "PR-2408-01",
        foreman: "Bima Saputra",
        milestoneId: "m2",
        title: "Pengerjaan Kolom (Tiang)",
        subtaskTitle: "Pengerjaan Kolom (Tiang)",
        note: "Pemasangan kolom utama selesai dan sudah dilakukan pengecekan tegak lurus.",
        submitted: "12 Okt 2026 · 15.10",
        progress: 20,
        decision: "Disetujui",
        photo: null,
        weight: 5,
      },
    ],
    issues: [],
    customerUpdates: [
      {
        id: "u1",
        date: "12 Okt 2026",
        message:
          "Pekerjaan struktur berjalan sesuai rencana. Pengecoran balok lantai sedang dikerjakan.",
      },
    ],
    documentation: [
      {
        id: "d1",
        date: "14 Okt 2026",
        caption: "Pemeriksaan struktur kolom",
        image: "/images/katalog/house-dummy1.webp",
      },
      {
        id: "d2",
        date: "10 Okt 2026",
        caption: "Pekerjaan struktur lantai",
        image: "/images/katalog/house-dummy1.webp",
      },
    ],
    payments: [
      {
        id: "p1",
        stage: "Uang muka",
        amount: 89500000,
        status: "Lunas",
        dueDate: "2 Sep 2026",
      },
      {
        id: "p2",
        stage: "Pondasi selesai",
        amount: 179000000,
        status: "Lunas",
        dueDate: "18 Sep 2026",
      },
      {
        id: "p3",
        stage: "Struktur bangunan",
        amount: 268500000,
        status: "Menunggu",
        dueDate: "20 Okt 2026",
      },
      {
        id: "p4",
        stage: "Serah terima",
        amount: 89500000,
        status: "Belum jatuh tempo",
        dueDate: "15 Des 2026",
      },
    ],
  },
  {
    id: "WH-2412",
    title: "Hunian Keluarga Cipete",
    customer: "Dimas Pratama",
    customerPhone: "+62 813-2200-1490",
    design: "Nawasena · Modern Tropis",
    category: "Pembangunan rumah",
    address: "Jl. Cipete Raya No. 8, Jakarta Selatan",
    status: "Perlu perhatian",
    progress: 42,
    deadline: "28 Nov 2026",
    started: "15 Sep 2026",
    value: 685000000,
    supervisor: "Rizky Ramadhan",
    foreman: null,
    needs:
      "Rumah tropis satu lantai dengan sirkulasi udara silang, ruang keluarga luas, serta taman depan untuk keluarga muda.",
    specifications: [
      "Luas tanah 90 m²",
      "Luas bangunan 72 m²",
      "2 kamar tidur · 1 kamar mandi",
      "1 lantai · gaya Modern Tropis",
      "Kontrak #K-2026-091",
    ],
    contractId: "K-2026-091",
    milestones: constructionMilestones6.map((m) => ({
      ...m,
      progress: m.id === "m1" ? 100 : m.id === "m2" ? 42 : 0,
      status:
        m.id === "m1" ? "Selesai" : m.id === "m2" ? "Berjalan" : "Menunggu",
    })),
    tasks: [
      { id: "a1", milestoneId: "m1", title: "Persiapan lahan", done: true },
      { id: "a2", milestoneId: "m2", title: "Pemasangan pondasi", done: true },
      {
        id: "a3",
        milestoneId: "m2",
        title: "Pemesanan material struktur",
        done: false,
      },
      { id: "a4", milestoneId: "m2", title: "Pengecoran sloof", done: false },
    ],
    reports: [],
    issues: [
      {
        id: "i2",
        title: "Mandor belum ditetapkan",
        description:
          "Proyek ini belum memiliki mandor lapangan untuk memulai pekerjaan struktur.",
        priority: "Sedang",
        state: "Baru",
        reportDate: "15 Okt 2026",
        followUp: "",
      },
    ],
    customerUpdates: [],
    documentation: [
      {
        id: "d3",
        date: "15 Sep 2026",
        caption: "Kondisi awal lahan",
        image: "/images/katalog/house-dummy1.webp",
      },
    ],
    payments: [
      {
        id: "p5",
        stage: "Uang muka",
        amount: 68500000,
        status: "Lunas",
        dueDate: "15 Sep 2026",
      },
      {
        id: "p6",
        stage: "Pondasi selesai",
        amount: 137000000,
        status: "Menunggu",
        dueDate: "20 Okt 2026",
      },
      {
        id: "p7",
        stage: "Serah terima",
        amount: 68500000,
        status: "Belum jatuh tempo",
        dueDate: "28 Nov 2026",
      },
    ],
  },
  {
    id: "WH-2396",
    title: "Ekstensi Rumah Depok",
    customer: "Rafi Akbar",
    customerPhone: "+62 811-4810-6702",
    design: "Rinjani · Modern Kontemporer",
    category: "Pembangunan rumah",
    address: "Jl. Mawar No. 12, Depok",
    status: "Selesai",
    progress: 100,
    deadline: "30 Sep 2026",
    started: "1 Jun 2026",
    value: 1250000000,
    supervisor: "Rizky Ramadhan",
    foreman: "Teguh Wibowo",
    needs:
      "Ekstensi ruang keluarga dengan akses taman belakang dan pencahayaan alami.",
    specifications: [
      "Luas tanah 150 m²",
      "Luas bangunan 128 m²",
      "4 kamar tidur · 3 kamar mandi",
      "2 lantai · gaya Modern Kontemporer",
      "Kontrak #K-2026-052",
    ],
    contractId: "K-2026-052",
    milestones: constructionMilestones6.map((m) => ({
      ...m,
      status: "Selesai",
      progress: 100,
    })),
    tasks: [
      { id: "z1", milestoneId: "m1", title: "Persiapan lahan", done: true },
      {
        id: "z2",
        milestoneId: "m2",
        title: "Penyelesaian struktur",
        done: true,
      },
      {
        id: "z3",
        milestoneId: "m3",
        title: "Pemasangan dinding dan atap",
        done: true,
      },
      {
        id: "z4",
        milestoneId: "m4",
        title: "Finishing dan serah terima",
        done: true,
      },
    ],
    reports: [],
    issues: [],
    customerUpdates: [
      {
        id: "u2",
        date: "30 Sep 2026",
        message: "Pembangunan telah selesai dan rumah siap untuk serah terima.",
      },
    ],
    documentation: [
      {
        id: "d4",
        date: "30 Sep 2026",
        caption: "Rumah selesai",
        image: "/images/katalog/house-dummy1.webp",
      },
    ],
    payments: [
      {
        id: "p8",
        stage: "Seluruh termin",
        amount: 1250000000,
        status: "Lunas",
        dueDate: "30 Sep 2026",
      },
    ],
  },
];
export const verifiedForemen: VerifiedForeman[] = [
  {
    id: "M-012",
    name: "Agus Santoso",
    specialties: ["Struktur", "Pondasi"],
    experience: 9,
    area: "Jakarta Selatan",
    portfolio: "12 proyek rumah tinggal",
    phone: "+62 812-9000-1201",
    verified: true,
  },
  {
    id: "M-018",
    name: "Bima Saputra",
    specialties: ["Pembangunan rumah", "Struktur"],
    experience: 7,
    area: "Jakarta Selatan · Depok",
    portfolio: "9 proyek rumah tinggal",
    phone: "+62 812-9000-1802",
    verified: true,
  },
  {
    id: "M-024",
    name: "Teguh Wibowo",
    specialties: ["Finishing", "Struktur"],
    experience: 11,
    area: "Depok · Bogor",
    portfolio: "18 proyek rumah tinggal",
    phone: "+62 812-9000-2403",
    verified: true,
  },
  {
    id: "M-029",
    name: "Dedi Kurniawan",
    specialties: ["Pondasi", "Pembangunan rumah"],
    experience: 6,
    area: "Jakarta · Bekasi",
    portfolio: "7 proyek rumah tinggal",
    phone: "+62 812-9000-2904",
    verified: true,
  },
];
