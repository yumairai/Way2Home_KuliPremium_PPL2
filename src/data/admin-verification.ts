import type { HouseDesign } from "@/types/house-design";

export type VerificationDocumentStatus = "Menunggu" | "Disetujui" | "Ditolak";
export type VerificationDocument = {
  id: string;
  name: string;
  status: VerificationDocumentStatus;
  kind: "image" | "pdf";
  fileName: string;
  dataUrl: string;
};
export type VerificationRequest = {
  id: string;
  applicant: string;
  email: string;
  submittedAt: string;
  adminNote: string;
  budget?: number;
  house: HouseDesign;
  documents: VerificationDocument[];
};

const sampleHouse = {
  slug: "arunika-2",
  name: "Arunika",
  style: "Japandi",
  location: "Bogor",
  landArea: 120,
  buildingArea: 96,
  bedrooms: 3,
  bathrooms: 2,
  floors: 1,
  estimatedCost: 895000000,
  estimatedDuration: 10,
  description:
    "Hunian tenang dengan material natural dan cahaya pagi yang melimpah.",
  highlights: ["Fasad kayu", "Dapur terbuka", "Void ruang keluarga"],
  image: "/images/katalog/house-dummy1.webp",
} satisfies HouseDesign;

const documentSvg = (title: string, accent: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="840" height="1100" viewBox="0 0 840 1100"><rect width="840" height="1100" fill="#f7f9fc"/><rect x="45" y="45" width="750" height="1010" rx="12" fill="white" stroke="#cbd5e1" stroke-width="3"/><rect x="95" y="100" width="650" height="90" rx="8" fill="${accent}"/><text x="125" y="157" fill="white" font-size="30" font-family="Arial" font-weight="700">${title}</text><circle cx="420" cy="360" r="95" fill="#dce6ef"/><rect x="335" y="285" width="170" height="155" rx="12" fill="#b7c7d5"/><text x="420" y="375" text-anchor="middle" fill="#536b80" font-size="42" font-family="Arial" font-weight="700">FOTO</text><rect x="100" y="530" width="640" height="18" rx="9" fill="#dbe3eb"/><rect x="100" y="580" width="575" height="18" rx="9" fill="#e7ecf1"/><rect x="100" y="630" width="615" height="18" rx="9" fill="#e7ecf1"/><rect x="100" y="730" width="280" height="95" rx="6" fill="#fbfcfd" stroke="#cbd5e1" stroke-dasharray="8 7"/><text x="420" y="970" text-anchor="middle" fill="#94a3b8" font-size="20" font-family="Arial">CONTOH DOKUMEN DEMO</text></svg>`)}`;

function makeDocuments(prefix: string): VerificationDocument[] {
  return [
    {
      id: `${prefix}-shm`,
      name: "Sertifikat Tanah",
      status: "Menunggu",
      kind: "image",
      fileName: "sertifikat-tanah.jpg",
      dataUrl: documentSvg("SERTIFIKAT HAK MILIK", "#385f7d"),
    },
    {
      id: `${prefix}-ktp`,
      name: "KTP Pemilik",
      status: "Menunggu",
      kind: "image",
      fileName: "ktp-pemilik.jpg",
      dataUrl: documentSvg("KARTU TANDA PENDUDUK", "#526e83"),
    },
    {
      id: `${prefix}-imb`,
      name: "IMB/PBG",
      status: "Menunggu",
      kind: "pdf",
      fileName: "izin-bangunan.pdf",
      dataUrl: documentSvg("PERSETUJUAN BANGUNAN", "#527a70"),
    },
    {
      id: `${prefix}-kuasa`,
      name: "Surat Kuasa",
      status: "Menunggu",
      kind: "pdf",
      fileName: "surat-kuasa.pdf",
      dataUrl: documentSvg("SURAT KUASA", "#8a704b"),
    },
  ];
}

export const verificationRequests: VerificationRequest[] = [
  {
    id: "WH-2501",
    applicant: "Nadia Putri",
    email: "nadia.putri@example.test",
    submittedAt: "13 Okt 2026 · 09.42",
    adminNote: "-",
    house: sampleHouse,
    documents: makeDocuments("2501"),
  },
  {
    id: "WH-2502",
    applicant: "Dimas Pratama",
    email: "dimas.pratama@example.test",
    submittedAt: "12 Okt 2026 · 16.18",
    adminNote: "Mohon pastikan berkas alamat sesuai dengan lokasi proyek.",
    house: {
      ...sampleHouse,
      slug: "nawasena-1",
      name: "Nawasena",
      style: "Modern Tropis",
      location: "Bandung",
      landArea: 90,
      buildingArea: 72,
      bedrooms: 2,
      bathrooms: 1,
      floors: 1,
      estimatedCost: 685000000,
      estimatedDuration: 8,
    },
    documents: makeDocuments("2502").map((doc, index) => ({
      ...doc,
      status: index === 0 ? "Disetujui" : index === 1 ? "Ditolak" : "Menunggu",
    })),
  },
  {
    id: "WH-2503",
    applicant: "Salsa Maharani",
    email: "salsa.maharani@example.test",
    submittedAt: "12 Okt 2026 · 11.05",
    adminNote: "-",
    house: {
      ...sampleHouse,
      slug: "rinjani-4",
      name: "Rinjani",
      style: "Modern Kontemporer",
      location: "Tangerang Selatan",
      landArea: 150,
      buildingArea: 128,
      bedrooms: 4,
      bathrooms: 3,
      floors: 2,
      estimatedCost: 1250000000,
      estimatedDuration: 13,
    },
    documents: makeDocuments("2503").map((doc, index) => ({
      ...doc,
      status: index === 0 ? "Disetujui" : index === 1 ? "Ditolak" : "Disetujui",
    })),
  },
];
