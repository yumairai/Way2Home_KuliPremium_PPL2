import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { HouseDesign } from "@/types/house-design";
import { getHouseDesign } from "@/data/house-designs";

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

export function transformDesignToHouseDesign(
  row: Record<string, unknown>,
  images: Array<{ url: string; urutan: number }> = [],
): HouseDesign {
  const sortedImages = [...images].sort(
    (a, b) => (a.urutan || 0) - (b.urutan || 0),
  );
  const mainImage = sortedImages[0]?.url || "/images/katalog/house-dummy1.webp";

  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.nama,
    style: row.gaya_arsitektur,
    location: row.lokasi || "Jawa Barat",
    landArea: Number(row.luas_tanah || 0),
    buildingArea: Number(row.luas_bangunan || 0),
    bedrooms: row.jumlah_kamar_tidur || 0,
    bathrooms: row.jumlah_kamar_mandi || 0,
    floors: row.jumlah_lantai || 1,
    estimatedCost: Number(row.estimasi_biaya || 0),
    estimatedDuration: Math.round((row.estimasi_durasi_hari || 0) / 30),
    estimatedDurationDays: row.estimasi_durasi_hari,
    description: row.deskripsi || "",
    highlights: row.highlights || [],
    image: mainImage,
    images: sortedImages.map((img) => img.url),
    spesifikasi:
      typeof row.spesifikasi === "object" && row.spesifikasi !== null
        ? row.spesifikasi
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

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil data katalog desain:", error);
    throw new Error("Gagal mengambil data katalog desain.");
  }

  let results: HouseDesign[] = (data || []).map(
    (row: Record<string, unknown>) =>
      transformDesignToHouseDesign(
        row,
        (row.design_images as Array<{ url: string; urutan: number }>) || [],
      ),
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
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[getDesignBySlug] error fetching design:", error);
  }

  if (error || !data) {
    const fallback = getHouseDesign(slug);
    return fallback ?? null;
  }

  return transformDesignToHouseDesign(
    data as Record<string, unknown>,
    ((data as Record<string, unknown>).design_images as Array<{
      url: string;
      urutan: number;
    }>) || [],
  );
}
