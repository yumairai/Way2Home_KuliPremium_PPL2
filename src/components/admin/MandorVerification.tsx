"use client";

import Link from "next/link";
import { useState } from "react";
import { mandorApplications } from "@/data/admin-mandor";

const applicants = mandorApplications;

export default function MandorVerification() {
  const [query, setQuery] = useState("");
  const filtered = applicants.filter((applicant) =>
    `${applicant.name} ${applicant.email} ${applicant.city} ${applicant.expertise}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-9">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Way2Home / Admin / Kemitraan
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#183047] sm:text-[30px]">
            Verifikasi Mandor
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tinjau profil dan pengalaman calon mitra sebelum mengaktifkan akun
            mereka.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#ead9b6] bg-[#fff9ed] px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f7edda] text-sm font-bold text-[#93651e]">
            {applicants.length}
          </span>
          <span>
            <b className="block text-sm text-[#4b3b20]">Menunggu verifikasi</b>
            <small className="text-xs text-[#836b44]">
              Perlu ditinjau admin
            </small>
          </span>
        </div>
      </div>
      <section
        className="overflow-hidden rounded-2xl border border-[#e3e9ef] bg-white shadow-[0_6px_24px_rgba(22,45,67,0.04)]"
        aria-labelledby="pending-title"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-[#e8edf2] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2
              id="pending-title"
              className="text-base font-bold text-[#203c54]"
            >
              Pendaftaran menunggu
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih pendaftar untuk meninjau informasi dan CV.
            </p>
          </div>
          <label className="sr-only" htmlFor="mandor-search">
            Cari pendaftar
          </label>
          <input
            id="mandor-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, lokasi, keahlian"
            className="h-10 w-full rounded-lg border border-[#dfe6ec] bg-white px-3 text-sm outline-none focus:border-[#5482a3] sm:max-w-[280px]"
          />
        </div>
        <div className="divide-y divide-[#edf0f3]">
          {filtered.length ? (
            filtered.map((applicant) => (
              <Link
                key={applicant.id}
                href={`/admin/verifikasi-mandor/${applicant.id}`}
                className="group flex flex-col gap-4 px-5 py-5 outline-none transition-colors hover:bg-[#f8fafc] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5482a3] sm:flex-row sm:items-center sm:px-6"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eaf1f6] text-sm font-bold text-[#345c78]">
                  {applicant.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="text-sm text-[#203c54]">{applicant.name}</b>
                    <span className="rounded-md bg-[#fff6e6] px-2 py-0.5 text-[10px] font-semibold text-[#9a6c28]">
                      Menunggu
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {applicant.email} · {applicant.phone}
                  </span>
                  <span className="mt-1 block text-xs text-slate-600">
                    {applicant.expertise} · {applicant.experience} tahun
                    pengalaman · {applicant.city}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4 text-xs text-slate-500 sm:justify-end">
                  <span>
                    <span className="block text-[10px] text-slate-400">
                      Diajukan
                    </span>
                    {applicant.submitted}
                  </span>
                  <span className="rounded-lg border border-[#dce4eb] px-3 py-2 font-semibold text-[#375c77] transition-colors group-hover:border-[#b7c9d8] group-hover:bg-white">
                    Tinjau
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              Tidak ada pendaftar yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </section>
      <section className="mt-5 flex flex-col gap-3 rounded-xl border border-[#e3e9ef] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#203c54]">
            Proses setelah verifikasi
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Mandor yang disetujui dapat aktif dan menunggu penugasan proyek dari
            pengawas.
          </p>
        </div>
        <Link
          href="/admin/manajemen-pengawas"
          className="text-xs font-semibold text-[#35658a] hover:underline"
        >
          Lihat manajemen pengawas
        </Link>
      </section>
    </main>
  );
}
