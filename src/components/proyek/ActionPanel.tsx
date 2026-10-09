"use client";

import { useState } from "react";
import type { Project } from "@/types/proyek";
import { useCountdown, formatRemaining } from "@/hooks/useCountdown";
import ContractModal from "./ContractModal";

type Banner = {
  icon: "check" | "clock" | "alert" | "revision" | "contract" | "expired" | "cancel" | "active";
  title: string;
  body: string;
  style: string;
};

function getBanner(project: Project): Banner | null {
  if (project.status === "Dibatalkan") {
    return {
      icon: "cancel",
      title: "Proyek Dibatalkan",
      body: "Proyek ini telah dibatalkan dan tidak dapat dilanjutkan.",
      style: "border-[#dc2626] bg-[#fef2f2] text-[#991b1b]",
    };
  }
  if (project.documentStatus === "revision") {
    return {
      icon: "revision",
      title: "Dokumen Ditolak",
      body: project.adminNote ?? "Dokumen Anda memerlukan perbaikan. Mohon unggah ulang dokumen yang sesuai.",
      style: "border-[#d97706] bg-[#fffaf0] text-[#92400e]",
    };
  }
  if (project.documentStatus === "pending") {
    return {
      icon: "clock",
      title: "Dokumen Sedang Direview",
      body: "Mohon tunggu 1×24 jam.",
      style: "border-[#fcd47c] bg-[#fffaf0] text-[#92400e]",
    };
  }
  if (project.status === "Alokasi Tim") {
    return {
      icon: "clock",
      title: "Pembayaran DP Berhasil",
      body: "Mohon tunggu 1×24 jam untuk pengalokasian mandor dan pengawas proyek Anda.",
      style: "border-[#8fb9ed] bg-[#eef5ff] text-[#004796]",
    };
  }
  if (project.contract.status === "menunggu") {
    return {
      icon: "contract",
      title: "Kontrak Menunggu Tanda Tangan",
      body: "Kontrak proyek Anda telah dibuat. Silakan baca dan setujui kontrak untuk melanjutkan ke tahap pembayaran DP.",
      style: "border-[#8fb9ed] bg-[#eef5ff] text-[#004796]",
    };
  }
  if (project.contract.status === "ditolak" || project.contract.status === "revisi") {
    return {
      icon: "revision",
      title: "Kontrak Sedang Direvisi",
      body: "Kontrak sedang direvisi tim Way2Home, estimasi 1×24 jam. Anda dapat melanjutkan setelah kontrak dikirim ulang.",
      style: "border-[#d97706] bg-[#fffaf0] text-[#92400e]",
    };
  }
  if (project.contract.status === "kedaluwarsa") {
    return {
      icon: "expired",
      title: "Kontrak Kedaluwarsa",
      body: "Anda belum merespon kontrak dalam 7×24 jam. Ajukan kontrak ulang untuk melanjutkan proyek.",
      style: "border-[#64748b] bg-[#f1f5f9] text-[#475569]",
    };
  }
  if (project.contract.status === "disetujui" && project.status === "Pembayaran DP") {
    return {
      icon: "check",
      title: "Kontrak Disetujui",
      body: "Mohon lakukan pembayaran Down Payment dalam waktu 7×24 jam. Jika tidak, proyek akan otomatis dibatalkan.",
      style: "border-[#8fb9ed] bg-[#eef5ff] text-[#004796]",
    };
  }
  if (project.status === "Proyek Aktif") {
    return {
      icon: "active",
      title: "Proyek Aktif",
      body: "Proyek sedang aktif dan progress dapat dilacak. Terima kasih telah menggunakan layanan Way2Home.",
      style: "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]",
    };
  }
  if (project.status === "Selesai") {
    return {
      icon: "check",
      title: "Proyek Selesai",
      body: "Seluruh tahapan pengerjaan telah selesai. Silakan lihat dokumentasi rumah untuk melihat hasil akhir proyek Anda.",
      style: "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]",
    };
  }
  return null;
}

function bannerIcon(icon: Banner["icon"]) {
  switch (icon) {
    case "check":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </>
      );
    case "alert":
      return (
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      );
    case "revision":
      return (
        <>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </>
      );
    case "contract":
      return (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </>
      );
    case "expired":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </>
      );
    case "cancel":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </>
      );
    case "active":
      return (
        <>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 12 2 2 4-4" />
        </>
      );
  }
}

