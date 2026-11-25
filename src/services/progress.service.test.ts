/**
 * White Box Testing — src/services/progress.service.ts
 *
 * Fungsi yang diuji:
 * - calculateOverallProgress
 * - stagesToMilestones
 * - getProjectProgressAccess
 * - getProjectProgress
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi } from "vitest";
import {
  calculateOverallProgress,
  stagesToMilestones,
  getProjectProgressAccess,
} from "./progress.service";
import type { Database } from "@/types/database.types";

type Stage = Database["public"]["Tables"]["project_stages"]["Row"];
type Subtask = Database["public"]["Tables"]["project_subtasks"]["Row"];

function mockStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "stage-1",
    project_id: "proj-1",
    nama_tahap: "Pekerjaan Persiapan & Fondasi",
    urutan: 1,
    progress_percentage: 0,
    status: "belum_mulai",
    keterangan: "Tahap 1",
    tanggal_mulai: null,
    tanggal_selesai: null,
    updated_at: new Date().toISOString(),
    updated_by: null,
    ...overrides,
  };
}

function mockSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    id: "sub-1",
    project_stage_id: "stage-1",
    judul: "Pembersihan Lahan",
    urutan: 1,
    bobot: 25,
    selesai: false,
    completed_at: null,
    target_selesai: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateOverallProgress
// ---------------------------------------------------------------------------
describe("calculateOverallProgress — kalkulasi progres keseluruhan", () => {
  it("harus null jika jumlah stage bukan 6 (misal 5 stage)", () => {
    const stages = [1, 2, 3, 4, 5].map((i) =>
      mockStage({ urutan: i, progress_percentage: 20 }),
    );
    expect(calculateOverallProgress(stages)).toBeNull();
  });

  it("harus null jika stages kosong []", () => {
    expect(calculateOverallProgress([])).toBeNull();
  });

  it("harus menghitung rata-rata jika tepat 6 stage (semua 0%)", () => {
    const stages = [1, 2, 3, 4, 5, 6].map((i) =>
      mockStage({ urutan: i, progress_percentage: 0 }),
    );
    expect(calculateOverallProgress(stages)).toBe(0);
  });

  it("harus menghitung rata-rata jika tepat 6 stage (semua 100%)", () => {
    const stages = [1, 2, 3, 4, 5, 6].map((i) =>
      mockStage({ urutan: i, progress_percentage: 100 }),
    );
    expect(calculateOverallProgress(stages)).toBe(100);
  });

  it("harus membulatkan ke 1 angka di belakang koma (misal: tahap 1 = 50%, lainnya 0)", () => {
    // 50 / 6 = 8.333... -> 8.3
    const stages = [
      mockStage({ urutan: 1, progress_percentage: 50 }),
      ...[2, 3, 4, 5, 6].map((i) =>
        mockStage({ urutan: i, progress_percentage: 0 }),
      ),
    ];
    expect(calculateOverallProgress(stages)).toBe(8.3);
  });

  it("boundary value: total 7 stage harus null", () => {
    const stages = [1, 2, 3, 4, 5, 6, 7].map((i) =>
      mockStage({ urutan: i, progress_percentage: 10 }),
    );
    expect(calculateOverallProgress(stages)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// stagesToMilestones
// ---------------------------------------------------------------------------
describe("stagesToMilestones — transformasi stage ke struktur milestones", () => {
  it("harus mengurutkan stage berdasarkan urutan ascending", () => {
    const stage2 = mockStage({ id: "s2", urutan: 2, nama_tahap: "Pekerjaan Struktur Utama" });
    const stage1 = mockStage({ id: "s1", urutan: 1, nama_tahap: "Pekerjaan Persiapan & Fondasi" });

    const milestones = stagesToMilestones([stage2, stage1]);
    expect(milestones[0].id).toBe("persiapan-fondasi");
    expect(milestones[1].id).toBe("struktur-utama");
  });

  it("harus menghitung progress dinamis dari bobot subtask", () => {
    const stage = mockStage({ id: "s1", urutan: 1, progress_percentage: 0 });
    const subtasks: Subtask[] = [
      mockSubtask({ id: "sub1", project_stage_id: "s1", bobot: 50, selesai: true }),
      mockSubtask({ id: "sub2", project_stage_id: "s1", bobot: 50, selesai: false }),
    ];
    const subtaskMap = new Map<string, Subtask[]>([["s1", subtasks]]);

    const milestones = stagesToMilestones([stage], subtaskMap);
    expect(milestones[0].progress).toBe(50);
    expect(milestones[0].status).toBe("in-progress");
    expect(milestones[0].tasks).toHaveLength(2);
    expect(milestones[0].tasks[0].status).toBe("completed");
    expect(milestones[0].tasks[1].status).toBe("pending");
  });

  it("harus menandai completed jika progress mencapai 100", () => {
    const stage = mockStage({ id: "s1", urutan: 1, progress_percentage: 0 });
    const subtasks: Subtask[] = [
      mockSubtask({ id: "sub1", project_stage_id: "s1", bobot: 50, selesai: true }),
      mockSubtask({ id: "sub2", project_stage_id: "s1", bobot: 50, selesai: true }),
    ];
    const subtaskMap = new Map<string, Subtask[]>([["s1", subtasks]]);

    const milestones = stagesToMilestones([stage], subtaskMap);
    expect(milestones[0].progress).toBe(100);
    expect(milestones[0].status).toBe("completed");
  });

  it("harus menggunakan stage.progress_percentage jika total bobot subtask 0", () => {
    const stage = mockStage({ id: "s1", urutan: 1, progress_percentage: 45, status: "berjalan" });
    const milestones = stagesToMilestones([stage], new Map());
    expect(milestones[0].progress).toBe(45);
    expect(milestones[0].status).toBe("in-progress");
  });

  it("status stage 'selesai' harus mapped ke 'completed'", () => {
    const stage = mockStage({ id: "s1", urutan: 1, status: "selesai" });
    const milestones = stagesToMilestones([stage]);
    expect(milestones[0].status).toBe("completed");
  });

  it("status stage 'berjalan' harus mapped ke 'in-progress'", () => {
    const stage = mockStage({ id: "s1", urutan: 1, status: "berjalan" });
    const milestones = stagesToMilestones([stage]);
    expect(milestones[0].status).toBe("in-progress");
  });

  it("status stage lainnya harus mapped ke 'pending'", () => {
    const stage = mockStage({ id: "s1", urutan: 1, status: "belum_mulai" });
    const milestones = stagesToMilestones([stage]);
    expect(milestones[0].status).toBe("pending");
  });
});

// ---------------------------------------------------------------------------
// getProjectProgressAccess
// ---------------------------------------------------------------------------
describe("getProjectProgressAccess — query status akses proyek", () => {
  it("harus mengembalikan status proyek jika ditemukan", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { status: "berjalan" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const status = await getProjectProgressAccess(mockSupabase, "p-1");
    expect(status).toBe("berjalan");
  });

  it("harus mengembalikan null jika proyek tidak ditemukan", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const status = await getProjectProgressAccess(mockSupabase, "p-non-existent");
    expect(status).toBeNull();
  });

  it("harus melempar error jika terjadi error database", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("DB Connection failed"),
            }),
          }),
        }),
      }),
    } as any;

    await expect(getProjectProgressAccess(mockSupabase, "p-1")).rejects.toThrow("DB Connection failed");
  });
});
