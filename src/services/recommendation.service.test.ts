/**
 * White Box Testing — src/services/recommendation.service.ts
 *
 * Fungsi yang diuji:
 * - recommendDesigns (Content-Based / Multi-Criteria Distance Weighted Recommendation)
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Path Testing
 */

import { describe, it, expect } from "vitest";
import {
  recommendDesigns,
  type RecommendationInput,
  type DesignLocationScore,
} from "./recommendation.service";
import type { HouseDesign } from "@/types/house-design";

function mockHouseDesign(overrides: Partial<HouseDesign> = {}): HouseDesign {
  return {
    id: "desain-1",
    slug: "modern-minimalis",
    name: "Modern Minimalis",
    style: "modern",
    location: "Bandung",
    estimatedCost: 350_000_000,
    landArea: 120,
    buildingArea: 100,
    bedrooms: 3,
    floors: 2,
    estimatedDuration: 180,
    description: "Desain rumah modern",
    highlights: [],
    image: "/images/house.webp",
    ...overrides,
  };
}

function mockLocationScore(
  overrides: Partial<DesignLocationScore> = {},
): DesignLocationScore {
  return {
    slug: "modern-minimalis",
    nama: "Modern Minimalis",
    lokasi: "Bandung",
    skor_hujan: 0.8,
    skor_panas: 0.7,
    skor_kelembapan: 0.75,
    skor_kecocokan_iklim: 0.85,
    peringkat_lokasi_untuk_desain: 1,
    cocok: true,
    ...overrides,
  };
}

const defaultInput: RecommendationInput = {
  location: "Bandung",
  style: "modern",
  area: 150,
  bedrooms: 3,
  floors: 2,
  budget: 400_000_000,
  flexibility: 10,
  priority: "biaya",
};

