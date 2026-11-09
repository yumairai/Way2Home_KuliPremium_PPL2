import type { HouseDesign } from "@/types/house-design";

// ==========================================
// 1. INPUT REKOMENDASI
// ==========================================

export interface RecommendationInput {
  lokasi: string;
  luas_tanah: number;
  budget: number;
  jumlah_kamar_tidur: number;
  jumlah_lantai?: number;
  gaya_arsitektur?: string;
}

// ==========================================
// 2. DATA SKOR KEC0COKAN LOKASI
// ==========================================

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

// ==========================================
// 3. DATA DESAIN UNTUK REKOMENDASI
// ==========================================

export type RecommendationDesign = HouseDesign & {
  slug: string;
  highlights: string[];
  dasar_pemetaan?: string[];
};

// ==========================================
// 4. HASIL REKOMENDASI
// ==========================================

export type RecommendedDesign = RecommendationDesign & {
  similarity_score: number;
  climate_score: number | null;
  final_score: number;
  alasan_rekomendasi: string[];
};

// ==========================================
// 5. RESPONSE
// ==========================================

export interface RecommendationResponse {
  success: boolean;
  message: string;
  data: RecommendedDesign[];
}