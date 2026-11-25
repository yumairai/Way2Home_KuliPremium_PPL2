/**
 * White Box Testing — src/utils/midtrans-payment.ts
 *
 * Fungsi yang diuji:
 * - verifyMidtransPayment
 *
 * Teknik: Statement, Branch, Condition, Path, Loop (Retry), Error Handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyMidtransPayment } from "./midtrans-payment";

describe("verifyMidtransPayment — Verifikasi Status Pembayaran Midtrans", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("harus mengembalikan true jika response memiliki paid: true pada percobaan pertama", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ paid: true })),
    });

    const result = await verifyMidtransPayment("proj-1", "order-1");
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("harus melakukan retry hingga percobaan berikutnya jika paid masih false", async () => {
    // Attempt 1: paid false, Attempt 2: paid true
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ paid: false })),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify({ paid: true })),
      });

    const result = await verifyMidtransPayment("proj-1", "order-1");
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("harus mengembalikan false setelah 4 percobaan jika tetap belum paid", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ paid: false })),
    });

    const result = await verifyMidtransPayment("proj-1", "order-1");
    expect(result).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("harus melempar error jika response tidak bisa di-parse JSON saat status ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("<!DOCTYPE html>Gateway Error"),
    });

    await expect(verifyMidtransPayment("proj-1", "order-1")).rejects.toThrow(
      "Respons verifikasi pembayaran tidak valid.",
    );
  });

  it("harus melempar error jika response tidak bisa di-parse JSON saat status bukan ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: vi.fn().mockResolvedValue("Bad Gateway"),
    });

    await expect(verifyMidtransPayment("proj-1", "order-1")).rejects.toThrow(
      "Server verifikasi pembayaran gagal (502).",
    );
  });

  it("harus melempar error dengan pesan dari backend jika response !ok dan berisi message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi
        .fn()
        .mockResolvedValue(JSON.stringify({ message: "Transaksi kedaluwarsa" })),
    });

    await expect(verifyMidtransPayment("proj-1", "order-1")).rejects.toThrow(
      "Transaksi kedaluwarsa",
    );
  });

  it("harus menggunakan pesan default jika response !ok tanpa pesan spesifik", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(JSON.stringify({})),
    });

    await expect(verifyMidtransPayment("proj-1", "order-1")).rejects.toThrow(
      "Gagal memverifikasi pembayaran.",
    );
  });
});
