"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mandorApplications } from "@/data/admin-mandor";

export default function MandorVerificationDetail({ id }: { id: string }) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<"approved" | "rejected" | null>(
    null,
  );
  const applicant = mandorApplications.find((profile) => profile.id === id);
  if (!applicant) notFound();
  const submitDecision = () => {
    if (!decision) return;
    if (decision === "reject" && reason.trim().length < 10) {
      setError("Jelaskan alasan penolakan minimal 10 karakter.");
      return;
    }
    setError("");
    setCompleted(decision === "approve" ? "approved" : "rejected");
    setDecision(null);
  };
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/verifikasi-mandor"
            className="text-xs font-medium text-[#35658a] hover:underline"
          >
            Kembali ke antrean
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#183047]">
            Detail pendaftaran mandor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Diajukan {applicant.submitted}
          </p>
        </div>
        <span
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${completed === "approved" ? "bg-green-50 text-green-800" : completed === "rejected" ? "bg-red-50 text-red-800" : "bg-[#fff6e6] text-[#9a6c28]"}`}
        >
          {completed === "approved"
            ? "Terverifikasi"
            : completed === "rejected"
              ? "Ditolak"
              : "Menunggu verifikasi"}
        </span>
      </div>
      {completed && (
        <div
          role="status"
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${completed === "approved" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}
        >
          {completed === "approved"
            ? `${applicant.name} telah terverifikasi dan akunnya aktif sebagai mandor.`
            : `Pendaftaran ${applicant.name} ditolak. Alasan penolakan tercatat untuk perbaikan dan pengajuan ulang.`}
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5 md:p-6">
            <div className="flex items-center gap-4 border-b border-[#edf0f3] pb-5">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eaf1f6] text-base font-bold text-[#345c78]">
                {applicant.initials}
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#203c54]">
                  {applicant.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Nomor pendaftaran {applicant.id}
                </p>
              </div>
            </div>
            <dl className="grid gap-x-8 gap-y-5 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="mt-1 text-sm font-medium text-[#29465e]">
                  {applicant.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Nomor HP</dt>
                <dd className="mt-1 text-sm font-medium text-[#29465e]">
                  {applicant.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Area kerja</dt>
                <dd className="mt-1 text-sm font-medium text-[#29465e]">
                  {applicant.city}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Keahlian utama</dt>
                <dd className="mt-1 text-sm font-medium text-[#29465e]">
                  {applicant.expertise}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pengalaman</dt>
                <dd className="mt-1 text-sm font-medium text-[#29465e]">
                  {applicant.experience} tahun
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">
                  Keterampilan yang dimiliki
                </dt>
                <dd className="mt-1 text-sm font-medium leading-6 text-[#29465e]">
                  {applicant.skills}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5 md:p-6">
            <h2 className="text-base font-bold text-[#203c54]">
              Ringkasan pengalaman
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {applicant.summary}
            </p>
            <h3 className="mt-5 text-sm font-semibold text-[#29465e]">
              Jenis pekerjaan yang pernah ditangani
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {applicant.projects}
            </p>
          </section>
          <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5 md:p-6">
            <h2 className="text-base font-bold text-[#203c54]">
              CV dan riwayat kerja
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Tinjau dokumen sebelum memberikan keputusan.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6ebf0] bg-[#f8fafc] p-4">
              <div>
                <b className="block text-sm text-[#29465e]">
                  {applicant.cv.split("/").pop()}
                </b>
                <span className="mt-1 block text-xs text-slate-500">
                  Dokumen PDF · Diunggah saat pendaftaran
                </span>
              </div>
              <div className="flex gap-2">
                <a
                  href={applicant.cv}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[#d7e0e8] bg-white px-3 py-2 text-xs font-semibold text-[#365c78] hover:bg-slate-50"
                >
                  Buka PDF
                </a>
                <a
                  href={applicant.cv}
                  download
                  className="rounded-lg bg-[#2B3361] px-3 py-2 text-xs font-semibold text-white hover:bg-[#21274b]"
                >
                  Unduh
                </a>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#e6ebf0] bg-slate-50">
              <iframe
                title={`Pratinjau CV ${applicant.name}`}
                src={applicant.cv}
                className="h-[420px] w-full"
              />
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-[#e3e9ef] bg-white p-5 md:p-6 xl:sticky xl:top-[94px]">
          <h2 className="text-base font-bold text-[#203c54]">
            Keputusan verifikasi
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Mandor terverifikasi menjadi aktif dan dapat menunggu penugasan
            proyek dari pengawas.
          </p>
          <div className="mt-5 rounded-lg bg-[#f4f7fa] p-4">
            <p className="text-xs font-semibold text-[#29465e]">
              Yang ditinjau
            </p>
            <ul className="mt-2 space-y-2 text-xs text-slate-600">
              <li>Informasi akun dan kontak</li>
              <li>Keahlian dan pengalaman kerja</li>
              <li>Area kerja dan CV</li>
            </ul>
          </div>
          {completed ? (
            <p className="mt-5 text-sm font-medium text-slate-600">
              Keputusan telah dicatat pada halaman ini.
            </p>
          ) : (
            <div className="mt-5 grid gap-2">
              <button
                onClick={() => setDecision("approve")}
                className="min-h-11 rounded-lg bg-[#2B3361] px-4 text-sm font-semibold text-white hover:bg-[#21274b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#045ec2]"
              >
                Verifikasi mandor
              </button>
              <button
                onClick={() => {
                  setDecision("reject");
                  setError("");
                }}
                className="min-h-11 rounded-lg border border-[#e5caca] bg-white px-4 text-sm font-semibold text-[#9c4545] hover:bg-[#fff8f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c4545]"
              >
                Tolak pendaftaran
              </button>
            </div>
          )}
        </aside>
      </div>
      {decision && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#0c1b2b]/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDecision(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="decision-title"
              className="text-lg font-bold text-[#203c54]"
            >
              {decision === "approve"
                ? "Verifikasi mandor ini?"
                : "Tolak pendaftaran mandor?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {decision === "approve"
                ? `${applicant.name} akan aktif sebagai mandor terverifikasi. Role tetap mandor; pengawas dapat menugaskannya ke proyek.`
                : `Sampaikan alasan yang jelas agar ${applicant.name} dapat memperbaiki profil dan mengajukan ulang melalui dashboard mandor.`}
            </p>
            {decision === "reject" && (
              <div className="mt-4">
                <label
                  htmlFor="rejection-reason"
                  className="mb-1.5 block text-sm font-medium text-[#29465e]"
                >
                  Alasan penolakan
                </label>
                <textarea
                  id="rejection-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Jelaskan informasi atau dokumen yang perlu diperbaiki"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#045ec2] focus:ring-2 focus:ring-[#045ec2]/15"
                />
                {error && (
                  <p role="alert" className="mt-1 text-xs text-red-700">
                    {error}
                  </p>
                )}
              </div>
            )}
            <footer className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDecision(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={submitDecision}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${decision === "approve" ? "bg-[#2B3361] hover:bg-[#21274b]" : "bg-[#9c4545] hover:bg-[#803939]"}`}
              >
                {decision === "approve"
                  ? "Ya, verifikasi"
                  : "Ya, tolak pendaftaran"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
