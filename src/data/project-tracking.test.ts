/**
 * White Box Testing — src/data/project-tracking.ts
 *
 * Teknik: Statement Coverage, Function Coverage, Boundary Value Testing
 *
 * Verifikasi struktur TRACKING_MILESTONE_TEMPLATE:
 * - Jumlah milestone = 6
 * - Setiap milestone memiliki id, title, description
 * - ID milestone unik dan sesuai nama tahap
 */

import { describe, it, expect } from "vitest";
import { TRACKING_MILESTONE_TEMPLATE } from "./project-tracking";

describe("TRACKING_MILESTONE_TEMPLATE — struktur milestone", () => {
  it("harus memiliki tepat 6 milestone", () => {
    expect(TRACKING_MILESTONE_TEMPLATE).toHaveLength(6);
  });

  it("setiap milestone harus memiliki id, title, dan description", () => {
    for (const milestone of TRACKING_MILESTONE_TEMPLATE) {
      expect(milestone.id).toBeTruthy();
      expect(milestone.title).toBeTruthy();
      expect(milestone.description).toBeTruthy();
    }
  });

  it("id milestone harus unik", () => {
    const ids = TRACKING_MILESTONE_TEMPLATE.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("milestone pertama: id = persiapan-fondasi", () => {
    expect(TRACKING_MILESTONE_TEMPLATE[0].id).toBe("persiapan-fondasi");
  });

  it("milestone kedua: id = struktur-utama", () => {
    expect(TRACKING_MILESTONE_TEMPLATE[1].id).toBe("struktur-utama");
  });

  it("milestone ketiga: id = dinding-penutup-atap", () => {
    expect(TRACKING_MILESTONE_TEMPLATE[2].id).toBe("dinding-penutup-atap");
  });

  it("milestone keempat: id = jalur-mep", () => {
    expect(TRACKING_MILESTONE_TEMPLATE[3].id).toBe("jalur-mep");
  });

  it("milestone kelima: id = finishing", () => {
    expect(TRACKING_MILESTONE_TEMPLATE[4].id).toBe("finishing");
  });

  it("milestone keenam: id = lingkungan-serah-terima", () => {
    expect(TRACKING_MILESTONE_TEMPLATE[5].id).toBe("lingkungan-serah-terima");
  });

  it("title milestone harus sesuai dengan nama tahap konstruksi", () => {
    const expectedTitles = [
      "Pekerjaan Persiapan & Fondasi",
      "Pekerjaan Struktur Utama",
      "Pekerjaan Dinding & Penutup Atap",
      "Instalasi Jalur MEP",
      "Pekerjaan Finishing",
      "Lingkungan Luar & Serah Terima",
    ];
    for (let i = 0; i < expectedTitles.length; i++) {
      expect(TRACKING_MILESTONE_TEMPLATE[i].title).toBe(expectedTitles[i]);
    }
  });

  it("boundary: tidak ada milestone dengan description kosong", () => {
    const empty = TRACKING_MILESTONE_TEMPLATE.filter(
      (m) => m.description.trim() === "",
    );
    expect(empty).toHaveLength(0);
  });

  it("boundary: tidak ada id yang mengandung spasi", () => {
    for (const m of TRACKING_MILESTONE_TEMPLATE) {
      expect(m.id).not.toContain(" ");
    }
  });

  it("jumlah milestone sama dengan jumlah tahap STAGE_TEMPLATE", async () => {
    const { STAGE_TEMPLATE } = await import("./stage-template");
    expect(TRACKING_MILESTONE_TEMPLATE.length).toBe(STAGE_TEMPLATE.length);
  });
});
