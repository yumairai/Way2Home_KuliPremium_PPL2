"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { SupervisorProject } from "@/data/pengawas";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function SupervisorContractModal({
  project,
  onClose,
}: {
  project: SupervisorProject;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  const rows = [
    ["Nomor kontrak", project.contractId],
    ["Pihak pertama", "PT Way2Home Konstruksi"],
    ["Pihak kedua", project.customer],
    ["Alamat proyek", project.address],
    ["Tipe desain", project.design],
    ["Nilai kontrak", money(project.value)],
    ["Tanggal mulai", project.started],
    ["Target penyelesaian", project.deadline],
  ];
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervisor-contract-title"
    >
      <button
        className="absolute inset-0 bg-[#0c1b2b]/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Tutup kontrak"
      />
      <section className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#e7ebef] px-5 py-4 md:px-7">
          <div>
            <h2
              id="supervisor-contract-title"
              className="text-lg font-bold text-[#17344e]"
            >
              Kontrak proyek
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {project.contractId} · {project.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kontrak"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg text-slate-500 hover:bg-slate-50"
          >
            ×
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-6 md:px-10">
          <div className="text-center">
            <Image
              src="/images/aset/logo-w2h.png"
              alt="Way2Home"
              width={52}
              height={52}
              className="mx-auto h-14 w-auto object-contain"
            />
            <p className="mt-3 text-sm font-bold text-[#234b69]">
              KONTRAK PEMBANGUNAN RUMAH
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Nomor: {project.contractId}
            </p>
          </div>
          <section className="mt-7">
            <h3 className="text-sm font-bold text-[#263d53]">
              Data pihak dan proyek
            </h3>
            <div className="mt-3 divide-y divide-[#e9edf1] rounded-xl border border-[#e3e9ee] px-4">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-5"
                >
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-semibold text-[#2b4358] sm:text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-7">
            <h3 className="text-sm font-bold text-[#263d53]">
              Spesifikasi pekerjaan
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">
              {project.specifications
                .filter((spec) => !spec.startsWith("Kontrak"))
                .map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
            </ul>
            <p className="mt-3 text-xs leading-6 text-slate-600">
              Kebutuhan customer: {project.needs}
            </p>
          </section>
          <section className="mt-7">
            <h3 className="text-sm font-bold text-[#263d53]">Ketentuan</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-5 text-slate-600">
              <li>
                Perubahan desain atau spesifikasi pekerjaan harus disetujui
                secara tertulis oleh kedua pihak.
              </li>
              <li>
                Pengerjaan mengikuti tahapan dan jadwal proyek yang disepakati.
              </li>
              <li>
                Penyesuaian jadwal dapat dilakukan jika terdapat keterlambatan
                material atau kondisi di luar kendali pihak terkait.
              </li>
              <li>
                Pembayaran mengikuti termin dan status yang tercantum dalam
                informasi proyek.
              </li>
            </ol>
          </section>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="border-t border-[#dfe6ec] pt-3 text-center">
              <p className="text-[10px] text-slate-500">Pihak pertama</p>
              <p className="mt-10 text-xs font-semibold text-[#263d53]">
                PT Way2Home Konstruksi
              </p>
            </div>
            <div className="border-t border-[#dfe6ec] pt-3 text-center">
              <p className="text-[10px] text-slate-500">Pihak kedua</p>
              <p className="mt-10 text-xs font-semibold text-[#263d53]">
                {project.customer}
              </p>
            </div>
          </div>
        </div>
        <footer className="flex justify-end border-t border-[#e7ebef] bg-[#fafbfc] px-5 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white hover:bg-[#234f70]"
          >
            Tutup kontrak
          </button>
        </footer>
      </section>
    </div>
  );
}
