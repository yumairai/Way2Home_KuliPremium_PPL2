
import { describe, it, expect } from "vitest";
import {
  formatRupiah,
  formatDate,
  formatDateTimeComma,
  formatDateTimeDot,
  formatMonthDay,
  formatDateOnly,
} from "./format";

describe("formatRupiah", () => {
  it("mengubah angka menjadi format Rupiah", () => {
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
  });

  it("menangani nilai nol", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });
});

describe("formatDate", () => {
  it("menampilkan tanggal dalam format Indonesia", () => {
    expect(formatDate("2026-10-15T12:00:00Z")).toBe("15 Okt 2026");
  });
});

describe("formatDateTimeComma", () => {
  it("menampilkan tanggal dan waktu dalam format Indonesia", () => {
    const result = formatDateTimeComma("2026-10-15T12:35:00Z");

    expect(result).toContain("15 Okt 2026");
    expect(result).toMatch(/\d{1,2}\.\d{2}/);
  });
});

describe("formatDateTimeDot", () => {
  it("memisahkan tanggal dan waktu dengan titik tengah", () => {
    const result = formatDateTimeDot("2026-10-15T12:35:00Z");

    expect(result).toContain("15 Okt 2026");
    expect(result).toContain(" · ");
    expect(result).toMatch(/\d{1,2}\.\d{2}/);
  });
});

describe("formatMonthDay", () => {
  it("menampilkan tanggal dan bulan tanpa tahun", () => {
    expect(formatMonthDay("2026-10-15T12:00:00Z")).toBe("15 Okt");
  });
});

describe("formatDateOnly", () => {
  it("menangani tanggal date-only tanpa mengubah harinya", () => {
    expect(formatDateOnly("2026-09-02")).toBe("2 Sep 2026");
  });

  it("tetap menerima tanggal yang sudah memiliki informasi waktu", () => {
    expect(formatDateOnly("2026-10-15T12:00:00Z")).toBe("15 Okt 2026");
  });
});
