"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  supervisorProjects,
  verifiedForemen,
  type SupervisorIssue,
  type SupervisorProject,
  type SupervisorReport,
  type VerifiedForeman,
} from "@/data/pengawas";
import SupervisorContractModal from "@/components/pengawas/SupervisorContractModal";
import {
  addDocumentationItem,
  addIssueResolution,
  addSyncedReport,
  compressImage,
  persistIssueFollowUp,
  updateIssueResolution,
  updateSyncedReportDecision,
  useProjectSync,
  type IssueResolution,
} from "@/utils/project-events";
import type { MandorIssueReport } from "@/data/mandor";

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
  { id: "catatan-mandor", label: "Catatan mandor" },
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
  onAssign: (foremen: VerifiedForeman[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const assignedNames =
    project.foremen ?? (project.foreman ? [project.foreman] : []);
  const assignedIds = new Set(
    assignedNames
      .map((name) => verifiedForemen.find((item) => item.name === name)?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const remaining = Math.max(0, 3 - assignedNames.length);
  const available = verifiedForemen.filter(
    (foreman) =>
      foreman.verified &&
      !assignedIds.has(foreman.id) &&
      `${foreman.name} ${foreman.specialties.join(" ")} ${foreman.area}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < remaining
          ? [...current, id]
          : current,
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
              Tambahkan mandor terverifikasi
            </h2>
            <p className="mt-1 text-[10px] text-slate-500">
              Pilih hingga {remaining} mandor lagi. Mandor yang sudah ditugaskan
              tidak dapat diganti.
            </p>
          </div>
          <button
            type="button"
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
            {available.map((foreman) => {
              const isSelected = selected.includes(foreman.id);
              const whatsappNumber = foreman.phone.replace(/\D/g, "");
              return (
                <article
                  key={foreman.id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 ${isSelected ? "border-[#7395b1] bg-[#f2f6f9]" : "border-[#e6ebef]"}`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleSelected(foreman.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eaf1f6] text-xs font-bold text-[#355973]">
                        {foreman.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-xs text-[#29465e]">
                          {foreman.name}
                        </b>
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
                    </button>
                    <span className="shrink-0 rounded-full bg-[#edf6ef] px-2 py-1 text-[9px] font-semibold text-[#4e8058]">
                      {isSelected ? "Dipilih" : "Terverifikasi"}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-fit items-center rounded-lg bg-[#2f725b] px-3 text-[10px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#245d49] hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f725b]"
                  >
                    Hubungi Mandor
                  </a>
                </article>
              );
            })}
            {available.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">
                {remaining === 0
                  ? "Batas tiga mandor sudah tercapai."
                  : "Mandor tidak ditemukan."}
              </p>
            )}
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#e8edf1] bg-[#fafbfc] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-[#dfe6ed] px-4 text-xs font-semibold text-slate-600"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() =>
              onAssign(
                verifiedForemen.filter((foreman) =>
                  selected.includes(foreman.id),
                ),
              )
            }
            disabled={selected.length === 0}
            className="h-10 rounded-lg bg-[#183b57] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Tambahkan {selected.length || ""} mandor
          </button>
        </footer>
      </section>
    </div>
  );
}
function ReportReview({
  report,
  project,
  onDecision,
}: {
  report: SupervisorReport;
  project: SupervisorProject;
  onDecision: (id: string, decision: "Disetujui" | "Perlu revisi") => void;
}) {
  const [open, setOpen] = useState(false);
  const milestone = project.milestones.find(
    (item) => item.id === report.milestoneId,
  );
  return (
    <article className="rounded-xl border border-[#e5eaf0] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {milestone?.name ?? report.title}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#2d4b63]">
            {report.subtaskTitle ?? report.title}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {report.foreman} · {report.submitted}
          </p>
          <span className="mt-1.5 inline-flex rounded-full bg-[#f0f3f6] px-2.5 py-1 text-[9px] font-semibold text-slate-500">
            Bobot subtask +{report.weight}%
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${report.decision === "Menunggu" ? "bg-[#fff4e2] text-[#98651e]" : report.decision === "Disetujui" ? "bg-[#edf6ef] text-[#4d7d56]" : "bg-[#fff0f0] text-[#a75252]"}`}
        >
          {report.decision}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{report.note}</p>
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
      {report.decision === "Menunggu" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3] pt-3">
          <span className="text-[10px] text-slate-500">
            Progres yang dilaporkan{" "}
            <b className="text-[#315b76">{report.progress}%</b>{" "}
            <span className="mx-1">·</span> progres resmi saat ini{" "}
            <b className="text-[#315b76]">{project.progress}%</b>
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

function IssueWorkflow({
  issue,
  report,
  projectId,
  customerName,
  onNotify,
}: {
  issue: SupervisorIssue;
  report?: MandorIssueReport;
  projectId: string;
  customerName: string;
  onNotify: (message: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "ai" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [solution, setSolution] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [evidenceName, setEvidenceName] = useState("");
  const [discussionReply, setDiscussionReply] = useState("");
  const sync = useProjectSync();
  const resolution = sync.resolutions.find((item) => item.issueId === issue.id);
  const aiOptions = [
    "Koordinasikan pengiriman material pengganti dari pemasok lain, sambil melanjutkan pekerjaan pada area yang tidak terdampak.",
    "Atur ulang urutan pekerjaan untuk sementara dan minta mandor memperbarui jadwal harian setelah material tersedia.",
    "Ajukan material dengan spesifikasi setara sebagai alternatif. Perubahan ini memerlukan persetujuan customer sebelum pembelian.",
  ];

  const runAiAnalysis = () => {
    setMode("ai");
    setAiLoading(true);
    setSelectedOption(null);
    window.setTimeout(() => setAiLoading(false), 850);
  };
  const selectAiOption = (index: number) => {
    setSelectedOption(index);
    setSolution(aiOptions[index]);
    setRequiresApproval(index === 2);
    setApprovalReason(
      index === 2
        ? "Penggantian material dengan spesifikasi alternatif dapat mengubah biaya dan perlu persetujuan customer."
        : "",
    );
  };
  const submitResolution = () => {
    if (!solution.trim() || (requiresApproval && !approvalReason.trim()))
      return;
    const now = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const next: IssueResolution = {
      id: resolution?.id ?? `RS-${issue.id}-${crypto.randomUUID()}`,
      projectId,
      issueId: issue.id,
      solution: solution.trim(),
      source:
        mode === "ai" && selectedOption !== null ? "Analisis AI" : "Pengawas",
      aiAnalysis:
        mode === "ai"
          ? {
            summary: `Berdasarkan laporan mandor, kendala pada ${report?.affectedSubtaskTitle ?? issue.title} berada dalam kondisi ${report?.workCondition === "BERHENTI" ? "berhenti total" : report?.workCondition === "TERHAMBAT_SEBAGIAN" ? "terhambat sebagian" : "masih dapat berjalan"}${report ? ` dengan estimasi dampak keterlambatan sekitar ${report.estimatedDelayDays} hari` : ""}. Prioritaskan pekerjaan yang tidak terdampak dan pastikan spesifikasi material sesuai sebelum pekerjaan dilanjutkan. Opsi perubahan material atau biaya perlu persetujuan customer terlebih dahulu.`,
            options: aiOptions,
            selectedOption,
          }
          : null,
      status: requiresApproval
        ? "Menunggu approval customer"
        : "Ditindaklanjuti",
      requiresCustomerApproval: requiresApproval,
      approvalReason: requiresApproval ? approvalReason.trim() : "",
      approvalEvidence: requiresApproval ? evidence : null,
      customerFeedback: "",
      discussion: [],
      submitted: now,
    };
    addIssueResolution(next);
    if (!requiresApproval) persistIssueFollowUp(issue.id, next.solution);
    onNotify(
      requiresApproval
        ? "Usulan dikirim. Kendala menunggu persetujuan customer."
        : "Solusi dikirim ke mandor dan status kendala diperbarui.",
    );
  };
  const customerDecision = (approved: boolean) => {
    if (!resolution) return;
    const feedback = approved
      ? "Usulan disetujui customer."
      : resolution.customerFeedback.trim();
    if (!approved && !feedback) return;
    const next = {
      ...resolution,
      status: approved
        ? ("Ditindaklanjuti" as const)
        : ("Diskusi dengan pengawas" as const),
      customerFeedback: approved
        ? feedback
        : resolution.customerFeedback.trim(),
      discussion: [
        ...resolution.discussion,
        {
          id: crypto.randomUUID(),
          author: "Customer" as const,
          message: feedback,
          date: new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
    };
    updateIssueResolution(next);
    if (approved) {
      persistIssueFollowUp(issue.id, resolution.solution);
      onNotify("Customer menyetujui usulan. Keputusan diteruskan ke mandor.");
    } else onNotify("Alasan penolakan diteruskan ke pengawas untuk diskusi.");
  };
  const sendDiscussion = () => {
    if (!resolution || !discussionReply.trim()) return;
    updateIssueResolution({
      ...resolution,
      solution: discussionReply.trim(),
      status: "Menunggu approval customer",
      customerFeedback: "",
      discussion: [
        ...resolution.discussion,
        {
          id: crypto.randomUUID(),
          author: "Pengawas",
          message: discussionReply.trim(),
          date: new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
    });
    setDiscussionReply("");
    onNotify("Tanggapan pengawas dikirim kembali ke customer.");
  };
  const finalizeDiscussion = () => {
    if (!resolution || !discussionReply.trim()) return;
    const finalResolution = {
      ...resolution,
      solution: discussionReply.trim(),
      discussion: [
        ...resolution.discussion,
        {
          id: crypto.randomUUID(),
          author: "Pengawas" as const,
          message: `Keputusan final: ${discussionReply.trim()}`,
          date: new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
      ],
    };
    updateIssueResolution(finalResolution);
    persistIssueFollowUp(issue.id, finalResolution.solution);
    setDiscussionReply("");
    onNotify("Keputusan final dikirim ke mandor dan dicatat untuk customer.");
  };

  const isFollowedUp =
    resolution?.status === "Ditindaklanjuti" ||
    (!resolution && issue.state === "Ditindaklanjuti");
  const isAwaitingCustomer =
    resolution?.status === "Menunggu approval customer";
  const isInDiscussion = resolution?.status === "Diskusi dengan pengawas";
  const issueBorderClass = isFollowedUp
    ? "border-[#b8d9bf]"
    : isInDiscussion
      ? "border-[#d9c9e8]"
      : "border-[#ead8b5]";
  const issueAccentClass = isFollowedUp
    ? "border-[#5b9a69]"
    : isInDiscussion
      ? "border-[#9875b5]"
      : "border-[#d4a044]";
  const issueStatusClass = isFollowedUp
    ? "bg-[#edf6ef] text-[#477c50]"
    : isInDiscussion
      ? "bg-[#f3eefa] text-[#75539a]"
      : "bg-[#fff4e2] text-[#98651e]";
  const issueStatusLabel = isFollowedUp
    ? "Ditindaklanjuti"
    : isAwaitingCustomer
      ? "Menunggu persetujuan customer"
      : isInDiscussion
        ? "Diskusi dengan pengawas"
        : "Menunggu ditinjau";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_8px_24px_rgba(28,52,73,0.045)] ${issueBorderClass}`}
    >
      <div className={`px-4 py-4 sm:px-5 ${issueAccentClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-[#64809a]">
                {issue.id}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${issueStatusClass}`}
              >
                {issueStatusLabel}
              </span>
              {report && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${report.workCondition === "BERHENTI" ? "bg-[#fff0f0] text-[#a75252]" : report.workCondition === "TERHAMBAT_SEBAGIAN" ? "bg-[#fff4e2] text-[#98651e]" : "bg-[#edf6ef] text-[#4d7d56]"}`}
                >
                  {report.workCondition === "BERJALAN"
                    ? "Tetap berjalan"
                    : report.workCondition === "TERHAMBAT_SEBAGIAN"
                      ? "Terhambat sebagian"
                      : "Berhenti total"}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-bold text-[#263d53]">
              {report?.categoryLabel ?? issue.title}
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              {report?.description ?? issue.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d8e2ea] bg-white px-4 text-[11px] font-semibold text-[#355873] transition-colors hover:bg-[#f3f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477ba6]"
          >
            {detailsOpen ? "Tutup detail" : "Detail kendala"}
          </button>
        </div>

        {detailsOpen && report && (
          <div className="mt-4 border-t border-[#e8edf1] pt-4">
            <h4 className="text-xs font-bold text-[#314c63]">
              Informasi dari mandor
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-[#f6f8fa] px-3 py-2.5">
                <p className="text-[9px] text-slate-400">Tahap terdampak</p>
                <p className="mt-1 text-[11px] font-semibold text-[#40596f]">
                  {report.affectedMilestoneTitle}
                </p>
              </div>
              <div className="rounded-lg bg-[#f6f8fa] px-3 py-2.5">
                <p className="text-[9px] text-slate-400">Subtask terdampak</p>
                <p className="mt-1 text-[11px] font-semibold text-[#40596f]">
                  {report.affectedSubtaskTitle}
                </p>
              </div>
              <div className="rounded-lg bg-[#f6f8fa] px-3 py-2.5">
                <p className="text-[9px] text-slate-400">Kondisi pekerjaan</p>
                <p className="mt-1 text-[11px] font-semibold text-[#40596f]">
                  {report.workCondition === "BERJALAN"
                    ? "Tetap berjalan"
                    : report.workCondition === "TERHAMBAT_SEBAGIAN"
                      ? "Terhambat sebagian"
                      : "Berhenti total"}
                </p>
              </div>
              <div className="rounded-lg bg-[#f6f8fa] px-3 py-2.5">
                <p className="text-[9px] text-slate-400">
                  Perkiraan tambahan waktu
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#40596f]">
                  {report.estimatedDelayDays} hari (estimasi mandor)
                </p>
              </div>
              <div className="rounded-lg bg-[#f6f8fa] px-3 py-2.5">
                <p className="text-[9px] text-slate-400">Waktu laporan</p>
                <p className="mt-1 text-[11px] font-semibold text-[#40596f]">
                  {report.submitted}
                </p>
              </div>
            </div>
            {report.additionalInfo && (
              <div className="mt-3 rounded-lg border border-[#e5ebef] bg-white p-3">
                <p className="text-[10px] font-semibold text-[#64809a]">
                  Informasi tambahan
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {report.additionalInfo}
                </p>
              </div>
            )}
            {report.attachment && (
              <div className="mt-3 overflow-hidden rounded-lg border border-[#e6ebef]">
                <Image
                  src={report.attachment}
                  alt={`Bukti kendala ${report.categoryLabel}`}
                  width={900}
                  height={520}
                  unoptimized
                  className="max-h-72 w-full object-contain bg-[#f6f8fa]"
                />
                {report.attachmentName && (
                  <p className="px-3 py-2 text-[10px] text-slate-500">
                    {report.attachmentName}
                  </p>
                )}
              </div>
            )}
            {!report.additionalInfo && !report.attachment && (
              <p className="mt-3 text-[10px] text-slate-400">
                Tidak ada informasi tambahan atau foto pendukung.
              </p>
            )}
          </div>
        )}
        {detailsOpen && !report && (
          <div className="mt-4 border-t border-[#e8edf1] pt-4">
            <p className="text-xs font-bold text-[#314c63]">
              Informasi dari mandor
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Laporan ini merupakan data contoh proyek lama. Rincian terstruktur
              mandor tidak tersedia.
            </p>
          </div>
        )}

        {resolution && (
          <section className="mt-4 rounded-xl border border-[#dce5ec] bg-[#f8fafb] p-4">
            {resolution.aiAnalysis && (
              <div className="mb-4 rounded-xl border border-[#d8e4ec] bg-[#f5f9fb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#315873]">
                    Hasil analisis AI
                  </h4>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {resolution.aiAnalysis.summary}
                </p>
                <div className="mt-3 space-y-2">
                  {resolution.aiAnalysis.options.map((option, index) => (
                    <div
                      key={`${resolution.issueId}-ai-option-${index}`}
                      className={`rounded-lg border p-3 text-xs leading-5 ${resolution.aiAnalysis?.selectedOption === index ? "border-[#7896aa] bg-white text-[#294b65]" : "border-[#e4eaee] bg-white/60 text-slate-500"}`}
                    >
                      <span className="mb-1 block text-[9px] font-semibold text-[#6d879b]">
                        Opsi {index + 1}
                        {resolution.aiAnalysis?.selectedOption === index
                          ? " · Dipilih"
                          : ""}
                      </span>
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-[#314c63]">
                Rencana penanganan
              </h4>
              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold text-[#55718a]">
                {resolution.source}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              {resolution.solution}
            </p>
            {resolution.requiresCustomerApproval && (
              <div className="mt-3 rounded-lg border border-[#eadfca] bg-[#fffaf1] p-3">
                <p className="text-[10px] font-semibold text-[#896527]">
                  Persetujuan customer · {customerName}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {resolution.approvalReason}
                </p>
                {resolution.approvalEvidence && (
                  <Image
                    src={resolution.approvalEvidence}
                    alt="Bukti usulan"
                    width={720}
                    height={420}
                    unoptimized
                    className="mt-2 max-h-48 w-full rounded-lg object-contain bg-white"
                  />
                )}
              </div>
            )}
            {resolution.discussion.length > 0 && (
              <div className="mt-3 space-y-2">
                {resolution.discussion.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg p-3 ${entry.author === "Customer" ? "bg-white" : "bg-[#edf4f8]"}`}
                  >
                    <p className="text-[9px] font-semibold text-[#64809a]">
                      {entry.author} · {entry.date}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {resolution.status === "Menunggu approval customer" && (
              <div className="mt-3 rounded-lg bg-[#fff6e8] p-3 text-xs text-[#8b6527]">
                Ini simulasi ceritanya cust setuju atau engga, nanti kalo BE
                udah jadi si simulasi setuju cust diapus ya , hubungin ke customer tracking buat setuju/ngga nya
                ya.
              </div>
            )}
            {resolution.status === "Diskusi dengan pengawas" && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-semibold text-[#75539a]">
                  Customer meminta diskusi. Tinjau alasan di atas, lalu balas
                  atau tetapkan keputusan final.
                </p>
                <textarea
                  value={discussionReply}
                  onChange={(e) => setDiscussionReply(e.target.value)}
                  rows={3}
                  placeholder="Tulis balasan atau keputusan final untuk customer dan mandor..."
                  className="w-full rounded-lg border border-[#dfe6ed] bg-white p-3 text-xs outline-none focus:border-[#477ba6]"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={sendDiscussion}
                    disabled={!discussionReply.trim()}
                    className="h-9 rounded-lg border border-[#d8e2ea] px-3 text-[10px] font-semibold text-[#355873] disabled:opacity-50"
                  >
                    Kirim tanggapan, minta persetujuan ulang
                  </button>
                  <button
                    type="button"
                    onClick={finalizeDiscussion}
                    disabled={!discussionReply.trim()}
                    className="h-9 rounded-lg bg-[#183b57] px-3 text-[10px] font-semibold text-white disabled:opacity-50"
                  >
                    Tetapkan keputusan final ke mandor
                  </button>
                </div>
              </div>
            )}
            {resolution.status === "Menunggu approval customer" && (
              <div className="mt-3 grid gap-3 border-t border-[#e5ebef] pt-3 md:grid-cols-2">
                <div className="rounded-lg border border-[#e6ebef] bg-white p-3">
                  <p className="text-[10px] font-semibold text-[#45627b]">
                    Simulasi aksi customer
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Customer: {customerName}
                  </p>
                  <textarea
                    value={resolution.customerFeedback}
                    onChange={(e) =>
                      updateIssueResolution({
                        ...resolution,
                        customerFeedback: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Jika menolak, tulis alasan customer di sini..."
                    className="mt-2 w-full rounded-lg border border-[#dfe6ed] p-2 text-xs outline-none focus:border-[#477ba6]"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => customerDecision(true)}
                      className="h-8 rounded-lg bg-[#347454] px-3 text-[10px] font-semibold text-white"
                    >
                      Setujui usulan
                    </button>
                    <button
                      type="button"
                      onClick={() => customerDecision(false)}
                      disabled={!resolution.customerFeedback.trim()}
                      className="h-8 rounded-lg border border-[#ead5d5] px-3 text-[10px] font-semibold text-[#9a5555] disabled:opacity-50"
                    >
                      Tolak dan beri alasan
                    </button>
                  </div>
                </div>
              </div>
            )}
            {resolution.status === "Ditindaklanjuti" && (
              <p className="mt-3 rounded-lg bg-[#edf6ef] p-3 text-[10px] font-semibold text-[#477c50]">
                Keputusan sudah diteruskan ke mandor dan dicatat pada informasi
                customer.
              </p>
            )}
          </section>
        )}

        {!resolution && !isFollowedUp && (
          <section className="mt-4 border-t border-[#e8edf1] pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#314c63]">
                  Tentukan penanganan kendala
                </h4>
                <p className="mt-1 text-[10px] text-slate-500">
                  Pilih solusi langsung atau gunakan analisis AI sebagai bahan pertimbangan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("manual");
                    setSelectedOption(null);
                  }}
                  className={`h-9 rounded-lg border px-3 text-[10px] font-semibold ${mode === "manual" ? "border-[#456d8c] bg-[#edf4f8] text-[#355873]" : "border-[#d8e2ea] text-[#526b80]"}`}
                >
                  Tulis solusi
                </button>
                <button
                  type="button"
                  onClick={runAiAnalysis}
                  className="h-9 rounded-lg bg-[#315f7d] px-3 text-[10px] font-semibold text-white"
                >
                  Analisis AI
                </button>
              </div>
            </div>
            {mode === "ai" && (
              <div className="mt-3 rounded-xl border border-[#d8e4ec] bg-[#f5f9fb] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-[#315873]">
                      Analisis kendala
                    </h5>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      Model menganalisis berdasarkan data laporan.
                    </p>
                  </div>
                </div>
                {aiLoading ? (
                  <p className="mt-4 animate-pulse text-xs text-[#55718a]">
                    Menganalisis dampak dan opsi penanganan...
                  </p>
                ) : (
                  <>
                    <div className="mt-3 rounded-lg border-l-2 border-[#7896aa] bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-[#40596f]">
                        Ringkasan analisis
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Berdasarkan laporan mandor, kendala pada{" "}
                        {report?.affectedSubtaskTitle ?? issue.title} berada
                        dalam kondisi{" "}
                        {report?.workCondition === "BERHENTI"
                          ? "berhenti total"
                          : report?.workCondition === "TERHAMBAT_SEBAGIAN"
                            ? "terhambat sebagian"
                            : "masih dapat berjalan"}
                        {report
                          ? ` dengan estimasi dampak keterlambatan sekitar ${report.estimatedDelayDays} hari`
                          : ""}
                        . Prioritaskan pekerjaan yang tidak terdampak dan
                        pastikan spesifikasi material sesuai sebelum pekerjaan
                        dilanjutkan. Opsi perubahan material atau biaya perlu
                        persetujuan customer terlebih dahulu.
                      </p>
                    </div>
                    <p className="mt-3 text-[10px] font-semibold text-slate-600">
                      Tiga opsi penanganan dari hasil analisis AI · pilih satu
                      atau tulis solusi sendiri
                    </p>
                    <div className="mt-2 space-y-2">
                      {aiOptions.map((option, index) => (
                        <button
                          type="button"
                          key={option}
                          onClick={() => selectAiOption(index)}
                          className={`w-full rounded-lg border p-3 text-left text-xs leading-5 transition-colors ${selectedOption === index ? "border-[#557d9a] bg-white text-[#294b65]" : "border-[#e0e8ed] bg-white/70 text-slate-600 hover:bg-white"}`}
                        >
                          <span className="mb-1 block text-[9px] font-semibold text-[#6d879b]">
                            Opsi {index + 1}
                            {index === 2 ? " · perlu persetujuan" : ""}
                          </span>
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {mode && !aiLoading && (
              <div className="mt-3 rounded-xl border border-[#e3e9ee] bg-[#fbfcfd] p-4">
                <label className="block text-[10px] font-semibold text-[#40596f]">
                  Instruksi solusi untuk mandor
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={3}
                    placeholder="Jelaskan tindakan yang harus dilakukan mandor..."
                    className="mt-2 w-full rounded-lg border border-[#dfe6ed] bg-white p-3 text-xs leading-5 outline-none focus:border-[#477ba6]"
                  />
                </label>
                <label className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-[#40596f]">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="mt-0.5 accent-[#315f7d]"
                  />
                  <span>
                    Solusi ini memerlukan persetujuan customer (contoh: biaya
                    tambahan, perubahan material/desain, atau jadwal)
                  </span>
                </label>
                {requiresApproval && (
                  <div className="mt-3 space-y-3 rounded-lg border border-[#eadfca] bg-[#fffaf1] p-3">
                    <label className="block text-[10px] font-semibold text-[#795e31]">
                      Alasan dan detail yang perlu disetujui
                      <textarea
                        value={approvalReason}
                        onChange={(e) => setApprovalReason(e.target.value)}
                        rows={3}
                        placeholder="Jelaskan perubahan, estimasi biaya/dampak, dan alasan persetujuan dibutuhkan..."
                        className="mt-2 w-full rounded-lg border border-[#e7ddcb] bg-white p-3 text-xs outline-none focus:border-[#b48a4c]"
                      />
                    </label>
                    <label className="block text-[10px] font-semibold text-[#795e31]">
                      Bukti pendukung (opsional)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEvidenceName(file.name);
                            void compressImage(file)
                              .then(setEvidence)
                              .catch(() =>
                                onNotify("Foto bukti tidak dapat dibaca."),
                              );
                          }
                        }}
                        className="mt-2 block w-full text-[10px] text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-[#526b80]"
                      />
                    </label>
                    {evidence && (
                      <div className="flex items-center gap-3">
                        <Image
                          src={evidence}
                          alt="Pratinjau bukti approval"
                          width={100}
                          height={72}
                          unoptimized
                          className="h-16 w-24 rounded-md object-cover"
                        />
                        <span className="text-[10px] text-slate-500">
                          {evidenceName}
                        </span>
                      </div>
                    )}
                    <p className="text-[9px] leading-4 text-[#8a724a]">
                      Pengiriman akan mengubah status menjadi “Menunggu approval
                      customer”. Instruksi belum diteruskan ke mandor sampai ada
                      keputusan final.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={submitResolution}
                  disabled={
                    !solution.trim() ||
                    (requiresApproval && !approvalReason.trim())
                  }
                  className="mt-3 h-10 rounded-lg bg-[#183b57] px-4 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {requiresApproval
                    ? "Kirim usulan ke customer"
                    : "Kirim solusi ke mandor"}
                </button>
              </div>
            )}
          </section>
        )}
        {isFollowedUp && (
          <p className="mt-4 rounded-lg border border-[#cfe3d2] bg-[#edf6ef] px-4 py-3 text-xs font-semibold text-[#477c50]">
            Kendala Sudah Ditindaklanjuti
          </p>
        )}
      </div>
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
  const sync = useProjectSync();
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
    const localReport = project.reports.find((report) => report.id === id);
    const existing = sync.reports.find((report) => report.id === id);
    if (existing) {
      updateSyncedReportDecision(id, decision);
    } else if (localReport) {
      addSyncedReport({
        id: localReport.id,
        projectId: project.id,
        foreman: localReport.foreman,
        milestoneId: localReport.milestoneId,
        milestoneTitle: localReport.title,
        subtaskTitle: localReport.subtaskTitle,
        note: localReport.note,
        photo: localReport.photo,
        submitted: localReport.submitted,
        decision,
        weight: localReport.weight,
      });
    }
    const photo = localReport?.photo ?? existing?.photo ?? null;
    if (decision === "Disetujui" && photo) {
      const submitted = (localReport ?? existing)?.submitted ?? "";
      addDocumentationItem({
        id: `DOC-${id}`,
        projectId: project.id,
        date: submitted.split(" · ")[0] || "Hari ini",
        caption: `Dokumentasi mandor: ${localReport?.subtaskTitle ?? existing?.subtaskTitle ?? "pekerjaan"}`,
        image: photo,
      });
    }
    const approvedProgress = existing?.weight ?? 0;
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
                  ?.progress ?? current.progress + approvedProgress,
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
  const overdue = project.status === "Perlu perhatian";
  const syncedIncoming = sync.reports
    .filter((report) => report.projectId === project.id)
    .map((report) => ({
      id: report.id,
      foreman: report.foreman,
      milestoneId: report.milestoneId,
      title: report.milestoneTitle,
      subtaskTitle: report.subtaskTitle,
      note: report.note,
      submitted: report.submitted,
      progress: Math.min(100, project.progress + report.weight),
      decision: report.decision,
      photo: report.photo,
      weight: report.weight,
    }));
  const mergedReports: SupervisorReport[] = [
    ...syncedIncoming,
    ...project.reports.filter(
      (report) => !syncedIncoming.some((synced) => synced.id === report.id),
    ),
  ];
  const foremanNotes = sync.notes.filter(
    (note) => note.projectId === project.id,
  );
  const mergedDocs = sync.documentation.filter(
    (item) => item.projectId === project.id,
  );
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
            <div className="space-y-3">
              {(
                project.foremen ?? (project.foreman ? [project.foreman] : [])
              ).map((name) => {
                const foreman = verifiedForemen.find(
                  (item) => item.name === name,
                );
                return (
                  <div
                    key={name}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-[#e5eaf0] p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf1f6] text-xs font-bold text-[#355973]">
                        {name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#29445c]">
                          {name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Mandor proyek · Terverifikasi
                        </p>
                      </div>
                    </div>
                    {foreman && (
                      <a
                        href={`https://wa.me/${foreman.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-fit items-center rounded-lg bg-[#2f725b] px-3 text-[10px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#245d49] hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f725b]"
                      >
                        Hubungi Mandor
                      </a>
                    )}
                  </div>
                );
              })}
              {(project.foremen ?? (project.foreman ? [project.foreman] : []))
                .length === 0 && (
                  <p className="text-xs text-slate-500">
                    Belum ada mandor ditetapkan.
                  </p>
                )}
              {(project.foremen ?? (project.foreman ? [project.foreman] : []))
                .length < 3 && (
                  <button
                    onClick={() => setShowForemen(true)}
                    className="h-10 rounded-lg border border-[#cfdce6] px-4 text-xs font-semibold text-[#355c78] hover:bg-[#f3f7fa] hover:cursor-pointer"
                  >
                    {(
                      project.foremen ??
                      (project.foreman ? [project.foreman] : [])
                    ).length
                      ? "Tambah mandor"
                      : "Pilih mandor"}
                  </button>
                )}
              <p className="text-[10px] text-slate-500">
                Mandor ditugaskan:{" "}
                {
                  (
                    project.foremen ??
                    (project.foreman ? [project.foreman] : [])
                  ).length
                }{" "}
                dari 3 maksimal.
              </p>
            </div>
          </Surface>
          <Surface
            id="progress"
            title="Progress dan verifikasi laporan"
            description="Laporan mandor baru menjadi progres resmi setelah ditinjau Pengawas."
          >
            <div className="space-y-3">
              {mergedReports.length ? (
                mergedReports.map((report) => (
                  <ReportReview
                    key={report.id}
                    report={report}
                    project={project}
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
                {project.milestones.map((milestone) => {
                  const milestoneReports = mergedReports.filter(
                    (report) => report.milestoneId === milestone.id,
                  );
                  return (
                    <details
                      key={milestone.id}
                      className={`group rounded-xl border ${milestone.status === "Selesai" ? "border-[#d5e7d8] bg-[#f4faf5] open:border-[#bdd8c3] open:bg-[#f0f8f1]" : milestone.status === "Berjalan" ? "border-[#d4e3ee] bg-[#f3f8fb] open:border-[#b8d0e1] open:bg-[#eef5fa]" : "border-[#e1e6eb] bg-[#f8f9fa] open:border-[#cbd3da] open:bg-[#f4f6f7]"}`}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7c99] [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-[#40596f]">
                            {milestone.name}
                          </span>
                          <span className="mt-1 block text-[9px] text-slate-400">
                            {milestone.start} – {milestone.end}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {milestone.progress}%
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${milestone.status === "Selesai" ? "bg-[#edf6ef] text-[#4d7d56]" : milestone.status === "Berjalan" ? "bg-[#eaf2f8] text-[#416f91]" : "bg-[#f0f3f6] text-slate-500"}`}
                          >
                            {milestone.status}
                          </span>
                        </span>
                      </summary>
                      <div className="border-t border-[#e8edf1] px-3 pb-3 pt-2">
                        <ul className="space-y-1.5">
                          {project.tasks
                            .filter((task) => task.milestoneId === milestone.id)
                            .map((task) => {
                              const verified = milestoneReports.some(
                                (report) =>
                                  report.subtaskTitle === task.title &&
                                  report.decision === "Disetujui",
                              );
                              const completed = task.done || verified;
                              return (
                                <li
                                  key={task.id}
                                  className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2"
                                >
                                  <span className="text-[11px] leading-5 text-slate-600">
                                    {task.title}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-medium ${completed ? "bg-[#edf6ef] text-[#4d7d56]" : "bg-[#f0f3f6] text-slate-500"}`}
                                  >
                                    {completed ? "Selesai" : "Belum selesai"}
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                        <p className="mt-2 text-[9px] text-slate-400">
                          Verifikasi laporan mandor untuk mengupdate.
                        </p>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </Surface>
          <Surface
            id="kendala"
            title="Kendala lapangan"
            description="Tinjau laporan kendala Mandor dan catat tindak lanjut untuk tim."
          >
            <div className="space-y-4">
              {(() => {
                const syncedIssueReports = sync.issues.filter(
                  (report) => report.projectId === project.id,
                );
                const issueCards: {
                  issue: SupervisorIssue;
                  report?: MandorIssueReport;
                }[] = [
                    ...syncedIssueReports.map((report) => ({
                      issue: {
                        id: report.id,
                        title: report.categoryLabel,
                        description: report.description,
                        priority:
                          report.workCondition === "BERHENTI"
                            ? ("Tinggi" as const)
                            : ("Sedang" as const),
                        state:
                          report.status === "Menunggu"
                            ? ("Baru" as const)
                            : ("Ditindaklanjuti" as const),
                        reportDate: report.submitted,
                        followUp: report.followUp,
                      },
                      report,
                    })),
                    ...project.issues
                      .filter(
                        (issue) =>
                          !syncedIssueReports.some(
                            (report) => report.id === issue.id,
                          ),
                      )
                      .map((issue) => ({ issue })),
                  ];
                return issueCards.length ? (
                  issueCards.map(({ issue, report }) => (
                    <IssueWorkflow
                      key={issue.id}
                      issue={issue}
                      report={report}
                      projectId={project.id}
                      customerName={project.customer}
                      onNotify={notify}
                    />
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-[#d6e0e8] bg-[#f8fafb] px-4 py-8 text-center text-xs text-slate-500">
                    Belum ada laporan kendala dari mandor.
                  </p>
                );
              })()}
            </div>
          </Surface>
          <Surface
            id="catatan-mandor"
            title="Catatan dari mandor"
            description="Catatan singkat yang dikirim mandor."
          >
            {foremanNotes.length ? (
              <div className="space-y-2">
                {foremanNotes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-lg bg-[#f7f9fb] p-3"
                  >
                    <p className="text-xs leading-5 text-slate-600">
                      {note.note}
                    </p>
                    <p className="mt-2 text-[9px] text-slate-400">
                      {note.foreman} · {note.submitted}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-[#f7f9fb] px-4 py-5 text-xs text-slate-500">
                Belum ada catatan dari mandor.
              </p>
            )}
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
              {[...mergedDocs, ...project.documentation].map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-[#e6ebef]"
                >
                  <div className="relative h-44 bg-[#edf1f4]">
                    {item.image.startsWith("data:") ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image}
                        alt={item.caption}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={item.image}
                        alt={item.caption}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    )}
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
          onAssign={(addedForemen) => {
            setProject((current) => {
              if (!current) return current;
              const existing =
                current.foremen ?? (current.foreman ? [current.foreman] : []);
              const additions = addedForemen
                .map((foreman) => foreman.name)
                .filter((name) => !existing.includes(name));
              const foremen = [...existing, ...additions].slice(0, 3);
              return { ...current, foremen, foreman: foremen[0] ?? null };
            });
            setShowForemen(false);
            notify(`${addedForemen.length} mandor ditambahkan ke proyek.`);
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
