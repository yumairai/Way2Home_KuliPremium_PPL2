import type { HouseDesign } from "@/types/house-design";

// Input preferensi customer.
export interface RecommendationInput {
  location: string;
  style: string;
  area: number;
  bedrooms: number;
  floors: number;
  budget: number;
  flexibility: number;
  priority: "biaya" | "estetik" | "cepat";
}

// Struktur data dari tabel design_location_scores.
export interface DesignLocationScore {
  slug: string;
  nama: string;
  lokasi: string;
  skor_hujan: number;
  skor_panas: number;
  skor_kelembapan: number;
  skor_kecocokan_iklim: number;
  peringkat_lokasi_untuk_desain: number;
  cocok: boolean;
}

// Faktor penilaian yang akan ditampilkan di halaman hasil.
export interface RecommendationFactor {
  label: string;
  score: number;
}

// Satu desain yang sudah diberi nilai rekomendasi.
export interface RecommendedDesign extends HouseDesign {
  match: number;
  distance: number;
  factors: RecommendationFactor[];
  climateScore: number | null;
  locationSuitable: boolean;
}

// Respons service.
export interface RecommendationResponse {
  recommendations: RecommendedDesign[];
  usedLocationFallback: boolean;
  message: string;
}

type PriorityWeights = {
  budget: number;
  area: number;
  bedrooms: number;
  floors: number;
  style: number;
  duration: number;
  climate: number;
};

// Bobot awal berdasarkan prioritas customer.
const PRIORITY_WEIGHTS: Record<
  RecommendationInput["priority"],
  PriorityWeights
> = {
  biaya: {
    budget: 0.35,
    area: 0.15,
    bedrooms: 0.10,
    floors: 0.10,
    style: 0.08,
    duration: 0.07,
    climate: 0.15,
  },

  estetik: {
    budget: 0.10,
    area: 0.10,
    bedrooms: 0.10,
    floors: 0.10,
    style: 0.30,
    duration: 0.05,
    climate: 0.25,
  },

  cepat: {
    budget: 0.15,
    area: 0.10,
    bedrooms: 0.10,
    floors: 0.10,
    style: 0.05,
    duration: 0.35,
    climate: 0.15,
  },
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

// Menyamakan format nama lokasi, misalnya:
// "Kota Bandung" dan "Bandung".
function normalizeLocation(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^(kota|kabupaten)\s+/, "")
    .replace(/\s+/g, " ");
}

function normalizeStyle(value: string): string {
  return value.toLowerCase().trim();
}

// Menormalisasi bobot agar totalnya selalu 1.
// Digunakan juga ketika bobot iklim dikeluarkan saat fallback.
function normalizeWeights(
  weights: PriorityWeights,
  includeClimate: boolean
): PriorityWeights {
  const adjusted = {
    ...weights,
    climate: includeClimate ? weights.climate : 0,
  };

  const total = Object.values(adjusted).reduce(
    (sum, weight) => sum + weight,
    0
  );

  return {
    budget: adjusted.budget / total,
    area: adjusted.area / total,
    bedrooms: adjusted.bedrooms / total,
    floors: adjusted.floors / total,
    style: adjusted.style / total,
    duration: adjusted.duration / total,
    climate: adjusted.climate / total,
  };
}

// Menghitung jarak untuk setiap kriteria.
// Seluruh nilai jarak berada pada rentang 0 sampai 1.
function calculateDistances(
  design: HouseDesign,
  input: RecommendationInput,
  maxValues: {
    landArea: number;
    bedrooms: number;
    floors: number;
    duration: number;
  },
  climateScore: number | null
): Record<keyof PriorityWeights, number> {
  const designCost = Math.max(0, Number(design.estimatedCost) || 0);
  const designArea = Math.max(0, Number(design.landArea) || 0);
  const designBedrooms = Math.max(0, Number(design.bedrooms) || 0);
  const designFloors = Math.max(0, Number(design.floors) || 0);
  const designDuration = Math.max(
    0,
    Number(design.estimatedDuration) || 0
  );

  const effectiveBudget =
    input.budget * (1 + input.flexibility / 100);

  // Semakin murah dibandingkan batas budget,
  // semakin kecil jaraknya.
  const budgetDistance =
    effectiveBudget > 0
      ? clamp(designCost / effectiveBudget)
      : 1;

  // Desain yang membutuhkan lahan melebihi
  // luas tanah customer mendapatkan penalti.
  const areaDistance = clamp(
    Math.max(0, designArea - input.area) /
      Math.max(maxValues.landArea, input.area, 1)
  );

  // Jumlah kamar dan lantai dibandingkan
  // dengan kebutuhan customer.
  const bedroomDistance = clamp(
    Math.abs(designBedrooms - input.bedrooms) /
      Math.max(maxValues.bedrooms, input.bedrooms, 1)
  );

  const floorDistance = clamp(
    Math.abs(designFloors - input.floors) /
      Math.max(maxValues.floors, input.floors, 1)
  );

  // Gaya arsitektur merupakan kriteria kategorikal.
  const styleDistance =
    normalizeStyle(design.style) === normalizeStyle(input.style)
      ? 0
      : 1;

  // Durasi lebih pendek mendapatkan jarak lebih kecil.
  const durationDistance = clamp(
    designDuration / Math.max(maxValues.duration, 1)
  );

  // Skor iklim 0-1 diubah menjadi jarak ketidakcocokan.
  const climateDistance =
    climateScore === null
      ? 0
      : 1 - clamp(climateScore);

  return {
    budget: budgetDistance,
    area: areaDistance,
    bedrooms: bedroomDistance,
    floors: floorDistance,
    style: styleDistance,
    duration: durationDistance,
    climate: climateDistance,
  };
}

