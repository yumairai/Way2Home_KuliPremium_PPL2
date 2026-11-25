export const TEST_USERS = {
  admin: {
    email: "admin@way2home.test",
    password: "admin123",
    role: "admin" as const,
    name: "Admin Way2Home",
  },
  pengawas: {
    email: "pengawas@way2home.test",
    password: "pengawas123",
    role: "pengawas" as const,
    name: "Pengawas Lapangan",
  },
  mandor: {
    email: "mandor@way2home.test",
    password: "mandor123",
    role: "mandor" as const,
    name: "Mandor Proyek",
  },
  customer: {
    email: "customer@example.com",
    password: "Password123!",
    role: "customer" as const,
    name: "Budi Santoso",
  },
  invalid: {
    email: "unregistered@example.com",
    password: "WrongPassword999!",
  },
};

export const SAMPLE_DESIGNS = [
  {
    slug: "modern-minimalis",
    title: "Rumah Modern Minimalis",
    style: "Modern",
    minBudget: 750000000,
  },
  {
    slug: "scandinavian-warmth",
    title: "Scandinavian Warmth",
    style: "Skandinavia",
    minBudget: 850000000,
  },
  {
    slug: "industrial-urban",
    title: "Industrial Urban Living",
    style: "Industrial",
    minBudget: 900000000,
  },
];

export const SAMPLE_CUSTOMER_REGISTRATION = {
  name: "Budi Santoso Test",
  email: `test_customer_${Date.now()}@example.com`,
  phoneNumber: "081234567890",
  nik: "3201234567890001",
  password: "Password123!",
  passwordConfirmation: "Password123!",
};

export const SAMPLE_AI_PREFERENCES = {
  city: "Bandung",
  style: "Modern",
  budget: 850000000,
  landArea: 120,
  bedrooms: 3,
  priority: "biaya",
};

export const SAMPLE_BUILD_APPLICATION = {
  customerName: "Budi Santoso",
  customerPhone: "081234567890",
  landArea: "150",
  buildingArea: "100",
  budget: "950000000",
  address: "Jl. Dago Asri No. 12, Coblong, Kota Bandung",
  city: "Bandung",
};

export const SAMPLE_KENDALA = {
  kategori: "CUACA",
  deskripsi: "Hujan lebat selama 3 hari berturut-turut menyebabkan pengecoran pondasi tertunda.",
  dampak: "WAKTU",
  estimasi_hari: "3",
  estimasi_biaya: "0",
  kondisi_pekerjaan: "TERHAMBAT_SEBAGIAN",
};
