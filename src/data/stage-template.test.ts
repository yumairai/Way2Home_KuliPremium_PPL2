/**
 * White Box Testing — src/data/stage-template.ts
 *
 * Teknik: Statement Coverage, Branch Coverage, Boundary Value Testing
 *
 * Verifikasi struktur STAGE_TEMPLATE:
 * - Jumlah tahap = 6
 * - Total bobot subtask = 100
 * - Setiap subtask memiliki title & weight > 0
 * - ISSUE_CATEGORIES memiliki value & label
 * - TEMPLATE_TOTAL_WEIGHT = 100
 */

import { describe, it, expect } from "vitest";
import {
  STAGE_TEMPLATE,
  TEMPLATE_TOTAL_WEIGHT,
  ISSUE_CATEGORIES,
} from "./stage-template";

describe("STAGE_TEMPLATE — struktur dan data", () => {
  it("harus memiliki tepat 6 tahap", () => {
    expect(STAGE_TEMPLATE).toHaveLength(6);
  });

  it("setiap tahap harus memiliki name dan subtasks", () => {
    for (const stage of STAGE_TEMPLATE) {
      expect(stage.name).toBeTruthy();
      expect(Array.isArray(stage.subtasks)).toBe(true);
      expect(stage.subtasks.length).toBeGreaterThan(0);
    }
  });

  it("setiap subtask harus memiliki title dan weight > 0", () => {
    for (const stage of STAGE_TEMPLATE) {
      for (const sub of stage.subtasks) {
        expect(sub.title).toBeTruthy();
        expect(typeof sub.weight).toBe("number");
        expect(sub.weight).toBeGreaterThan(0);
      }
    }
  });

  it("total bobot seluruh subtask harus tepat 100", () => {
    const total = STAGE_TEMPLATE.reduce(
      (acc, stage) =>
        acc + stage.subtasks.reduce((s, sub) => s + sub.weight, 0),
      0,
    );
    expect(total).toBeCloseTo(100, 5);
  });

  it("TEMPLATE_TOTAL_WEIGHT harus 100", () => {
    expect(TEMPLATE_TOTAL_WEIGHT).toBeCloseTo(100, 5);
  });

  it("tahap ke-1: Pekerjaan Persiapan & Fondasi — 4 subtask", () => {
    const stage = STAGE_TEMPLATE[0];
    expect(stage.name).toContain("Persiapan");
    expect(stage.subtasks).toHaveLength(4);
  });

  it("tahap ke-2: Pekerjaan Struktur Utama — 4 subtask", () => {
    const stage = STAGE_TEMPLATE[1];
    expect(stage.name).toContain("Struktur");
    expect(stage.subtasks).toHaveLength(4);
  });

  it("tahap ke-3: Dinding & Penutup Atap — 4 subtask", () => {
    const stage = STAGE_TEMPLATE[2];
    expect(stage.name).toContain("Dinding");
    expect(stage.subtasks).toHaveLength(4);
  });

  it("tahap ke-4: Instalasi Jalur MEP — 3 subtask", () => {
    const stage = STAGE_TEMPLATE[3];
    expect(stage.name).toContain("MEP");
    expect(stage.subtasks).toHaveLength(3);
  });

  it("tahap ke-5: Pekerjaan Finishing — 5 subtask", () => {
    const stage = STAGE_TEMPLATE[4];
    expect(stage.name).toContain("Finishing");
    expect(stage.subtasks).toHaveLength(5);
  });

  it("tahap ke-6: Lingkungan Luar & Serah Terima — 4 subtask", () => {
    const stage = STAGE_TEMPLATE[5];
    expect(stage.name).toContain("Serah Terima");
    expect(stage.subtasks).toHaveLength(4);
  });

  it("total subtask harus 24", () => {
    const total = STAGE_TEMPLATE.reduce(
      (acc, stage) => acc + stage.subtasks.length,
      0,
    );
    expect(total).toBe(24);
  });

  it("boundary: tidak ada subtask dengan weight <= 0", () => {
    const invalid = STAGE_TEMPLATE.flatMap((s) => s.subtasks).filter(
      (sub) => sub.weight <= 0,
    );
    expect(invalid).toHaveLength(0);
  });
});

describe("ISSUE_CATEGORIES — kategori kendala", () => {
  it("harus memiliki setidaknya satu kategori", () => {
    expect(ISSUE_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("setiap kategori harus memiliki value dan label", () => {
    for (const cat of ISSUE_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
    }
  });

  it("harus mengandung kategori CUACA_LINGKUNGAN", () => {
    const found = ISSUE_CATEGORIES.find((c) => c.value === "CUACA_LINGKUNGAN");
    expect(found).toBeDefined();
  });

  it("harus mengandung kategori MATERIAL_PERALATAN", () => {
    const found = ISSUE_CATEGORIES.find(
      (c) => c.value === "MATERIAL_PERALATAN",
    );
    expect(found).toBeDefined();
  });

  it("harus mengandung kategori TENAGA_KERJA", () => {
    const found = ISSUE_CATEGORIES.find((c) => c.value === "TENAGA_KERJA");
    expect(found).toBeDefined();
  });

  it("harus mengandung kategori LAINNYA", () => {
    const found = ISSUE_CATEGORIES.find((c) => c.value === "LAINNYA");
    expect(found).toBeDefined();
  });

  it("nilai value harus unik", () => {
    const values = ISSUE_CATEGORIES.map((c) => c.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