// Menghitung Weighted Euclidean Distance.
function calculateWeightedDistance(
  distances: Record<keyof PriorityWeights, number>,
  weights: PriorityWeights
): number {
  const squaredDistance =
    distances.budget ** 2 * weights.budget +
    distances.area ** 2 * weights.area +
    distances.bedrooms ** 2 * weights.bedrooms +
    distances.floors ** 2 * weights.floors +
    distances.style ** 2 * weights.style +
    distances.duration ** 2 * weights.duration +
    distances.climate ** 2 * weights.climate;

  return Math.sqrt(squaredDistance);
}

// Mengubah jarak menjadi skor kemiripan 0-100.
function calculateMatch(distance: number): number {
  return Math.round(clamp(1 - distance) * 100);
}

function createFactors(
  distances: Record<keyof PriorityWeights, number>,
  includeClimate: boolean
): RecommendationFactor[] {
  const factors: RecommendationFactor[] = [
    {
      label: "Kesesuaian budget",
      score: calculateMatch(distances.budget),
    },
    {
      label: "Kesesuaian luas tanah",
      score: calculateMatch(distances.area),
    },
    {
      label: "Jumlah kamar tidur",
      score: calculateMatch(distances.bedrooms),
    },
    {
      label: "Jumlah lantai",
      score: calculateMatch(distances.floors),
    },
    {
      label: "Gaya arsitektur",
      score: calculateMatch(distances.style),
    },
    {
      label: "Durasi pembangunan",
      score: calculateMatch(distances.duration),
    },
  ];

  if (includeClimate) {
    factors.push({
      label: "Kecocokan iklim",
      score: calculateMatch(distances.climate),
    });
  }

  return factors;
}

/**
 * Menghasilkan rekomendasi desain berdasarkan preferensi customer.
 *
 * Jika tersedia desain cocok secara iklim:
 * - Hanya desain dengan cocok=true pada lokasi pilihan yang dipertimbangkan.
 * - Skor iklim ikut dihitung.
 *
 * Jika tidak tersedia desain cocok secara iklim:
 * - Semua desain dipertimbangkan.
 * - Bobot iklim dikeluarkan.
 * - Bobot kriteria lain dinormalisasi kembali.
 */
export function recommendDesigns(
  designs: HouseDesign[],
  locationScores: DesignLocationScore[],
  input: RecommendationInput,
  limit = 6
): RecommendationResponse {
  if (designs.length === 0) {
    return {
      recommendations: [],
      usedLocationFallback: false,
      message: "Belum tersedia data desain rumah untuk direkomendasikan.",
    };
  }

  // Ambil skor lokasi sesuai pilihan customer
  // yang memiliki status cocok = true.
  const suitableLocationScores = locationScores.filter(
    (item) =>
      normalizeLocation(item.lokasi) ===
        normalizeLocation(input.location) &&
      item.cocok === true
  );

  // Tentukan apakah sistem perlu menggunakan fallback.
  const matchingSlugs = new Set(
    suitableLocationScores.map((item) => item.slug)
  );

  const suitableDesigns = designs.filter((design) =>
    matchingSlugs.has(design.slug)
  );

  const usedLocationFallback = suitableDesigns.length === 0;

  // Jika tidak ada desain cocok secara iklim,
  // gunakan seluruh desain berdasarkan preferensi lainnya.
  const candidateDesigns = usedLocationFallback
    ? designs
    : suitableDesigns;

  // Ambil skor iklim berdasarkan slug desain.
  const climateMap = new Map<string, number>();

  if (!usedLocationFallback) {
    suitableLocationScores.forEach((item) => {
      climateMap.set(
        item.slug,
        clamp(Number(item.skor_kecocokan_iklim) || 0)
      );
    });
  }

  // Nilai maksimum digunakan untuk normalisasi atribut numerik.
  const maxValues = {
    landArea: Math.max(
      1,
      ...designs.map((item) => Number(item.landArea) || 0)
    ),
    bedrooms: Math.max(
      1,
      ...designs.map((item) => Number(item.bedrooms) || 0)
    ),
    floors: Math.max(
      1,
      ...designs.map((item) => Number(item.floors) || 0)
    ),
    duration: Math.max(
      1,
      ...designs.map(
        (item) => Number(item.estimatedDuration) || 0
      )
    ),
  };

  // Ambil bobot berdasarkan prioritas customer.
  // Saat fallback, bobot iklim dikeluarkan dan
  // bobot kriteria lainnya dinormalisasi.
  const weights = normalizeWeights(
    PRIORITY_WEIGHTS[input.priority],
    !usedLocationFallback
  );

  const recommendations: RecommendedDesign[] = candidateDesigns
    .map((design) => {
      const climateScore = usedLocationFallback
        ? null
        : climateMap.get(design.slug) ?? null;

      const distances = calculateDistances(
        design,
        input,
        maxValues,
        climateScore
      );

      const distance = calculateWeightedDistance(
        distances,
        weights
      );

      return {
        ...design,
        distance,
        match: calculateMatch(distance),
        factors: createFactors(
          distances,
          !usedLocationFallback
        ),
        climateScore,
        locationSuitable: !usedLocationFallback,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(0, limit));

  return {
    recommendations,
    usedLocationFallback,
    message: usedLocationFallback
      ? `Belum ditemukan desain dengan kecocokan iklim untuk ${input.location}. Rekomendasi berikut disusun berdasarkan preferensi lainnya tanpa mempertimbangkan lokasi.`
      : `Rekomendasi disusun berdasarkan preferensi dan kecocokan iklim untuk ${input.location}.`,
  };
}