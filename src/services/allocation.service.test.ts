/**
 * White Box Testing — src/services/allocation.service.ts
 *
 * Fungsi yang diuji:
 * - canAllocateStaff
 * - finalizeProjectStaffing
 * - assignMandorsToProject
 * - removeMandorFromProject
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canAllocateStaff,
  finalizeProjectStaffing,
  assignMandorsToProject,
  removeMandorFromProject,
} from "./allocation.service";
import * as accessModule from "./access.service";

describe("canAllocateStaff — Cek status proyek untuk alokasi", () => {
  it("harus true hanya jika status proyek adalah 'alokasi_mandor_pengawas'", () => {
    expect(canAllocateStaff("alokasi_mandor_pengawas")).toBe(true);
    expect(canAllocateStaff("draft")).toBe(false);
    expect(canAllocateStaff("verifikasi_dokumen")).toBe(false);
    expect(canAllocateStaff("berjalan")).toBe(false);
    expect(canAllocateStaff("")).toBe(false);
  });
});

describe("finalizeProjectStaffing — Finalisasi alokasi tim oleh pengawas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus melempar ServiceError 404 jika proyek tidak ditemukan", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Project not found"),
            }),
          }),
        }),
      }),
    } as any;

    await expect(finalizeProjectStaffing(mockSupabase, "proj-1")).rejects.toMatchObject({
      status: 404,
      message: "Proyek tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 403 jika pengawas bukan yang ditugaskan ke proyek", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-other" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { pengawas_id: "pengawas-original", status: "alokasi_mandor_pengawas" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(finalizeProjectStaffing(mockSupabase, "proj-1")).rejects.toMatchObject({
      status: 403,
      message: "Anda tidak ditugaskan ke proyek ini.",
    });
  });

  it("harus melempar ServiceError 409 jika status proyek bukan 'alokasi_mandor_pengawas'", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { pengawas_id: "pengawas-1", status: "berjalan" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(finalizeProjectStaffing(mockSupabase, "proj-1")).rejects.toMatchObject({
      status: 409,
      message: "Proyek ini tidak sedang berada di tahap alokasi tim.",
    });
  });

  it("harus melempar ServiceError 409 jika belum ada mandor yang dialokasikan (count = 0)", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    await expect(finalizeProjectStaffing(mockSupabase, "proj-1")).rejects.toMatchObject({
      status: 409,
      message: "Alokasikan minimal satu mandor sebelum melanjutkan.",
    });
  });

  it("harus melempar ServiceError 409 jika mandor melebihi 3 orang", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 4,
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    await expect(finalizeProjectStaffing(mockSupabase, "proj-1")).rejects.toMatchObject({
      status: 409,
      message: "Satu proyek hanya dapat memiliki maksimal 3 mandor.",
    });
  });

  it("berhasil mengubah status ke 'finalisasi_kontrak' saat validasi terpenuhi", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: { id: "proj-1" },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 2,
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    await expect(finalizeProjectStaffing(mockSupabase, "proj-1")).resolves.toBeUndefined();
  });
});

describe("assignMandorsToProject — Alokasi mandor ke proyek", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus melempar ServiceError 400 jika mandorIds kosong", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {} as any;
    await expect(assignMandorsToProject(mockSupabase, "proj-1", [])).rejects.toMatchObject({
      status: 400,
      message: "Pilih minimal satu mandor.",
    });
  });

  it("harus melempar ServiceError 409 jika proyek bukan dalam status alokasi mandor", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { pengawas_id: "pengawas-1", status: "draft" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(assignMandorsToProject(mockSupabase, "proj-1", ["m-1"])).rejects.toMatchObject({
      status: 409,
      message: "Mandor hanya dapat dialokasikan setelah dokumen proyek berhasil diverifikasi.",
    });
  });

  it("harus melempar ServiceError 409 jika total mandor melebihi batas 3", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ mandor_id: "m-existing-1" }, { mandor_id: "m-existing-2" }],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    // Menambah 2 mandor baru padahal sudah ada 2 -> total 4 > 3
    await expect(assignMandorsToProject(mockSupabase, "proj-1", ["m-3", "m-4"])).rejects.toMatchObject({
      status: 409,
      message: "Satu proyek hanya dapat memiliki maksimal 3 mandor.",
    });
  });

  it("harus melempar ServiceError 409 jika mandor belum memiliki keahlian tercatat", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "mandor_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-1", keahlian: [] }],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    await expect(assignMandorsToProject(mockSupabase, "proj-1", ["m-1"])).rejects.toMatchObject({
      status: 409,
      message: "Mandor harus memiliki keahlian yang tercatat sebelum dialokasikan.",
    });
  });

  it("harus melempar ServiceError 409 jika terjadi duplikasi keahlian antarmandor dalam satu proyek", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ mandor_id: "m-existing-1" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "mandor_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: "m-existing-1", keahlian: ["struktur"] },
                  { id: "m-new-2", keahlian: ["struktur", "finishing"] }, // Konflik 'struktur'
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    await expect(assignMandorsToProject(mockSupabase, "proj-1", ["m-new-2"])).rejects.toMatchObject({
      status: 409,
      message: "Setiap mandor dalam satu proyek harus memiliki keahlian yang berbeda.",
    });
  });

  it("berhasil mengalokasikan mandor baru dengan keahlian unik", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const insertSpy = vi.fn().mockResolvedValue({ error: null });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { pengawas_id: "pengawas-1", status: "alokasi_mandor_pengawas" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_mandors") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: insertSpy,
          };
        }
        if (table === "mandor_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-1", keahlian: ["finishing"] }],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const result = await assignMandorsToProject(mockSupabase, "proj-1", ["m-1"]);
    expect(result).toEqual({ assigned: 1, skipped: 0 });
    expect(insertSpy).toHaveBeenCalled();
  });
});

describe("removeMandorFromProject — Hapus alokasi mandor dari proyek", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("berhasil menghapus mandor dari tabel project_mandors", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const deleteSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: deleteSpy,
      }),
    } as any;

    await expect(removeMandorFromProject(mockSupabase, "proj-1", "m-1")).resolves.toBeUndefined();
    expect(deleteSpy).toHaveBeenCalled();
  });

  it("harus melempar ServiceError 500 jika operasi delete database gagal", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "pengawas-1" } as any,
      role: "pengawas",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
          }),
        }),
      }),
    } as any;

    await expect(removeMandorFromProject(mockSupabase, "proj-1", "m-1")).rejects.toMatchObject({
      status: 500,
      message: "Gagal menghapus mandor dari proyek.",
    });
  });
});
