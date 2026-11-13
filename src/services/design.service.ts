import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { HouseDesign } from "@/types/house-design";
import { getHouseDesign } from "@/data/house-designs";
import { toUiLocation } from "@/data/location-mapping";
import type { DesignLocationScore } from "./recommendation.types";

export type { DesignLocationScore } from "./recommendation.types";

export type DesignFilters = {
  query?: string;
  style?: string;
  minPrice?: number;
  maxPrice?: number;
  minLand?: number;
  maxLand?: number;
  minBuilding?: number;
  maxBuilding?: number;
  bedrooms?: string | number;
  sort?: string;
};

type DesignLocationScoreRow = Pick<
  Database["public"]["Tables"]["design_location_scores"]["Row"],
  | "slug"
  | "nama"
  | "lokasi"
  | "skor_hujan"
  | "skor_panas"
  | "skor_kelembapan"
  | "skor_kecocokan_iklim"
  | "peringkat_lokasi_untuk_desain"
  | "cocok"
>;

function mapDesignLocationScore(
  row: DesignLocationScoreRow,
): DesignLocationScore {
  return {
    slug: row.slug,
    nama: row.nama,
    lokasi: row.lokasi,
    skor_hujan: Number(row.skor_hujan ?? 0),
    skor_panas: Number(row.skor_panas ?? 0),
    skor_kelembapan: Number(row.skor_kelembapan ?? 0),
    skor_kecocokan_iklim: Number(row.skor_kecocokan_iklim ?? 0),
    peringkat_lokasi_untuk_desain: Number(
      row.peringkat_lokasi_untuk_desain ?? 0,
    ),
    cocok: row.cocok,
  };
}

export async function getAllDesignLocationScores(
  supabase: SupabaseClient<Database>,
): Promise<DesignLocationScore[]> {
  const { data, error } = await supabase
    .from("design_location_scores")
    .select(
      "slug, nama, lokasi, skor_hujan, skor_panas, skor_kelembapan, skor_kecocokan_iklim, peringkat_lokasi_untuk_desain, cocok",
    )
    .eq("cocok", true);

  if (error) {
    console.error("Gagal mengambil skor lokasi desain:", error);
    throw new Error("Gagal mengambil skor lokasi desain.");
  }

  return (data ?? []).map(mapDesignLocationScore);
}

export async function getDesignLocationScores(
  supabase: SupabaseClient<Database>,
  lokasi: string,
): Promise<DesignLocationScore[]> {
  const { data, error } = await supabase
    .from("design_location_scores")
    .select(
      "slug, nama, lokasi, skor_hujan, skor_panas, skor_kelembapan, skor_kecocokan_iklim, peringkat_lokasi_untuk_desain, cocok",
    )
    .eq("lokasi", lokasi)
    .eq("cocok", true);

  if (error) {
    console.error("Gagal mengambil skor desain berdasarkan lokasi:", error);
    throw new Error("Gagal mengambil skor desain berdasarkan lokasi.");
  }

  return (data ?? []).map(mapDesignLocationScore);
}

export function transformDesignToHouseDesign(
  row: Record<string, unknown>,
  images: Array<{ url: string; urutan: number }> = [],
): HouseDesign {
  const sortedImages = [...images].sort(
    (a, b) => (a.urutan || 0) - (b.urutan || 0),
  );
  const mainImage = sortedImages[0]?.url || "/images/katalog/house-dummy1.webp";

  const locationRows = Array.isArray(row.design_location_scores)
    ? (row.design_location_scores as Array<{
        lokasi: string;
        peringkat_lokasi_untuk_desain: number | null;
      }>)
    : [];
  const lokasiCocok = [...locationRows]
    .sort(
      (a, b) =>
        Number(a.peringkat_lokasi_untuk_desain ?? 0) -
        Number(b.peringkat_lokasi_untuk_desain ?? 0),
    )
    .map((item) => item.lokasi);

  return {
    id: row.id as string | undefined,
    slug: (row.slug as string) || (row.id as string),
    name: row.nama as string,
    style: row.gaya_arsitektur as string,
    location: toUiLocation((row.lokasi as string) || "Jawa Barat"),
    landArea: Number(row.luas_tanah || 0),
    buildingArea: Number(row.luas_bangunan || 0),
    bedrooms: Number(row.jumlah_kamar_tidur || 0),
    bathrooms: Number(row.jumlah_kamar_mandi || 0),
    floors: Number(row.jumlah_lantai || 1),
    estimatedCost: Number(row.estimasi_biaya || 0),
    estimatedDuration: Math.round(Number(row.estimasi_durasi_hari || 0) / 30),
    estimatedDurationDays:
      row.estimasi_durasi_hari != null
        ? Number(row.estimasi_durasi_hari)
        : undefined,
    description: (row.deskripsi as string) || "",
    highlights: (row.highlights as string[]) || [],
    dasarPemetaan: (row.dasar_pemetaan as string[]) || [],
    lokasiCocok,
    lokasi_cocok: [],
    image: mainImage,
    images: sortedImages.map((img) => img.url),
    spesifikasi:
      typeof row.spesifikasi === "object" && row.spesifikasi !== null
        ? (row.spesifikasi as Record<string, unknown>)
        : {},
  } as HouseDesign;
}