export default function ActionPanel({ project }: { project: Project }) {
  const banner = getBanner(project);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const contractCountdown = useCountdown(
    project.contract.status === "menunggu" ? project.contract.deadlineAt : undefined,
  );
  const dpCountdown = useCountdown(
    project.contract.status === "disetujui" && project.status === "Pembayaran DP"
      ? project.payments.find((p) => p.periode === 0)?.dueDate
      : undefined,
  );

  const canceled = project.status === "Dibatalkan" || cancelled;
  const dpPaid = project.payments.find((p) => p.periode === 0)?.status === "lunas";
  const contractLocked =
    project.contract.status === "disetujui" || project.status === "Proyek Aktif" || dpPaid;

  const canCancel =
    !canceled &&
    !contractLocked &&
    project.status !== "Selesai";

  const activePayment = project.payments.find((p) => p.status === "aktif");
  const allInstallmentsPaid = !activePayment && dpPaid;

  if (!banner && !canCancel && !activePayment && !allInstallmentsPaid) return null;

  return (
    <section className="flex flex-col gap-4">
      {banner && (
        <div
          role="status"
          className={`flex items-start gap-4 rounded-2xl border p-5 ${banner.style}`}
        >
          <div className="mt-0.5 shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {bannerIcon(banner.icon)}
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold">{banner.title}</h3>
            <p className="mt-1 text-sm leading-6 opacity-90">{banner.body}</p>

            {project.contract.status === "menunggu" && (
              <p className="mt-3 inline-block rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold">
                {formatRemaining(contractCountdown)}
              </p>
            )}
            {project.contract.status === "disetujui" && project.status === "Pembayaran DP" && (
              <p className="mt-3 inline-block rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold">
                {formatRemaining(dpCountdown)}
              </p>
            )}
            {(project.contract.status === "ditolak" || project.contract.status === "revisi") &&
              project.contract.rejectionReasons &&
              project.contract.rejectionReasons.length > 0 && (
                <div className="mt-3 rounded-xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider">Alasan Penolakan Anda</p>
                  <ul className="mt-2 space-y-1.5">
                    {project.contract.rejectionReasons.map((r) => (
                      <li key={r} className="text-sm leading-6">“{r}”</li>
                    ))}
                  </ul>
                </div>
              )}
            {(project.contract.status === "ditolak" || project.contract.status === "revisi") &&
              project.contract.adminNotes && (
                <div className="mt-3 rounded-xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider">Komentar Tim Way2Home</p>
                  <p className="mt-1.5 text-sm leading-6">{project.contract.adminNotes}</p>
                </div>
              )}
          </div>
        </div>
      )}

      {canceled ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <span className="h-3 w-3 rounded-full bg-[#dc2626]" />
          <p className="font-bold text-[#475569]">Proyek ini telah dibatalkan.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {project.contract.status === "menunggu" && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              Baca & Tandatangani Kontrak
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 0 2.8l-9.9 9.9a4 4 0 0 1-1.4.9l-4.3 1.2a1 1 0 0 1-1.2-1.2l1.2-4.3a4 4 0 0 1 .9-1.4l9.9-9.9a2 2 0 0 1 1.4-.6Z" />
              </svg>
            </button>
          )}

          {project.contract.status === "kedaluwarsa" && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-[#111e3f] px-8 font-bold text-white transition hover:-translate-y-0.5 active:scale-95"
            >
              Ajukan Kontrak Ulang
            </button>
          )}

          {project.status === "Pembayaran DP" && (
            <button
              type="button"
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-[#004796] to-[#045ec2] px-8 font-bold text-white shadow-[0_10px_25px_rgba(0,71,150,0.3)] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              Bayar Down Payment
            </button>
          )}

          {project.status === "Selesai" && (
            <button
              type="button"
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-[#eef5ff] px-8 font-bold text-[#004796] transition hover:-translate-y-0.5 active:scale-95"
            >
              Lihat Dokumentasi Rumah
            </button>
          )}

          {canCancel &&
            (cancelConfirm ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCancelled(true);
                    setCancelConfirm(false);
                  }}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-full bg-[#dc2626] px-8 font-bold text-white shadow-lg transition hover:bg-[#b91c1c] active:scale-95"
                >
                  Konfirmasi Pembatalan
                </button>
                <button
                  type="button"
                  onClick={() => setCancelConfirm(false)}
                  className="min-h-14 cursor-pointer rounded-full border border-[#dbe4f2] px-8 font-bold text-[#475569] transition hover:bg-[#f1f5f9]"
                >
                  Urungkan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCancelConfirm(true)}
                className="min-h-14 cursor-pointer rounded-full border-2 border-[#dc2626] px-8 font-bold text-[#dc2626] transition hover:bg-[#fef2f2] active:scale-95"
              >
                Batalkan Proyek
              </button>
            ))}
        </div>
      )}

      {modalOpen && (
        <ContractModal
          project={project}
          interactive={project.contract.status === "menunggu"}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