describe("recommendDesigns — Rekomendasi Desain Rumah", () => {
  it("harus mengembalikan rekomendasi kosong jika data designs kosong", () => {
    const result = recommendDesigns([], [], defaultInput);
    expect(result.recommendations).toHaveLength(0);
    expect(result.usedLocationFallback).toBe(false);
    expect(result.message).toContain("Belum tersedia data desain");
  });

  it("harus menghitung rekomendasi dengan kecocokan iklim jika desain cocok tersedia di lokasi", () => {
    const designs = [
      mockHouseDesign({ slug: "modern-1", name: "Desain A", estimatedCost: 300_000_000 }),
      mockHouseDesign({ slug: "tropis-1", name: "Desain B", estimatedCost: 450_000_000 }),
    ];
    const scores = [
      mockLocationScore({ slug: "modern-1", lokasi: "Kota Bandung", cocok: true, skor_kecocokan_iklim: 0.9 }),
      mockLocationScore({ slug: "tropis-1", lokasi: "Kota Bandung", cocok: false, skor_kecocokan_iklim: 0.4 }),
    ];

    const result = recommendDesigns(designs, scores, defaultInput);

    expect(result.usedLocationFallback).toBe(false);
    expect(result.message).toContain("kecocokan iklim untuk Bandung");
    // Hanya desain dengan cocok=true yang direkomendasikan
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].slug).toBe("modern-1");
    expect(result.recommendations[0].locationSuitable).toBe(true);
    expect(result.recommendations[0].climateScore).toBe(0.9);
    expect(result.recommendations[0].match).toBeGreaterThan(0);
    expect(result.recommendations[0].factors.some((f) => f.label === "Kecocokan iklim")).toBe(true);
  });

  it("harus beralih ke location fallback jika tidak ada desain yang cocok secara iklim di lokasi tersebut", () => {
    const designs = [
      mockHouseDesign({ slug: "modern-1", name: "Desain A" }),
      mockHouseDesign({ slug: "tropis-1", name: "Desain B" }),
    ];
    // Tidak ada yang cocok (cocok = false atau lokasi berbeda)
    const scores = [
      mockLocationScore({ slug: "modern-1", lokasi: "Surabaya", cocok: true }),
    ];

    const result = recommendDesigns(designs, scores, defaultInput);

    expect(result.usedLocationFallback).toBe(true);
    expect(result.message).toContain("tanpa mempertimbangkan lokasi");
    // Seluruh desain dipertimbangkan
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].locationSuitable).toBe(false);
    expect(result.recommendations[0].climateScore).toBeNull();
    // Faktor kecocokan iklim tidak dimasukkan saat fallback
    expect(result.recommendations[0].factors.some((f) => f.label === "Kecocokan iklim")).toBe(false);
  });

  it("harus menerapkan bobot sesuai prioritas 'estetik'", () => {
    const designs = [
      mockHouseDesign({ slug: "modern-1", style: "modern", estimatedCost: 500_000_000 }),
      mockHouseDesign({ slug: "klasik-1", style: "klasik", estimatedCost: 300_000_000 }),
    ];
    const scores = [
      mockLocationScore({ slug: "modern-1", cocok: true }),
      mockLocationScore({ slug: "klasik-1", cocok: true }),
    ];

    const inputEstetik: RecommendationInput = {
      ...defaultInput,
      style: "modern",
      priority: "estetik",
    };

    const result = recommendDesigns(designs, scores, inputEstetik);
    expect(result.recommendations.length).toBeGreaterThan(0);
    // Desain modern memiliki jarak gaya = 0, sehingga unggul dalam prioritas estetik
    expect(result.recommendations[0].slug).toBe("modern-1");
  });

  it("harus menerapkan bobot sesuai prioritas 'cepat' berdasarkan durasi pembangunan", () => {
    const designs = [
      mockHouseDesign({ slug: "cepat-1", estimatedDuration: 90 }),
      mockHouseDesign({ slug: "lama-1", estimatedDuration: 360 }),
    ];
    const scores = [
      mockLocationScore({ slug: "cepat-1", cocok: true }),
      mockLocationScore({ slug: "lama-1", cocok: true }),
    ];

    const inputCepat: RecommendationInput = {
      ...defaultInput,
      priority: "cepat",
    };

    const result = recommendDesigns(designs, scores, inputCepat);
    expect(result.recommendations[0].slug).toBe("cepat-1");
  });

  it("harus menghormati batas limit yang diberikan", () => {
    const designs = [1, 2, 3, 4, 5].map((i) =>
      mockHouseDesign({ slug: `desain-${i}`, name: `Desain ${i}` }),
    );
    const scores = [1, 2, 3, 4, 5].map((i) =>
      mockLocationScore({ slug: `desain-${i}`, cocok: true }),
    );

    const result = recommendDesigns(designs, scores, defaultInput, 2);
    expect(result.recommendations).toHaveLength(2);
  });

  it("boundary value: penalti luas tanah hanya berlaku jika luas tanah desain > luas tanah input", () => {
    const designBesar = mockHouseDesign({ slug: "d-besar", landArea: 200 }); // > 150
    const designPas = mockHouseDesign({ slug: "d-pas", landArea: 100 });    // <= 150

    const scores = [
      mockLocationScore({ slug: "d-besar", cocok: true }),
      mockLocationScore({ slug: "d-pas", cocok: true }),
    ];

    const result = recommendDesigns([designBesar, designPas], scores, defaultInput);
    // designPas tidak mendapat penalti area
    const pasFactor = result.recommendations.find((r) => r.slug === "d-pas")?.factors.find((f) => f.label === "Kesesuaian luas tanah");
    const besarFactor = result.recommendations.find((r) => r.slug === "d-besar")?.factors.find((f) => f.label === "Kesesuaian luas tanah");

    expect(pasFactor?.score).toBe(100);
    expect((besarFactor?.score ?? 0)).toBeLessThan(100);
  });

  it("boundary value: budget fleksibilitas 0% vs nominal budget 0", () => {
    const design = mockHouseDesign({ slug: "d-1", estimatedCost: 100_000_000 });
    const scores = [mockLocationScore({ slug: "d-1", cocok: true })];

    const inputZeroBudget: RecommendationInput = {
      ...defaultInput,
      budget: 0,
      flexibility: 0,
    };

    const result = recommendDesigns([design], scores, inputZeroBudget);
    expect(result.recommendations[0].match).toBeDefined();
  });
});
