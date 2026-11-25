/**
 * White Box Testing — src/services/auth.service.ts
 *
 * Fungsi yang diuji:
 * - login (Email/password authentication, role lookup, mandor verification check)
 * - register (Customer registration via Supabase auth signUp)
 * - logout (Supabase signOut)
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register, logout } from "./auth.service";
import * as clientModule from "@/utils/supabase/client";

describe("login — Autentikasi Pengguna & Pengecekan Role", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus mengembalikan pesan kesalahan jika kredensial login salah", async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: { message: "Invalid login credentials" },
        }),
      },
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await login("wrong@example.com", "wrongpass");
    expect(result).toEqual({
      ok: false,
      message: "Email atau password salah.",
    });
  });

  it("harus mengembalikan pesan bahwa email belum dikonfirmasi", async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: { message: "Email not confirmed" },
        }),
      },
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await login("unconfirmed@example.com", "pass123");
    expect(result).toEqual({
      ok: false,
      message: "Email belum dikonfirmasi. Cek inbox kamu.",
    });
  });

  it("harus gagal dan signOut jika profil akun tidak memiliki role", async () => {
    const signOutSpy = vi.fn().mockResolvedValue({});
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }),
        signOut: signOutSpy,
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await login("norole@example.com", "pass123");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Profil akun belum memiliki role");
    expect(signOutSpy).toHaveBeenCalled();
  });

  it("harus mengembalikan MANDOR_PENDING jika mandor belum berstatus approved", async () => {
    const signOutSpy = vi.fn().mockResolvedValue({});
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "m-1" } } }),
        signOut: signOutSpy,
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: "mandor" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "mandor_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { status: "pending" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await login("mandor@example.com", "pass123");
    expect(result).toEqual({
      ok: false,
      message: "MANDOR_PENDING",
    });
    expect(signOutSpy).toHaveBeenCalled();
  });

  it("berhasil login untuk customer biasa", async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "c-1" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: "customer" },
              error: null,
            }),
          }),
        }),
      }),
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await login("cust@example.com", "pass123");
    expect(result).toEqual({
      ok: true,
      role: "customer",
    });
  });
});

describe("register — Registrasi Akun Customer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus mengembalikan pesan kesalahan jika email sudah terdaftar", async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {},
          error: { message: "User already registered" },
        }),
      },
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await register({
      name: "Budi",
      email: "exist@example.com",
      phone: "0812345678",
      nik: "3201010101010001",
      password: "secretpassword",
    });

    expect(result).toEqual({
      ok: false,
      message: "Email sudah terdaftar.",
    });
  });

  it("berhasil mendaftar dan sign out session awal", async () => {
    const signOutSpy = vi.fn().mockResolvedValue({});
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { session: { access_token: "token123" } },
          error: null,
        }),
        signOut: signOutSpy,
      },
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    const result = await register({
      name: "Budi",
      email: "new@example.com",
      phone: "0812345678",
      nik: "3201010101010001",
      password: "secretpassword",
    });

    expect(result).toEqual({ ok: true });
    expect(signOutSpy).toHaveBeenCalled();
  });
});

describe("logout — Keluar dari Akun", () => {
  it("harus memanggil signOut pada supabase.auth", async () => {
    const signOutSpy = vi.fn().mockResolvedValue({});
    const mockSupabase = {
      auth: {
        signOut: signOutSpy,
      },
    } as any;
    vi.spyOn(clientModule, "createClient").mockReturnValue(mockSupabase);

    await logout();
    expect(signOutSpy).toHaveBeenCalled();
  });
});
