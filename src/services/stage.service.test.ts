/**
 * White Box Testing — src/services/stage.service.ts
 *
 * Fungsi yang diuji:
 * - normalizeStageRows
 * - calculateOfficialProgress
 * - findCurrentStage
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Path Testing
 */

import { describe, it, expect } from "vitest";
import {
  normalizeStageRows,
  calculateOfficialProgress,
  findCurrentStage,
  type StageDTO,
} from "./stage.service";

describe("normalizeStageRows — Normalisasi baris mentah project_stages & subtasks", () => {
  it("harus menghitung ulang progress_percentage secara dinamis dari bobot subtask", () => {
    const rawRows = [
      {
        id: "s-1",
        project_id: "p-1",
        nama_tahap: "Fondasi",
        urutan: 1,
        progress_percentage: 0,
        status: "belum_mulai",
        project_subtasks: [
          { id: "sub-1", judul: "Galian", bobot: 5, selesai: true },
          { id: "sub-2", judul: "Pengecoran", bobot: 15, selesai: false },
        ],
      },
    ];

    const result = normalizeStageRows(rawRows);
    expect(result).toHaveLength(1);
    // Total bobot = 20, selesai = 5 -> (5/20) * 100 = 25%
    expect(result[0].progress_percentage).toBe(25);
    expect(result[0].status).toBe("berjalan");
    expect(result[0].subtasks).toHaveLength(2);
    expect(result[0].subtasks[0].selesai).toBe(true);
    expect(result[0].subtasks[1].selesai).toBe(false);
  });

  it("harus menandai status 'selesai' jika progress mencapai 100%", () => {
    const rawRows = [
      {
        id: "s-1",
        nama_tahap: "Fondasi",
        urutan: 1,
        progress_percentage: 0,
        status: "berjalan",
        project_subtasks: [
          { id: "sub-1", bobot: 10, selesai: true },
          { id: "sub-2", bobot: 10, selesai: true },
        ],
      },
    ];

    const result = normalizeStageRows(rawRows);
    expect(result[0].progress_percentage).toBe(100);
    expect(result[0].status).toBe("selesai");
  });

  it("harus menghasilkan progress_percentage 0 jika tahap tidak memiliki subtask", () => {
    const rawRows = [
      {
        id: "s-1",
        nama_tahap: "Persiapan",
        urutan: 1,
        progress_percentage: 40,
        status: "berjalan",
        project_subtasks: [],
      },
    ];

    const result = normalizeStageRows(rawRows);
    expect(result[0].progress_percentage).toBe(0);
    expect(result[0].status).toBe("belum_mulai");
  });

  it("harus menangani bobot non-finite atau negatif dengan menjadikannya 0", () => {
    const rawRows = [
      {
        id: "s-1",
        nama_tahap: "Struktur",
        urutan: 2,
        project_subtasks: [
          { id: "sub-1", bobot: -5, selesai: false },
          { id: "sub-2", bobot: NaN, selesai: false },
          { id: "sub-3", bobot: 10, selesai: true },
        ],
      },
    ];

    const result = normalizeStageRows(rawRows);
    expect(result[0].subtasks[0].bobot).toBe(0);
    expect(result[0].subtasks[1].bobot).toBe(0);
    expect(result[0].subtasks[2].bobot).toBe(10);
    expect(result[0].progress_percentage).toBe(100);
  });
});

describe("calculateOfficialProgress — Perhitungan progres resmi proyek", () => {
  it("harus mengembalikan 0 jika stages kosong", () => {
    expect(calculateOfficialProgress([])).toBe(0);
  });

  it("harus menghitung persentase dari rasio bobot subtask selesai terhadap total bobot", () => {
    const stages: StageDTO[] = [
      {
        id: "s-1",
        project_id: "p-1",
        nama_tahap: "Tahap 1",
        urutan: 1,
        progress_percentage: 100,
        status: "selesai",
        keterangan: null,
        tanggal_mulai: null,
        tanggal_selesai: null,
        subtasks: [
          { id: "sub-1", judul: "A", bobot: 15, urutan: 1, target_selesai: null, selesai: true },
        ],
      },
      {
        id: "s-2",
        project_id: "p-1",
        nama_tahap: "Tahap 2",
        urutan: 2,
        progress_percentage: 50,
        status: "berjalan",
        keterangan: null,
        tanggal_mulai: null,
        tanggal_selesai: null,
        subtasks: [
          { id: "sub-2", judul: "B", bobot: 12.5, urutan: 1, target_selesai: null, selesai: true },
          { id: "sub-3", judul: "C", bobot: 12.5, urutan: 2, target_selesai: null, selesai: false },
        ],
      },
    ];

    // Total selesai = 27.5, Total bobot = 40 -> (27.5 / 40) * 100 = 68.75 -> round to 69
    expect(calculateOfficialProgress(stages)).toBe(69);
  });

  it("boundary value: tidak boleh melebihi 100 (clamp)", () => {
    const stages: StageDTO[] = [
      {
        id: "s-1",
        project_id: "p-1",
        nama_tahap: "Tahap 1",
        urutan: 1,
        progress_percentage: 100,
        status: "selesai",
        keterangan: null,
        tanggal_mulai: null,
        tanggal_selesai: null,
        subtasks: [
          { id: "sub-1", judul: "A", bobot: 120, urutan: 1, target_selesai: null, selesai: true },
        ],
      },
    ];

    expect(calculateOfficialProgress(stages)).toBe(100);
  });
});

describe("findCurrentStage — Penentuan tahap konstruksi aktif", () => {
  it("harus mengembalikan undefined jika daftar stages kosong", () => {
    expect(findCurrentStage([])).toBeUndefined();
  });

  it("harus mengambil tahap pertama yang memiliki progress_percentage < 100", () => {
    const stages: StageDTO[] = [
      { id: "s-1", urutan: 1, progress_percentage: 100, status: "selesai" } as any,
      { id: "s-2", urutan: 2, progress_percentage: 40, status: "berjalan" } as any,
      { id: "s-3", urutan: 3, progress_percentage: 0, status: "belum_mulai" } as any,
    ];

    const current = findCurrentStage(stages);
    expect(current?.id).toBe("s-2");
  });

  it("harus mengambil tahap berikutnya jika tahap pertama sudah 100%", () => {
    const stages: StageDTO[] = [
      { id: "s-1", urutan: 1, progress_percentage: 100, status: "selesai" } as any,
      { id: "s-2", urutan: 2, progress_percentage: 0, status: "belum_mulai" } as any,
      { id: "s-3", urutan: 3, progress_percentage: 0, status: "belum_mulai" } as any,
    ];

    const current = findCurrentStage(stages);
    expect(current?.id).toBe("s-2");
  });

  it("harus mengambil tahap terakhir jika semua tahap telah mencapai progress 100%", () => {
    const stages: StageDTO[] = [
      { id: "s-1", urutan: 1, progress_percentage: 100, status: "selesai" } as any,
      { id: "s-2", urutan: 2, progress_percentage: 100, status: "selesai" } as any,
    ];

    const current = findCurrentStage(stages);
    expect(current?.id).toBe("s-2");
  });
});
