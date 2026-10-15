"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  mandorProjects,
  type MandorIssueReport,
  type MandorProgressReport,
} from "@/data/mandor";
import { useMandorStatus } from "@/components/mandor/MandorShell";

type Tab = "Ringkasan" | "Laporan progress" | "Kendala";
const reviewClass: Record<string, string> = {
  Menunggu: "bg-[#fff4e2] text-[#98651e]",
  Disetujui: "bg-[#edf6ef] text-[#4d7d56]",
  "Perlu revisi": "bg-[#fff0f0] text-[#a75252]",
  Ditindaklanjuti: "bg-[#eaf2f8] text-[#416f91]",
  Selesai: "bg-[#edf6ef] text-[#4d7d56]",
};

export default function MandorProjectDetail({ id }: { id: string }) {
  const { status } = useMandorStatus();
  const [project, setProject] = useState(() =>
    mandorProjects.find((item) => item.id === id),
  );
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [progressOpen, setProgressOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [toast, setToast] = useState("");
  if (!project) notFound();
  if (status !== "Disetujui")
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <section className="rounded-2xl border border-[#e3e9ef] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#203c54]">
            Detail pekerjaan belum tersedia
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Akses pekerjaan tersedia setelah pendaftaran disetujui.
          </p>
          <Link
            href="/mandor"
            className="mt-4 inline-block text-sm font-semibold text-[#35658a] underline"
          >
            Kembali ke ringkasan
          </Link>
        </section>
      </main>
    );
  const addProgress = (report: MandorProgressReport) => {
    setProject((current) =>
      current
        ? { ...current, progressReports: [report, ...current.progressReports] }
        : current,
    );
    setProgressOpen(false);
    setToast("Laporan progress terkirim dan menunggu verifikasi pengawas.");
    window.setTimeout(() => setToast(""), 4000);
  };
  const addIssue = (report: MandorIssueReport) => {
    setProject((current) =>
      current
        ? { ...current, issueReports: [report, ...current.issueReports] }
        : current,
    );
    setIssueOpen(false);
    setToast("Laporan kendala terkirim kepada pengawas.");
    window.setTimeout(() => setToast(""), 4000);
  };
  return (
    <main className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 md:py-7">
      <Link
        href="/mandor/proyek"
        className="text-xs font-semibold text-[#35658a] hover:underline"
      >
        Kembali ke proyek
      </Link>
      <section className="overflow-hidden rounded-2xl border border-[#e3e9ef] bg-white">
        <div className="relative h-44 sm:h-60">
          <Image
            src={project.image}
            alt={`Desain ${project.title}`}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <span className="absolute left-4 top-4 rounded-md bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#365c78]">
            #{project.id}
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
          <div>
            <p className="text-xs text-[#53738d]">{project.design}</p>
            <h1 className="mt-1 text-2xl font-bold text-[#183b57]">
              {project.title}
            </h1>
            <p className="mt-2 text-xs text-slate-500">{project.location}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-slate-500">Progres resmi proyek</p>
            <p className="mt-1 text-2xl font-bold text-[#315b76]">
              {project.overallProgress}%
            </p>
            <p className="text-[10px] text-slate-500">
              Target {project.target}
            </p>
          </div>
        </div>
      </section>
      {toast && (
        <div
          role="status"
          className="rounded-lg border border-[#cfe3d2] bg-[#edf7ee] px-4 py-3 text-sm text-[#3f7049]"
        >
          {toast}
        </div>
      )}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <nav
          className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#dfe6ec] bg-white p-1"
          aria-label="Bagian detail pekerjaan"
        >
          {(["Ringkasan", "Laporan progress", "Kendala"] as Tab[]).map(
            (item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold ${tab === item ? "bg-[#2B3361] text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {item}
              </button>
            ),
          )}
        </nav>
        <div className="flex gap-2">
          <button
            onClick={() => setProgressOpen(true)}
            className="min-h-10 flex-1 rounded-lg bg-[#2B3361] px-4 text-xs font-semibold text-white hover:bg-[#21274b] sm:flex-none"
          >
            Lapor progress
          </button>
          <button
            onClick={() => setIssueOpen(true)}
            className="min-h-10 flex-1 rounded-lg border border-[#ccd8e2] bg-white px-4 text-xs font-semibold text-[#365c78] hover:bg-[#f6f9fb] sm:flex-none"
          >
            Laporkan kendala
          </button>
        </div>
      </div>
      {tab === "Ringkasan" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
              <h2 className="text-base font-bold text-[#263d53]">
                Tahapan dan pekerjaan
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Rincian tahap bersifat read-only. Kirim laporan jika ada
                perkembangan.
              </p>
              <div className="mt-4 space-y-3">
                {project.milestones.map((milestone) => (
                  <article
                    key={milestone.id}
                    className="rounded-xl border border-[#e7ecf0] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[#29465e]">
                          {milestone.title}
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Target {milestone.target}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${milestone.status === "Selesai" ? reviewClass.Disetujui : milestone.status === "Berjalan" ? "bg-[#eaf2f8] text-[#416f91]" : "bg-[#f0f2f5] text-[#718096]"}`}
                      >
                        {milestone.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Progress tahap</span>
                      <b>{milestone.progress}%</b>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e9edf2]">
                      <span
                        className="block h-full rounded-full bg-[#5e83a0]"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    <ul className="mt-3 space-y-2">
                      {milestone.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <span
                            className={`grid h-4 w-4 place-items-center rounded border text-[9px] ${task.done ? "border-[#71947b] bg-[#edf6ef] text-[#4d7d56]" : "border-slate-300"}`}
                          >
                            {task.done ? "✓" : ""}
                          </span>
                          {task.title}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
              <h2 className="text-base font-bold text-[#263d53]">
                Lingkup pekerjaan
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {project.scope.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-[#f7f9fb] px-3 py-2.5 text-xs leading-5 text-slate-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
              <h2 className="text-base font-bold text-[#263d53]">
                Arahan pengawas
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {project.supervisorNote}
              </p>
              <p className="mt-4 border-t border-[#edf0f3] pt-3 text-xs font-semibold text-[#416f91]">
                {project.supervisor}
              </p>
            </section>
            <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
              <h2 className="text-base font-bold text-[#263d53]">
                Informasi penugasan
              </h2>
              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Ditugaskan</dt>
                  <dd className="font-medium text-[#29465e]">
                    {project.assignedAt}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Tahap berjalan</dt>
                  <dd className="text-right font-medium text-[#29465e]">
                    {project.currentMilestone}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Target selesai</dt>
                  <dd className="font-medium text-[#29465e]">
                    {project.target}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      )}
      {tab === "Laporan progress" && (
        <Reports reports={project.progressReports} project={project} />
      )}
      {tab === "Kendala" && <Issues reports={project.issueReports} />}
      {progressOpen && (
        <ProgressModal
          project={project}
          onClose={() => setProgressOpen(false)}
          onSubmit={addProgress}
        />
      )}
      {issueOpen && (
        <IssueModal onClose={() => setIssueOpen(false)} onSubmit={addIssue} />
      )}
    </main>
  );
}

function Reports({
  reports,
  project,
}: {
  reports: MandorProgressReport[];
  project: (typeof mandorProjects)[number];
}) {
  return (
    <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
      <h2 className="text-base font-bold text-[#263d53]">
        Riwayat laporan progress
      </h2>
      <div className="mt-4 space-y-3">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-xl border border-[#e5eaf0] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#29465e]">
                  {
                    project.milestones.find(
                      (item) => item.id === report.milestoneId,
                    )?.title
                  }
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  {report.id} · {report.submitted}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${reviewClass[report.review]}`}
              >
                {report.review === "Menunggu"
                  ? "Menunggu verifikasi"
                  : report.review}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              {report.note}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-[#edf0f3] pt-3 text-[10px] text-slate-500">
              <span>
                Status usulan: <b className="text-[#29465e]">{report.status}</b>
              </span>
              <span>
                Progress usulan:{" "}
                <b className="text-[#29465e]">{report.proposedProgress}%</b>
              </span>
            </div>
            {report.feedback && (
              <div className="mt-3 rounded-lg bg-[#f4f7fa] p-3">
                <p className="text-[10px] font-semibold text-[#416f91]">
                  Feedback pengawas
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {report.feedback}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
      {reports.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Belum ada laporan progress.
        </p>
      )}
    </section>
  );
}
function Issues({ reports }: { reports: MandorIssueReport[] }) {
  return (
    <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
      <h2 className="text-base font-bold text-[#263d53]">
        Laporan kendala lapangan
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Kendala yang dikirim akan diterima pengawas untuk ditinjau.
      </p>
      <div className="mt-4 space-y-3">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-xl border border-[#e5eaf0] p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                {report.id} · {report.submitted}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${reviewClass[report.status]}`}
              >
                {report.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {report.description}
            </p>
            {report.followUp && (
              <div className="mt-3 rounded-lg bg-[#f4f7fa] p-3">
                <p className="text-[10px] font-semibold text-[#416f91]">
                  Tindak lanjut pengawas
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {report.followUp}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
      {reports.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Belum ada kendala dilaporkan.
        </p>
      )}
    </section>
  );
}

function ProgressModal({
  project,
  onClose,
  onSubmit,
}: {
  project: (typeof mandorProjects)[number];
  onClose: () => void;
  onSubmit: (report: MandorProgressReport) => void;
}) {
  const [milestoneId, setMilestoneId] = useState(
    project.milestones.find((item) => item.status === "Berjalan")?.id ??
      project.milestones[0].id,
  );
  const [status, setStatus] =
    useState<MandorProgressReport["status"]>("Berjalan");
  const [progress, setProgress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  return (
    <Dialog title="Laporkan progress" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(progress);
          if (
            !progress ||
            value < 0 ||
            value > 100 ||
            note.trim().length < 10
          ) {
            setError(
              "Masukkan progress 0–100% dan catatan minimal 10 karakter.",
            );
            return;
          }
          onSubmit({
            id: `PR-${project.id}-${Date.now().toString().slice(-4)}`,
            milestoneId,
            status,
            proposedProgress: value,
            note: note.trim(),
            submitted: new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date()),
            review: "Menunggu",
            feedback: "",
          });
        }}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Progress yang Anda kirim menjadi usulan dan belum mengubah progress
          resmi sebelum diverifikasi pengawas.
        </p>
        <label className="block text-xs font-semibold text-[#29465e]">
          Tahapan
          <select
            value={milestoneId}
            onChange={(event) => setMilestoneId(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm font-normal"
          >
            {project.milestones.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#29465e]">
          Status pekerjaan
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as MandorProgressReport["status"])
            }
            className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm font-normal"
          >
            <option>Belum dimulai</option>
            <option>Berjalan</option>
            <option>Selesai</option>
          </select>
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#29465e]">
          Progress yang diusulkan (%)
          <input
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(event) => setProgress(event.target.value)}
            placeholder="0–100"
            className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe6ed] px-3 text-sm font-normal"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#29465e]">
          Catatan pekerjaan
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Jelaskan pekerjaan yang sudah dilakukan"
            className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm font-normal"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        )}
        <DialogFooter onClose={onClose} submitLabel="Kirim laporan" />
      </form>
    </Dialog>
  );
}
function IssueModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (report: MandorIssueReport) => void;
}) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  return (
    <Dialog title="Laporkan kendala" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (description.trim().length < 10) {
            setError("Uraian kendala minimal 10 karakter.");
            return;
          }
          onSubmit({
            id: `KN-${Date.now().toString().slice(-6)}`,
            description: description.trim(),
            submitted: new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date()),
            status: "Menunggu",
            followUp: "",
          });
        }}
      >
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Sampaikan kendala secara jelas agar pengawas dapat meninjau dan
          menindaklanjuti.
        </p>
        <label
          htmlFor="issue-description"
          className="block text-xs font-semibold text-[#29465e]"
        >
          Uraian kendala
          <textarea
            id="issue-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Contoh: material untuk pekerjaan berikutnya belum tersedia sehingga jadwal berisiko tertunda."
            className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm font-normal"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        )}
        <DialogFooter onClose={onClose} submitLabel="Kirim kendala" />
      </form>
    </Dialog>
  );
}
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#0c1b2b]/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="report-dialog-title"
            className="text-lg font-bold text-[#203c54]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function DialogFooter({
  onClose,
  submitLabel,
}: {
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <footer className="mt-5 flex justify-end gap-2 border-t border-[#edf0f3] pt-4">
      <button
        type="button"
        onClick={onClose}
        className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600"
      >
        Batal
      </button>
      <button
        type="submit"
        className="min-h-10 rounded-lg bg-[#2B3361] px-4 text-xs font-semibold text-white"
      >
        {submitLabel}
      </button>
    </footer>
  );
}
