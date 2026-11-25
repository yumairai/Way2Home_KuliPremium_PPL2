/**
 * White Box Testing — src/services/design.service.ts
 *
 * Fungsi yang diuji:
 * - getAllDesignLocationScores
 * - getDesignLocationScores
 * - transformDesignToHouseDesign
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllDesignLocationScores,
  getDesignLocationScores,
  transformDesignToHouseDesign,
} from "./design.service";

describe("getAllDesignLocationScores — Query skor lokasi desain", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("berhasil mengambil dan memetakan daftar skor lokasi yang cocok", async () => {
    const rawScores = [
      {
        slug: "modern-1",
        nama: "Modern 1",
        lokasi: "Bandung",
        skor_hujan: 0.8,
        skor_panas: 0.7,
        skor_kelembapan: 0.75,
        skor_kecocokan_iklim: 0.85,
        peringkat_lokasi_untuk_desain: 1,
        cocok: true,
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: rawScores,
            error: null,
          }),
        }),
      }),
    } as any;

    const result = await getAllDesignLocationScores(mockSupabase);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("modern-1");
    expect(result[0].skor_hujan).toBe(0.8);
    expect(result[0].cocok).toBe(true);
  });

  it("harus melempar error jika query database gagal", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("DB Error"),
          }),
        }),
      }),
    } as any;

    await expect(getAllDesignLocationScores(mockSupabase)).rejects.toThrow(
      "Gagal mengambil skor lokasi desain.",
    );
  });
});

describe("getDesignLocationScores — Query skor lokasi spesifik", () => {
  it("berhasil mengambil data berdasarkan lokasi dan cocok=true", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  slug: "klasik-1",
                  nama: "Klasik 1",
                  lokasi: "Bogor",
                  skor_hujan: 0.9,
                  cocok: true,
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const result = await getDesignLocationScores(mockSupabase, "Bogor");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("klasik-1");
    expect(result[0].lokasi).toBe("Bogor");
  });

  it("harus melempar error jika query gagal", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("DB timeout"),
            }),
          }),
        }),
      }),
    } as any;

    await expect(getDesignLocationScores(mockSupabase, "Jakarta")).rejects.toThrow(
      "Gagal mengambil skor desain berdasarkan lokasi.",
    );
  });
});

describe("transformDesignToHouseDesign — Transformasi Baris DB ke HouseDesign", () => {
  it("harus mengurutkan gambar berdasarkan urutan dan memilih gambar utama", () => {
    const row = {
      id: "des-1",
      slug: "scandinavian-1",
      nama: "Scandinavian House",
      gaya_arsitektur: "scandinavian",
      lokasi: "Bandung",
      luas_tanah: 150,
      luas_bangunan: 120,
      jumlah_kamar_tidur: 3,
      jumlah_kamar_mandi: 2,
      jumlah_lantai: 2,
      estimasi_biaya: 450_000_000,
      estimasi_durasi_hari: 180,
      deskripsi: "Rumah elegan gaya skandinavia",
      highlights: ["Taman", "Carport"],
    };

    const images = [
      { url: "/images/img-2.jpg", urutan: 2 },
      { url: "/images/img-1.jpg", urutan: 1 },
    ];

    const result = transformDesignToHouseDesign(row, images);
    expect(result.id).toBe("des-1");
    expect(result.slug).toBe("scandinavian-1");
    expect(result.name).toBe("Scandinavian House");
    expect(result.image).toBe("/images/img-1.jpg");
    expect(result.images).toEqual(["/images/img-1.jpg", "/images/img-2.jpg"]);
    expect(result.estimatedDuration).toBe(6); // 180 hari / 30 = 6 bulan
    expect(result.estimatedDurationDays).toBe(180);
  });

  it("harus menggunakan fallback image jika array gambar kosong", () => {
    const row = {
      slug: "minimal-1",
      nama: "Minimal House",
      estimasi_biaya: 200_000_000,
    };

    const result = transformDesignToHouseDesign(row, []);
    expect(result.image).toBe("/images/katalog/house-dummy1.webp");
  });
});
