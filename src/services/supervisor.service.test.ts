/**
 * White Box Testing — src/services/supervisor.service.ts
 *
 * Fungsi yang diuji:
 * - verifyProgressReport
 * - followUpKendala
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyProgressReport, followUpKendala } from "./supervisor.service";
import * as accessModule from "./access.service";
import * as stageModule from "./stage.service";

describe("verifyProgressReport — Verifikasi laporan progress oleh pengawas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(stageModule, "persistStageProgress").mockResolvedValue(undefined);
  });

  it("harus melempar ServiceError 422 jika keputusan verifikasi tidak dikenal", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {} as any;
    await expect(
      verifyProgressReport(mockSupabase, "rep-1", "invalid_decision" as any, "catatan"),
    ).rejects.toMatchObject({
      status: 422,
      message: "Keputusan verifikasi tidak dikenal.",
    });
  });

  it("harus melempar ServiceError 422 jika status 'Perlu revisi' tetapi catatan < 5 karakter", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {} as any;
    await expect(
      verifyProgressReport(mockSupabase, "rep-1", "Perlu revisi", "rev"),
    ).rejects.toMatchObject({
      status: 422,
      message: "Tulis catatan revisi minimal 5 karakter untuk mandor.",
    });
  });

  it("harus melempar ServiceError 404 jika laporan progress tidak ditemukan", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

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

    await expect(
      verifyProgressReport(mockSupabase, "rep-unknown", "Disetujui", "Sudah bagus"),
    ).rejects.toMatchObject({
      status: 404,
      message: "Laporan progress tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 409 jika laporan sudah pernah disetujui", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "rep-1", keputusan: "disetujui" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(
      verifyProgressReport(mockSupabase, "rep-1", "Disetujui", "Oke"),
    ).rejects.toMatchObject({
      status: 409,
      message: "Laporan ini sudah pernah disetujui.",
    });
  });

  it("berhasil menyetujui laporan: update laporan, update subtask selesai=true, persistStageProgress", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const updateReportSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const updateSubtaskSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "progress_reports") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "rep-1",
                    project_stage_id: "stage-1",
                    project_subtask_id: "sub-1",
                    keputusan: "menunggu",
                  },
                  error: null,
                }),
              }),
            }),
            update: updateReportSpy,
          };
        }
        if (table === "project_subtasks") {
          return {
            update: updateSubtaskSpy,
          };
        }
        return {};
      }),
    } as any;

    await expect(
      verifyProgressReport(mockSupabase, "rep-1", "Disetujui", "Pekerjaan rapi sesuai standar"),
    ).resolves.toBeUndefined();

    expect(updateReportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        keputusan: "disetujui",
        status: "verified",
        verified_by: "p-1",
      }),
    );
    expect(updateSubtaskSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        selesai: true,
      }),
    );
    expect(stageModule.persistStageProgress).toHaveBeenCalledWith(mockSupabase, "stage-1");
  });

  it("berhasil meminta revisi laporan: update laporan, subtask selesai=false", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const updateReportSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const updateSubtaskSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "progress_reports") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "rep-2",
                    project_stage_id: "stage-1",
                    project_subtask_id: "sub-2",
                    keputusan: "menunggu",
                  },
                  error: null,
                }),
              }),
            }),
            update: updateReportSpy,
          };
        }
        if (table === "project_subtasks") {
          return {
            update: updateSubtaskSpy,
          };
        }
        return {};
      }),
    } as any;

    await expect(
      verifyProgressReport(mockSupabase, "rep-2", "Perlu revisi", "Bongkar bagian plesteran yang retak"),
    ).resolves.toBeUndefined();

    expect(updateReportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        keputusan: "perlu_revisi",
        status: "pending",
        feedback: "Bongkar bagian plesteran yang retak",
      }),
    );
    expect(updateSubtaskSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        selesai: false,
        completed_at: null,
      }),
    );
    expect(stageModule.persistStageProgress).toHaveBeenCalledWith(mockSupabase, "stage-1");
  });
});

describe("followUpKendala — Tindak lanjut kendala oleh pengawas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus melempar ServiceError 422 jika tindak lanjut < 10 karakter", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {} as any;
    await expect(followUpKendala(mockSupabase, "k-1", "pendek")).rejects.toMatchObject({
      status: 422,
      message: "Tuliskan tindak lanjut minimal 10 karakter.",
    });
  });

  it("berhasil memperbarui status kendala menjadi reviewed", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "p-1" } as any,
      role: "pengawas",
    });

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "kendala") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "k-1", status: "reported" },
                  error: null,
                }),
              }),
            }),
            update: updateSpy,
          };
        }
        return {};
      }),
    } as any;

    await expect(
      followUpKendala(mockSupabase, "k-1", "Instruksikan tim memasang terpal pelindung hujan."),
    ).resolves.toBeUndefined();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tindak_lanjut: "Instruksikan tim memasang terpal pelindung hujan.",
        status: "reviewed",
      }),
    );
  });
});
