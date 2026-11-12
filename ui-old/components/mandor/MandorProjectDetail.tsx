"use client";

import { useRef, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  mandorProjects,
  type MandorIssueReport,
  type MandorMilestone,
  type MandorProgressReport,
} from "@/data/mandor";
import { useMandorStatus } from "@/components/mandor/MandorShell";
import {
  addForemanNote,
  addIssueReport,
  addSyncedReport,
  compressImage,
  useProjectSync,
  type ApprovedSubtask,
  type ForemanNote,
  type SyncedReport,
} from "@/utils/project-events";

type Tab = "Ringkasan" | "Laporan progress" | "Kendala";
const reviewClass: Record<string, string> = {
  Menunggu: "bg-[#fff4e2] text-[#98651e]",
  Disetujui: "bg-[#edf6ef] text-[#4d7d56]",
  "Perlu revisi": "bg-[#fff0f0] text-[#a75252]",
  Ditindaklanjuti: "bg-[#eaf2f8] text-[#416f91]",
  Selesai: "bg-[#edf6ef] text-[#4d7d56]",
};

const isApproved = (
  task: MandorMilestone["subtasks"][number],
  milestone: MandorMilestone,
  approved: ApprovedSubtask[],
) =>
  task.done ||
  approved.some(
    (item) =>
      item.milestoneId === milestone.id && item.subtaskTitle === task.title,
  );

const milestoneState = (
  milestone: MandorMilestone,
  approved: ApprovedSubtask[],
) => {
  const doneCount = milestone.subtasks.filter((task) =>
    isApproved(task, milestone, approved),
  ).length;
  if (doneCount === 0) return "Menunggu" as const;
  if (doneCount === milestone.subtasks.length) return "Selesai" as const;
  return "Berjalan" as const;
};

const milestoneProgress = (
  milestone: MandorMilestone,
  approved: ApprovedSubtask[],
) => {
  const doneWeight = milestone.subtasks
    .filter((task) => isApproved(task, milestone, approved))
    .reduce((sum, task) => sum + task.weight, 0);
  return Math.round((doneWeight / milestone.weight) * 100);
};

const formatNow = () =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

