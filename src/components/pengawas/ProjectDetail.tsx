"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  supervisorProjects,
  verifiedForemen,
  type SupervisorProject,
  type SupervisorReport,
} from "@/data/pengawas";
import SupervisorContractModal from "@/components/pengawas/SupervisorContractModal";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const sectionLinks = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "mandor", label: "Mandor" },
  { id: "progress", label: "Progress" },
  { id: "kendala", label: "Kendala" },
  { id: "customer", label: "Customer" },
  { id: "dokumentasi", label: "Dokumentasi" },
  { id: "jadwal", label: "Jadwal" },
  { id: "pembayaran", label: "Pembayaran" },
];
const sectionClass =
  "scroll-mt-28 rounded-2xl border border-[#e3e9ee] bg-white";

function Surface({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={`${sectionClass} p-5 md:p-6`}>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#263d53]">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
function AssignmentDialog({
  project,
  onClose,
  onAssign,
}: {
  project: SupervisorProject;
  onClose: () => void;
  onAssign: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const available = useMemo(
    () =>
      verifiedForemen.filter(
        (foreman) =>
          foreman.verified &&
          `${foreman.name} ${foreman.specialties.join(" ")} ${foreman.area}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#0c1b2b]/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="foreman-dialog-title"
        className="w-full max-w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#e8edf1] px-5 py-4 md:px-6">
          <div>
            <p className="text-[10px] text-slate-500">Proyek #{project.id}</p>
            <h2
              id="foreman-dialog-title"
              className="mt-1 text-lg font-bold text-[#17344e]"
            >
              Pilih mandor terverifikasi
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-xl text-slate-500"
          >
            ×
          </button>
        </header>
        <div className="p-5">
          <label className="block">
            <span className="sr-only">Cari mandor</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, keahlian, atau area..."
              className="h-10 w-full rounded-lg border border-[#dfe6ed] px-3 text-xs outline-none focus:border-[#477ba6]"
            />
          </label>
          <div className="mt-3 max-h-[48vh] space-y-2 overflow-y-auto">
            {available.map((foreman) => (
              <button
                key={foreman.id}
                onClick={() => setSelected(foreman.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${selected === foreman.id ? "border-[#7395b1] bg-[#f2f6f9]" : "border-[#e6ebef] hover:bg-slate-50"}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eaf1f6] text-xs font-bold text-[#355973]">
                  {foreman.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-xs text-[#29465e]">{foreman.name}</b>
                  <span className="mt-1 block text-[10px] text-slate-500">
                    {foreman.experience} tahun pengalaman · {foreman.area}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-500">
                    Keahlian: {foreman.specialties.join(", ")}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    Portofolio: {foreman.portfolio}
                  </span>
                </span>
                <span className="rounded-full bg-[#edf6ef] px-2 py-1 text-[9px] font-semibold text-[#4e8058]">
                  Terverifikasi
                </span>
              </button>
            ))}
            {available.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">
                Mandor tidak ditemukan.
              </p>
            )}
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#e8edf1] bg-[#fafbfc] px-5 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-[#dfe6ed] px-4 text-xs font-semibold text-slate-600"
          >
            Batal
          </button>
          <button
            disabled={!selected}
            onClick={() => {
              const foreman = verifiedForemen.find(
                (item) => item.id === selected,
              );
              if (foreman) onAssign(foreman.name);
            }}
            className="h-10 rounded-lg bg-[#183b57] px-5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Tetapkan mandor
          </button>
        </footer>
      </section>
    </div>
  );
}
function ReportReview({
  report,
  onDecision,
}: {
  report: SupervisorReport;
  onDecision: (id: string, decision: "Disetujui" | "Perlu revisi") => void;
}) {
  const [open, setOpen] = useState(false);
  const milestone = supervisorProjects[0].milestones.find(
    (item) => item.id === report.milestoneId,
  );
  return (
    <article className="rounded-xl border border-[#e5eaf0] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#2d4b63]">{report.title}</p>
          <p className="mt-1 text-[10px] text-slate-500">
            {report.foreman} · {report.submitted}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Tahap: {milestone?.name ?? "Struktur bangunan"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${report.decision === "Menunggu" ? "bg-[#fff4e2] text-[#98651e]" : report.decision === "Disetujui" ? "bg-[#edf6ef] text-[#4d7d56]" : "bg-[#fff0f0] text-[#a75252]"}`}
        >
          {report.decision}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{report.note}</p>
      {report.decision === "Menunggu" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3] pt-3">
          <span className="text-[10px] text-slate-500">
            Progres yang dilaporkan{" "}
            <b className="text-[#315b76]">{report.progress}%</b>{" "}
            <span className="mx-1">·</span> progres resmi saat ini{" "}
            <b className="text-[#315b76]">68%</b>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen((current) => !current)}
              className="h-9 rounded-lg border border-[#dfe6ed] px-3 text-[10px] font-semibold text-slate-600"
            >
              Perlu revisi
            </button>
            <button
              onClick={() => onDecision(report.id, "Disetujui")}
              className="h-9 rounded-lg bg-[#183b57] px-3 text-[10px] font-semibold text-white"
            >
              Verifikasi progress
            </button>
          </div>
        </div>
      )}
      {open && (
        <div className="mt-3 rounded-lg bg-[#f7f9fb] p-3">
          <label className="block text-[10px] font-semibold text-slate-600">
            Catatan revisi
          </label>
          <textarea
            id={`revision-${report.id}`}
            rows={2}
            placeholder="Jelaskan informasi atau bukti yang perlu diperbaiki..."
            className="mt-2 w-full rounded-lg border border-[#dfe6ed] bg-white p-2 text-xs outline-none focus:border-[#477ba6]"
          />
          <button
            onClick={() => onDecision(report.id, "Perlu revisi")}
            className="mt-2 h-8 rounded-lg border border-[#e3d4bc] px-3 text-[10px] font-semibold text-[#94682e]"
          >
            Kirim catatan
          </button>
        </div>
      )}
    </article>
  );
}

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const initial = supervisorProjects.find(
    (project) => project.id === projectId,
  );
  const [project, setProject] = useState(initial ?? null);
  const [showForemen, setShowForemen] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };
  if (!project)
    return (
      <div className="mx-auto max-w-3xl p-10">
        <div className="rounded-2xl border border-[#e3e9ee] bg-white p-8">
          <h1 className="text-xl font-bold text-[#183b57]">
            Proyek tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Proyek ini tidak ada dalam daftar penugasan Anda.
          </p>
          <Link
            href="/pengawas"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#183b57] px-4 text-xs font-semibold text-white"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );

  const decideReport = (id: string, decision: "Disetujui" | "Perlu revisi") => {
    setProject((current) =>
      current
        ? {
            ...current,
            reports: current.reports.map((report) =>
              report.id === id ? { ...report, decision } : report,
            ),
            progress:
              decision === "Disetujui"
                ? Math.max(
                    current.progress,
                    current.reports.find((report) => report.id === id)
                      ?.progress ?? current.progress,
                  )
                : current.progress,
            status:
              decision === "Disetujui" && current.status === "Perlu perhatian"
                ? "Berjalan"
                : current.status,
          }
        : current,
    );
    notify(
      decision === "Disetujui"
        ? "Laporan diverifikasi. Progres resmi proyek telah diperbarui."
        : "Catatan revisi disimpan untuk mandor.",
    );
  };
  const addCustomerUpdate = () => {
    if (!customerMessage.trim()) return;
    setProject((current) =>
      current
        ? {
            ...current,
            customerUpdates: [
              {
                id: `u-${Date.now()}`,
                date: "15 Okt 2026",
                message: customerMessage.trim(),
              },
              ...current.customerUpdates,
            ],
          }
        : current,
    );
    setCustomerMessage("");
    notify("Informasi proyek diperbarui untuk customer.");
  };
  const addFollowUp = (issueId: string, text: string) => {
    if (!text.trim()) return;
    setProject((current) =>
      current
        ? {
            ...current,
            issues: current.issues.map((issue) =>
              issue.id === issueId
                ? { ...issue, followUp: text.trim(), state: "Ditindaklanjuti" }
                : issue,
            ),
          }
        : current,
    );
    notify("Tindak lanjut kendala dicatat.");
  };
  const toggleTask = (taskId: string) => {
    setProject((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === taskId ? { ...task, done: !task.done } : task,
            ),
          }
        : current,
    );
  };
  const overdue = project.status === "Perlu perhatian";
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8 xl:p-10">
      {toast && (
        <div
          role="status"
          className="fixed right-5 top-20 z-50 max-w-md rounded-xl border border-[#cfdfd2] bg-white px-4 py-3 text-xs font-medium text-[#477c50] shadow-lg"
        >
          {toast}
        </div>
      )}
      <div>
        <Link
          href="/pengawas#proyek"
          className="text-xs font-semibold text-[#64809a] hover:text-[#315b76]"
        >
          ‹ Kembali ke daftar proyek
        </Link>
      </div>
      <section
        id="ringkasan"
        className="rounded-2xl border border-[#dfe6ec] bg-white"
      >
        <div className="border-b border-[#e9edf1] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#64809a]">
                  #{project.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${overdue ? "bg-[#fff3e2] text-[#9b6a24]" : project.status === "Selesai" ? "bg-[#edf6ef] text-[#4d7d56]" : "bg-[#eaf2f8] text-[#416f91]"}`}
                >
                  {project.status}
                </span>
                <span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-[9px] text-slate-500">
                  {project.category}
                </span>
              </div>
              <h1 className="mt-3 text-[26px] font-bold tracking-tight text-[#17344e] md:text-[32px]">
                {project.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {project.design} <span className="px-1">·</span> Customer{" "}
                {project.customer}
              </p>
              <p className="mt-3 text-xs text-slate-600">{project.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[460px]">
              <div className="rounded-xl bg-[#f5f7f9] p-3">
                <p className="text-[9px] text-slate-500">Progres resmi</p>
                <strong className="mt-1 block text-xl text-[#294d69]">
                  {project.progress}%
                </strong>
              </div>
              <div className="rounded-xl bg-[#f5f7f9] p-3">
                <p className="text-[9px] text-slate-500">Target selesai</p>
                <strong className="mt-1 block text-xs text-[#294d69]">
                  {project.deadline}
                </strong>
              </div>
              <div className="col-span-2 rounded-xl bg-[#f5f7f9] p-3 sm:col-span-1">
                <p className="text-[9px] text-slate-500">Nilai proyek</p>
                <strong className="mt-1 block text-xs text-[#294d69]">
                  {money(project.value)}
                </strong>
              </div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9edf2]">
            <span
              className="block h-full rounded-full bg-[#5e83a0] transition-[width]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-slate-400">
            <span>Dimulai {project.started}</span>
            <span>Progress resmi telah diverifikasi</span>
          </div>
        </div>
        <nav
          aria-label="Navigasi detail proyek"
          className="flex gap-1 overflow-x-auto px-4 py-2"
        >
          {sectionLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="shrink-0 rounded-lg px-3 py-2 text-[10px] font-semibold text-slate-500 hover:bg-[#f0f4f7] hover:text-[#315b76]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <Surface
            id="mandor"
            title="Mandor lapangan"
            description="Mandor yang sudah diverifikasi admin dapat ditugaskan pada proyek ini."
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eaf1f6] text-sm font-bold text-[#355973]">
                  {project.foreman
                    ? project.foreman
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                    : "—"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#29445c]">
                    {project.foreman ?? "Belum ada mandor ditetapkan"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {project.foreman
                      ? "Mandor proyek"
                      : "Pilih mandor terverifikasi untuk memulai koordinasi lapangan."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForemen(true)}
                className="h-10 rounded-lg border border-[#cfdce6] px-4 text-xs font-semibold text-[#355c78] hover:bg-[#f3f7fa]"
              >
                {project.foreman ? "Ganti mandor" : "Pilih mandor"}
              </button>
            </div>
          </Surface>
          <Surface
            id="progress"
            title="Progress dan verifikasi laporan"
            description="Laporan mandor baru menjadi progres resmi setelah ditinjau Pengawas."
          >
            <div className="space-y-3">
              {project.reports.length ? (
                project.reports.map((report) => (
                  <ReportReview
                    key={report.id}
                    report={report}
                    onDecision={decideReport}
                  />
                ))
              ) : (
                <p className="rounded-lg bg-[#f7f9fb] px-4 py-5 text-xs text-slate-500">
                  Belum ada laporan Mandor yang perlu ditinjau.
                </p>
              )}
            </div>
            <div className="mt-5 border-t border-[#edf0f3] pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#314c63]">
                  Tahapan pekerjaan
                </h3>
                <span className="text-[10px] text-slate-500">
                  {project.progress}% progres resmi
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {project.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="rounded-xl border border-[#e8edf1] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#40596f]">
                          {milestone.name}
                        </p>
                        <p className="mt-1 text-[9px] text-slate-400">
                          {milestone.start} – {milestone.end}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {milestone.progress}% · {milestone.status}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#edf0f3]">
                      <span
                        className="block h-full bg-[#6a8ca7]"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 border-t border-[#edf0f3] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#314c63]">
                  Daftar tugas
                </h3>
                <span className="text-[10px] text-slate-500">
                  {project.tasks.filter((task) => task.done).length}/
                  {project.tasks.length} selesai
                </span>
              </div>
              <div className="space-y-1">
                {project.tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#f7f9fb]"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="h-4 w-4 accent-[#315b76]"
                    />
                    <span
                      className={`text-xs ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                    >
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[9px] text-slate-400">
                Checklist ini catatan pengawasan; perubahan checklist tidak
                menggantikan verifikasi laporan.
              </p>
            </div>
          </Surface>
          <Surface
            id="kendala"
            title="Kendala lapangan"
            description="Tinjau laporan kendala Mandor dan catat tindak lanjut untuk tim."
          >
            <div className="space-y-3">
              {project.issues.length ? (
                project.issues.map((issue) => (
                  <article
                    key={issue.id}
                    className="rounded-xl border border-[#e7ebef] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-[#314c63]">
                        {issue.title}
                      </h3>
                      <div className="flex gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold ${issue.priority === "Tinggi" ? "bg-[#fff0f0] text-[#a75252]" : "bg-[#fff4e2] text-[#98651e]"}`}
                        >
                          {issue.priority}
                        </span>
                        <span className="rounded-full bg-[#f0f3f6] px-2 py-1 text-[9px] text-slate-500">
                          {issue.state}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {issue.description}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">
                      Dilaporkan {issue.reportDate}
                    </p>
                    <form
                      className="mt-3 border-t border-[#edf0f3] pt-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        const input = form.elements.namedItem(
                          "followUp",
                        ) as HTMLTextAreaElement;
                        addFollowUp(issue.id, input.value);
                      }}
                    >
                      <label className="block text-[10px] font-semibold text-slate-600">
                        Tindak lanjut Pengawas
                      </label>
                      <textarea
                        name="followUp"
                        defaultValue={issue.followUp}
                        rows={2}
                        placeholder="Catat langkah penanganan atau koordinasi..."
                        className="mt-2 w-full rounded-lg border border-[#dfe6ed] p-2 text-xs outline-none focus:border-[#477ba6]"
                      />
                      <button className="mt-2 h-9 rounded-lg bg-[#183b57] px-3 text-[10px] font-semibold text-white">
                        Simpan tindak lanjut
                      </button>
                    </form>
                    {issue.followUp && (
                      <p className="mt-3 rounded-lg bg-[#f4f7f9] p-3 text-xs leading-5 text-slate-600">
                        <b>Tindak lanjut tersimpan:</b> {issue.followUp}
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <p className="rounded-lg bg-[#f7f9fb] px-4 py-5 text-xs text-slate-500">
                  Tidak ada kendala yang dilaporkan.
                </p>
              )}
            </div>
          </Surface>
          <Surface
            id="customer"
            title="Informasi untuk customer"
            description="Hanya informasi yang ditulis di sini yang disiapkan untuk ditampilkan kepada customer."
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addCustomerUpdate();
              }}
            >
              <label className="block text-[10px] font-semibold text-slate-600">
                Pesan perkembangan proyek
              </label>
              <textarea
                value={customerMessage}
                onChange={(event) => setCustomerMessage(event.target.value)}
                rows={3}
                placeholder="Contoh: Pekerjaan struktur berjalan sesuai rencana..."
                className="mt-2 w-full rounded-lg border border-[#dfe6ed] p-3 text-xs leading-5 outline-none focus:border-[#477ba6]"
              />
              <button className="mt-2 h-9 rounded-lg bg-[#183b57] px-4 text-[10px] font-semibold text-white">
                Terbitkan update
              </button>
            </form>
            <div className="mt-5 space-y-2 border-t border-[#edf0f3] pt-4">
              {project.customerUpdates.map((update) => (
                <article
                  key={update.id}
                  className="rounded-lg bg-[#f7f9fb] p-3"
                >
                  <p className="text-xs leading-5 text-slate-600">
                    {update.message}
                  </p>
                  <p className="mt-2 text-[9px] text-slate-400">
                    {update.date}
                  </p>
                </article>
              ))}
              {project.customerUpdates.length === 0 && (
                <p className="text-xs text-slate-500">
                  Belum ada informasi yang diterbitkan.
                </p>
              )}
            </div>
          </Surface>
          <Surface
            id="dokumentasi"
            title="Dokumentasi lapangan"
            description="Foto dan catatan hasil pemeriksaan proyek."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {project.documentation.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-[#e6ebef]"
                >
                  <div className="relative h-44 bg-[#edf1f4]">
                    <Image
                      src={item.image}
                      alt={item.caption}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="text-xs font-medium text-[#3c566c]">
                      {item.caption}
                    </p>
                    <span className="shrink-0 text-[9px] text-slate-400">
                      {item.date}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </Surface>
        </div>
        <aside className="space-y-5">
          <Surface title="Informasi proyek">
            <p className="text-[10px] font-semibold text-slate-500">
              Kebutuhan customer
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {project.needs}
            </p>
            <div className="mt-4 border-t border-[#edf0f3] pt-4">
              <h3 className="text-[10px] font-semibold text-slate-500">
                Spesifikasi & kontrak
              </h3>
              <ul className="mt-2 space-y-2">
                {project.specifications.map((spec) => (
                  <li key={spec} className="text-xs text-slate-600">
                    {spec}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-[#f4f7f9] px-3 py-2 text-[10px] text-[#40596f]">
                Nilai kontrak{" "}
                <b className="float-right">{money(project.value)}</b>
              </p>
              <button
                type="button"
                onClick={() => setShowContract(true)}
                className="mt-3 h-10 w-full rounded-lg border border-[#cfdce6] px-4 text-xs font-semibold text-[#355c78] transition hover:bg-[#f3f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
              >
                Lihat Kontrak
              </button>
            </div>
          </Surface>
          <Surface id="jadwal" title="Jadwal proyek">
            <p className="mb-4 text-[10px] text-slate-500">
              Mulai {project.started} · Target {project.deadline}
            </p>
            <div className="space-y-3">
              {project.milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-[9px] ${milestone.status === "Selesai" ? "bg-[#e8f2ea] text-[#4d7d56]" : milestone.status === "Berjalan" ? "bg-[#eaf2f8] text-[#416f91]" : "bg-[#f0f3f6] text-slate-400"}`}
                    >
                      {milestone.status === "Selesai" ? "✓" : index + 1}
                    </span>
                    {index < project.milestones.length - 1 && (
                      <span className="my-1 min-h-6 w-px flex-1 bg-[#e3e9ee]" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-[10px] font-semibold text-[#40596f]">
                      {milestone.name}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">
                      {milestone.start} – {milestone.end}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p
              className={`mt-2 rounded-lg px-3 py-2 text-[10px] ${overdue ? "bg-[#fff4e2] text-[#98651e]" : "bg-[#edf6ef] text-[#4d7d56]"}`}
            >
              {overdue
                ? "Perlu koordinasi jadwal dengan tim proyek."
                : "Jadwal proyek dalam pemantauan."}
            </p>
          </Surface>
          <Surface
            id="pembayaran"
            title="Monitoring pembayaran"
            description="Status termin ditampilkan untuk pemantauan saja."
          >
            <div className="space-y-2">
              {project.payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-lg border border-[#e9edf1] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-semibold text-[#40596f]">
                      {payment.stage}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${payment.status === "Lunas" ? "bg-[#edf6ef] text-[#4d7d56]" : payment.status === "Menunggu" ? "bg-[#fff4e2] text-[#98651e]" : "bg-[#f0f3f6] text-slate-500"}`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#294d69]">
                    {money(payment.amount)}
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400">
                    Jatuh tempo {payment.dueDate}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-3 text-[9px] text-slate-400">
              Pengawas tidak dapat mengubah status pembayaran.
            </p>
          </Surface>
        </aside>
      </div>
      {showForemen && (
        <AssignmentDialog
          project={project}
          onClose={() => setShowForemen(false)}
          onAssign={(name) => {
            setProject((current) =>
              current ? { ...current, foreman: name } : current,
            );
            setShowForemen(false);
            notify(`${name} ditetapkan sebagai mandor proyek.`);
          }}
        />
      )}{" "}
      {showContract && (
        <SupervisorContractModal
          project={project}
          onClose={() => setShowContract(false)}
        />
      )}
    </div>
  );
}
