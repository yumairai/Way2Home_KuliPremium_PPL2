/**
 * White Box Testing — src/services/ai-kendala.service.ts
 *
 * Fungsi yang diuji:
 * - analyzeCostRisk (Rule-Based Cost Risk Analysis)
 * - getMitigationOptions (Rule-Based Recommendations)
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Path Testing
 */

import { describe, it, expect } from "vitest";
import { analyzeCostRisk } from "./ai-kendala.service";

describe("analyzeCostRisk — Evaluasi Rule-Based Risiko Biaya Kendala", () => {
  // 1. Kondisi BELUM DAPAT DINILAI: Karakter < 12 atau kata generik
  it("harus mengembalikan BELUM DAPAT DINILAI jika teks terlalu pendek (< 12 karakter)", () => {
    const result = analyzeCostRisk("MATERIAL_PERALATAN", "rusak", "sedang kerja", "");
    expect(result.overbudget_risk).toBe("BELUM DAPAT DINILAI");
    expect(result.cost_notes).toContain("belum mencukupi");
  });

  it("harus mengembalikan BELUM DAPAT DINILAI jika hanya kata generik seperti 'ada kendala'", () => {
    const result = analyzeCostRisk("CUACA_LINGKUNGAN", "ada kendala", "aman", "");
    expect(result.overbudget_risk).toBe("BELUM DAPAT DINILAI");
  });

  // 2. Deteksi HIGH: Penggantian material
  it("harus mengembalikan HIGH jika kendala menyebutkan penggantian material rusak/cacat", () => {
    const result = analyzeCostRisk(
      "MATERIAL_PERALATAN",
      "Keramik lantai pecah saat pengiriman, perlu ganti material baru sebanyak 10 dus",
      "Pemasangan keramik terhenti",
      "Menunggu konfirmasi supplier",
    );
    expect(result.overbudget_risk).toBe("HIGH");
    expect(result.cost_notes).toContain("penggantian material");
  });

  // 3. Deteksi HIGH: Tambahan tenaga kerja / alat berat
  it("harus mengembalikan HIGH jika kendala membutuhkan tambahan tenaga kerja atau sewa alat", () => {
    const result = analyzeCostRisk(
      "TENAGA_KERJA",
      "Pekerjaan galian tanah terlalu keras, butuh sewa alat berat excavator mini",
      "Tanah berbatu",
      "Direncanakan pengerjaan 2 hari",
    );
    expect(result.overbudget_risk).toBe("HIGH");
    expect(result.cost_notes).toContain("penambahan tenaga kerja atau penyewaan alat");
  });

  // 4. Deteksi HIGH: Pengerjaan ulang (rework / bongkar / cor ulang)
  it("harus mengembalikan HIGH jika kendala berupa pengerjaan ulang (cor ulang/bongkar)", () => {
    const result = analyzeCostRisk(
      "TEKNIS_KONSTRUKSI",
      "Campuran semen kolom tidak merata sehingga keropos, perlu cor ulang dan bobok beton",
      "Struktur tiang lt 1",
      "",
    );
    expect(result.overbudget_risk).toBe("HIGH");
    expect(result.cost_notes).toContain("pengerjaan ulang");
  });

  // 5. Deteksi HIGH: Perubahan spesifikasi / change order
  it("harus mengembalikan HIGH jika ada perubahan spesifikasi atau upgrade material", () => {
    const result = analyzeCostRisk(
      "DESAIN_SPESIFIKASI",
      "Customer meminta perubahan spesifikasi genteng menjadi genteng keramik glasur",
      "Rangka atap siap",
      "Ada change order",
    );
    expect(result.overbudget_risk).toBe("HIGH");
    expect(result.cost_notes).toContain("spesifikasi atau perubahan desain");
  });

  // 6. Deteksi MEDIUM: Potensi sumber daya tambahan / belum pasti
  it("harus mengembalikan MEDIUM jika ada potensi kendala atau dampak belum pasti", () => {
    const result = analyzeCostRisk(
      "CUACA_LINGKUNGAN",
      "Hujan lebat terus menerus berpotensi menyebabkan genangan dan memperlambat galian",
      "Lahan becek",
      "Mungkin tertunda",
    );
    expect(result.overbudget_risk).toBe("MEDIUM");
    expect(result.cost_notes).toContain("berpotensi membutuhkan");
  });

  // 7. Deteksi LOW: Tidak ada indikasi biaya tambahan (hanya koordinasi/penataan)
  it("harus mengembalikan LOW jika kendala operasional ringan tanpa dampak biaya", () => {
    const result = analyzeCostRisk(
      "TEKNIS_KONSTRUKSI",
      "Kunci gudang material sempat tertinggal oleh mandor sehingga tukang menunggu 30 menit",
      "Pekerjaan berlanjut normal",
      "Hanya koordinasi internal",
    );
    expect(result.overbudget_risk).toBe("LOW");
    expect(result.cost_notes).toContain("tanpa indikasi kebutuhan biaya tambahan");
  });

  // Boundary: Whitespace trimming dan case insensitivity
  it("harus tahan terhadap case dan spasi berlebih", () => {
    const result = analyzeCostRisk(
      "MATERIAL_PERALATAN",
      "   MATERIAL PECAH DAN BUTUH BELI ULANG SEMEN 5 SAK   ",
      "",
      "",
    );
    expect(result.overbudget_risk).toBe("HIGH");
  });
});