export default function MandorProjectDetail({ id }: { id: string }) {
  const { status } = useMandorStatus();
  const [project, setProject] = useState(() =>
    mandorProjects.find((item) => item.id === id),
  );
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [progressOpen, setProgressOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [toast, setToast] = useState("");
  const sync = useProjectSync();
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

  const seededReports: SyncedReport[] = sync.reports.filter(
    (report) => report.projectId === id,
  );
  const approvedSubtasks = sync.approvedSubtasks.filter(
    (item) => item.projectId === id,
  );
  const approvedWeight = project.milestones.reduce(
    (sum, milestone) =>
      sum +
      milestone.subtasks
        .filter((task) => isApproved(task, milestone, approvedSubtasks))
        .reduce((subtotal, task) => subtotal + task.weight, 0),
    0,
  );
  const officialProgress = Math.max(project.overallProgress, approvedWeight);
  const reportDecision = (reportId: string): MandorProgressReport["review"] =>
    sync.reports.find((report) => report.id === reportId)?.decision ??
    "Menunggu";

  const addProgress = (report: MandorProgressReport) => {
    addSyncedReport({
      id: report.id,
      projectId: id,
      foreman: "Bima Saputra",
      milestoneId: report.milestoneId,
      milestoneTitle: report.milestoneTitle,
      subtaskTitle: report.subtaskTitle,
      note: report.note,
      photo: report.photo,
      submitted: report.submitted,
      decision: "Menunggu",
      weight: report.weight,
    });
    setProgressOpen(false);
    setToast("Laporan progress terkirim dan menunggu verifikasi pengawas.");
    window.setTimeout(() => setToast(""), 4000);
  };
  const addIssue = (report: MandorIssueReport) => {
    const scopedReport = { ...report, projectId: id };
    addIssueReport(scopedReport);
    setProject((current) =>
      current
        ? { ...current, issueReports: [scopedReport, ...current.issueReports] }
        : current,
    );
    setIssueOpen(false);
    setToast("Laporan kendala terkirim kepada pengawas.");
    window.setTimeout(() => setToast(""), 4000);
  };
  const submitNote = (note: string) => {
    const next: ForemanNote = {
      id: `CN-${Date.now()}`,
      projectId: id,
      foreman: "Bima Saputra",
      note,
      submitted: formatNow(),
    };
    addForemanNote(next);
    setToast("Catatan untuk pengawas terkirim.");
    window.setTimeout(() => setToast(""), 4000);
  };

  const weightedReports = seededReports
    .map((report) => ({
      id: report.id,
      milestoneId: report.milestoneId,
      milestoneTitle: report.milestoneTitle,
      subtaskTitle: report.subtaskTitle,
      note: report.note,
      photo: report.photo,
      submitted: report.submitted,
      review: report.decision,
      feedback: "",
      weight: report.weight,
    }))
    .sort((a, b) => b.submitted.localeCompare(a.submitted));

  return (
    <main className="mx-auto max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 md:py-7">
      <Link
        href="/mandor/proyek"
        className="text-xs font-semibold text-[#35658a] hover:underline"
      >
        ‹ Kembali ke proyek
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
              {officialProgress}%
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
            className="min-h-10 flex-1 rounded-lg border border-[#d99a9a] bg-[#a94444] px-4 text-xs font-semibold text-white hover:bg-[#913838] sm:flex-none"
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
                perkembangan pekerjaan.
              </p>
              <div className="mt-4 space-y-3">
                {project.milestones.map((milestone) => {
                  const state = milestoneState(milestone, approvedSubtasks);
                  const progress = milestoneProgress(
                    milestone,
                    approvedSubtasks,
                  );
                  return (
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
                            Target {milestone.target} · Bobot {milestone.weight}
                            %
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${state === "Selesai" ? reviewClass.Disetujui : state === "Berjalan" ? "bg-[#eaf2f8] text-[#416f91]" : "bg-[#f0f2f5] text-[#718096]"}`}
                        >
                          {state}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Progress tahap</span>
                        <b>{progress}%</b>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e9edf2]">
                        <span
                          className="block h-full rounded-full bg-[#5e83a0]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <ul className="mt-3 space-y-2">
                        {milestone.subtasks.map((task) => {
                          const done = isApproved(
                            task,
                            milestone,
                            approvedSubtasks,
                          );
                          return (
                            <li
                              key={task.id}
                              className="flex items-center justify-between gap-2 text-xs text-slate-600"
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`grid h-4 w-4 place-items-center rounded border text-[9px] ${done ? "border-[#71947b] bg-[#edf6ef] text-[#4d7d56]" : "border-slate-300"}`}
                                >
                                  {done ? "✓" : ""}
                                </span>
                                {task.title}
                              </span>
                              <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                {task.weight}%
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </article>
                  );
                })}
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
            <NotesCard
              notes={sync.notes.filter((note) => note.projectId === id)}
              onSubmit={submitNote}
            />
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
        <Reports
          reports={weightedReports}
          reviewFor={reportDecision}
          pendingMilestones={
            new Set(sync.reports.map((report) => report.milestoneTitle))
          }
        />
      )}
      {tab === "Kendala" && <Issues reports={project.issueReports} />}
      {progressOpen && (
        <ProgressModal
          project={project}
          approvedSubtasks={approvedSubtasks}
          onClose={() => setProgressOpen(false)}
          onSubmit={addProgress}
        />
      )}
      {issueOpen && (
        <IssueModal
          project={project}
          approvedSubtasks={approvedSubtasks}
          onClose={() => setIssueOpen(false)}
          onSubmit={addIssue}
        />
      )}
    </main>
  );
}

function NotesCard({
  notes,
  onSubmit,
}: {
  notes: ForemanNote[];
  onSubmit: (note: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
      <h2 className="text-base font-bold text-[#263d53]">
        Catatan untuk pengawas
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Catatan singkat terpisah dari laporan progress dan kendala.
      </p>
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim().length < 5) {
            setError("Catatan minimal 5 karakter.");
            return;
          }
          onSubmit(draft.trim());
          setDraft("");
          setError("");
        }}
      >
        <label
          htmlFor="note-supervisor"
          className="block text-xs font-semibold text-[#29465e]"
        >
          Tulis catatan
          <textarea
            id="note-supervisor"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Contoh: tim sudah menyesuaikan metode kerja sesuai arahan terakhir..."
            className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm font-normal outline-none focus:border-[#5b7c99]"
          />
        </label>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-2 min-h-9 rounded-lg bg-[#2B3361] px-4 text-xs font-semibold text-white hover:bg-[#21274b]"
        >
          Kirim ke pengawas
        </button>
      </form>
      {notes.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[#edf0f3] pt-4">
          {notes.map((note) => (
            <article key={note.id} className="rounded-lg bg-[#f7f9fb] p-3">
              <p className="text-xs leading-5 text-slate-600">{note.note}</p>
              <p className="mt-2 text-[10px] text-slate-400">
                {note.submitted} · untuk pengawas
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Reports({
  reports,
  reviewFor,
  pendingMilestones,
}: {
  reports: MandorProgressReport[];
  reviewFor: (reportId: string) => MandorProgressReport["review"];
  pendingMilestones: Set<string>;
}) {
  return (
    <section className="rounded-2xl border border-[#e3e9ef] bg-white p-5">
      <h2 className="text-base font-bold text-[#263d53]">
        Riwayat laporan progress
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Laporan yang sedang ditinjau pengawas ditandai dengan status menunggu.
      </p>
      <div className="mt-4 space-y-3">
        {reports.map((report) => {
          const review = reviewFor(report.id);
          return (
            <article
              key={report.id}
              className="rounded-xl border border-[#e5eaf0] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {report.milestoneTitle}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#29465e]">
                    {report.subtaskTitle}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {report.id} · {report.submitted}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${reviewClass[review]}`}
                  >
                    {review === "Menunggu" ? "Menunggu verifikasi" : review}
                  </span>
                  <span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-[9px] font-semibold text-slate-500">
                    Bobot +{report.weight}%
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {report.note}
              </p>
              {report.photo && (
                <div className="mt-3 overflow-hidden rounded-lg border border-[#e6ebef]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.photo}
                    alt={`Dokumentasi ${report.subtaskTitle}`}
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}
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
              {review === "Menunggu" &&
                pendingMilestones.has(report.milestoneTitle) && (
                  <p className="mt-3 rounded-lg bg-[#fff8ec] px-3 py-2 text-[10px] leading-4 text-[#8a6a2e]">
                    Subtask menunggu verifikasi pengawas sebelum dihitung ke
                    progres resmi.
                  </p>
                )}
            </article>
          );
        })}
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
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#eaf2f8] px-2.5 py-1 text-[10px] font-semibold text-[#416f91]">
                {report.categoryLabel}
              </span>
              <span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-[10px] font-medium text-slate-600">
                {report.workCondition === "BERJALAN"
                  ? "Pekerjaan berjalan"
                  : report.workCondition === "TERHAMBAT_SEBAGIAN"
                    ? "Terhambat sebagian"
                    : "Pekerjaan berhenti"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {report.description}
            </p>
            <div className="mt-3 rounded-lg bg-[#f7f9fb] p-3 text-xs text-slate-600">
              <p>
                <span className="font-semibold text-[#40596f]">
                  Pekerjaan terdampak:
                </span>{" "}
                {report.affectedMilestoneTitle} / {report.affectedSubtaskTitle}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-[#40596f]">
                  Perkiraan tambahan waktu:
                </span>{" "}
                {report.estimatedDelayDays} hari
              </p>
              {report.additionalInfo && (
                <p className="mt-1">
                  <span className="font-semibold text-[#40596f]">
                    Informasi tambahan:
                  </span>{" "}
                  {report.additionalInfo}
                </p>
              )}
            </div>
            {report.attachment && (
              <div className="mt-3 overflow-hidden rounded-lg border border-[#e6ebef]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.attachment}
                  alt={`Bukti kendala: ${report.attachmentName}`}
                  className="h-40 w-full object-cover"
                />
              </div>
            )}
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
  approvedSubtasks,
  onClose,
  onSubmit,
}: {
  project: (typeof mandorProjects)[number];
  approvedSubtasks: ApprovedSubtask[];
  onClose: () => void;
  onSubmit: (report: MandorProgressReport) => void;
}) {
  const firstOpen = project.milestones.find(
    (milestone) =>
      !milestone.subtasks.every((task) =>
        isApproved(task, milestone, approvedSubtasks),
      ),
  );
  const [subtaskId, setSubtaskId] = useState(
    firstOpen?.subtasks.find(
      (task) => !isApproved(task, firstOpen, approvedSubtasks),
    )?.id ?? "",
  );
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const idCounter = useRef(0);
  const milestone = firstOpen;
  const availableSubtasks = milestone?.subtasks ?? [];
  const pendingSubtasks = availableSubtasks.filter(
    (task) => !isApproved(task, milestone!, approvedSubtasks),
  );

  return (
    <Dialog title="Laporkan progress" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (note.trim().length < 10) {
            setError("Tulis catatan pekerjaan minimal 10 karakter.");
            return;
          }
          const subtask = pendingSubtasks.find((item) => item.id === subtaskId);
          if (!subtask || !milestone) {
            setError("Pilih subtask yang belum selesai.");
            return;
          }
          setSending(true);
          idCounter.current += 1;
          onSubmit({
            id: `PR-${project.id}-${idCounter.current}`,
            milestoneId: milestone.id,
            milestoneTitle: milestone.title,
            subtaskTitle: subtask.title,
            note: note.trim(),
            photo,
            submitted: formatNow(),
            review: "Menunggu",
            feedback: "",
            weight: subtask.weight,
          });
        }}
      >
        <p className="mb-4 rounded-xl bg-[#f5f8fb] p-4 text-xs leading-5 text-slate-600">
          Progress yang Anda kirim menjadi usulan dan belum mengubah progress
          resmi sebelum diverifikasi pengawas.
        </p>
        <div className="block text-xs font-semibold text-[#29465e]">
          Milestone saat ini
          <div className="mt-1.5 flex min-h-10 items-center rounded-lg border border-[#dfe6ed] bg-[#f5f8fb] px-3 text-sm font-medium text-[#315b76]">
            {milestone?.title ?? "Semua milestone telah selesai"}
          </div>
        </div>
        <label className="mt-4 block text-xs font-semibold text-[#29465e]">
          Subtask yang dilaporkan
          <select
            value={subtaskId}
            onChange={(event) => setSubtaskId(event.target.value)}
            disabled={!pendingSubtasks.length}
            className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm font-normal outline-none focus:border-[#5b7c99] disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">Pilih subtask…</option>
            {availableSubtasks.map((task) => {
              const completed = isApproved(task, milestone!, approvedSubtasks);
              return (
                <option key={task.id} value={task.id} disabled={completed}>
                  {task.title} ({task.weight}%) {completed ? "· Selesai" : ""}
                </option>
              );
            })}
          </select>
          <span className="mt-1.5 block text-[10px] text-slate-400">
            Subtask yang sudah selesai ditandai dan tidak dapat dipilih lagi.
          </span>
        </label>
        <label className="mt-4 block text-xs font-semibold text-[#29465e]">
          Catatan pekerjaan
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Jelaskan pekerjaan yang sudah dilakukan dan hasilnya..."
            className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm font-normal outline-none focus:border-[#5b7c99]"
          />
        </label>
        <div className="mt-4">
          <span className="block text-xs font-semibold text-[#29465e]">
            Upload foto (opsional)
          </span>
          <span className="mt-1 block text-[10px] text-slate-400">
            Foto akan muncul di dokumentasi pengawas setelah laporan
            diverifikasi.
          </span>
          <label
            htmlFor="progress-photo"
            className="mt-2 flex h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c6d3de] bg-[#f8fafc] text-xs font-medium text-slate-500 transition-colors hover:border-[#8fa9bf] hover:bg-[#f2f6f9]"
          >
            {photo ? (
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-[11px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="Pratinjau foto laporan"
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <span className="text-center">
                <b className="block text-xs text-[#41698a]">Pilih foto</b>
                <span className="mt-0.5 block text-[10px]">
                  {photoName || "JPG atau PNG, maks 10 MB"}
                </span>
              </span>
            )}
          </label>
          <input
            id="progress-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                setError("Ukuran foto maksimal 10 MB.");
                return;
              }
              setError("");
              const compressed = await compressImage(file);
              setPhoto(compressed);
              setPhotoName(file.name);
            }}
          />
          {photo && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPhotoName("");
              }}
              className="mt-2 text-[10px] font-semibold text-[#a75252] hover:underline"
            >
              Hapus foto
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        )}
        <DialogFooter
          onClose={onClose}
          submitLabel={sending ? "Mengirim…" : "Kirim laporan"}
          disabled={sending}
        />
      </form>
    </Dialog>
  );
}
const ISSUE_CATEGORIES = [
  { value: "CUACA_LINGKUNGAN", label: "Cuaca dan lingkungan" },
  { value: "MATERIAL_PERALATAN", label: "Material dan peralatan" },
  { value: "TENAGA_KERJA", label: "Tenaga kerja" },
  { value: "TEKNIS_KONSTRUKSI", label: "Teknis konstruksi" },
  { value: "DESAIN_SPESIFIKASI", label: "Desain dan spesifikasi" },
  { value: "ANGGARAN_PENGADAAN", label: "Anggaran dan pengadaan" },
  { value: "PERIZINAN_EKSTERNAL", label: "Perizinan dan pihak eksternal" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

function IssueModal({
  project,
  approvedSubtasks,
  onClose,
  onSubmit,
}: {
  project: (typeof mandorProjects)[number];
  approvedSubtasks: ApprovedSubtask[];
  onClose: () => void;
  onSubmit: (report: MandorIssueReport) => void;
}) {
  const milestone =
    project.milestones.find(
      (item) => item.title === project.currentMilestone,
    ) ??
    project.milestones.find((item) =>
      item.subtasks.some((task) => !isApproved(task, item, approvedSubtasks)),
    );
  const availableSubtasks =
    milestone?.subtasks.filter(
      (task) => !isApproved(task, milestone, approvedSubtasks),
    ) ?? [];
  const [category, setCategory] = useState<MandorIssueReport["category"] | "">(
    "",
  );
  const [description, setDescription] = useState("");
  const [subtaskId, setSubtaskId] = useState(availableSubtasks[0]?.id ?? "");
  const [workCondition, setWorkCondition] = useState<
    MandorIssueReport["workCondition"] | ""
  >("");
  const [estimatedDelayDays, setEstimatedDelayDays] = useState(0);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const idCounter = useRef(0);
  const selectedCategory = ISSUE_CATEGORIES.find(
    (item) => item.value === category,
  );
  const selectedSubtask = availableSubtasks.find(
    (task) => task.id === subtaskId,
  );

  return (
    <Dialog title="Laporkan kendala" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!category || !selectedCategory) {
            setError("Pilih kategori kendala.");
            return;
          }
          if (description.trim().length < 10) {
            setError("Jelaskan kendala minimal 10 karakter.");
            return;
          }
          if (!milestone || !selectedSubtask) {
            setError(
              "Tidak ada subtask aktif yang dapat dipilih untuk laporan.",
            );
            return;
          }
          if (!workCondition) {
            setError("Pilih kondisi pekerjaan saat ini.");
            return;
          }
          setSending(true);
          idCounter.current += 1;
          onSubmit({
            id: `KN-${project.id}-${idCounter.current}`,
            projectId: project.id,
            category,
            categoryLabel: selectedCategory.label,
            description: description.trim(),
            affectedMilestoneId: milestone.id,
            affectedMilestoneTitle: milestone.title,
            affectedSubtaskId: selectedSubtask.id,
            affectedSubtaskTitle: selectedSubtask.title,
            workCondition,
            estimatedDelayDays,
            additionalInfo: additionalInfo.trim(),
            attachment,
            attachmentName,
            submitted: formatNow(),
            status: "Menunggu",
            followUp: "",
          });
        }}
        className="space-y-4"
      >
        <p className="rounded-xl border border-[#dce7ef] bg-[#f5f8fb] p-3 text-xs leading-5 text-slate-600">
          Sampaikan kondisi lapangan dengan jelas. Informasi ini membantu
          pengawas menilai dampak dan menentukan penanganan.
        </p>
        <label className="block text-xs font-semibold text-[#29465e]">
          Kategori kendala <span className="text-[#a75252]">*</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as MandorIssueReport["category"] | "",
              )
            }
            className="mt-1.5 h-11 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm font-normal outline-none focus:border-[#5b7c99] focus:ring-2 focus:ring-[#5b7c99]/15"
          >
            <option value="">Pilih kategori kendala</option>
            {ISSUE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[#29465e]">
          Detail kendala <span className="text-[#a75252]">*</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            minLength={10}
            maxLength={1000}
            placeholder="Jelaskan apa yang terjadi, sejak kapan, dan dampaknya pada pekerjaan."
            className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm font-normal outline-none focus:border-[#5b7c99] focus:ring-2 focus:ring-[#5b7c99]/15"
          />
          <span className="mt-1 block text-right text-[10px] font-normal text-slate-400">
            {description.length}/1000
          </span>
        </label>
        <div className="rounded-xl border border-[#e4eaf0] p-3">
          <p className="text-xs font-semibold text-[#29465e]">
            Pekerjaan yang terdampak
          </p>
          {milestone ? (
            <>
              <p className="mt-2 rounded-lg bg-[#f5f8fb] px-3 py-2 text-xs font-medium text-[#315b76]">
                {milestone.title}
              </p>
              <label className="mt-3 block text-xs font-medium text-slate-600">
                Subtask aktif <span className="text-[#a75252]">*</span>
                <select
                  value={subtaskId}
                  onChange={(event) => setSubtaskId(event.target.value)}
                  disabled={!availableSubtasks.length}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe6ed] bg-white px-3 text-sm outline-none focus:border-[#5b7c99] disabled:bg-slate-100"
                >
                  {availableSubtasks.length ? (
                    availableSubtasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada subtask aktif</option>
                  )}
                </select>
              </label>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Semua pekerjaan telah selesai; tidak ada subtask aktif.
            </p>
          )}
        </div>
        <fieldset>
          <legend className="text-xs font-semibold text-[#29465e]">
            Kondisi pekerjaan saat ini <span className="text-[#a75252]">*</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(
              [
                [
                  "BERJALAN",
                  "Tetap berjalan",
                  "Pekerjaan berlanjut dengan penyesuaian.",
                ],
                [
                  "TERHAMBAT_SEBAGIAN",
                  "Terhambat sebagian",
                  "Produktivitas menurun.",
                ],
                [
                  "BERHENTI",
                  "Berhenti total",
                  "Pekerjaan tidak dapat dilanjutkan.",
                ],
              ] as const
            ).map(([value, label, detail]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${workCondition === value ? "border-[#5b7c99] bg-[#f1f6fa] ring-1 ring-[#5b7c99]/20" : "border-[#e1e7ec] hover:bg-[#f8fafb]"}`}
              >
                <input
                  type="radio"
                  name="issue-work-condition"
                  value={value}
                  checked={workCondition === value}
                  onChange={() => setWorkCondition(value)}
                  className="sr-only"
                />
                <span className="block text-[11px] font-semibold text-[#29465e]">
                  {label}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                  {detail}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="issue-delay"
              className="text-xs font-semibold text-[#29465e]"
            >
              Perkiraan tambahan waktu
            </label>
            <span className="rounded-md bg-[#f0f3f6] px-2.5 py-1 text-xs font-semibold text-[#40596f]">
              {estimatedDelayDays} hari
            </span>
          </div>
          <input
            id="issue-delay"
            type="range"
            min={0}
            max={30}
            value={estimatedDelayDays}
            onChange={(event) =>
              setEstimatedDelayDays(Number(event.target.value))
            }
            className="mt-2 w-full accent-[#315b76]"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0 hari</span>
            <span>30 hari</span>
          </div>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
            Perkiraan awal dari mandor, bukan hasil final analisis.
          </p>
        </div>
        <label className="block text-xs font-semibold text-[#29465e]">
          Informasi tambahan{" "}
          <span className="font-normal text-slate-400">(opsional)</span>
          <textarea
            value={additionalInfo}
            onChange={(event) => setAdditionalInfo(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Contoh: pemasok menjanjikan pengiriman ulang hari Jumat."
            className="mt-1.5 w-full rounded-lg border border-[#dfe6ed] p-3 text-sm font-normal outline-none focus:border-[#5b7c99]"
          />
        </label>
        <div>
          <p className="text-xs font-semibold text-[#29465e]">
            Bukti pendukung{" "}
            <span className="font-normal text-slate-400">(opsional)</span>
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Unggah foto kondisi lapangan atau material terkait.
          </p>
          <label
            htmlFor="issue-attachment"
            className="mt-2 flex min-h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#c6d3de] bg-[#f8fafc] text-xs text-slate-500 transition-colors hover:border-[#8fa9bf] hover:bg-[#f2f6f9]"
          >
            {attachment ? (
              <span className="relative block h-40 w-full overflow-hidden rounded-lg">
                <Image
                  src={attachment}
                  alt="Pratinjau bukti kendala"
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="px-3 py-5 text-center">
                <b className="block text-xs text-[#41698a]">Pilih foto</b>
                <span className="mt-1 block text-[10px]">
                  JPG, PNG, atau WebP · maks. 10 MB
                </span>
              </span>
            )}
          </label>
          <input
            id="issue-attachment"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                setError("Ukuran foto maksimal 10 MB.");
                event.target.value = "";
                return;
              }
              setError("");
              const compressed = await compressImage(file);
              setAttachment(compressed);
              setAttachmentName(file.name);
            }}
          />
          {attachment && (
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                setAttachmentName("");
              }}
              className="mt-2 text-[10px] font-semibold text-[#a75252] hover:underline"
            >
              Hapus foto
            </button>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[#fff3f2] px-3 py-2 text-xs text-[#a75252]"
          >
            {error}
          </p>
        )}
        <DialogFooter
          onClose={onClose}
          submitLabel={sending ? "Mengirim…" : "Kirim laporan kendala"}
          disabled={sending}
        />
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
  disabled,
}: {
  onClose: () => void;
  submitLabel: string;
  disabled?: boolean;
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
        disabled={disabled}
        className="min-h-10 rounded-lg bg-[#2B3361] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </footer>
  );
}
