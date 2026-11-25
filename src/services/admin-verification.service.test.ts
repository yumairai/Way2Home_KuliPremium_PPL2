/**
 * White Box Testing — src/services/admin-verification.service.ts
 *
 * Fungsi yang diuji:
 * - saveDocumentVerification
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveDocumentVerification } from "./admin-verification.service";
import * as accessModule from "./access.service";
import * as notificationModule from "./notification.service";

describe("saveDocumentVerification — Verifikasi Dokumen Proyek oleh Admin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(notificationModule, "notifyDocumentVerified").mockResolvedValue(undefined as any);
  });

  it("harus melempar ServiceError 400 jika projectId atau decisions kosong", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const mockSupabase = {} as any;
    await expect(saveDocumentVerification(mockSupabase, "", [], "")).rejects.toMatchObject({
      status: 400,
      message: "Data hasil review tidak lengkap.",
    });
  });

  it("harus melempar ServiceError 404 jika proyek tidak ditemukan", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
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
      saveDocumentVerification(mockSupabase, "p-unknown", [{ id: "doc-1", status: "Disetujui" }], ""),
    ).rejects.toMatchObject({
      status: 404,
      message: "Pengajuan proyek tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 409 jika status proyek bukan tahap verifikasi dokumen", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "p-1", status: "berjalan" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(
      saveDocumentVerification(mockSupabase, "p-1", [{ id: "doc-1", status: "Disetujui" }], ""),
    ).rejects.toMatchObject({
      status: 409,
      message: "Dokumen proyek ini tidak dapat direview pada tahap saat ini.",
    });
  });

  it("harus melempar ServiceError 400 jika jumlah decisions tidak cocok dengan jumlah dokumen di database", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "p-1", status: "verifikasi_dokumen" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "project_documents") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "doc-1" }, { id: "doc-2" }], // ada 2 dokumen
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    // Hanya kirim 1 keputusan -> mismatch
    await expect(
      saveDocumentVerification(mockSupabase, "p-1", [{ id: "doc-1", status: "Disetujui" }], ""),
    ).rejects.toMatchObject({
      status: 400,
      message: "Daftar dokumen review tidak sesuai dengan pengajuan.",
    });
  });

  it("harus mengubah status proyek ke 'revisi_dokumen' jika ada satu dokumen ditolak", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const updateDocSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const updateProjectSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "p-1", status: "verifikasi_dokumen" },
                  error: null,
                }),
              }),
            }),
            update: updateProjectSpy,
          };
        }
        if (table === "project_documents") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: "doc-1", jenis_dokumen: "sertifikat_tanah" },
                  { id: "doc-2", jenis_dokumen: "ktp_pemilik" },
                ],
                error: null,
              }),
            }),
            update: updateDocSpy,
          };
        }
        return {};
      }),
    } as any;

    const decisions = [
      { id: "doc-1", status: "Disetujui" as const },
      { id: "doc-2", status: "Ditolak" as const },
    ];

    await expect(
      saveDocumentVerification(mockSupabase, "p-1", decisions, "Foto KTP buram"),
    ).resolves.toBeUndefined();

    expect(updateProjectSpy).toHaveBeenCalledWith({ status: "revisi_dokumen" });
  });

  it("harus mengubah status proyek ke 'alokasi_mandor_pengawas' jika seluruh dokumen wajib disetujui", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const updateDocSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const updateProjectSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "p-1", status: "verifikasi_dokumen" },
                  error: null,
                }),
              }),
            }),
            update: updateProjectSpy,
          };
        }
        if (table === "project_documents") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: "doc-1", jenis_dokumen: "sertifikat_tanah" },
                  { id: "doc-2", jenis_dokumen: "ktp_pemilik" },
                  { id: "doc-3", jenis_dokumen: "imb_pbg" },
                ],
                error: null,
              }),
            }),
            update: updateDocSpy,
          };
        }
        return {};
      }),
    } as any;

    const decisions = [
      { id: "doc-1", status: "Disetujui" as const },
      { id: "doc-2", status: "Disetujui" as const },
      { id: "doc-3", status: "Disetujui" as const },
    ];

    await expect(
      saveDocumentVerification(mockSupabase, "p-1", decisions, "Dokumen lengkap dan valid"),
    ).resolves.toBeUndefined();

    expect(updateProjectSpy).toHaveBeenCalledWith({ status: "alokasi_mandor_pengawas" });
  });
});
