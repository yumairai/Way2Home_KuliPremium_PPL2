"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project, Payment } from "@/types/proyek";
import { formatDate, formatRupiah } from "@/utils/format";
import { verifyMidtransPayment } from "@/utils/midtrans-payment";

/**
 * Badge styles mapped to Payment.status which comes from transforming
 * the DB enum payment_status ("belum" | "lunas") into UI-friendly values:
 *   - "lunas"       → sudah dibayar
 *   - "aktif"       → tahap ini bisa dibayar sekarang (first "belum" after all lunas)
 *   - "akan_datang"  → belum bisa dibayar (masih ada tahap sebelumnya)
 */
const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  lunas: { label: "Lunas", style: "bg-[#ecfdf5] text-[#065f46]" },
  aktif: { label: "Siap Dibayar", style: "bg-[#eef5ff] text-[#004796]" },
  menunggu: { label: "Menunggu", style: "bg-[#fffaf0] text-[#92400e]" },
  akan_datang: { label: "Akan Datang", style: "bg-[#f1f5f9] text-[#475569]" },
};

function useMidtransSnap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.snap) {
        resolve();
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
      if (!clientKey) {
        reject(new Error("Midtrans client key tidak ditemukan."));
        return;
      }

      const existing = document.querySelector(
        'script[src*="snap.js"]',
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Gagal memuat Midtrans.")),
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Gagal memuat Midtrans."));
      document.head.appendChild(script);
    });
  }, []);

  return { loading, setLoading, error, setError, loadSnapScript };
}

type PaymentsSectionProps = {
  project: Project;
};

export default function PaymentsSection({ project }: PaymentsSectionProps) {
  const router = useRouter();
  const { loading, setLoading, error, setError, loadSnapScript } =
    useMidtransSnap();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activePayment = project.payments.find((p) => p.status === "aktif");

  async function handlePay(payment: Payment) {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // Load Snap.js if not already loaded
      await loadSnapScript();

      // Get the DB stage id for this payment
      const stageId = payment.stageId;
      if (!stageId) {
        throw new Error("ID tahap pembayaran tidak ditemukan.");
      }

      // Request snap token from our API
      const response = await fetch(`/api/projects/${project.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_stage_id: stageId }),
      });

      const data = (await response.json()) as {
        token?: string;
        message?: string;
      };

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Gagal membuat transaksi.");
      }

      // Open Midtrans Snap popup
      const snap = window.snap;
      if (!snap) {
        throw new Error("Sistem pembayaran belum siap. Silakan coba lagi.");
      }
      snap.pay(data.token, {
        onSuccess: (result) => {
          void (async () => {
            try {
              const paid = await verifyMidtransPayment(
                project.id,
                result.order_id,
              );
              setSuccessMessage(
                paid
                  ? `Pembayaran ${payment.label} berhasil dan statusnya sudah lunas.`
                  : `Pembayaran ${payment.label} sedang dikonfirmasi Midtrans. Status akan diperbarui setelah pembayaran terverifikasi.`,
              );
              router.refresh();
            } catch (verificationError) {
              setError(
                verificationError instanceof Error
                  ? verificationError.message
                  : "Pembayaran berhasil, tetapi status belum dapat diverifikasi.",
              );
              router.refresh();
            } finally {
              setLoading(false);
            }
          })();
        },
        onPending: () => {
          setSuccessMessage(
            `Pembayaran ${payment.label} sedang diproses. Status akan diperbarui otomatis.`,
          );
          setLoading(false);
          setTimeout(() => {
            router.refresh();
          }, 3000);
        },
        onError: () => {
          setError("Pembayaran gagal. Silakan coba lagi.");
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan.",
      );
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[#dbe4f2] bg-white p-6 shadow-[0_12px_30px_rgba(17,30,63,0.06)] md:p-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#475569]">
        Tahapan Pembayaran
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {project.payments.map((payment) => {
          const badge = STATUS_BADGE[payment.status] ?? STATUS_BADGE.akan_datang;
          const isActive = payment.status === "aktif";

          return (
            <div
              key={payment.periode}
              className={`rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-[#004796] bg-[#eef5ff] shadow-md"
                  : "border-[#dbe4f2] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                  {payment.label}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.style}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-[#111e3f]">
                {formatRupiah(payment.amount)}
              </p>

              {payment.status === "lunas" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#059669]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {payment.paidAt
                    ? `Dibayar ${formatDate(payment.paidAt)}`
                    : "Sudah dibayar"}
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#64748b]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  {payment.dueDate
                    ? `Jatuh tempo ${formatDate(payment.dueDate)}`
                    : payment.status === "aktif"
                      ? "Siap dibayar sekarang"
                      : "Menunggu tahap sebelumnya"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#ecfdf5] p-4 text-sm leading-6 text-[#065f46]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#fef2f2] p-4 text-sm leading-6 text-[#991b1b]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Warning info */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#fffaf0] p-4 text-sm leading-6 text-[#92400e]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <p>
          <strong>Informasi penting:</strong> Jika pembayaran belum dilunasi
          sesuai jadwal, pengerjaan proyek akan ditunda sementara.
        </p>
      </div>

      {/* Main pay button for active payment (larger CTA) */}
      {activePayment && !successMessage && (
        <button
          type="button"
          disabled={loading}
          onClick={() => handlePay(activePayment)}
          className="mt-5 flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Memproses Pembayaran...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
              Bayar {activePayment.label}
            </>
          )}
        </button>
      )}
    </section>
  );
}
