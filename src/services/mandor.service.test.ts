/**
 * White Box Testing — src/services/mandor.service.ts
 *
 * Fungsi yang diuji:
 * - mapKendalaToIssueReport
 * - submitProgressReport
 * - submitKendala
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mapKendalaToIssueReport,
  submitProgressReport,
  submitKendala,
} from "./mandor.service";
import * as accessModule from "./access.service";

describe("mapKendalaToIssueReport — Pemetaan baris kendala ke format UI Mandor", () => {
  it("harus memetakan atribut kategori, status, dan label kendala dengan benar", () => {
    const row = {
      id: "k-1",
      project_id: "p-1",
      kategori: "CUACA_LINGKUNGAN",
      deskripsi: "Hujan deras 3 hari berturut-turut",
      status: "reported",
      created_at: "2026-10-15T08:35:00+07:00",
      project_stages: { id: "s-1", nama_tahap: "Fondasi" },
      project_subtasks: { id: "sub-1", judul: "Galian Tanah" },
    };

    const result = mapKendalaToIssueReport(row);
    expect(result.id).toBe("k-1");
    expect(result.category).toBe("CUACA_LINGKUNGAN");
    expect(result.categoryLabel).toBe("Cuaca dan lingkungan");
    expect(result.status).toBe("Menunggu");
    expect(result.affectedMilestoneTitle).toBe("Fondasi");
    expect(result.affectedSubtaskTitle).toBe("Galian Tanah");
  });

  it("harus menggunakan fallback untuk kategori tidak dikenal atau tahap kosong", () => {
    const row = {
      id: "k-2",
      project_id: "p-1",
      deskripsi: "Kendala teknis lain",
      status: "resolved",
      created_at: "2026-10-15T08:35:00+07:00",
    };

    const result = mapKendalaToIssueReport(row);
    expect(result.category).toBe("LAINNYA");
    expect(result.status).toBe("Selesai");
    expect(result.affectedMilestoneTitle).toBe("Tanpa tahap");
  });
});

describe("submitProgressReport — Pengiriman Laporan Progres Mandor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus melempar ServiceError 422 jika keterangan kurang dari 10 karakter", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "mandor-1" } as any,
      role: "mandor",
    });

    const mockSupabase = {} as any;
    await expect(
      submitProgressReport(mockSupabase, "p-1", {
        project_subtask_id: "sub-1",
        keterangan: "singkat",
        foto_url: "https://example.com/foto.jpg",
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: "Tulis catatan pekerjaan minimal 10 karakter.",
    });
  });

  it("harus melempar ServiceError 404 jika subtask tidak ditemukan", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "mandor-1" } as any,
      role: "mandor",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as any;

    await expect(
      submitProgressReport(mockSupabase, "p-1", {
        project_subtask_id: "sub-unknown",
        keterangan: "Pengecoran sloof selesai rapi",
        foto_url: "https://example.com/foto.jpg",
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Subtask tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 409 jika subtask sudah disetujui sebelumnya", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "mandor-1" } as any,
      role: "mandor",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_subtasks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "sub-1", project_stage_id: "s-1", selesai: true },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_stages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { project_id: "p-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    await expect(
      submitProgressReport(mockSupabase, "p-1", {
        project_subtask_id: "sub-1",
        keterangan: "Pengecoran sloof selesai rapi",
        foto_url: "https://example.com/foto.jpg",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Subtask ini sudah selesai dan tidak dapat dilaporkan lagi.",
    });
  });

  it("berhasil mengirim laporan progress", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "mandor-1" } as any,
      role: "mandor",
    });

    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "rep-1",
            project_stage_id: "s-1",
            project_subtask_id: "sub-1",
            keterangan: "Pengecoran sloof selesai rapi",
            foto_url: "https://example.com/foto.jpg",
            keputusan: "menunggu",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_subtasks") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "sub-1", project_stage_id: "s-1", selesai: false, bobot: 5 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_stages") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { project_id: "p-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "progress_reports") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({}),
                }),
              }),
            }),
            insert: insertSpy,
          };
        }
        return {};
      }),
    } as any;

    const result = await submitProgressReport(mockSupabase, "p-1", {
      project_subtask_id: "sub-1",
      keterangan: "Pengecoran sloof selesai rapi",
      foto_url: "https://example.com/foto.jpg",
    });

    expect(result.id).toBe("rep-1");
    expect(result.note).toBe("Pengecoran sloof selesai rapi");
    expect(insertSpy).toHaveBeenCalled();
  });
});

describe("submitKendala — Pengiriman Laporan Kendala Mandor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus melempar ServiceError 422 jika deskripsi kurang dari 10 karakter", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "mandor-1" } as any,
      role: "mandor",
    });

    const mockSupabase = {} as any;
    await expect(
      submitKendala(mockSupabase, "p-1", {
        project_stage_id: "s-1",
        project_subtask_id: "sub-1",
        kategori: "CUACA_LINGKUNGAN",
        deskripsi: "hujan",
        kondisi_pekerjaan: "BERJALAN",
        dampak_waktu_hari: 2,
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: "Jelaskan kendala minimal 10 karakter.",
    });
  });

  it("berhasil mengirim laporan kendala", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "mandor-1" } as any,
      role: "mandor",
    });

    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "k-1",
            project_id: "p-1",
            kategori: "CUACA_LINGKUNGAN",
            deskripsi: "Hujan lebat selama 2 hari menyebabkan galian tergenang",
            status: "reported",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: insertSpy,
      }),
    } as any;

    const result = await submitKendala(mockSupabase, "p-1", {
      project_stage_id: "s-1",
      project_subtask_id: "sub-1",
      kategori: "CUACA_LINGKUNGAN",
      deskripsi: "Hujan lebat selama 2 hari menyebabkan galian tergenang",
      kondisi_pekerjaan: "BERHENTI",
      dampak_waktu_hari: 2,
    });

    expect(result.id).toBe("k-1");
    expect(result.category).toBe("CUACA_LINGKUNGAN");
    expect(insertSpy).toHaveBeenCalled();
  });
});
