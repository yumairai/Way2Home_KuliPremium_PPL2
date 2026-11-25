import type { MandorProject } from "@/data/mandor";

export const MANDOR_TEST_EMAILS = [
  "mandor-testing-1@way2home.test",
  "mandor-testing-2@way2home.test",
  "mandor-testing-3@way2home.test",
] as const;

export type MandorTestState = { project: MandorProject; version?: number };

export const createMandorTestProject = (email: string): MandorProject => ({
  id: `TEST-${email.match(/(\d)@/)?.[1] ?? "1"}`,
  status: "berjalan",
  title: "Pembangunan Rumah Tumbuh",
  design: "Rumah Modern Tropis 2 Lantai",
  location: "Jl. Melati No. 18, Jakarta Selatan",
  assignedAt: "1 Juni 2026",
  target: "30 November 2026",
  overallProgress: 0,
  currentMilestone: "Persiapan dan pondasi",
  supervisor: "Andi Pratama",
  supervisorNote:
    "Pastikan mutu material dan dokumentasikan setiap tahap pekerjaan.",
  image: "/images/katalog/house-dummy1.webp",
  scope: [
    "Pekerjaan persiapan dan fondasi",
    "Pekerjaan struktur utama",
    "Pekerjaan dinding dan penutup atap",
    "Instalasi jalur MEP",
    "Pekerjaan finishing",
    "Lingkungan luar dan serah terima",
  ],
  milestones: [
    {
      id: "stage-1",
      title: "Pekerjaan Persiapan & Fondasi",
      target: "30 Juni 2026",
      weight: 15,
      subtasks: [
        { id: "task-1", title: "Pembersihan Lahan", weight: 3.75, done: false },
        {
          id: "task-2",
          title: "Pengukuran (Bowplank)",
          weight: 3.75,
          done: false,
        },
        { id: "task-3", title: "Galian Tanah", weight: 3.75, done: false },
        {
          id: "task-4",
          title: "Pengecoran Fondasi & Sloof",
          weight: 3.75,
          done: false,
        },
      ],
    },
    {
      id: "stage-2",
      title: "Pekerjaan Struktur Utama",
      target: "31 Juli 2026",
      weight: 20,
      subtasks: [
        {
          id: "task-5",
          title: "Pengerjaan Kolom (Tiang)",
          weight: 5,
          done: false,
        },
        { id: "task-6", title: "Pengerjaan Balok", weight: 5, done: false },
        {
          id: "task-7",
          title: "Pelat Lantai (Jika 2 lantai)",
          weight: 5,
          done: false,
        },
        { id: "task-8", title: "Rangka Atap", weight: 5, done: false },
      ],
    },
    {
      id: "stage-3",
      title: "Pekerjaan Dinding & Penutup Atap",
      target: "31 Agustus 2026",
      weight: 20,
      subtasks: [
        { id: "task-9", title: "Pemasangan Bata", weight: 5, done: false },
        { id: "task-10", title: "Plesteran Awal", weight: 5, done: false },
        { id: "task-11", title: "Pengerjaan Kusen", weight: 5, done: false },
        {
          id: "task-12",
          title: "Pemasangan Genteng / Atap",
          weight: 5,
          done: false,
        },
      ],
    },
    {
      id: "stage-4",
      title: "Instalasi Jalur MEP",
      target: "30 September 2026",
      weight: 15,
      subtasks: [
        {
          id: "task-13",
          title: "Penanaman Pipa Air Bersih & Kotor",
          weight: 5,
          done: false,
        },
        {
          id: "task-14",
          title: "Pipa Kabel Listrik Dinding",
          weight: 5,
          done: false,
        },
        {
          id: "task-15",
          title: "Pembuatan Septic Tank",
          weight: 5,
          done: false,
        },
      ],
    },
    {
      id: "stage-5",
      title: "Pekerjaan Finishing",
      target: "31 Oktober 2026",
      weight: 20,
      subtasks: [
        { id: "task-16", title: "Acian Dinding", weight: 4, done: false },
        {
          id: "task-17",
          title: "Pemasangan Keramik / Granit",
          weight: 4,
          done: false,
        },
        { id: "task-18", title: "Pemasangan Plafon", weight: 4, done: false },
        {
          id: "task-19",
          title: "Pengecatan Interior & Eksterior",
          weight: 4,
          done: false,
        },
        {
          id: "task-20",
          title: "Pemasangan Lampu, Keran & Sanitari",
          weight: 4,
          done: false,
        },
      ],
    },
    {
      id: "stage-6",
      title: "Lingkungan Luar & Serah Terima",
      target: "30 November 2026",
      weight: 10,
      subtasks: [
        {
          id: "task-21",
          title: "Pengerjaan Pagar & Carport",
          weight: 2.5,
          done: false,
        },
        { id: "task-22", title: "Pembuatan Taman", weight: 2.5, done: false },
        {
          id: "task-23",
          title: "Pembersihan Total (Final Cleaning)",
          weight: 2.5,
          done: false,
        },
        {
          id: "task-24",
          title: "Inspeksi Komplain (Punch List) & Penyerahan Kunci",
          weight: 2.5,
          done: false,
        },
      ],
    },
  ],
  progressReports: [],
  issueReports: [],
  notes: [],
});

const storageKey = (userId: string) => `way2home-mandor-test:${userId}`;
export const MANDOR_TEST_FIXTURE_VERSION = 2;
const previousStorageKey = "way2home-mandor-test-active-user";

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    const activeUserId = window.localStorage.getItem(previousStorageKey);
    if (activeUserId) window.localStorage.removeItem(storageKey(activeUserId));
    window.localStorage.removeItem(previousStorageKey);
  });
}

export function loadMandorTestState(userId: string): MandorTestState {
  if (typeof window === "undefined")
    return { project: createMandorTestProject("") };
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (raw) {
      const state = JSON.parse(raw) as MandorTestState;
      if (
        state.project &&
        state.project.milestones?.length === 6 &&
        state.version === MANDOR_TEST_FIXTURE_VERSION
      )
        return state;
    }
  } catch (error) {
    console.warn("Tidak dapat membaca data testing mandor lokal.", error);
  }
  return { project: createMandorTestProject("") };
}

export function saveMandorTestState(userId: string, state: MandorTestState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ ...state, version: MANDOR_TEST_FIXTURE_VERSION }),
    );
    window.localStorage.setItem(previousStorageKey, userId);
  }
}

export function clearMandorTestState(userId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey(userId));
    if (window.localStorage.getItem(previousStorageKey) === userId)
      window.localStorage.removeItem(previousStorageKey);
  }
}
