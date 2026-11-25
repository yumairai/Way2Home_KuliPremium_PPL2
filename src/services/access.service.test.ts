/**
 * White Box Testing — src/services/access.service.ts
 *
 * Fungsi yang diuji:
 * - ServiceError
 * - requireUser
 * - requireRole
 * - assertProjectOwner
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi } from "vitest";
import {
  ServiceError,
  requireUser,
  requireRole,
  assertProjectOwner,
} from "./access.service";

describe("ServiceError — Custom error class", () => {
  it("harus membuat instance ServiceError dengan message dan status code yang benar", () => {
    const error = new ServiceError("Unauthorized", 401, { reason: "token_expired" });
    expect(error.name).toBe("ServiceError");
    expect(error.message).toBe("Unauthorized");
    expect(error.status).toBe(401);
    expect(error.data).toEqual({ reason: "token_expired" });
  });

  it("harus default data ke undefined jika parameter data tidak disertakan", () => {
    const error = new ServiceError("Forbidden", 403);
    expect(error.data).toBeUndefined();
  });
});

describe("requireUser — Validasi autentikasi user", () => {
  it("harus mengembalikan user jika auth.getUser() sukses dan user ada", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as any;

    const user = await requireUser(mockSupabase);
    expect(user).toEqual(mockUser);
  });

  it("harus melempar ServiceError 401 jika auth.getUser() mengembalikan error", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Invalid token"),
        }),
      },
    } as any;

    await expect(requireUser(mockSupabase)).rejects.toThrowError(ServiceError);
    await expect(requireUser(mockSupabase)).rejects.toMatchObject({
      status: 401,
      message: "Anda harus login terlebih dahulu.",
    });
  });

  it("harus melempar ServiceError 401 jika user bernilai null", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any;

    await expect(requireUser(mockSupabase)).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe("requireRole — Validasi otorisasi role pengguna", () => {
  it("harus mengembalikan user dan role jika role pengguna sesuai", async () => {
    const mockUser = { id: "user-cust", email: "cust@example.com" };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: "customer" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const result = await requireRole(mockSupabase, "customer");
    expect(result.user).toEqual(mockUser);
    expect(result.role).toBe("customer");
  });

  it("harus melempar ServiceError 403 jika profil user tidak ditemukan", async () => {
    const mockUser = { id: "user-unknown" };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Profile not found"),
            }),
          }),
        }),
      }),
    } as any;

    await expect(requireRole(mockSupabase, "customer")).rejects.toMatchObject({
      status: 403,
      message: "Profil pengguna tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 403 jika role tidak sesuai yang diharapkan", async () => {
    const mockUser = { id: "user-mandor" };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: "mandor" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(requireRole(mockSupabase, "pengawas")).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining("Akses ditolak. Peran Anda (mandor) tidak memiliki izin"),
    });
  });
});

describe("assertProjectOwner — Validasi kepemilikan proyek", () => {
  it("harus mengembalikan data proyek jika customer_id cocok dengan userId", async () => {
    const mockProject = {
      id: "proj-1",
      customer_id: "user-123",
      status: "berjalan",
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const result = await assertProjectOwner(mockSupabase, "proj-1", "user-123");
    expect(result).toEqual(mockProject);
  });

  it("harus melempar ServiceError 404 jika proyek tidak ditemukan", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Not found"),
            }),
          }),
        }),
      }),
    } as any;

    await expect(
      assertProjectOwner(mockSupabase, "proj-unknown", "user-123"),
    ).rejects.toMatchObject({
      status: 404,
      message: "Proyek tidak ditemukan.",
    });
  });

  it("harus melempar ServiceError 403 jika customer_id tidak cocok dengan userId", async () => {
    const mockProject = {
      id: "proj-1",
      customer_id: "user-owner-999",
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(
      assertProjectOwner(mockSupabase, "proj-1", "user-intruder-123"),
    ).rejects.toMatchObject({
      status: 403,
      message: "Anda tidak memiliki hak akses ke proyek ini.",
    });
  });
});