export async function getDesigns(
  supabase: SupabaseClient<Database>,
  filters?: DesignFilters,
): Promise<HouseDesign[]> {
  let query = supabase
    .from("designs")
    .select(
      `
      *,
      design_images (
        url,
        urutan
      )
    `,
    )
    .eq("is_active", true);

  if (filters?.style && filters.style !== "Semua gaya") {
    query = query.eq("gaya_arsitektur", filters.style);
  }

  if (filters?.minPrice !== undefined && !isNaN(filters.minPrice)) {
    query = query.gte("estimasi_biaya", filters.minPrice);
  }
  if (
    filters?.maxPrice !== undefined &&
    !isNaN(filters.maxPrice) &&
    isFinite(filters.maxPrice)
  ) {
    query = query.lte("estimasi_biaya", filters.maxPrice);
  }

  if (filters?.minLand !== undefined && !isNaN(filters.minLand)) {
    query = query.gte("luas_tanah", filters.minLand);
  }
  if (
    filters?.maxLand !== undefined &&
    !isNaN(filters.maxLand) &&
    isFinite(filters.maxLand)
  ) {
    query = query.lte("luas_tanah", filters.maxLand);
  }

  if (filters?.minBuilding !== undefined && !isNaN(filters.minBuilding)) {
    query = query.gte("luas_bangunan", filters.minBuilding);
  }
  if (
    filters?.maxBuilding !== undefined &&
    !isNaN(filters.maxBuilding) &&
    isFinite(filters.maxBuilding)
  ) {
    query = query.lte("luas_bangunan", filters.maxBuilding);
  }

  if (filters?.bedrooms && filters.bedrooms !== "Semua kamar") {
    if (
      filters.bedrooms === "4 kamar atau lebih" ||
      Number(filters.bedrooms) >= 4
    ) {
      query = query.gte("jumlah_kamar_tidur", 4);
    } else {
      const numBedrooms =
        typeof filters.bedrooms === "number"
          ? filters.bedrooms
          : parseInt(String(filters.bedrooms)[0], 10);
      if (!isNaN(numBedrooms)) {
        query = query.eq("jumlah_kamar_tidur", numBedrooms);
      }
    }
  }

  if (
    filters?.sort === "Harga terendah" ||
    filters?.sort === "harga_terendah"
  ) {
    query = query.order("estimasi_biaya", { ascending: true });
  } else if (
    filters?.sort === "Harga tertinggi" ||
    filters?.sort === "harga_tertinggi"
  ) {
    query = query.order("estimasi_biaya", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const [{ data, error }, locationScores] = await Promise.all([
    query,
    getAllDesignLocationScores(supabase).catch((scoreError: unknown) => {
      console.error(
        "Skor lokasi tidak dapat dimuat untuk katalog:",
        scoreError,
      );
      return [];
    }),
  ]);

  if (error) {
    console.error("Gagal mengambil data katalog desain:", error);
    throw new Error("Gagal mengambil data katalog desain.");
  }

  const locationsBySlug = new Map<string, Set<string>>();
  for (const score of locationScores) {
    const locations = locationsBySlug.get(score.slug) ?? new Set<string>();
    locations.add(toUiLocation(score.lokasi));
    locationsBySlug.set(score.slug, locations);
  }

  let results: HouseDesign[] = (data || []).map(
    (row: Record<string, unknown>) => ({
      ...transformDesignToHouseDesign(
        row,
        (row.design_images as Array<{ url: string; urutan: number }>) || [],
      ),
      lokasi_cocok: Array.from(
        locationsBySlug.get(String(row.slug ?? row.id)) ?? [],
      ),
    }),
  );

  if (filters?.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    results = results.filter(
      (item: HouseDesign) =>
        item.name.toLowerCase().includes(q) ||
        item.style.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q),
    );
  }

  return results;
}

export async function getDesignBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<HouseDesign | null> {
  const { data, error } = await supabase
    .from("designs")
    .select(
      `
      *,
      design_images (
        url,
        urutan
      ),
      design_location_scores (
        lokasi,
        peringkat_lokasi_untuk_desain
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("design_location_scores.cocok", true)
    .order("peringkat_lokasi_untuk_desain", {
      referencedTable: "design_location_scores",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    console.error("[getDesignBySlug] error fetching design:", error);
  }

  if (error || !data) {
    const fallback = getHouseDesign(slug);
    return fallback
      ? {
          ...fallback,
          location: toUiLocation(fallback.location),
          lokasi_cocok: fallback.lokasi_cocok?.map(toUiLocation) ?? [],
        }
      : null;
  }

  return transformDesignToHouseDesign(
    data as Record<string, unknown>,
    ((data as Record<string, unknown>).design_images as Array<{
      url: string;
      urutan: number;
    }>) || [],
  );
}
