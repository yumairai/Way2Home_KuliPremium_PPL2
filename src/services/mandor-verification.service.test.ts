/**
 * White Box Testing — src/services/mandor-verification.service.ts
 *
 * Fungsi yang diuji:
 * - saveMandorDecision
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMandorDecision } from "./mandor-verification.service";
import * as accessModule from "./access.service";
import * as adminModule from "@/utils/supabase/admin";
import * as notificationModule from "./notification.service";

describe("saveMandorDecision — Persetujuan / Penolakan Pendaftaran Mandor oleh Admin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(notificationModule, "notifyMandorApproved").mockResolvedValue(undefined as any);
    vi.spyOn(notificationModule, "notifyMandorRejected").mockResolvedValue(undefined as any);
  });

  it("harus melempar ServiceError 404 jika pendaftaran mandor tidak ditemukan", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const mockAdminClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as any;

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(mockAdminClient);

    const mockSupabase = {} as any;
    await expect(saveMandorDecision(mockSupabase, "m-unknown", "approve")).rejects.toMatchObject({
      status: 404,
      message: "Pendaftaran mandor tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 409 jika status pendaftaran bukan 'pending'", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const mockAdminClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "m-1", status: "approved" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(mockAdminClient);

    const mockSupabase = {} as any;
    await expect(saveMandorDecision(mockSupabase, "m-1", "approve")).rejects.toMatchObject({
      status: 409,
      message: "Pendaftaran tidak ditemukan atau sudah diproses.",
    });
  });

  it("berhasil memproses 'reject': mengirim email penolakan dan menghapus akun", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const removeStorageSpy = vi.fn().mockResolvedValue({});
    const deleteSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const deleteUserSpy = vi.fn().mockResolvedValue({ error: null });

    const mockAdminClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "mandor_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "m-1", status: "pending", cv_path: "cvs/mandor-1.pdf" },
                  error: null,
                }),
              }),
            }),
            delete: deleteSpy,
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { full_name: "Pak Mandor Budi" },
                  error: null,
                }),
              }),
            }),
            delete: deleteSpy,
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          remove: removeStorageSpy,
        }),
      },
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: "budi@mandor.com" } },
          }),
          deleteUser: deleteUserSpy,
        },
      },
    } as any;

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(mockAdminClient);

    const mockSupabase = {} as any;
    await expect(
      saveMandorDecision(mockSupabase, "m-1", "reject", "Pengalaman kerja belum memadai"),
    ).resolves.toBeUndefined();

    expect(notificationModule.notifyMandorRejected).toHaveBeenCalledWith(
      "budi@mandor.com",
      "Pak Mandor Budi",
      "Pengalaman kerja belum memadai",
    );
    expect(removeStorageSpy).toHaveBeenCalledWith(["cvs/mandor-1.pdf"]);
    expect(deleteUserSpy).toHaveBeenCalledWith("m-1");
  });

  it("berhasil memproses 'approve': memperbarui status approved dan mengubah role profile menjadi 'mandor'", async () => {
    vi.spyOn(accessModule, "requireRole").mockResolvedValue({
      user: { id: "admin-1" } as any,
      role: "admin",
    });

    const updateMandorSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "m-1" },
              error: null,
            }),
          }),
        }),
      }),
    });
    const updateProfileSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockAdminClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "mandor_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "m-1", status: "pending", cv_path: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { full_name: "Pak Mandor Budi" },
                  error: null,
                }),
              }),
            }),
            update: updateProfileSpy,
          };
        }
        return {};
      }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: "budi@mandor.com" } },
          }),
        },
      },
    } as any;

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(mockAdminClient);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: updateMandorSpy,
      }),
    } as any;
    await expect(saveMandorDecision(mockSupabase, "m-1", "approve")).resolves.toBeUndefined();

    expect(updateMandorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        verified_by: "admin-1",
      }),
    );
    expect(notificationModule.notifyMandorApproved).toHaveBeenCalledWith("m-1");
  });
});
