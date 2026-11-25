/**
 * White Box Testing — src/services/notification.service.ts
 *
 * Fungsi yang diuji:
 * - notifyDocumentVerified
 * - notifyMandorApproved
 * - notifyMandorRejected
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notifyDocumentVerified,
  notifyMandorApproved,
  notifyMandorRejected,
} from "./notification.service";
import * as adminModule from "@/utils/supabase/admin";
import * as emailModule from "./email.service";

describe("notification.service — Pengiriman Notifikasi & Email", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(emailModule, "sendEmailViaBrevo").mockResolvedValue(true as any);
  });

  describe("notifyDocumentVerified", () => {
    it("harus keluar secara graceful jika info proyek tidak ditemukan", async () => {
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

      await expect(notifyDocumentVerified("p-unknown")).resolves.toBeUndefined();
      expect(emailModule.sendEmailViaBrevo).not.toHaveBeenCalled();
    });

    it("berhasil mengirim in-app notification dan email saat dokumen diverifikasi", async () => {
      const insertNotificationSpy = vi.fn().mockResolvedValue({ error: null });

      const mockAdminClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "projects") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "p-1",
                      customer_id: "c-1",
                      alamat_proyek: "Jl. Merdeka No. 1",
                      design_id: "d-1",
                    },
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
                    data: { full_name: "Customer Budi" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "designs") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { nama: "Villa Minimalis", estimasi_biaya: 500_000_000 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "notifications") {
            return {
              insert: insertNotificationSpy,
            };
          }
          return {};
        }),
        auth: {
          admin: {
            getUserById: vi.fn().mockResolvedValue({
              data: { user: { email: "customer@example.com" } },
            }),
          },
        },
      } as any;

      vi.spyOn(adminModule, "createAdminClient").mockReturnValue(mockAdminClient);

      await expect(notifyDocumentVerified("p-1")).resolves.toBeUndefined();

      expect(insertNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "c-1",
          tipe: "doc_verified",
          judul: "Dokumen Pembangunan Berhasil Diverifikasi",
        }),
      );
      expect(emailModule.sendEmailViaBrevo).toHaveBeenCalledWith(
        expect.objectContaining({
          to: {
            email: "customer@example.com",
            name: "Customer Budi",
          },
          subject: expect.stringContaining("Dokumen Disetujui"),
        }),
      );
    });
  });

  describe("notifyMandorApproved", () => {
    it("berhasil mencatat in-app notification dan mengirim email selamat kepada mandor", async () => {
      const insertNotificationSpy = vi.fn().mockResolvedValue({ error: null });

      const mockAdminClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: "Mandor Agus" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "notifications") {
            return {
              insert: insertNotificationSpy,
            };
          }
          return {};
        }),
        auth: {
          admin: {
            getUserById: vi.fn().mockResolvedValue({
              data: { user: { email: "agus@mandor.com" } },
            }),
          },
        },
      } as any;

      vi.spyOn(adminModule, "createAdminClient").mockReturnValue(mockAdminClient);

      await expect(notifyMandorApproved("m-1")).resolves.toBeUndefined();

      expect(insertNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "m-1",
          tipe: "mandor_verified",
        }),
      );
      expect(emailModule.sendEmailViaBrevo).toHaveBeenCalledWith(
        expect.objectContaining({
          to: {
            email: "agus@mandor.com",
            name: "Mandor Agus",
          },
          subject: expect.stringContaining("Telah Disetujui"),
        }),
      );
    });
  });

  describe("notifyMandorRejected", () => {
    it("berhasil mengirim email penolakan mandor dengan alasan admin", async () => {
      await expect(
        notifyMandorRejected(
          "calon@mandor.com",
          "Calon Mandor",
          "Sertifikat keahlian belum terverifikasi",
        ),
      ).resolves.toBeUndefined();

      expect(emailModule.sendEmailViaBrevo).toHaveBeenCalledWith(
        expect.objectContaining({
          to: {
            email: "calon@mandor.com",
            name: "Calon Mandor",
          },
          subject: expect.stringContaining("Pendaftaran"),
        }),
      );
    });
  });
});
