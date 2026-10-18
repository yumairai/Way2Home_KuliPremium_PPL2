export type MandorApplication = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  city: string;
  expertise: string;
  skills: string;
  experience: number;
  submitted: string;
  cv: string;
  summary: string;
  projects: string;
};

export const mandorApplications: MandorApplication[] = [
  {
    id: "MD-1024",
    name: "Rizky Aditya Pratama",
    initials: "RA",
    email: "rizky.pratama@mail.id",
    phone: "0812 3456 7890",
    city: "Bandung, Jawa Barat",
    expertise: "Pembangunan rumah",
    skills:
      "Membaca gambar kerja, mengatur tenaga lapangan, bekisting dan pengecoran",
    experience: 8,
    submitted: "15 Okt 2026, 09.42",
    cv: "/documents/cv-mandor-rizky.pdf",
    summary:
      "Berpengalaman mengelola pembangunan rumah tinggal, mulai dari persiapan lahan hingga serah terima.",
    projects: "Rumah tinggal dua lantai, renovasi fasad dan perluasan dapur",
  },
  {
    id: "MD-1023",
    name: "Siti Rahmawati",
    initials: "SR",
    email: "siti.rahmawati@mail.id",
    phone: "0813 2109 8765",
    city: "Bogor, Jawa Barat",
    expertise: "Finishing",
    skills:
      "Pemasangan keramik, pengecatan, plafon dan pemeriksaan hasil akhir",
    experience: 6,
    submitted: "15 Okt 2026, 08.16",
    cv: "/documents/cv-mandor-siti.pdf",
    summary:
      "Fokus pada pengawasan pekerjaan finishing dan koordinasi tenaga kerja di lapangan.",
    projects:
      "Finishing rumah tapak, pengecatan interior dan pemasangan lantai",
  },
  {
    id: "MD-1022",
    name: "Fajar Nugraha",
    initials: "FN",
    email: "fajar.nugraha@mail.id",
    phone: "0821 5566 7788",
    city: "Depok, Jawa Barat",
    expertise: "Struktur dan pondasi",
    skills: "Pengukuran elevasi, pembesian, bekisting dan pengecoran struktur",
    experience: 11,
    submitted: "14 Okt 2026, 16.38",
    cv: "/documents/cv-mandor-fajar.pdf",
    summary:
      "Memiliki pengalaman di pekerjaan struktur, pondasi, dan pengendalian mutu konstruksi.",
    projects:
      "Pondasi rumah dua lantai, struktur beton bertulang dan pekerjaan sloof",
  },
  {
    id: "MD-1021",
    name: "Dewi Anggraini",
    initials: "DA",
    email: "dewi.anggraini@mail.id",
    phone: "0857 1122 3344",
    city: "Tangerang Selatan, Banten",
    expertise: "Pembangunan rumah",
    skills:
      "Mengatur tenaga kerja, membaca gambar, keselamatan dan kontrol mutu",
    experience: 5,
    submitted: "14 Okt 2026, 14.07",
    cv: "/documents/cv-mandor-dewi.pdf",
    summary:
      "Mengelola proyek rumah tinggal dengan perhatian pada jadwal, keselamatan, dan komunikasi tim.",
    projects:
      "Pembangunan rumah satu lantai dan koordinasi tenaga kerja harian",
  },
];
