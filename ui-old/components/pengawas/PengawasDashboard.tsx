"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  supervisorProjects,
  type SupervisorProjectStatus,
} from "@/data/pengawas";

const statusClasses: Record<SupervisorProjectStatus, string> = {
  Berjalan: "bg-[#eaf2f8] text-[#416f91]",
  "Perlu perhatian": "bg-[#fff3e2] text-[#9b6a24]",
  Selesai: "bg-[#edf6ef] text-[#4d7d56]",
};
export default function PengawasDashboard() {
  const [filter, setFilter] = useState("Semua proyek");
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      supervisorProjects.filter(
        (project) =>
          `${project.id} ${project.title} ${project.customer} ${project.design}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (filter === "Semua proyek" ||
            (filter === "Aktif"
              ? project.status !== "Selesai"
              : project.status === "Selesai")),
      ),
    [filter, query],
  );
  const active = supervisorProjects.filter(
    (project) => project.status !== "Selesai",
  ).length;
  const needsAttention = supervisorProjects.filter(
    (project) => project.status === "Perlu perhatian",
  ).length;
  return (
    <div className="mx-auto max-w-[1500px] space-y-7 p-5 md:p-8 xl:p-10">
      <section className="flex flex-col justify-between gap-5 border-b border-[#dfe6ec] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold text-[#64809a]">
            Kamis, 15 Oktober 2026
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-[#17344e] md:text-[34px]">
            Ringkasan operasional
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Pantau proyek yang dipercayakan kepada Anda, tinjau laporan
            lapangan, dan pastikan setiap tahap bergerak sesuai rencana.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="min-w-[110px] border-l-2 border-[#6b91ae] pl-3">
            <p className="text-[10px] text-slate-500">Proyek aktif</p>
            <strong className="mt-1 block text-2xl text-[#183b57]">
              {active}
            </strong>
          </div>
          <div className="min-w-[130px] border-l-2 border-[#d7a348] pl-3">
            <p className="text-[10px] text-slate-500">Perlu perhatian</p>
            <strong className="mt-1 block text-2xl text-[#183b57]">
              {needsAttention}
            </strong>
          </div>
        </div>
      </section>
      <section id="proyek" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#263d53]">Proyek Anda</h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih proyek untuk membuka detail dan pekerjaan lapangan.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label>
              <span className="sr-only">Cari proyek</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari proyek, customer, desain..."
                className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs outline-none focus:border-[#477ba6] focus:ring-2 focus:ring-[#477ba6]/15 sm:w-[250px]"
              />
            </label>
            <label>
              <span className="sr-only">Filter daftar proyek</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-10 rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs text-slate-600 outline-none focus:border-[#477ba6]"
              >
                <option>Semua proyek</option>
                <option>Aktif</option>
                <option>Selesai</option>
              </select>
            </label>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((project) => (
            <article
              key={project.id}
              className="overflow-hidden rounded-2xl border border-[#e2e8ed] bg-white"
            >
              <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#365873]">
                      #{project.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${statusClasses[project.status]}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-[#183b57]">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {project.design} <span className="px-1">·</span>{" "}
                    {project.customer}
                  </p>
                </div>
                <Link
                  href={`/pengawas/proyek/${project.id}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#cfdce6] px-4 text-xs font-semibold text-[#355c78] hover:bg-[#f3f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
                >
                  Buka detail
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-y-4 border-t border-[#edf0f3] bg-[#fafbfc] px-5 py-4 sm:grid-cols-4 sm:px-6">
                <div>
                  <p className="text-[9px] text-slate-500">Customer</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {project.customer}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500">Progres resmi</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {project.progress}%
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500">Mandor</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                    {project.foreman ?? "Belum ditetapkan"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500">Target selesai</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {project.deadline}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 sm:px-6">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Progres keseluruhan</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9edf2]">
                  <span
                    className="block h-full rounded-full bg-[#5e83a0]"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#d8e1e8] bg-white px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[#35546d]">
              Tidak ada proyek ditemukan
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ubah kata kunci atau filter proyek.
            </p>
          </div>
        )}
      </section>
      <footer className="border-t border-[#dfe6ec] pt-4 text-[10px] text-slate-400">
        Informasi dashboard diperbarui berdasarkan progres proyek yang telah
        diverifikasi.
      </footer>
    </div>
  );
}
