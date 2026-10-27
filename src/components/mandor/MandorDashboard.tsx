"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { initialMandorRegistration } from "@/data/mandor";
import { useMandorStatus } from "@/components/mandor/MandorShell";
import { useMandorProjects } from "@/hooks/useMandorProjects";

export default function MandorDashboard() {
  const { status, loading: statusLoading } = useMandorStatus();
  const [filter, setFilter] = useState("Semua proyek");
  const [query, setQuery] = useState("");
  const { projects: allProjects, loading: projectsLoading } =
    useMandorProjects();
  const projects = useMemo(
    () =>
      allProjects.filter(
        (project) =>
          `${project.id} ${project.title} ${project.design} ${project.location}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (filter === "Semua proyek" ||
            (filter === "Aktif"
              ? project.overallProgress < 100
              : project.overallProgress === 100)),
      ),
    [allProjects, query, filter],
  );
  const active = allProjects.filter(
    (project) => project.overallProgress < 100,
  ).length;
  const waiting = allProjects
    .flatMap((project) => project.progressReports)
    .filter((report) => report.review === "Menunggu").length;
  if (statusLoading || projectsLoading)
    return (
      <main className="grid min-h-[calc(100vh-68px)] place-items-center text-sm text-slate-600">
        Memuat halaman...
      </main>
    );
  if (status !== "Disetujui") return <VerificationStatus />;
  return (
    <div className="mx-auto max-w-[1480px] space-y-7 px-4 py-6 sm:px-6 md:py-8">
      <section className="flex flex-col justify-between gap-5 border-b border-[#dfe6ec] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold text-[#64809a]">
            Kamis, 15 Oktober 2026
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-[#17344e] md:text-[34px]">
            Pekerjaan Anda
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Lihat tugas lapangan, ikuti arahan pengawas, dan kirim laporan
            perkembangan proyek.
          </p>
        </div>
        <div className="flex gap-5">
          <div className="min-w-[92px] border-l-2 border-[#6b91ae] pl-3">
            <p className="text-[10px] text-slate-500">Proyek aktif</p>
            <strong className="mt-1 block text-2xl text-[#183b57]">
              {active}
            </strong>
          </div>
          <div className="min-w-[112px] border-l-2 border-[#d7a348] pl-3">
            <p className="text-[10px] text-slate-500">Laporan menunggu</p>
            <strong className="mt-1 block text-2xl text-[#183b57]">
              {waiting}
            </strong>
          </div>
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="mandor-projects-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="mandor-projects-title"
              className="text-lg font-bold text-[#263d53]"
            >
              Proyek yang ditugaskan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih proyek untuk melihat lingkup kerja, tahapan, dan instruksi
              pengawas.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label>
              <span className="sr-only">Cari proyek</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari proyek atau lokasi"
                className="h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-xs outline-none focus:border-[#477ba6] sm:w-[230px]"
              />
            </label>
            <label>
              <span className="sr-only">Filter proyek</span>
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
          {projects.map((project) => (
            <article
              key={project.id}
              className="overflow-hidden rounded-2xl border border-[#e2e8ed] bg-white"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-[#e9eef2] sm:h-24 sm:w-32">
                  <Image
                    src={project.image}
                    alt="Tampilan desain rumah"
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-[#53738d]">
                    #{project.id} Â· {project.design}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[#183b57]">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {project.location}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                    <span>Pengawas: {project.supervisor}</span>
                    <span>Target: {project.target}</span>
                  </div>
                </div>
                <Link
                  href={`/mandor/proyek/${project.id}`}
                  className="flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-[#cfdce6] px-4 text-xs font-semibold text-[#355c78] hover:bg-[#f3f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
                >
                  Buka pekerjaan
                </Link>
              </div>
              <div className="border-t border-[#edf0f3] bg-[#fafbfc] px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>
                    Progres proyek{" "}
                    <span className="ml-1 rounded bg-[#eaf2f8] px-1.5 py-0.5 text-[#416f91]">
                      Usulan menunggu tidak mengubah progres resmi
                    </span>
                  </span>
                  <b className="text-[#315b76]">{project.overallProgress}%</b>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9edf2]">
                  <span
                    className="block h-full rounded-full bg-[#5e83a0]"
                    style={{ width: `${project.overallProgress}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
        {projects.length === 0 && (
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
    </div>
  );
}

function VerificationStatus() {
  const { status, reason, resubmit } = useMandorStatus();
  if (status === "Menunggu")
    return (
      <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-3xl place-items-center px-5 py-12">
        <section className="w-full rounded-2xl border border-[#e2e8ed] bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff3df] text-lg font-bold text-[#98651e]">
            i
          </span>
          <h1 className="mt-5 text-2xl font-bold text-[#183b57]">
            Pendaftaran sedang ditinjau
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
            Profil dan dokumen Anda sedang diperiksa oleh admin. Fitur proyek
            akan tersedia setelah pendaftaran disetujui.
          </p>
          <div className="mt-7 grid gap-3 rounded-xl bg-[#f7f9fb] p-4 text-left sm:grid-cols-3">
            <div>
              <span className="text-[10px] text-slate-500">Status akun</span>
              <b className="mt-1 block text-xs text-[#946a27]">
                Menunggu verifikasi
              </b>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">
                Langkah selanjutnya
              </span>
              <b className="mt-1 block text-xs text-[#29465e]">
                Tinjauan admin
              </b>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Akses proyek</span>
              <b className="mt-1 block text-xs text-slate-500">
                Belum tersedia
              </b>
            </div>
          </div>
        </section>
      </main>
    );
  return (
    <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-3xl place-items-center px-5 py-12">
      <RejectedApplication
        reason={reason}
        onResubmit={() => void resubmit()}
      />
    </main>
  );
}

function RejectedApplication({
  reason,
  onResubmit,
}: {
  reason: string;
  onResubmit: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ ...initialMandorRegistration });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");
  const update = (key: keyof typeof profile, value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));
  return (
    <section className="w-full rounded-2xl border border-[#e2e8ed] bg-white p-6 shadow-sm sm:p-9">
      <p className="text-xs font-semibold text-[#a75252]">
        Perlu perbaikan pada pendaftaran
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[#183b57]">
        Tinjau kembali informasi Anda
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Admin belum dapat menyetujui pendaftaran. Perbaiki informasi berikut,
        lalu ajukan kembali untuk ditinjau.
      </p>
      <div className="mt-5 rounded-xl border border-[#ecd2d2] bg-[#fff8f8] p-4">
        <p className="text-[10px] font-semibold text-[#854b4b]">
          Catatan admin
        </p>
        <p className="mt-1 text-sm leading-6 text-[#704c4c]">{reason}</p>
      </div>
      {saved && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-[#edf6ef] px-4 py-3 text-sm text-[#3f7049]"
        >
          Pembaruan tersimpan. Pendaftaran Anda menunggu pemeriksaan admin.
        </p>
      )}
      {!editing ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-lg bg-[#2B3361] px-5 text-sm font-semibold text-white hover:bg-[#21274b]"
          >
            Perbarui profil
          </button>
          {!saved && (
            <button
              onClick={onResubmit}
              className="min-h-11 rounded-lg border border-[#ccd8e2] px-5 text-sm font-semibold text-[#365c78] hover:bg-[#f6f9fb]"
            >
              Ajukan ulang
            </button>
          )}
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (
              profile.name.trim().length < 2 ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) ||
              profile.experienceSummary.trim().length < 20 ||
              profile.previousProjects.trim().length < 5 ||
              profile.area.trim().length < 2 ||
              !/^\d{1,2}$/.test(profile.experience)
            ) {
              setFormError(
                "Periksa kembali nama, email, pengalaman, area, serta ringkasan kerja dan proyek.",
              );
              return;
            }
            if (
              cvFile &&
              (cvFile.type !== "application/pdf" ||
                cvFile.size > 5 * 1024 * 1024)
            ) {
              setFormError(
                "CV harus berformat PDF dengan ukuran maksimal 5 MB.",
              );
              return;
            }
            setFormError("");
            setEditing(false);
            setSaved(true);
            onResubmit();
          }}
          className="mt-6 space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Nama lengkap", "name"],
                ["Email", "email"],
                ["Nomor HP", "phone"],
                ["Keahlian", "expertise"],
                ["Pengalaman (tahun)", "experience"],
                ["Area kerja", "area"],
              ] as const
            ).map(([label, key]) => (
              <label
                key={key}
                className="block text-xs font-medium text-[#29465e]"
              >
                {label}
                <input
                  value={profile[key]}
                  onChange={(event) => update(key, event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe6ed] px-3 text-sm outline-none focus:border-[#477ba6]"
                />
              </label>
            ))}
          </div>
          <label className="block text-xs font-medium text-[#29465e]">
            Ceritakan pengalaman kerja
            <textarea
              value={profile.experienceSummary}
              onChange={(event) =>
                update("experienceSummary", event.target.value)
              }
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm outline-none focus:border-[#477ba6]"
            />
          </label>
          <label className="block text-xs font-medium text-[#29465e]">
            Project yang pernah dilakukan
            <textarea
              value={profile.previousProjects}
              onChange={(event) =>
                update("previousProjects", event.target.value)
              }
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm outline-none focus:border-[#477ba6]"
            />
          </label>
          <label className="block text-xs font-medium text-[#29465e]">
            CV terbaru (PDF)
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (
                  file.type !== "application/pdf" ||
                  !file.name.toLowerCase().endsWith(".pdf") ||
                  file.size > 5 * 1024 * 1024
                ) {
                  setFormError(
                    "CV harus berformat PDF dengan ukuran maksimal 5 MB.",
                  );
                  setCvFile(null);
                  event.target.value = "";
                  return;
                }
                setFormError("");
                setCvFile(file);
              }}
              className="mt-1.5 block w-full rounded-lg border border-[#dfe6ed] bg-white p-2 text-xs"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              CV saat ini: {cvFile?.name ?? profile.cv.split("/").pop()}
            </span>
          </label>
          {formError && (
            <p role="alert" className="text-xs text-red-700">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-10 rounded-lg border px-4 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-[#2B3361] px-4 text-xs font-semibold text-white"
            >
              Simpan dan ajukan ulang
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
