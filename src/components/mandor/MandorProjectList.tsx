"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMandorStatus } from "@/components/mandor/MandorShell";
import { useMandorProjects } from "@/hooks/useMandorProjects";

export default function MandorProjectList() {
  const { status, loading: statusLoading } = useMandorStatus();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua proyek");
  const { projects: allProjects, loading: projectsLoading } =
    useMandorProjects();
  const projects = useMemo(
    () =>
      allProjects.filter(
        (project) =>
          `${project.id} ${project.title} ${project.location}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === "Semua proyek" ||
            (filter === "Aktif"
              ? project.overallProgress < 100
              : project.overallProgress === 100)),
      ),
    [allProjects, query, filter],
  );
  if (statusLoading || projectsLoading)
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="rounded-2xl border border-[#e3e9ef] bg-white p-10 text-center text-sm text-slate-500">
          Memuat halaman...
        </p>
      </main>
    );
  if (status !== "Disetujui")
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <section className="rounded-2xl border border-[#e3e9ef] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#203c54]">
            Proyek belum tersedia
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Akses proyek tersedia setelah pendaftaran disetujui.
          </p>
          <Link
            href="/mandor"
            className="mt-4 inline-block text-sm font-semibold text-[#35658a] underline"
          >
            Lihat status pendaftaran
          </Link>
        </section>
      </main>
    );
  return (
    <main className="mx-auto max-w-[1480px] space-y-6 px-4 py-6 sm:px-6 md:py-8">
      <header>
        <p className="text-xs font-semibold text-[#64809a]">
          Ruang kerja / Proyek
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#17344e]">
          Proyek yang ditugaskan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Daftar proyek yang dipercayakan kepada Anda.
        </p>
      </header>
      <section className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Cari proyek</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama proyek atau lokasi"
            className="h-11 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm outline-none focus:border-[#477ba6]"
          />
        </label>
        <select
          aria-label="Filter proyek"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-11 rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm"
        >
          <option>Semua proyek</option>
          <option>Aktif</option>
          <option>Selesai</option>
        </select>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="overflow-hidden rounded-2xl border border-[#e2e8ed] bg-white"
          >
            <div className="relative h-44 sm:h-52">
              <Image
                src={project.image}
                alt={`Desain ${project.title}`}
                fill
                sizes="(max-width: 1280px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#365c78]">
                #{project.id}
              </span>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#53738d]">{project.design}</p>
              <h2 className="mt-1 text-lg font-bold text-[#183b57]">
                {project.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{project.location}</p>
              <div className="mt-4 flex justify-between text-xs text-slate-500">
                <span>Tahap: {project.currentMilestone}</span>
                <span>Target: {project.target}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9edf2]">
                <span
                  className="block h-full rounded-full bg-[#5e83a0]"
                  style={{ width: `${project.overallProgress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[10px] font-semibold text-[#315b76]">
                {project.overallProgress}% resmi
              </div>
              <Link
                href={`/mandor/proyek/${project.id}`}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#2B3361] px-4 text-sm font-semibold text-white hover:bg-[#21274b]"
              >
                Lihat pekerjaan
              </Link>
            </div>
          </article>
        ))}
      </div>
      {projects.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#d8e1e8] bg-white p-10 text-center text-sm text-slate-500">
          Tidak ada proyek yang sesuai dengan pencarian.
        </p>
      )}
    </main>
  );
}
