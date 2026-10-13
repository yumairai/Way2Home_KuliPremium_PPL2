export type SupervisorProject = {
  id: string;
  title: string;
  address: string;
  category: string;
  image: string;
};
export type Supervisor = {
  id: string;
  name: string;
  email: string;
  initials: string;
  rating: number;
  completedProjects: number;
  status: "Tersedia" | "Sedang bertugas";
  currentProject: string | null;
};
export const initialSupervisors: Supervisor[] = [
  {
    id: "PWS-001",
    name: "Rizky Ramadhan",
    email: "rizky.ramadhan@example.test",
    initials: "RR",
    rating: 4.9,
    completedProjects: 24,
    status: "Sedang bertugas",
    currentProject: "Rumah Tumbuh Cilandak",
  },
  {
    id: "PWS-002",
    name: "Maya Lestari",
    email: "maya.lestari@example.test",
    initials: "ML",
    rating: 4.8,
    completedProjects: 19,
    status: "Tersedia",
    currentProject: null,
  },
  {
    id: "PWS-003",
    name: "Fajar Hidayat",
    email: "fajar.hidayat@example.test",
    initials: "FH",
    rating: 4.7,
    completedProjects: 16,
    status: "Tersedia",
    currentProject: null,
  },
  {
    id: "PWS-004",
    name: "Naufal Prasetyo",
    email: "naufal.prasetyo@example.test",
    initials: "NP",
    rating: 4.9,
    completedProjects: 31,
    status: "Sedang bertugas",
    currentProject: "Hunian Keluarga Cipete",
  },
  {
    id: "PWS-005",
    name: "Sinta Maharani",
    email: "sinta.maharani@example.test",
    initials: "SM",
    rating: 4.6,
    completedProjects: 12,
    status: "Tersedia",
    currentProject: null,
  },
];
export const initialSupervisorProjects: SupervisorProject[] = [
  {
    id: "WH-2508",
    title: "Renovasi ruang keluarga",
    address: "Jl. Melati No. 18, Depok",
    category: "Renovasi",
    image: "/images/katalog/house-dummy1.webp",
  },
  {
    id: "WH-2511",
    title: "Rumah keluarga dua lantai",
    address: "Jl. Kenanga No. 7, Bekasi",
    category: "Konstruksi",
    image: "/images/katalog/house-dummy1.webp",
  },
  {
    id: "WH-2514",
    title: "Pembaruan dapur dan teras",
    address: "Jl. Anggrek No. 42, Bogor",
    category: "Renovasi",
    image: "/images/katalog/house-dummy1.webp",
  },
];
